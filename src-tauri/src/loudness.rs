//! ITU-R BS.1770-4 loudness measurement.
//!
//! The soundboard needs every clip to hit the listener at the same perceived level, and
//! peak or plain RMS normalisation does not achieve that — a bright clip and a bassy clip
//! with identical RMS are perceived several dB apart. BS.1770 solves it with a K-weighting
//! filter plus a two-stage gate, which is what every broadcast loudness spec builds on.

const ABSOLUTE_GATE_LUFS: f64 = -70.0;
const RELATIVE_GATE_LU: f64 = -10.0;
const BLOCK_MS: usize = 400;
const STEP_MS: usize = 100;
/// The -0.691 dB offset from BS.1770 that aligns the K-weighted energy with LKFS.
const ENERGY_OFFSET_DB: f64 = -0.691;
/// Reported for pure digital silence; also the floor for anything below the absolute gate.
pub const SILENCE_LUFS: f32 = -70.0;

#[derive(Debug, Clone, Copy)]
pub struct LoudnessMeasurement {
    /// Gated integrated loudness in LUFS.
    pub integrated_lufs: f32,
    /// Highest absolute sample value expressed in dBFS.
    pub peak_dbfs: f32,
}

#[derive(Clone, Copy, Default)]
struct Biquad {
    b0: f64,
    b1: f64,
    b2: f64,
    a1: f64,
    a2: f64,
}

#[derive(Clone, Copy, Default)]
struct BiquadState {
    x1: f64,
    x2: f64,
    y1: f64,
    y2: f64,
}

impl Biquad {
    fn process(&self, state: &mut BiquadState, input: f64) -> f64 {
        let output = self.b0 * input + self.b1 * state.x1 + self.b2 * state.x2
            - self.a1 * state.y1
            - self.a2 * state.y2;
        state.x2 = state.x1;
        state.x1 = input;
        state.y2 = state.y1;
        state.y1 = output;
        output
    }
}

/// BS.1770 defines the K-weighting coefficients at 48 kHz. Re-deriving them from the
/// analog prototype keeps the measurement correct at any input rate instead of silently
/// mis-weighting 44.1 kHz material.
fn shelving_filter(sample_rate: f64) -> Biquad {
    const F0: f64 = 1681.974450955533;
    const GAIN_DB: f64 = 3.999843853973347;
    const Q: f64 = 0.7071752369554196;

    let k = (std::f64::consts::PI * F0 / sample_rate).tan();
    let vh = 10f64.powf(GAIN_DB / 20.0);
    let vb = vh.powf(0.4996667741545416);
    let a0 = 1.0 + k / Q + k * k;

    Biquad {
        b0: (vh + vb * k / Q + k * k) / a0,
        b1: 2.0 * (k * k - vh) / a0,
        b2: (vh - vb * k / Q + k * k) / a0,
        a1: 2.0 * (k * k - 1.0) / a0,
        a2: (1.0 - k / Q + k * k) / a0,
    }
}

fn highpass_filter(sample_rate: f64) -> Biquad {
    const F0: f64 = 38.13547087602444;
    const Q: f64 = 0.5003270373238773;

    let k = (std::f64::consts::PI * F0 / sample_rate).tan();
    let a0 = 1.0 + k / Q + k * k;

    Biquad {
        b0: 1.0,
        b1: -2.0,
        b2: 1.0,
        a1: 2.0 * (k * k - 1.0) / a0,
        a2: (1.0 - k / Q + k * k) / a0,
    }
}

/// Streaming BS.1770 meter: feed interleaved frames, read the gated result at the end.
pub struct LoudnessAnalyzer {
    channels: usize,
    weights: Vec<f64>,
    shelving: Biquad,
    highpass: Biquad,
    shelving_state: Vec<BiquadState>,
    highpass_state: Vec<BiquadState>,
    /// Mean-square energy per channel accumulated over the current 100 ms sub-block.
    step_energy: Vec<f64>,
    step_frames: usize,
    step_capacity: usize,
    /// Last four completed sub-blocks, giving 400 ms blocks with 75 % overlap.
    history: Vec<Vec<f64>>,
    /// Weighted energy of every completed block, used by the two gating passes.
    block_energy: Vec<f64>,
    peak: f32,
}

