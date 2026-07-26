//! Hardware integration probe for either MicDeck virtual-audio backend.
//!
//! It opens CABLE Output as the engine input with microphone gain muted, sends
//! a reference tone through the soundboard ring to CABLE Input, and verifies
//! that the engine captures that tone back from CABLE Output. This exercises
//! the same native WASAPI and virtual cable path used by Discord/OBS and catches
//! the regression where local preview works while the virtual mic is silent.

use micdeck_lib::native_audio::{NativeAudioConfig, NativeAudioEngine, VoiceProcessingConfig};
use micdeck_lib::virtual_audio::{self, VirtualAudioBackend};
use std::io::Write;
use std::thread;
use std::time::{Duration, Instant};

fn write_reference_tone(file: &mut tempfile::NamedTempFile) -> Result<(), String> {
    const SAMPLE_RATE: u32 = 48_000;
    const CHANNELS: u16 = 2;
    const BITS: u16 = 16;
    const FRAMES: u32 = SAMPLE_RATE;
    const DATA_BYTES: u32 = FRAMES * CHANNELS as u32 * (BITS / 8) as u32;

    let mut header = Vec::with_capacity(44);
    header.extend_from_slice(b"RIFF");
    header.extend_from_slice(&(36u32 + DATA_BYTES).to_le_bytes());
    header.extend_from_slice(b"WAVEfmt ");
    header.extend_from_slice(&16u32.to_le_bytes());
    header.extend_from_slice(&1u16.to_le_bytes());
    header.extend_from_slice(&CHANNELS.to_le_bytes());
    header.extend_from_slice(&SAMPLE_RATE.to_le_bytes());
    header.extend_from_slice(
        &(SAMPLE_RATE * u32::from(CHANNELS) * u32::from(BITS / 8)).to_le_bytes(),
    );
    header.extend_from_slice(&(CHANNELS * (BITS / 8)).to_le_bytes());
    header.extend_from_slice(&BITS.to_le_bytes());
    header.extend_from_slice(b"data");
    header.extend_from_slice(&DATA_BYTES.to_le_bytes());
    file.write_all(&header).map_err(|error| error.to_string())?;

    for frame in 0..FRAMES {
        let phase = frame as f32 * 440.0 * std::f32::consts::TAU / SAMPLE_RATE as f32;
        let sample = (phase.sin() * 0.25 * i16::MAX as f32) as i16;
        file.write_all(&sample.to_le_bytes())
            .and_then(|_| file.write_all(&sample.to_le_bytes()))
            .map_err(|error| error.to_string())?;
    }
    file.flush().map_err(|error| error.to_string())
}

fn wait_until_ready(engine: &NativeAudioEngine) -> Result<(), String> {
    let deadline = Instant::now() + Duration::from_secs(6);
    loop {
        let status = engine.status();
        if status.engine_state == 2 {
            return Ok(());
        }
        if status.engine_state == 3 {
            return Err(status
                .error
                .unwrap_or_else(|| "Native engine failed".into()));
        }
        if Instant::now() >= deadline {
            return Err("Native engine did not become ready in 6 seconds".into());
        }
        thread::sleep(Duration::from_millis(50));
    }
}

fn main() -> Result<(), String> {
    let backend = if std::env::args().any(|argument| argument == "--micdeck-vad") {
        VirtualAudioBackend::MicDeckVad
    } else {
        VirtualAudioBackend::VbCable
    };
    let render = virtual_audio::render_endpoints(backend)
        .into_iter()
        .next()
        .ok_or_else(|| format!("No {} render endpoint", backend.label()))?;
    let capture = virtual_audio::capture_endpoints(backend)
        .into_iter()
        .next()
        .ok_or_else(|| format!("No {} capture endpoint", backend.label()))?;

    let mut engine = NativeAudioEngine::start()?;
    engine.configure(NativeAudioConfig {
        // Capture the exact endpoint Discord sees. The mic contribution is
        // muted below, so the tone is not fed back into its own cable output.
        input_endpoint_id: &capture.raw_id,
        output_endpoint_id: &render.raw_id,
        virtual_capture_endpoint_id: &capture.raw_id,
        microphone_gain: 0.0,
        sound_gain: 1.0,
        system_audio_enabled: false,
        system_audio_gain: 0.0,
        voice_processing: VoiceProcessingConfig {
            aec_enabled: false,
            rnnoise_enabled: false,
            auto_level_enabled: false,
            target_min_db: -20.0,
            target_max_db: -12.0,
            voice_monitor_enabled: false,
            voice_monitor_gain: 0.0,
            noise_gate_enabled: false,
            gate_threshold_db: -55.0,
            compressor_ratio: 3.0,
            limiter_ceiling_db: -1.0,
        },
    })?;
    engine.set_monitor_gain(0.0);
    wait_until_ready(&engine)?;

    let mut tone = tempfile::Builder::new()
        .prefix("micdeck-route-probe-")
        .suffix(".wav")
        .tempfile()
        .map_err(|error| error.to_string())?;
    write_reference_tone(&mut tone)?;
    thread::sleep(Duration::from_millis(250));
    engine.play_file(tone.path())?;

    let deadline = Instant::now() + Duration::from_secs(3);
    let mut mixer_peak = 0.0f32;
    let mut cable_capture_peak = 0.0f32;
    let mut dropped = 0u32;
    while Instant::now() < deadline {
        let status = engine.status();
        mixer_peak = mixer_peak.max(status.mixed_level);
        cable_capture_peak = cable_capture_peak.max(status.microphone_input_level);
        dropped = dropped.max(status.dropped_audio_frames);
        thread::sleep(Duration::from_millis(20));
    }
    let protocol = engine.status().protocol_version;

    println!(
        "protocol={} render={} capture={} mixed_peak={:.4} cable_capture_peak={:.4} dropped={}",
        protocol, render.name, capture.name, mixer_peak, cable_capture_peak, dropped
    );
    if protocol != 8 {
        return Err(format!("Expected native protocol v8, got v{protocol}"));
    }
    if mixer_peak < 0.10 {
        return Err("The soundboard tone did not reach the native mixer".into());
    }
    if cable_capture_peak < 0.10 {
        return Err(format!(
            "{} capture endpoint received silence or an unusably weak signal",
            backend.label()
        ));
    }
    println!("RESULT: PASS — soundboard audio reached the real virtual microphone");
    engine.shutdown();
    Ok(())
}
