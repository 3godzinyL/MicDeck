use aec3::api::control::EchoControl;
use aec3::audio_processing::aec3::echo_canceller3::EchoCanceller3;
use aec3::audio_processing::audio_buffer::AudioBuffer;
use nnnoiseless::DenoiseState;
use std::ffi::c_void;

const SAMPLE_RATE: usize = 48_000;
const FRAME_SIZE: usize = 480;
const CROSSFADE_STEP: f32 = 1.0 / 15.0;

struct VoiceDsp {
    aec: EchoCanceller3,
    render: AudioBuffer,
    capture: AudioBuffer,
    denoiser: Box<DenoiseState<'static>>,
    aec_mix: f32,
    denoise_mix: f32,
    denoise_input: [f32; FRAME_SIZE],
    denoise_output: [f32; FRAME_SIZE],
    echo_output: [f32; FRAME_SIZE],
}

impl VoiceDsp {
    fn new() -> Self {
        let config = EchoCanceller3::create_default_config(1, 1);
        Self {
            aec: EchoCanceller3::new(config, SAMPLE_RATE as i32, 1, 1),
            render: AudioBuffer::from_sample_rates(SAMPLE_RATE, 1, SAMPLE_RATE, 1, SAMPLE_RATE),
            capture: AudioBuffer::from_sample_rates(SAMPLE_RATE, 1, SAMPLE_RATE, 1, SAMPLE_RATE),
            denoiser: DenoiseState::new(),
            aec_mix: 0.0,
            denoise_mix: 0.0,
            denoise_input: [0.0; FRAME_SIZE],
            denoise_output: [0.0; FRAME_SIZE],
            echo_output: [0.0; FRAME_SIZE],
        }
    }

    fn move_mix(current: &mut f32, enabled: bool) {
        let target = if enabled { 1.0 } else { 0.0 };
        if *current < target {
            *current = (*current + CROSSFADE_STEP).min(target);
        } else if *current > target {
            *current = (*current - CROSSFADE_STEP).max(target);
        }
    }

    fn process(
        &mut self,
        microphone: &[f32],
        render_reference: &[f32],
        output: &mut [f32],
        aec_enabled: bool,
        denoise_enabled: bool,
    ) -> f32 {
        Self::move_mix(&mut self.aec_mix, aec_enabled);
        Self::move_mix(&mut self.denoise_mix, denoise_enabled);

        if aec_enabled || self.aec_mix > 0.0 {
            self.render.channel_mut(0).copy_from_slice(render_reference);
            self.render.split_into_frequency_bands();
            self.aec.analyze_render(&mut self.render);
            self.render.merge_frequency_bands();

            self.capture.channel_mut(0).copy_from_slice(microphone);
            self.aec.analyze_capture(&mut self.capture);
            self.capture.split_into_frequency_bands();
            self.aec.process_capture(&mut self.capture, false);
            self.capture.merge_frequency_bands();
            self.echo_output.copy_from_slice(self.capture.channel(0));
        } else {
            self.echo_output.copy_from_slice(microphone);
        }

        for (index, sample) in self.denoise_input.iter_mut().enumerate() {
            let echo_cancelled =
                microphone[index] + (self.echo_output[index] - microphone[index]) * self.aec_mix;
            *sample = echo_cancelled * 32_768.0;
        }

        let voice_probability = if denoise_enabled || self.denoise_mix > 0.0 {
            self.denoiser
                .process_frame(&mut self.denoise_output, &self.denoise_input)
        } else {
            0.0
        };

        for (index, sample) in output.iter_mut().enumerate() {
            let dry = self.denoise_input[index] / 32_768.0;
            let wet = self.denoise_output[index] / 32_768.0;
            *sample = dry + (wet - dry) * self.denoise_mix;
        }
        voice_probability
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn mb_dsp_frame_size() -> u32 {
    FRAME_SIZE as u32
}

#[unsafe(no_mangle)]
pub extern "C" fn mb_dsp_create() -> *mut c_void {
    Box::into_raw(Box::new(VoiceDsp::new())).cast()
}

#[unsafe(no_mangle)]
/// Releases a processor previously returned by [`mb_dsp_create`].
///
/// # Safety
///
/// `handle` must be null or a live pointer returned by `mb_dsp_create` that
/// has not already been released. No other thread may use it during this call.
pub unsafe extern "C" fn mb_dsp_destroy(handle: *mut c_void) {
    if !handle.is_null() {
        drop(unsafe { Box::from_raw(handle.cast::<VoiceDsp>()) });
    }
}

#[unsafe(no_mangle)]
/// Processes one 10 ms, mono, 48 kHz microphone frame.
///
/// # Safety
///
/// `handle` must identify a live processor owned by the calling thread.
/// `microphone` and `render_reference` must each point to at least 480 readable
/// `f32` samples, and `output` must point to at least 480 writable samples.
/// The input and output regions must remain valid for the duration of the call.
/// `voice_probability` may be null or point to one writable `f32`.
pub unsafe extern "C" fn mb_dsp_process_10ms(
    handle: *mut c_void,
    microphone: *const f32,
    render_reference: *const f32,
    output: *mut f32,
    aec_enabled: i32,
    denoise_enabled: i32,
    voice_probability: *mut f32,
) -> i32 {
    if handle.is_null() || microphone.is_null() || render_reference.is_null() || output.is_null() {
        return 0;
    }

    let processor = unsafe { &mut *handle.cast::<VoiceDsp>() };
    let microphone = unsafe { std::slice::from_raw_parts(microphone, FRAME_SIZE) };
    let render_reference = unsafe { std::slice::from_raw_parts(render_reference, FRAME_SIZE) };
    let output = unsafe { std::slice::from_raw_parts_mut(output, FRAME_SIZE) };
    let probability = processor.process(
        microphone,
        render_reference,
        output,
        aec_enabled != 0,
        denoise_enabled != 0,
    );
    if !voice_probability.is_null() {
        unsafe { *voice_probability = probability };
    }
    1
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn processor_keeps_samples_finite() {
        let mut processor = VoiceDsp::new();
        let microphone = [0.01; FRAME_SIZE];
        let render = [0.0; FRAME_SIZE];
        let mut output = [0.0; FRAME_SIZE];
        for _ in 0..20 {
            processor.process(&microphone, &render, &mut output, true, true);
        }
        assert!(output.iter().all(|sample| sample.is_finite()));
    }
}