impl LoudnessAnalyzer {
    pub fn new(channels: usize, sample_rate: u32) -> Self {
        let channels = channels.max(1);
        let sample_rate = sample_rate.max(1);
        Self {
            channels,
            weights: channel_weights(channels),
            shelving: shelving_filter(f64::from(sample_rate)),
            highpass: highpass_filter(f64::from(sample_rate)),
            shelving_state: vec![BiquadState::default(); channels],
            highpass_state: vec![BiquadState::default(); channels],
            step_energy: vec![0.0; channels],
            step_frames: 0,
            step_capacity: (sample_rate as usize * STEP_MS / 1000).max(1),
            history: Vec::with_capacity(BLOCK_MS / STEP_MS),
            block_energy: Vec::new(),
            peak: 0.0,
        }
    }

    /// Feeds one interleaved frame. Extra samples beyond `channels` are ignored, missing
    /// ones are treated as silence, so a partial trailing frame cannot panic.
    pub fn push_frame(&mut self, frame: &[f32]) {
        for channel in 0..self.channels {
            let sample = frame.get(channel).copied().unwrap_or(0.0);
            if !sample.is_finite() {
                continue;
            }
            let magnitude = sample.abs();
            if magnitude > self.peak {
                self.peak = magnitude;
            }
            let shelved = self
                .shelving
                .process(&mut self.shelving_state[channel], f64::from(sample));
            let weighted = self
                .highpass
                .process(&mut self.highpass_state[channel], shelved);
            self.step_energy[channel] += weighted * weighted;
        }

        self.step_frames += 1;
        if self.step_frames >= self.step_capacity {
            self.close_step();
        }
    }

    fn close_step(&mut self) {
        let frames = self.step_frames.max(1) as f64;
        let mean_square: Vec<f64> = self
            .step_energy
            .iter()
            .map(|energy| energy / frames)
            .collect();
        self.step_energy.iter_mut().for_each(|energy| *energy = 0.0);
        self.step_frames = 0;

        if self.history.len() == BLOCK_MS / STEP_MS {
            self.history.remove(0);
        }
        self.history.push(mean_square);

        if self.history.len() < BLOCK_MS / STEP_MS {
            return;
        }
        let mut weighted = 0.0;
        for channel in 0..self.channels {
            let block_mean = self
                .history
                .iter()
                .map(|step| step[channel])
                .sum::<f64>()
                / self.history.len() as f64;
            weighted += self.weights[channel] * block_mean;
        }
        self.block_energy.push(weighted);
    }

    pub fn finish(mut self) -> LoudnessMeasurement {
        // A clip shorter than 400 ms never completes a block. Treat whatever partial
        // sub-blocks exist as one block so short one-shots still get a measurement.
        if self.block_energy.is_empty() {
            if self.step_frames > 0 {
                self.close_step();
            }
            if self.block_energy.is_empty() && !self.history.is_empty() {
                let mut weighted = 0.0;
                for channel in 0..self.channels {
                    let block_mean = self
                        .history
                        .iter()
                        .map(|step| step[channel])
                        .sum::<f64>()
                        / self.history.len() as f64;
                    weighted += self.weights[channel] * block_mean;
                }
                self.block_energy.push(weighted);
            }
        }

        LoudnessMeasurement {
            integrated_lufs: self.gated_loudness(),
            peak_dbfs: peak_to_dbfs(self.peak),
        }
    }

    fn gated_loudness(&self) -> f32 {
        let absolute: Vec<f64> = self
            .block_energy
            .iter()
            .copied()
            .filter(|energy| energy_to_lufs(*energy) > ABSOLUTE_GATE_LUFS)
            .collect();
        if absolute.is_empty() {
            return SILENCE_LUFS;
        }

        let relative_threshold =
            energy_to_lufs(absolute.iter().sum::<f64>() / absolute.len() as f64) + RELATIVE_GATE_LU;
        let gated: Vec<f64> = absolute
            .iter()
            .copied()
            .filter(|energy| energy_to_lufs(*energy) > relative_threshold)
            .collect();
        let selected = if gated.is_empty() { &absolute } else { &gated };

        let mean = selected.iter().sum::<f64>() / selected.len() as f64;
        (energy_to_lufs(mean) as f32).max(SILENCE_LUFS)
    }
}

fn energy_to_lufs(energy: f64) -> f64 {
    if energy <= 0.0 {
        return f64::NEG_INFINITY;
    }
    ENERGY_OFFSET_DB + 10.0 * energy.log10()
}

fn peak_to_dbfs(peak: f32) -> f32 {
    if peak <= 0.000_015_8 {
        -96.0
    } else {
        (20.0 * peak.log10()).clamp(-96.0, 24.0)
    }
}

/// BS.1770 weights the surround channels higher; front channels are unweighted.
fn channel_weights(channels: usize) -> Vec<f64> {
    (0..channels)
        .map(|channel| match (channels, channel) {
            (n, 4..) if n >= 5 => 1.41,
            (4, 2..) => 1.41,
            _ => 1.0,
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn measure_sine_with(
        amplitude: f32,
        sample_rate: u32,
        seconds: f32,
        both_channels: bool,
    ) -> LoudnessMeasurement {
        let mut analyzer = LoudnessAnalyzer::new(2, sample_rate);
        let total = (sample_rate as f32 * seconds) as usize;
        for index in 0..total {
            let phase = 2.0 * std::f32::consts::PI * 1000.0 * index as f32 / sample_rate as f32;
            let sample = amplitude * phase.sin();
            analyzer.push_frame(&[sample, if both_channels { sample } else { 0.0 }]);
        }
        analyzer.finish()
    }

    fn measure_sine(amplitude: f32, sample_rate: u32, seconds: f32) -> LoudnessMeasurement {
        measure_sine_with(amplitude, sample_rate, seconds, true)
    }

    #[test]
    fn silence_reports_the_gate_floor() {
        let mut analyzer = LoudnessAnalyzer::new(2, 48_000);
        for _ in 0..48_000 {
            analyzer.push_frame(&[0.0, 0.0]);
        }
        let measurement = analyzer.finish();
        assert_eq!(measurement.integrated_lufs, SILENCE_LUFS);
        assert_eq!(measurement.peak_dbfs, -96.0);
    }

    #[test]
    fn single_channel_full_scale_sine_reads_minus_three_lufs() {
        // BS.1770 calibration point: the -0.691 offset exists to cancel the K-weighting
        // gain at 1 kHz, so a 0 dBFS 1 kHz sine in one channel of a stereo pair must
        // read -3.01 LKFS. This pins both the filter coefficients and the offset.
        let measurement = measure_sine_with(1.0, 48_000, 3.0, false);
        assert!(
            (measurement.integrated_lufs - (-3.01)).abs() < 0.1,
            "expected -3.01 LUFS, measured {}",
            measurement.integrated_lufs
        );
        assert!((measurement.peak_dbfs - 0.0).abs() < 0.1);
    }

    #[test]
    fn coherent_stereo_is_three_lu_louder_than_one_channel() {
        let mono = measure_sine_with(1.0, 48_000, 3.0, false).integrated_lufs;
        let stereo = measure_sine(1.0, 48_000, 3.0).integrated_lufs;
        assert!(
            ((stereo - mono) - 3.01).abs() < 0.1,
            "expected +3 LU for a coherent pair, got {}",
            stereo - mono
        );
    }

    #[test]
    fn halving_amplitude_drops_loudness_by_six_db() {
        let loud = measure_sine(1.0, 48_000, 3.0).integrated_lufs;
        let quiet = measure_sine(0.5, 48_000, 3.0).integrated_lufs;
        assert!(
            ((loud - quiet) - 6.02).abs() < 0.2,
            "expected a 6 dB drop, got {}",
            loud - quiet
        );
    }

    #[test]
    fn filters_track_the_sample_rate() {
        // The same signal measured at two rates must agree; a hard-coded 48 kHz
        // filter would skew the 44.1 kHz result.
        let at_48 = measure_sine(0.5, 48_000, 3.0).integrated_lufs;
        let at_44 = measure_sine(0.5, 44_100, 3.0).integrated_lufs;
        assert!((at_48 - at_44).abs() < 0.3);
    }

    #[test]
    fn clips_shorter_than_one_block_still_measure() {
        let measurement = measure_sine(1.0, 48_000, 0.15);
        assert!(measurement.integrated_lufs > SILENCE_LUFS);
    }
}
