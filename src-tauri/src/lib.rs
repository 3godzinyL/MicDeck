pub mod loudness;
pub mod native_audio;
pub mod virtual_audio;

use cpal::traits::{DeviceTrait, HostTrait};
use rodio::source::UniformSourceIterator;
use rodio::{Decoder, Source};
use serde::{Deserialize, Serialize};
use std::f32;
use std::fs::{self, File};
use std::io::{BufReader, Write};
use std::num::NonZero;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::str::FromStr;
use std::sync::Mutex;
use std::time::Instant;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_global_shortcut::Shortcut;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct SoundItem {
    id: String,
    name: String,
    path: String,
    extension: String,
    file_size: u64,
    duration_ms: u64,
    #[serde(default)]
    meter_profile: Vec<u8>,
    #[serde(default)]
    shortcut: Option<String>,
    /// Gated integrated loudness from the BS.1770 analysis. `None` for clips imported
    /// before loudness matching existed — the Levels tab can backfill them.
    #[serde(default)]
    loudness_lufs: Option<f32>,
    #[serde(default)]
    peak_dbfs: Option<f32>,
}

#[derive(Debug, Clone, Serialize)]
struct SoundDto {
    id: String,
    name: String,
    path: String,
    extension: String,
    file_size: u64,
    duration_ms: u64,
    #[serde(rename = "fileSizeText")]
    file_size_text: String,
    #[serde(rename = "durationText")]
    duration_text: String,
    #[serde(rename = "sourceKind")]
    source_kind: String,
    shortcut: Option<String>,
    #[serde(rename = "loudnessLufs")]
    loudness_lufs: Option<f32>,
    #[serde(rename = "peakDbfs")]
    peak_dbfs: Option<f32>,
    /// Gain the normaliser will apply to this clip with the current settings.
    #[serde(rename = "normalizationGainDb")]
    normalization_gain_db: f32,
    /// True when the requested gain had to be clipped by the ceiling or the gain limits,
    /// i.e. the clip cannot fully reach the target.
    #[serde(rename = "normalizationLimited")]
    normalization_limited: bool,
}

#[derive(Debug)]
struct PreparedSound {
    name: String,
    path: String,
    extension: String,
    file_size: u64,
    duration_ms: u64,
    meter_profile: Vec<u8>,
    loudness_lufs: f32,
    peak_dbfs: f32,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
enum NormalizationMode {
    /// BS.1770 gated loudness — matches perceived level, which is what "same volume" means.
    #[default]
    Integrated,
    /// Aligns sample peaks instead. Preserves dynamics but leaves clips perceptually uneven.
    Peak,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NormalizationSettings {
    enabled: bool,
    mode: NormalizationMode,
    /// Target for the integrated mode, in LUFS.
    target_lufs: f32,
    /// Target for the peak mode, and the ceiling that caps integrated gain, in dBFS.
    peak_ceiling_db: f32,
    /// Positive magnitudes; how far the normaliser may push a clip in either direction.
    max_gain_db: f32,
    max_attenuation_db: f32,
    /// Drives the microphone auto-leveller to the same target so voice and clips land
    /// at one level on the stream bus.
    match_microphone: bool,
}

impl Default for NormalizationSettings {
    fn default() -> Self {
        Self {
            enabled: false,
            mode: NormalizationMode::Integrated,
            target_lufs: -16.0,
            peak_ceiling_db: -1.0,
            max_gain_db: 12.0,
            max_attenuation_db: 24.0,
            match_microphone: false,
        }
    }
}

impl NormalizationSettings {
    fn sanitized(self) -> Self {
        let defaults = Self::default();
        Self {
            target_lufs: finite_or(self.target_lufs, defaults.target_lufs).clamp(-40.0, -5.0),
            peak_ceiling_db: finite_or(self.peak_ceiling_db, defaults.peak_ceiling_db)
                .clamp(-12.0, 0.0),
            max_gain_db: finite_or(self.max_gain_db, defaults.max_gain_db).clamp(0.0, 24.0),
            max_attenuation_db: finite_or(self.max_attenuation_db, defaults.max_attenuation_db)
                .clamp(0.0, 40.0),
            ..self
        }
    }

    /// Gain in dB for a clip, or `None` when the clip has never been analysed.
    fn gain_db_for(&self, loudness_lufs: Option<f32>, peak_dbfs: Option<f32>) -> Option<f32> {
        if !self.enabled {
            return Some(0.0);
        }
        let peak = peak_dbfs?;
        let desired = match self.mode {
            NormalizationMode::Integrated => {
                let loudness = loudness_lufs?;
                if loudness <= loudness::SILENCE_LUFS {
                    return Some(0.0);
                }
                self.target_lufs - loudness
            }
            NormalizationMode::Peak => self.peak_ceiling_db - peak,
        };

        // Never let the boost push samples past the ceiling; that is what the ceiling is for.
        let headroom = self.peak_ceiling_db - peak;
        Some(
            desired
                .min(headroom.max(-self.max_attenuation_db))
                .clamp(-self.max_attenuation_db, self.max_gain_db),
        )
    }

    fn linear_gain_for(&self, loudness_lufs: Option<f32>, peak_dbfs: Option<f32>) -> f32 {
        match self.gain_db_for(loudness_lufs, peak_dbfs) {
            Some(db) => db_to_linear(db),
            None => 1.0,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
struct LibraryWorkerProgressDto {
    kind: &'static str,
    stage: &'static str,
    current: usize,
    total: usize,
    #[serde(rename = "fileName")]
    file_name: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
struct DeviceDto {
    id: String,
    #[serde(rename = "rawId")]
    raw_id: String,
    name: String,
}

#[derive(Debug, Clone, Serialize)]
struct NativeAudioStatusDto {
    available: bool,
    ready: bool,
    state: String,
    #[serde(rename = "protocolVersion")]
    protocol_version: u32,
    #[serde(rename = "enginePid")]
    engine_pid: u32,
    #[serde(rename = "microphoneLevel01")]
    microphone_level_01: f32,
    #[serde(rename = "systemLevel01")]
    system_level_01: f32,
    #[serde(rename = "mixedLevel01")]
    mixed_level_01: f32,
    #[serde(rename = "microphoneInputLevel01")]
    microphone_input_level_01: f32,
    #[serde(rename = "microphoneOutputLevel01")]
    microphone_output_level_01: f32,
    #[serde(rename = "systemInputLevel01")]
    system_input_level_01: f32,
    #[serde(rename = "systemOutputLevel01")]
    system_output_level_01: f32,
    #[serde(rename = "voiceProbability01")]
    voice_probability_01: f32,
    #[serde(rename = "microphoneAppliedGain")]
    microphone_applied_gain: f32,
    #[serde(rename = "systemAppliedGain")]
    system_applied_gain: f32,
    underruns: u32,
    #[serde(rename = "captureOverruns")]
    capture_overruns: u32,
    #[serde(rename = "droppedAudioFrames")]
    dropped_audio_frames: u32,
    #[serde(rename = "estimatedLatencyMs")]
    estimated_latency_ms: f32,
    error: Option<String>,
    runtime: &'static str,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct VoiceProcessingSettings {
    aec_enabled: bool,
    rnnoise_enabled: bool,
    auto_level_enabled: bool,
    target_min_db: f32,
    target_max_db: f32,
    voice_monitor_enabled: bool,
    voice_monitor_gain: f32,
    noise_gate_enabled: bool,
    gate_threshold_db: f32,
    compressor_ratio: f32,
    limiter_ceiling_db: f32,
}

impl Default for VoiceProcessingSettings {
    fn default() -> Self {
        Self {
            aec_enabled: false,
            rnnoise_enabled: false,
            auto_level_enabled: false,
            target_min_db: -19.0,
            target_max_db: -13.0,
            voice_monitor_enabled: false,
            voice_monitor_gain: 0.25,
            noise_gate_enabled: false,
            gate_threshold_db: -55.0,
            compressor_ratio: 3.0,
            limiter_ceiling_db: -1.0,
        }
    }
}

impl VoiceProcessingSettings {
    fn sanitized(self) -> Self {
        let mut target_min_db = clamp_db(self.target_min_db, -19.0);
        let mut target_max_db = clamp_db(self.target_max_db, -13.0);
        if target_min_db > target_max_db {
            std::mem::swap(&mut target_min_db, &mut target_max_db);
        }
        Self {
            target_min_db,
            target_max_db,
            voice_monitor_gain: if self.voice_monitor_gain.is_finite() {
                self.voice_monitor_gain.clamp(0.0, 2.0)
            } else {
                0.25
            },
            gate_threshold_db: clamp_db(self.gate_threshold_db, -55.0),
            compressor_ratio: if self.compressor_ratio.is_finite() {
                self.compressor_ratio.clamp(1.0, 20.0)
            } else {
                3.0
            },
            limiter_ceiling_db: clamp_db(self.limiter_ceiling_db, -1.0).clamp(-12.0, 0.0),
            ..self
        }
    }

    fn native(self) -> native_audio::VoiceProcessingConfig {
        let settings = self.sanitized();
        native_audio::VoiceProcessingConfig {
            aec_enabled: settings.aec_enabled,
            rnnoise_enabled: settings.rnnoise_enabled,
            auto_level_enabled: settings.auto_level_enabled,
            target_min_db: settings.target_min_db,
            target_max_db: settings.target_max_db,
            voice_monitor_enabled: settings.voice_monitor_enabled,
            voice_monitor_gain: settings.voice_monitor_gain,
            noise_gate_enabled: settings.noise_gate_enabled,
            gate_threshold_db: settings.gate_threshold_db,
            compressor_ratio: settings.compressor_ratio,
            limiter_ceiling_db: settings.limiter_ceiling_db,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
struct AudioSessionDto {
    id: String,
    #[serde(rename = "processId")]
    process_id: u32,
    name: String,
    #[serde(rename = "peakLevel01")]
    peak_level_01: f32,
    volume: f32,
    muted: bool,
    active: bool,
    #[serde(rename = "lastActiveMs")]
    last_active_ms: u64,
    #[serde(rename = "iconDataUrl")]
    icon_data_url: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
struct PlaybackStatusDto {
    #[serde(rename = "isPlaying")]
    is_playing: bool,
    #[serde(rename = "soundId")]
    sound_id: Option<String>,
    #[serde(rename = "soundName")]
    sound_name: Option<String>,
    #[serde(rename = "positionMs")]
    position_ms: u64,
    #[serde(rename = "durationMs")]
    duration_ms: u64,
    #[serde(rename = "progress01")]
    progress_01: f32,
    #[serde(rename = "signalDbfs")]
    signal_dbfs: f32,
    #[serde(rename = "signalLevel01")]
    signal_level_01: f32,
}

#[derive(Debug, Clone, Serialize)]
struct VirtualAudioStatusDto {
    installed: bool,
    ready: bool,
    #[serde(rename = "installerAttempted")]
    installer_attempted: bool,
    #[serde(rename = "restartRequired")]
    restart_required: bool,
    error: Option<String>,
    vendor: &'static str,
    #[serde(rename = "renderDeviceId")]
    render_device_id: Option<String>,
    #[serde(rename = "renderDeviceName")]
    render_device_name: Option<String>,
    #[serde(rename = "microphoneDeviceId")]
    microphone_device_id: Option<String>,
    #[serde(rename = "microphoneName")]
    microphone_name: Option<String>,
    /// Backend the user picked in the driver tab.
    #[serde(rename = "preferredBackend")]
    preferred_backend: virtual_audio::VirtualAudioBackend,
    /// Backend actually carrying audio right now — differs from the preferred one
    /// while a freshly selected driver is still installing.
    #[serde(rename = "activeBackend")]
    active_backend: virtual_audio::VirtualAudioBackend,
    #[serde(rename = "activeBackendLabel")]
    active_backend_label: &'static str,
    #[serde(rename = "customDriverAvailable")]
    custom_driver_available: bool,
    #[serde(rename = "customDriverVersion")]
    custom_driver_version: Option<String>,
    backends: Vec<virtual_audio::BackendProbe>,
}

#[derive(Debug, Serialize, Deserialize)]
struct PersistedState {
    sounds: Vec<SoundItem>,
    selected_device: Option<String>,
    #[serde(default)]
    selected_input_device: Option<String>,
    volume: f32,
    #[serde(default = "default_microphone_gain")]
    microphone_gain: f32,
    #[serde(default = "default_sound_overdrive")]
    sound_overdrive: f32,
    #[serde(default = "default_monitor_gain")]
    monitor_gain: f32,
    #[serde(default)]
    system_audio_enabled: bool,
    #[serde(default = "default_system_audio_gain")]
    system_audio_gain: f32,
    #[serde(default)]
    voice_processing: VoiceProcessingSettings,
    #[serde(default)]
    virtual_render_device: Option<String>,
    #[serde(default)]
    virtual_capture_device: Option<String>,
    #[serde(default)]
    virtual_audio_backend: virtual_audio::VirtualAudioBackend,
    #[serde(default)]
    normalization: NormalizationSettings,
}

struct ActivePlayback {
    sound_id: String,
    sound_name: String,
    duration_ms: u64,
    started_at: Instant,
    meter_profile: Vec<u8>,
    normalization_gain: f32,
}

struct AppState {
    sounds: Vec<SoundItem>,
    selected_device: Option<String>,
    selected_input_device: Option<String>,
    volume: f32,
    microphone_gain: f32,
    sound_overdrive: f32,
    monitor_gain: f32,
    system_audio_enabled: bool,
    system_audio_gain: f32,
    voice_processing: VoiceProcessingSettings,
    next_id: u64,
    playback: Option<ActivePlayback>,
    virtual_render_device: Option<String>,
    virtual_capture_device: Option<String>,
    virtual_audio_backend: virtual_audio::VirtualAudioBackend,
    normalization: NormalizationSettings,
}

#[derive(Default)]
struct NativeAudioRuntime {
    engine: Option<native_audio::NativeAudioEngine>,
    startup_error: Option<String>,
}

impl NativeAudioRuntime {
    fn shutdown(&mut self) {
        if let Some(mut engine) = self.engine.take() {
            engine.shutdown();
        }
    }
}

impl AppState {
    fn load() -> Self {
        let persisted = load_persisted_state().ok();
        let sounds = persisted
            .as_ref()
            .map(|p| p.sounds.clone())
            .unwrap_or_default();

        let next_id = sounds
            .iter()
            .filter_map(|s| s.id.parse::<u64>().ok())
            .max()
            .unwrap_or(0)
            + 1;

        Self {
            sounds,
            selected_device: persisted.as_ref().and_then(|p| p.selected_device.clone()),
            selected_input_device: persisted
                .as_ref()
                .and_then(|p| p.selected_input_device.clone()),
            volume: persisted
                .as_ref()
                .map(|p| clamp_volume(p.volume))
                .unwrap_or(1.0),
            microphone_gain: persisted
                .as_ref()
                .map(|p| clamp_volume(p.microphone_gain))
                .unwrap_or_else(default_microphone_gain),
            sound_overdrive: persisted
                .as_ref()
                .map(|p| clamp_overdrive(p.sound_overdrive))
                .unwrap_or_else(default_sound_overdrive),
            monitor_gain: persisted
                .as_ref()
                .map(|p| clamp_monitor_gain(p.monitor_gain))
                .unwrap_or_else(default_monitor_gain),
            // Broadcasting never resumes implicitly after a restart.
            system_audio_enabled: false,
            system_audio_gain: persisted
                .as_ref()
                .map(|p| clamp_system_audio_gain(p.system_audio_gain))
                .unwrap_or_else(default_system_audio_gain),
            voice_processing: persisted
                .as_ref()
                .map(|p| p.voice_processing.sanitized())
                .unwrap_or_default(),
            next_id,
            playback: None,
            virtual_render_device: persisted
                .as_ref()
                .and_then(|p| p.virtual_render_device.clone()),
            virtual_capture_device: persisted
                .as_ref()
                .and_then(|p| p.virtual_capture_device.clone()),
            virtual_audio_backend: persisted
                .as_ref()
                .map(|p| p.virtual_audio_backend)
                .unwrap_or_default(),
            normalization: persisted
                .as_ref()
                .map(|p| p.normalization.sanitized())
                .unwrap_or_default(),
        }
    }

    fn persist(&self) -> Result<(), String> {
        let persisted = PersistedState {
            sounds: self.sounds.clone(),
            selected_device: self.selected_device.clone(),
            selected_input_device: self.selected_input_device.clone(),
            volume: self.volume,
            microphone_gain: self.microphone_gain,
            sound_overdrive: self.sound_overdrive,
            monitor_gain: self.monitor_gain,
            system_audio_enabled: self.system_audio_enabled,
            system_audio_gain: self.system_audio_gain,
            voice_processing: self.voice_processing,
            virtual_render_device: self.virtual_render_device.clone(),
            virtual_capture_device: self.virtual_capture_device.clone(),
            virtual_audio_backend: self.virtual_audio_backend,
            normalization: self.normalization,
        };

        let path = config_file_path()?;
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Nie udało się utworzyć katalogu config: {e}"))?;
        }

        let json = serde_json::to_string_pretty(&persisted)
            .map_err(|e| format!("Nie udało się zapisać JSON: {e}"))?;
        let parent = path
            .parent()
            .ok_or_else(|| "Nieprawidłowa ścieżka configu".to_string())?;
        let mut temporary = tempfile::NamedTempFile::new_in(parent)
            .map_err(|e| format!("Nie udało się utworzyć atomowego configu: {e}"))?;
        temporary
            .write_all(json.as_bytes())
            .and_then(|_| temporary.as_file_mut().sync_all())
            .map_err(|e| format!("Nie udało się utrwalić configu: {e}"))?;
        temporary
            .persist(&path)
            .map_err(|e| format!("Nie udało się atomowo podmienić configu: {}", e.error))?;
        Ok(())
    }

    fn effective_sound_gain(&self) -> f32 {
        (self.volume * self.sound_overdrive).clamp(0.0, 24.0)
    }

    /// Voice DSP as the engine should see it. When loudness matching is asked to cover the
    /// microphone too, the auto-leveller target is pulled onto the same LUFS target so
    /// speech and clips arrive at the listener at one level.
    fn effective_voice_processing(&self) -> VoiceProcessingSettings {
        if !(self.normalization.enabled && self.normalization.match_microphone) {
            return self.voice_processing;
        }
        VoiceProcessingSettings {
            auto_level_enabled: true,
            target_min_db: self.normalization.target_lufs - 1.5,
            target_max_db: self.normalization.target_lufs + 1.5,
            ..self.voice_processing
        }
        .sanitized()
    }

    fn playback_status(&mut self) -> PlaybackStatusDto {
        if let Some(playback) = &self.playback {
            let elapsed = playback.started_at.elapsed().as_millis() as u64;
            if elapsed >= playback.duration_ms && playback.duration_ms > 0 {
                self.playback = None;
            }
        }

        if let Some(playback) = &self.playback {
            let position_ms = playback.started_at.elapsed().as_millis() as u64;
            let position_ms = position_ms.min(playback.duration_ms);
            let progress_01 = if playback.duration_ms == 0 {
                0.0
            } else {
                (position_ms as f32 / playback.duration_ms as f32).clamp(0.0, 1.0)
            };
            let signal_level_01 = level_for_position(&playback.meter_profile, position_ms)
                * self.volume
                * playback.normalization_gain;
            let signal_dbfs = dbfs_from_level(signal_level_01);

            PlaybackStatusDto {
                is_playing: true,
                sound_id: Some(playback.sound_id.clone()),
                sound_name: Some(playback.sound_name.clone()),
                position_ms,
                duration_ms: playback.duration_ms,
                progress_01,
                signal_dbfs,
                signal_level_01: signal_level_01.clamp(0.0, 6.0),
            }
        } else {
            PlaybackStatusDto {
                is_playing: false,
                sound_id: None,
                sound_name: None,
                position_ms: 0,
                duration_ms: 0,
                progress_01: 0.0,
                signal_dbfs: -90.0,
                signal_level_01: 0.0,
            }
        }
    }
}

fn load_persisted_state() -> Result<PersistedState, String> {
    let path = config_file_path()?;
    let path = if path.exists() {
        path
    } else {
        let base =
            dirs::config_dir().ok_or_else(|| "Brak katalogu konfiguracyjnego".to_string())?;
        base.join("soundboard-binder").join("state.json")
    };
    if !path.exists() {
        return Err("Brak poprzedniego configu".into());
    }
    let text = fs::read_to_string(path).map_err(|e| format!("Błąd odczytu configu: {e}"))?;
    serde_json::from_str(&text).map_err(|e| format!("Błąd parsowania configu: {e}"))
}

fn config_file_path() -> Result<PathBuf, String> {
    let base = dirs::config_dir().ok_or_else(|| "Brak katalogu konfiguracyjnego".to_string())?;
    Ok(base.join("micdeck").join("state.json"))
}

fn library_dir() -> Result<PathBuf, String> {
    let base = dirs::data_local_dir()
        .or_else(dirs::data_dir)
        .ok_or_else(|| "Brak katalogu danych aplikacji".to_string())?;
    let dir = base.join("micdeck").join("library");
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Nie udało się utworzyć katalogu biblioteki: {e}"))?;
    Ok(dir)
}

fn clamp_volume(v: f32) -> f32 {
    v.clamp(0.0, 6.0)
}

fn default_microphone_gain() -> f32 {
    1.0
}

fn clamp_overdrive(v: f32) -> f32 {
    if v.is_finite() {
        v.clamp(1.0, 4.0)
    } else {
        1.0
    }
}

fn default_sound_overdrive() -> f32 {
    1.0
}

fn clamp_monitor_gain(v: f32) -> f32 {
    if v.is_finite() {
        v.clamp(0.0, 2.0)
    } else {
        0.0
    }
}

fn default_monitor_gain() -> f32 {
    0.0
}

fn clamp_system_audio_gain(v: f32) -> f32 {
    if v.is_finite() {
        v.clamp(0.0, 2.0)
    } else {
        default_system_audio_gain()
    }
}

fn default_system_audio_gain() -> f32 {
    0.85
}

fn clamp_db(value: f32, fallback: f32) -> f32 {
    if value.is_finite() {
        value.clamp(-90.0, 0.0)
    } else {
        fallback
    }
}

fn finite_or(value: f32, fallback: f32) -> f32 {
    if value.is_finite() {
        value
    } else {
        fallback
    }
}

fn db_to_linear(db: f32) -> f32 {
    10f32.powf(db / 20.0)
}

fn file_name_for_path(path: &Path) -> String {
    path.file_name()
        .and_then(|x| x.to_str())
        .unwrap_or("unknown")
        .to_string()
}

fn extension_for_path(path: &Path) -> String {
    path.extension()
        .and_then(|x| x.to_str())
        .unwrap_or("?")
        .to_lowercase()
}

fn file_size_text(bytes: u64) -> String {
    const KB: f64 = 1024.0;
    const MB: f64 = KB * 1024.0;
    const GB: f64 = MB * 1024.0;
    let b = bytes as f64;
    if b >= GB {
        format!("{:.2} GB", b / GB)
    } else if b >= MB {
        format!("{:.2} MB", b / MB)
    } else if b >= KB {
        format!("{:.1} KB", b / KB)
    } else {
        format!("{} B", bytes)
    }
}

fn format_duration(ms: u64) -> String {
    let total_seconds = ms / 1000;
    let minutes = total_seconds / 60;
    let seconds = total_seconds % 60;
    format!("{minutes:02}:{seconds:02}")
}

fn dbfs_from_level(level: f32) -> f32 {
    if level <= 0.000_01 {
        -90.0
    } else {
        (20.0 * level.log10()).clamp(-90.0, 15.6)
    }
}

fn level_for_position(profile: &[u8], position_ms: u64) -> f32 {
    if profile.is_empty() {
        return 0.0;
    }
    let chunk_index = ((position_ms / 100) as usize).min(profile.len().saturating_sub(1));
    profile[chunk_index] as f32 / 255.0
}

#[derive(Debug, Clone)]
struct AudioAnalysis {
    duration_ms: u64,
    meter_profile: Vec<u8>,
    loudness_lufs: f32,
    peak_dbfs: f32,
}

/// Analysis rate and channel count. Matching what `play_file` feeds the engine keeps the
/// measured loudness identical to what actually reaches the virtual cable.
const ANALYSIS_SAMPLE_RATE: u32 = 48_000;
const ANALYSIS_CHANNELS: usize = 2;

fn analyze_audio_file(path: &Path) -> Result<AudioAnalysis, String> {
    let file =
        File::open(path).map_err(|e| format!("Nie udało się otworzyć pliku do analizy: {e}"))?;
    let decoder = Decoder::try_from(BufReader::new(file))
        .map_err(|e| format!("Nie udało się zdekodować pliku: {e}"))?;

    let total_duration = decoder.total_duration().map(|d| d.as_millis() as u64);
    let source = UniformSourceIterator::new(
        decoder,
        NonZero::new(ANALYSIS_CHANNELS as u16).unwrap(),
        NonZero::new(ANALYSIS_SAMPLE_RATE).unwrap(),
    );

    let frames_per_chunk = ANALYSIS_SAMPLE_RATE as usize / 10;
    let mut analyzer = loudness::LoudnessAnalyzer::new(ANALYSIS_CHANNELS, ANALYSIS_SAMPLE_RATE);
    let mut meter_profile = Vec::new();
    let mut frame = [0.0f32; ANALYSIS_CHANNELS];
    let mut frame_len = 0usize;
    let mut sum_sq = 0.0f64;
    let mut chunk_frames = 0usize;
    let mut total_frames = 0usize;

    for sample in source {
        frame[frame_len] = sample;
        frame_len += 1;
        if frame_len < ANALYSIS_CHANNELS {
            continue;
        }
        frame_len = 0;
        analyzer.push_frame(&frame);
        total_frames += 1;

        let magnitude = frame
            .iter()
            .map(|value| f64::from(value.abs().min(1.25)))
            .fold(0.0f64, f64::max);
        sum_sq += magnitude * magnitude;
        chunk_frames += 1;

        if chunk_frames >= frames_per_chunk {
            meter_profile.push(rms_to_meter(sum_sq, chunk_frames));
            sum_sq = 0.0;
            chunk_frames = 0;
        }
    }

    if chunk_frames > 0 {
        meter_profile.push(rms_to_meter(sum_sq, chunk_frames));
    }

    let measurement = analyzer.finish();
    let duration_ms = total_duration.unwrap_or_else(|| {
        ((total_frames as f64 / f64::from(ANALYSIS_SAMPLE_RATE)) * 1000.0).round() as u64
    });

    Ok(AudioAnalysis {
        duration_ms,
        meter_profile,
        loudness_lufs: measurement.integrated_lufs,
        peak_dbfs: measurement.peak_dbfs,
    })
}

fn rms_to_meter(sum_sq: f64, frames: usize) -> u8 {
    let rms = (sum_sq / frames.max(1) as f64).sqrt().clamp(0.0, 1.0);
    (rms * 255.0).round() as u8
}

fn to_sound_dto(item: &SoundItem, normalization: &NormalizationSettings) -> SoundDto {
    let source_kind = if item.path.contains("micdeck") || item.path.contains("soundboard-binder") {
        "library"
    } else {
        "file"
    };
    let gain_db = normalization.gain_db_for(item.loudness_lufs, item.peak_dbfs);
    let unclamped = match (normalization.enabled, item.loudness_lufs, item.peak_dbfs) {
        (true, Some(loudness), Some(peak)) => Some(match normalization.mode {
            NormalizationMode::Integrated => normalization.target_lufs - loudness,
            NormalizationMode::Peak => normalization.peak_ceiling_db - peak,
        }),
        _ => None,
    };

    SoundDto {
        id: item.id.clone(),
        name: item.name.clone(),
        path: item.path.clone(),
        extension: item.extension.clone(),
        file_size: item.file_size,
        duration_ms: item.duration_ms,
        file_size_text: file_size_text(item.file_size),
        duration_text: format_duration(item.duration_ms),
        source_kind: source_kind.to_string(),
        shortcut: item.shortcut.clone(),
        loudness_lufs: item.loudness_lufs,
        peak_dbfs: item.peak_dbfs,
        normalization_gain_db: gain_db.unwrap_or(0.0),
        normalization_limited: match (gain_db, unclamped) {
            (Some(applied), Some(wanted)) => (applied - wanted).abs() > 0.05,
            _ => false,
        },
    }
}

fn sound_dtos(app: &AppState) -> Vec<SoundDto> {
    app.sounds
        .iter()
        .map(|item| to_sound_dto(item, &app.normalization))
        .collect()
}

fn list_output_devices_impl() -> Result<Vec<DeviceDto>, String> {
    let host = cpal::default_host();
    let devices = host
        .output_devices()
        .map_err(|e| format!("Nie udało się pobrać output devices: {e}"))?;

    let mut result = Vec::new();
    for device in devices {
        result.push(device_to_dto(&device));
    }

    result.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(result)
}

fn list_input_devices_impl() -> Result<Vec<DeviceDto>, String> {
    let host = cpal::default_host();
    let virtual_ids = virtual_audio::managed_capture_endpoints()
        .into_iter()
        .flat_map(|endpoint| [endpoint.cpal_id, endpoint.raw_id])
        .collect::<Vec<_>>();
    let devices = host
        .input_devices()
        .map_err(|e| format!("Nie udało się pobrać input devices: {e}"))?;

    let mut result = Vec::new();
    for device in devices {
        let dto = device_to_dto(&device);
        let description = device.description().ok();
        let fingerprint = description
            .as_ref()
            .map(|description| {
                [
                    Some(description.name()),
                    description.manufacturer(),
                    description.driver(),
                ]
                .into_iter()
                .flatten()
                .collect::<Vec<_>>()
                .join(" ")
                .to_lowercase()
            })
            .unwrap_or_default();
        let is_managed_virtual = virtual_ids
            .iter()
            .any(|id| id == &dto.id || id == &dto.raw_id)
            || ((fingerprint.contains("vb-audio") || fingerprint.contains("vbaudio"))
                && fingerprint.contains("cable"))
            || fingerprint.contains("micdeckvad")
            || fingerprint.contains("micdeck virtual microphone");
        if !is_managed_virtual {
            let display_name = description
                .as_ref()
                .map(|description| {
                    let base = description.name().to_string();
                    let base_lower = base.to_lowercase();
                    let extra = [description.driver(), description.manufacturer()]
                        .into_iter()
                        .flatten()
                        .map(|value| value.to_string())
                        .find(|value| {
                            let value = value.trim();
                            !value.is_empty() && !base_lower.contains(&value.to_lowercase())
                        });
                    match extra {
                        Some(extra) => format!("{base} · {extra}"),
                        None => base,
                    }
                })
                .unwrap_or_else(|| dto.name.clone());
            result.push(DeviceDto {
                name: display_name,
                ..dto
            });
        }
    }

    result.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(result)
}

fn resolve_physical_input(app: &mut AppState) -> Result<Option<DeviceDto>, String> {
    let devices = list_input_devices_impl()?;
    let selected = app.selected_input_device.as_ref().and_then(|selected| {
        devices
            .iter()
            .find(|device| device.id == *selected || device.raw_id == *selected)
            .cloned()
    });
    let default = cpal::default_host()
        .default_input_device()
        .and_then(|device| {
            let candidate = device_to_dto(&device);
            devices
                .iter()
                .find(|item| item.id == candidate.id || item.raw_id == candidate.raw_id)
                .cloned()
        });
    let resolved = selected.or(default).or_else(|| devices.first().cloned());
    let resolved_id = resolved.as_ref().map(|device| device.id.clone());
    if app.selected_input_device != resolved_id {
        app.selected_input_device = resolved_id;
        let _ = app.persist();
    }
    Ok(resolved)
}

fn resolve_managed_endpoint(
    endpoints: Vec<virtual_audio::AudioEndpoint>,
    saved_id: Option<&str>,
) -> Option<virtual_audio::AudioEndpoint> {
    saved_id
        .and_then(|id| {
            endpoints
                .iter()
                .find(|endpoint| endpoint.cpal_id == id)
                .cloned()
        })
        .or_else(|| endpoints.into_iter().next())
}

fn sync_virtual_audio_devices(
    app: &mut AppState,
) -> (
    Option<virtual_audio::AudioEndpoint>,
    Option<virtual_audio::AudioEndpoint>,
) {
    let backend = virtual_audio::resolve_active_backend(app.virtual_audio_backend);
    let render = resolve_managed_endpoint(
        virtual_audio::render_endpoints(backend),
        app.virtual_render_device.as_deref(),
    );
    let capture = resolve_managed_endpoint(
        virtual_audio::capture_endpoints(backend),
        app.virtual_capture_device.as_deref(),
    );

    let new_render_id = render.as_ref().map(|endpoint| endpoint.cpal_id.clone());
    let new_capture_id = capture.as_ref().map(|endpoint| endpoint.cpal_id.clone());
    let changed = app.virtual_render_device != new_render_id
        || app.virtual_capture_device != new_capture_id
        || (new_render_id.is_some() && app.selected_device != new_render_id);

    app.virtual_render_device = new_render_id.clone();
    app.virtual_capture_device = new_capture_id;
    if new_render_id.is_some() {
        app.selected_device = new_render_id;
    }
    if changed {
        let _ = app.persist();
    }

    (render, capture)
}

#[tauri::command]
fn get_virtual_audio_status(
    state: tauri::State<'_, Mutex<AppState>>,
    bootstrap: tauri::State<'_, Mutex<virtual_audio::DriverBootstrap>>,
) -> Result<VirtualAudioStatusDto, String> {
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    let preferred = app.virtual_audio_backend;
    let (render, capture) = sync_virtual_audio_devices(&mut app);
    let bootstrap = bootstrap
        .lock()
        .map_err(|_| "Driver state lock error".to_string())?
        .clone();
    let ready = render.is_some() && capture.is_some();
    let active = virtual_audio::resolve_active_backend(preferred);

    Ok(VirtualAudioStatusDto {
        installed: render.is_some() || capture.is_some(),
        ready,
        installer_attempted: bootstrap.installer_attempted,
        restart_required: bootstrap.restart_required || (bootstrap.installer_attempted && !ready),
        error: bootstrap.error,
        vendor: active.vendor(),
        render_device_id: render.as_ref().map(|endpoint| endpoint.cpal_id.clone()),
        render_device_name: render.map(|endpoint| endpoint.name),
        microphone_device_id: capture.as_ref().map(|endpoint| endpoint.cpal_id.clone()),
        microphone_name: capture.map(|endpoint| endpoint.name),
        preferred_backend: preferred,
        active_backend: active,
        active_backend_label: active.label(),
        custom_driver_available: virtual_audio::custom_driver_package_ready(),
        custom_driver_version: virtual_audio::custom_driver_package_version(),
        backends: virtual_audio::probe_all(),
    })
}

#[tauri::command]
fn set_virtual_audio_backend(
    backend: virtual_audio::VirtualAudioBackend,
    state: tauri::State<'_, Mutex<AppState>>,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<(), String> {
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    if app.virtual_audio_backend == backend {
        return Ok(());
    }
    app.virtual_audio_backend = backend;
    // The endpoint ids belong to the previous backend, so drop them and let
    // sync_virtual_audio_devices re-resolve against the new one.
    app.virtual_render_device = None;
    app.virtual_capture_device = None;
    app.persist()?;

    let mut native = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?;
    match configure_native_runtime(&mut app, &mut native) {
        Ok(()) => Ok(()),
        // Switching to a backend that is not installed yet is a normal step in the
        // driver tab, so surface it as an error the UI shows without tearing down
        // the saved preference.
        Err(error) => Err(error),
    }
}

#[tauri::command]
fn test_virtual_audio_backend(
    backend: virtual_audio::VirtualAudioBackend,
) -> virtual_audio::BackendProbe {
    virtual_audio::probe(backend)
}

#[tauri::command]
fn uninstall_virtual_audio_driver(
    state: tauri::State<'_, Mutex<AppState>>,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<(), String> {
    virtual_audio::uninstall_micdeck_vad()?;
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    app.virtual_audio_backend = virtual_audio::VirtualAudioBackend::VbCable;
    app.virtual_render_device = None;
    app.virtual_capture_device = None;
    app.persist()?;
    let mut native = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?;
    let _ = configure_native_runtime(&mut app, &mut native);
    Ok(())
}

#[tauri::command]
fn rename_virtual_microphone(
    name: String,
    state: tauri::State<'_, Mutex<AppState>>,
) -> Result<(), String> {
    let capture = {
        let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
        let (_, capture) = sync_virtual_audio_devices(&mut app);
        capture.ok_or_else(|| {
            "Wirtualny mikrofon nie jest jeszcze dostępny. Dokończ instalację i uruchom ponownie Windows."
                .to_string()
        })?
    };

    virtual_audio::rename_endpoint_elevated(&capture.raw_id, &name)
}

#[tauri::command]
fn install_virtual_audio_driver(
    backend: Option<virtual_audio::VirtualAudioBackend>,
    bootstrap: tauri::State<'_, Mutex<virtual_audio::DriverBootstrap>>,
    state: tauri::State<'_, Mutex<AppState>>,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<(), String> {
    let backend = match backend {
        Some(backend) => {
            let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
            if app.virtual_audio_backend != backend {
                app.virtual_audio_backend = backend;
                app.virtual_render_device = None;
                app.virtual_capture_device = None;
                app.persist()?;
            }
            backend
        }
        None => {
            state
                .lock()
                .map_err(|_| "State lock error".to_string())?
                .virtual_audio_backend
        }
    };
    let result = virtual_audio::install_driver_now(backend);
    let error = result.error.clone();
    let mut bootstrap_state = bootstrap
        .lock()
        .map_err(|_| "Driver state lock error".to_string())?;
    *bootstrap_state = result;
    drop(bootstrap_state);
    match error {
        Some(error) => Err(error),
        None => {
            let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
            let mut native = native
                .lock()
                .map_err(|_| "Native audio lock error".to_string())?;
            configure_native_runtime(&mut app, &mut native)
        }
    }
}

fn configure_native_runtime(
    app: &mut AppState,
    runtime: &mut NativeAudioRuntime,
) -> Result<(), String> {
    let input = resolve_physical_input(app)?.ok_or_else(|| {
        "Nie znaleziono fizycznego mikrofonu. Podłącz mikrofon i odśwież.".to_string()
    })?;
    let backend = virtual_audio::resolve_active_backend(app.virtual_audio_backend);
    let (render, capture) = sync_virtual_audio_devices(app);
    let render = render.ok_or_else(|| {
        format!(
            "Wirtualne wyjście {} nie jest jeszcze gotowe. Zainstaluj sterownik w zakładce Sterownik albo uruchom ponownie Windows.",
            backend.label()
        )
    })?;
    let capture = capture.ok_or_else(|| {
        format!(
            "Wirtualny mikrofon {} nie jest jeszcze gotowy. Uruchom ponownie Windows po instalacji sterownika.",
            backend.label()
        )
    })?;
    let engine = runtime.engine.as_ref().ok_or_else(|| {
        runtime
            .startup_error
            .clone()
            .unwrap_or_else(|| "C++ audio engine nie działa".into())
    })?;
    engine.configure(native_audio::NativeAudioConfig {
        input_endpoint_id: &input.raw_id,
        output_endpoint_id: &render.raw_id,
        virtual_capture_endpoint_id: &capture.raw_id,
        microphone_gain: app.microphone_gain,
        sound_gain: app.effective_sound_gain(),
        system_audio_enabled: app.system_audio_enabled,
        system_audio_gain: app.system_audio_gain,
        voice_processing: app.effective_voice_processing().native(),
    })?;
    engine.set_monitor_gain(app.monitor_gain);
    runtime.startup_error = None;
    Ok(())
}

fn start_native_runtime(app: &mut AppState, runtime: &mut NativeAudioRuntime) {
    runtime.engine = None;
    runtime.startup_error = None;
    match native_audio::NativeAudioEngine::start() {
        Ok(engine) => {
            runtime.engine = Some(engine);
            if let Err(error) = configure_native_runtime(app, runtime) {
                runtime.startup_error = Some(error);
            }
        }
        Err(error) => runtime.startup_error = Some(error),
    }
}

#[tauri::command]
fn list_input_devices() -> Result<Vec<DeviceDto>, String> {
    list_input_devices_impl()
}

#[tauri::command]
fn get_selected_input_device(
    state: tauri::State<'_, Mutex<AppState>>,
) -> Result<Option<String>, String> {
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    Ok(resolve_physical_input(&mut app)?.map(|device| device.id))
}

#[tauri::command]
fn set_selected_input_device(
    device_id: String,
    state: tauri::State<'_, Mutex<AppState>>,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<(), String> {
    let devices = list_input_devices_impl()?;
    if !devices
        .iter()
        .any(|device| device.id == device_id || device.raw_id == device_id)
    {
        return Err("Wybrany fizyczny mikrofon już nie istnieje".into());
    }

    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    app.selected_input_device = Some(device_id);
    app.persist()?;
    let mut native = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?;
    configure_native_runtime(&mut app, &mut native)
}

#[tauri::command]
fn get_microphone_gain(state: tauri::State<'_, Mutex<AppState>>) -> Result<f32, String> {
    let app = state.lock().map_err(|_| "State lock error".to_string())?;
    Ok(app.microphone_gain)
}

#[tauri::command]
fn set_microphone_gain(
    gain: f32,
    state: tauri::State<'_, Mutex<AppState>>,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<(), String> {
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    app.microphone_gain = clamp_volume(gain);
    app.persist()?;
    if let Some(engine) = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?
        .engine
        .as_ref()
    {
        engine.set_gains(app.microphone_gain, app.effective_sound_gain());
    }
    Ok(())
}

#[tauri::command]
fn get_sound_overdrive(state: tauri::State<'_, Mutex<AppState>>) -> Result<f32, String> {
    let app = state.lock().map_err(|_| "State lock error".to_string())?;
    Ok(app.sound_overdrive)
}

#[tauri::command]
fn set_sound_overdrive(
    overdrive: f32,
    state: tauri::State<'_, Mutex<AppState>>,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<(), String> {
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    app.sound_overdrive = clamp_overdrive(overdrive);
    app.persist()?;
    if let Some(engine) = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?
        .engine
        .as_ref()
    {
        engine.set_gains(app.microphone_gain, app.effective_sound_gain());
    }
    Ok(())
}

#[tauri::command]
fn get_monitor_gain(state: tauri::State<'_, Mutex<AppState>>) -> Result<f32, String> {
    let app = state.lock().map_err(|_| "State lock error".to_string())?;
    Ok(app.monitor_gain)
}

#[tauri::command]
fn set_monitor_gain(
    gain: f32,
    state: tauri::State<'_, Mutex<AppState>>,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<(), String> {
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    app.monitor_gain = clamp_monitor_gain(gain);
    app.persist()?;
    if let Some(engine) = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?
        .engine
        .as_ref()
    {
        engine.set_monitor_gain(app.monitor_gain);
    }
    Ok(())
}

#[tauri::command]
fn get_system_audio_enabled(state: tauri::State<'_, Mutex<AppState>>) -> Result<bool, String> {
    let app = state.lock().map_err(|_| "State lock error".to_string())?;
    Ok(app.system_audio_enabled)
}

#[tauri::command]
fn set_system_audio_enabled(
    enabled: bool,
    state: tauri::State<'_, Mutex<AppState>>,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<(), String> {
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    app.system_audio_enabled = enabled;
    app.persist()?;
    if let Some(engine) = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?
        .engine
        .as_ref()
    {
        engine.set_system_audio(app.system_audio_enabled, app.system_audio_gain);
    }
    Ok(())
}

#[tauri::command]
fn get_system_audio_gain(state: tauri::State<'_, Mutex<AppState>>) -> Result<f32, String> {
    let app = state.lock().map_err(|_| "State lock error".to_string())?;
    Ok(app.system_audio_gain)
}

#[tauri::command]
fn set_system_audio_gain(
    gain: f32,
    state: tauri::State<'_, Mutex<AppState>>,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<(), String> {
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    app.system_audio_gain = clamp_system_audio_gain(gain);
    app.persist()?;
    if let Some(engine) = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?
        .engine
        .as_ref()
    {
        engine.set_system_audio(app.system_audio_enabled, app.system_audio_gain);
    }
    Ok(())
}

#[tauri::command]
fn get_voice_processing_settings(
    state: tauri::State<'_, Mutex<AppState>>,
) -> Result<VoiceProcessingSettings, String> {
    let app = state.lock().map_err(|_| "State lock error".to_string())?;
    Ok(app.voice_processing)
}

#[tauri::command]
fn set_voice_processing_settings(
    settings: VoiceProcessingSettings,
    state: tauri::State<'_, Mutex<AppState>>,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<VoiceProcessingSettings, String> {
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    app.voice_processing = settings.sanitized();
    app.persist()?;
    if let Some(engine) = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?
        .engine
        .as_ref()
    {
        engine.set_voice_processing(app.effective_voice_processing().native());
    }
    Ok(app.voice_processing)
}

#[tauri::command]
fn get_normalization_settings(
    state: tauri::State<'_, Mutex<AppState>>,
) -> Result<NormalizationSettings, String> {
    let app = state.lock().map_err(|_| "State lock error".to_string())?;
    Ok(app.normalization)
}

#[tauri::command]
fn set_normalization_settings(
    settings: NormalizationSettings,
    state: tauri::State<'_, Mutex<AppState>>,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<NormalizationSettings, String> {
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    app.normalization = settings.sanitized();
    app.persist()?;

    if let Some(engine) = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?
        .engine
        .as_ref()
    {
        engine.set_voice_processing(app.effective_voice_processing().native());
        // A clip already playing keeps the gain it started with; only the next one picks
        // up the new target. Re-apply the bus gain so a settings change is not swallowed.
        let playing_gain = app
            .playback
            .as_ref()
            .map(|playback| playback.normalization_gain)
            .unwrap_or(1.0);
        engine.set_gains(
            app.microphone_gain,
            (app.effective_sound_gain() * playing_gain).clamp(0.0, 24.0),
        );
    }
    Ok(app.normalization)
}

/// Measures every clip that has no BS.1770 result yet, or all of them when `force` is set.
#[tauri::command]
async fn analyze_library_loudness(
    force: bool,
    app_handle: tauri::AppHandle,
) -> Result<Vec<SoundDto>, String> {
    let pending: Vec<(String, PathBuf)> = {
        let state = app_handle.state::<Mutex<AppState>>();
        let app = state.lock().map_err(|_| "State lock error".to_string())?;
        app.sounds
            .iter()
            .filter(|sound| force || sound.loudness_lufs.is_none() || sound.peak_dbfs.is_none())
            .map(|sound| (sound.id.clone(), PathBuf::from(&sound.path)))
            .collect()
    };

    let total = pending.len();
    if total == 0 {
        let state = app_handle.state::<Mutex<AppState>>();
        let app = state.lock().map_err(|_| "State lock error".to_string())?;
        return Ok(sound_dtos(&app));
    }

    emit_library_progress(&app_handle, "loudness", "queued", 0, total, None);
    let worker_handle = app_handle.clone();
    let measured = tauri::async_runtime::spawn_blocking(move || {
        pending
            .into_iter()
            .enumerate()
            .map(|(index, (id, path))| {
                emit_library_progress(
                    &worker_handle,
                    "loudness",
                    "analyzing",
                    index,
                    total,
                    Some(file_name_for_path(&path)),
                );
                let result = analyze_audio_file(&path);
                emit_library_progress(
                    &worker_handle,
                    "loudness",
                    "analyzing",
                    index + 1,
                    total,
                    None,
                );
                (id, result)
            })
            .collect::<Vec<_>>()
    })
    .await
    .map_err(|error| format!("Worker analizy głośności zakończył się błędem: {error}"))?;

    let state = app_handle.state::<Mutex<AppState>>();
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    let mut first_error = None;
    for (id, result) in measured {
        match result {
            Ok(analysis) => {
                if let Some(sound) = app.sounds.iter_mut().find(|sound| sound.id == id) {
                    sound.duration_ms = analysis.duration_ms;
                    sound.meter_profile = analysis.meter_profile;
                    sound.loudness_lufs = Some(analysis.loudness_lufs);
                    sound.peak_dbfs = Some(analysis.peak_dbfs);
                }
            }
            Err(error) => {
                first_error.get_or_insert(error);
            }
        }
    }
    app.persist()?;
    emit_library_progress(&app_handle, "loudness", "done", total, total, None);

    match first_error {
        Some(error) => Err(error),
        None => Ok(sound_dtos(&app)),
    }
}

#[tauri::command]
fn get_native_audio_status(
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<NativeAudioStatusDto, String> {
    let native = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?;
    let Some(engine) = native.engine.as_ref() else {
        return Ok(NativeAudioStatusDto {
            available: false,
            ready: false,
            state: "unavailable".into(),
            protocol_version: 0,
            engine_pid: 0,
            microphone_level_01: 0.0,
            system_level_01: 0.0,
            mixed_level_01: 0.0,
            microphone_input_level_01: 0.0,
            microphone_output_level_01: 0.0,
            system_input_level_01: 0.0,
            system_output_level_01: 0.0,
            voice_probability_01: 0.0,
            microphone_applied_gain: 1.0,
            system_applied_gain: 1.0,
            underruns: 0,
            capture_overruns: 0,
            dropped_audio_frames: 0,
            estimated_latency_ms: 0.0,
            error: native.startup_error.clone(),
            runtime: "C++ / WASAPI",
        });
    };
    let status = engine.status();
    let state = match status.engine_state {
        1 => "starting",
        2 => "ready",
        3 => "error",
        _ => "stopped",
    };
    Ok(NativeAudioStatusDto {
        available: status.connected,
        ready: status.engine_state == 2,
        state: state.into(),
        protocol_version: status.protocol_version,
        engine_pid: status.engine_pid,
        microphone_level_01: status.microphone_level.clamp(0.0, 1.5),
        system_level_01: status.system_level.clamp(0.0, 1.5),
        mixed_level_01: status.mixed_level.clamp(0.0, 1.5),
        microphone_input_level_01: status.microphone_input_level.clamp(0.0, 1.5),
        microphone_output_level_01: status.microphone_output_level.clamp(0.0, 1.5),
        system_input_level_01: status.system_input_level.clamp(0.0, 1.5),
        system_output_level_01: status.system_output_level.clamp(0.0, 1.5),
        voice_probability_01: status.voice_probability.clamp(0.0, 1.0),
        microphone_applied_gain: status.microphone_applied_gain.clamp(0.0, 24.0),
        system_applied_gain: status.system_applied_gain.clamp(0.0, 24.0),
        underruns: status.underruns,
        capture_overruns: status.capture_overruns,
        dropped_audio_frames: status.dropped_audio_frames,
        estimated_latency_ms: status.estimated_latency_ms.max(0.0),
        error: status.error.or_else(|| native.startup_error.clone()),
        runtime: "C++ / WASAPI",
    })
}

#[tauri::command]
fn list_audio_sessions(
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<Vec<AudioSessionDto>, String> {
    let native = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?;
    let Some(engine) = native.engine.as_ref() else {
        return Ok(Vec::new());
    };
    Ok(engine
        .audio_sessions()
        .into_iter()
        .map(|session| AudioSessionDto {
            id: session.id,
            process_id: session.process_id,
            name: session.name,
            peak_level_01: session.peak_level,
            volume: session.volume,
            muted: session.muted,
            active: session.active,
            last_active_ms: session.last_active_age_ms,
            icon_data_url: session.icon_data_url,
        })
        .collect())
}

#[tauri::command]
fn set_audio_session_volume(
    id: String,
    volume: f32,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<(), String> {
    if !volume.is_finite() {
        return Err("Nieprawidłowa głośność aplikacji".into());
    }
    let native = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?;
    let engine = native.engine.as_ref().ok_or_else(|| {
        native
            .startup_error
            .clone()
            .unwrap_or_else(|| "C++ audio engine nie działa".into())
    })?;
    engine.set_audio_session_volume(&id, volume)
}

#[tauri::command]
fn repair_default_microphone(
    state: tauri::State<'_, Mutex<AppState>>,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<String, String> {
    let input = {
        let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
        resolve_physical_input(&mut app)?
            .ok_or_else(|| "Nie znaleziono fizycznego mikrofonu do przywrócenia".to_string())?
    };
    let native = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?;
    let engine = native.engine.as_ref().ok_or_else(|| {
        native
            .startup_error
            .clone()
            .unwrap_or_else(|| "C++ audio engine nie działa".into())
    })?;
    engine.repair_default_capture(&input.raw_id)?;
    Ok(input.name)
}

#[tauri::command]
fn restart_native_audio_engine(
    state: tauri::State<'_, Mutex<AppState>>,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<(), String> {
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    let mut native = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?;
    start_native_runtime(&mut app, &mut native);
    match &native.startup_error {
        Some(error) => Err(error.clone()),
        None => Ok(()),
    }
}

fn device_to_dto(device: &cpal::Device) -> DeviceDto {
    let name = device
        .description()
        .map(|description| description.name().to_string())
        .unwrap_or_else(|_| "Unknown device".to_string());
    let (id, raw_id) = device
        .id()
        .map(|id| (id.to_string(), id.1))
        .unwrap_or_else(|_| (name.clone(), name.clone()));

    DeviceDto { id, raw_id, name }
}

fn prepare_sound_path(path: PathBuf) -> Result<PreparedSound, String> {
    if !path.exists() || !path.is_file() {
        return Err("Plik nie istnieje albo nie jest plikiem audio".into());
    }

    let normalized = path.to_string_lossy().to_string();
    let analysis = analyze_audio_file(&path)?;
    let file_size = path.metadata().map(|m| m.len()).unwrap_or(0);

    Ok(PreparedSound {
        name: file_name_for_path(&path),
        path: normalized,
        extension: extension_for_path(&path),
        file_size,
        duration_ms: analysis.duration_ms,
        meter_profile: analysis.meter_profile,
        loudness_lufs: analysis.loudness_lufs,
        peak_dbfs: analysis.peak_dbfs,
    })
}

fn insert_prepared_sound(app: &mut AppState, sound: PreparedSound) -> bool {
    if app.sounds.iter().any(|item| item.path == sound.path) {
        return false;
    }

    app.sounds.push(SoundItem {
        id: app.next_id.to_string(),
        name: sound.name,
        path: sound.path,
        extension: sound.extension,
        file_size: sound.file_size,
        duration_ms: sound.duration_ms,
        meter_profile: sound.meter_profile,
        shortcut: None,
        loudness_lufs: Some(sound.loudness_lufs),
        peak_dbfs: Some(sound.peak_dbfs),
    });
    app.next_id += 1;
    true
}

fn emit_library_progress(
    app: &tauri::AppHandle,
    kind: &'static str,
    stage: &'static str,
    current: usize,
    total: usize,
    file_name: Option<String>,
) {
    let _ = app.emit(
        "library-worker-progress",
        LibraryWorkerProgressDto {
            kind,
            stage,
            current,
            total,
            file_name,
        },
    );
}

fn download_audio_to_library(url: &str) -> Result<PathBuf, String> {
    let library = library_dir()?;
    let template = library.join("%(title).120B [%(id)s].%(ext)s");
    let output_template = template.to_string_lossy().to_string();

    // yt-dlp prints the final path to STDOUT in the Windows console codepage
    // (e.g. CP1250), so decoding it as UTF-8 mangles non-ASCII filenames
    // (ń, ż, ł…) and the resulting path fails path.exists(). --print-to-file
    // is written in UTF-8, so we capture the path from a temp file instead.
    let path_file = tempfile::Builder::new()
        .prefix("micdeck-ytpath-")
        .suffix(".txt")
        .tempfile()
        .map_err(|e| format!("Nie udało się utworzyć pliku tymczasowego: {e}"))?
        .into_temp_path();
    let path_file_arg = path_file.to_string_lossy().to_string();

    let output = Command::new("yt-dlp")
        .args([
            "--no-playlist",
            "--windows-filenames",
            "--no-warnings",
            "--print-to-file",
            "after_move:filepath",
            &path_file_arg,
            "-x",
            "--audio-format",
            "mp3",
            "--audio-quality",
            "0",
            "-o",
            &output_template,
            url,
        ])
        .output()
        .map_err(|e| {
            format!(
                "Nie udało się uruchomić yt-dlp. Zainstaluj yt-dlp i ffmpeg, a potem dodaj je do PATH. Szczegóły: {e}"
            )
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        let details = if !stderr.trim().is_empty() {
            stderr.trim().to_string()
        } else {
            stdout.trim().to_string()
        };
        return Err(format!("Import z linku nie powiódł się: {details}"));
    }

    let printed = fs::read_to_string(&path_file)
        .map_err(|e| format!("Nie udało się odczytać ścieżki pliku z yt-dlp: {e}"))?;
    let final_path = printed
        .lines()
        .rev()
        .find(|line| !line.trim().is_empty())
        .map(|line| PathBuf::from(line.trim()))
        .filter(|path| path.exists())
        .ok_or_else(|| "yt-dlp nie zwrócił finalnej ścieżki pliku".to_string())?;

    Ok(final_path)
}

fn validate_media_url(url: &str) -> Result<(), String> {
    let normalized = url.trim().to_ascii_lowercase();
    if !(normalized.starts_with("https://") || normalized.starts_with("http://")) {
        return Err("Link musi zaczynać się od http:// albo https://".into());
    }
    let supported = normalized.contains("youtube.com/")
        || normalized.contains("youtu.be/")
        || normalized.contains("tiktok.com/");
    if !supported {
        return Err("Obsługiwane źródła to YouTube, YouTube Shorts i TikTok".into());
    }
    Ok(())
}

#[tauri::command]
fn list_sounds(state: tauri::State<'_, Mutex<AppState>>) -> Result<Vec<SoundDto>, String> {
    let app = state.lock().map_err(|_| "State lock error".to_string())?;
    Ok(sound_dtos(&app))
}

#[tauri::command]
async fn add_sounds(
    paths: Vec<String>,
    app_handle: tauri::AppHandle,
) -> Result<Vec<SoundDto>, String> {
    let total = paths.len();
    if total == 0 {
        let state = app_handle.state::<Mutex<AppState>>();
        let app = state.lock().map_err(|_| "State lock error".to_string())?;
        return Ok(sound_dtos(&app));
    }

    emit_library_progress(&app_handle, "files", "queued", 0, total, None);
    let worker_handle = app_handle.clone();
    let prepared = tauri::async_runtime::spawn_blocking(move || {
        paths
            .into_iter()
            .enumerate()
            .map(|(index, raw)| {
                let path = PathBuf::from(&raw);
                emit_library_progress(
                    &worker_handle,
                    "files",
                    "analyzing",
                    index,
                    total,
                    Some(file_name_for_path(&path)),
                );
                let result = prepare_sound_path(path);
                emit_library_progress(&worker_handle, "files", "analyzing", index + 1, total, None);
                result
            })
            .collect::<Vec<_>>()
    })
    .await
    .map_err(|error| format!("Worker importu plików zakończył się błędem: {error}"))?;

    let mut first_error = None;
    let mut successful = Vec::new();
    for result in prepared {
        match result {
            Ok(sound) => successful.push(sound),
            Err(error) if first_error.is_none() => first_error = Some(error),
            Err(_) => {}
        }
    }
    if successful.is_empty() {
        emit_library_progress(&app_handle, "files", "failed", total, total, None);
        return Err(first_error.unwrap_or_else(|| "Nie udało się dodać plików audio".into()));
    }

    emit_library_progress(&app_handle, "files", "finalizing", total, total, None);
    let state = app_handle.state::<Mutex<AppState>>();
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    for sound in successful {
        insert_prepared_sound(&mut app, sound);
    }
    app.persist()?;
    let sounds = sound_dtos(&app);
    drop(app);
    emit_library_progress(&app_handle, "files", "complete", total, total, None);
    Ok(sounds)
}

#[tauri::command]
async fn import_from_url(
    url: String,
    app_handle: tauri::AppHandle,
) -> Result<Vec<SoundDto>, String> {
    let trimmed = url.trim().to_string();
    if trimmed.is_empty() {
        return Err("Wklej link do YouTube, Shorts albo TikToka".into());
    }
    validate_media_url(&trimmed)?;

    emit_library_progress(&app_handle, "url", "validating", 0, 1, None);
    let worker_handle = app_handle.clone();
    let worker_result = tauri::async_runtime::spawn_blocking(move || {
        emit_library_progress(&worker_handle, "url", "downloading", 0, 1, None);
        let downloaded = download_audio_to_library(&trimmed)?;
        emit_library_progress(
            &worker_handle,
            "url",
            "analyzing",
            0,
            1,
            Some(file_name_for_path(&downloaded)),
        );
        prepare_sound_path(downloaded)
    })
    .await
    .map_err(|error| format!("Worker Quick Capture zakończył się błędem: {error}"))?;

    let prepared = match worker_result {
        Ok(sound) => sound,
        Err(error) => {
            emit_library_progress(&app_handle, "url", "failed", 1, 1, None);
            return Err(error);
        }
    };

    emit_library_progress(&app_handle, "url", "finalizing", 1, 1, None);
    let state = app_handle.state::<Mutex<AppState>>();
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    insert_prepared_sound(&mut app, prepared);
    app.persist()?;
    let sounds = sound_dtos(&app);
    drop(app);
    emit_library_progress(&app_handle, "url", "complete", 1, 1, None);
    Ok(sounds)
}

#[tauri::command]
fn set_sound_shortcut(
    id: String,
    shortcut: Option<String>,
    state: tauri::State<'_, Mutex<AppState>>,
) -> Result<Vec<SoundDto>, String> {
    let normalized = shortcut
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    if let Some(value) = normalized.as_deref() {
        Shortcut::from_str(value)
            .map_err(|_| "Ta kombinacja klawiszy nie jest obsługiwana przez Windows".to_string())?;
    }

    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    if let Some(value) = normalized.as_deref() {
        if app.sounds.iter().any(|sound| {
            sound.id != id
                && sound
                    .shortcut
                    .as_deref()
                    .is_some_and(|current| current.eq_ignore_ascii_case(value))
        }) {
            return Err("Ta kombinacja jest już przypisana do innego dźwięku".into());
        }
    }

    let sound = app
        .sounds
        .iter_mut()
        .find(|sound| sound.id == id)
        .ok_or_else(|| "Nie znaleziono dźwięku".to_string())?;
    sound.shortcut = normalized;
    app.persist()?;
    Ok(sound_dtos(&app))
}

#[tauri::command]
fn remove_sound(
    id: String,
    state: tauri::State<'_, Mutex<AppState>>,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<(), String> {
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    app.sounds.retain(|s| s.id != id);
    if app.playback.as_ref().map(|p| p.sound_id.as_str()) == Some(id.as_str()) {
        app.playback = None;
        if let Some(engine) = native
            .lock()
            .map_err(|_| "Native audio lock error".to_string())?
            .engine
            .as_ref()
        {
            engine.stop_sound();
        }
    }
    app.persist()
}

#[tauri::command]
fn list_output_devices() -> Result<Vec<DeviceDto>, String> {
    list_output_devices_impl()
}

#[tauri::command]
fn set_selected_device(
    device_id: String,
    state: tauri::State<'_, Mutex<AppState>>,
) -> Result<(), String> {
    let devices = list_output_devices_impl()?;
    if !devices.iter().any(|d| d.id == device_id) {
        return Err("Wybrane urządzenie już nie istnieje".into());
    }

    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    app.selected_device = Some(device_id);
    app.persist()
}

#[tauri::command]
fn get_selected_device(state: tauri::State<'_, Mutex<AppState>>) -> Result<Option<String>, String> {
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    let devices = list_output_devices_impl()?;
    let managed_device = app.virtual_render_device.as_ref().and_then(|selected| {
        devices
            .iter()
            .find(|device| device.id == *selected || device.name == *selected)
            .map(|device| device.id.clone())
    });
    let resolved_selected = managed_device.or_else(|| {
        app.selected_device.as_ref().and_then(|selected| {
            devices
                .iter()
                .find(|device| device.id == *selected || device.name == *selected)
                .map(|device| device.id.clone())
        })
    });

    if resolved_selected.is_none() || resolved_selected != app.selected_device {
        let default_name = cpal::default_host()
            .default_output_device()
            .map(|device| device_to_dto(&device).id)
            .filter(|id| devices.iter().any(|device| device.id == *id));

        app.selected_device = resolved_selected
            .or(default_name)
            .or_else(|| devices.first().map(|device| device.id.clone()));
        let _ = app.persist();
    }

    Ok(app.selected_device.clone())
}

#[tauri::command]
fn set_volume(
    volume: f32,
    state: tauri::State<'_, Mutex<AppState>>,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<(), String> {
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    app.volume = clamp_volume(volume);
    if let Some(engine) = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?
        .engine
        .as_ref()
    {
        engine.set_gains(app.microphone_gain, app.effective_sound_gain());
    }
    app.persist()
}

#[tauri::command]
fn get_volume(state: tauri::State<'_, Mutex<AppState>>) -> Result<f32, String> {
    let app = state.lock().map_err(|_| "State lock error".to_string())?;
    Ok(app.volume)
}

#[tauri::command]
fn stop_playback(
    state: tauri::State<'_, Mutex<AppState>>,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<(), String> {
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    app.playback = None;
    if let Some(engine) = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?
        .engine
        .as_ref()
    {
        engine.stop_sound();
    }
    Ok(())
}

#[tauri::command]
async fn play_sound(id: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let mut sound = {
        let state = app_handle.state::<Mutex<AppState>>();
        let app = state.lock().map_err(|_| "State lock error".to_string())?;
        app.sounds
            .iter()
            .find(|sound| sound.id == id)
            .cloned()
            .ok_or_else(|| "Nie znaleziono dźwięku".to_string())?
    };

    let needs_analysis = sound.duration_ms == 0
        || sound.meter_profile.is_empty()
        || sound.loudness_lufs.is_none()
        || sound.peak_dbfs.is_none();
    if needs_analysis {
        let path = PathBuf::from(&sound.path);
        let analysis = tauri::async_runtime::spawn_blocking(move || analyze_audio_file(&path))
            .await
            .map_err(|error| format!("Worker analizy audio zakończył się błędem: {error}"))??;
        sound.duration_ms = analysis.duration_ms;
        sound.meter_profile = analysis.meter_profile;
        sound.loudness_lufs = Some(analysis.loudness_lufs);
        sound.peak_dbfs = Some(analysis.peak_dbfs);

        let state = app_handle.state::<Mutex<AppState>>();
        let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
        if let Some(saved) = app.sounds.iter_mut().find(|saved| saved.id == id) {
            saved.duration_ms = sound.duration_ms;
            saved.meter_profile = sound.meter_profile.clone();
            saved.loudness_lufs = sound.loudness_lufs;
            saved.peak_dbfs = sound.peak_dbfs;
            let _ = app.persist();
        }
    }

    let state = app_handle.state::<Mutex<AppState>>();
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    app.playback = None;
    let normalization_gain = app
        .normalization
        .linear_gain_for(sound.loudness_lufs, sound.peak_dbfs);
    let native = app_handle.state::<Mutex<NativeAudioRuntime>>();
    let native = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?;
    let engine = native.engine.as_ref().ok_or_else(|| {
        native
            .startup_error
            .clone()
            .unwrap_or_else(|| "C++ audio engine nie działa".into())
    })?;
    // Fold the per-clip normalisation into the sound bus gain so every clip lands on the
    // stream at the same level without touching the engine ABI.
    engine.set_gains(
        app.microphone_gain,
        (app.effective_sound_gain() * normalization_gain).clamp(0.0, 24.0),
    );
    engine.play_file(Path::new(&sound.path))?;

    app.playback = Some(ActivePlayback {
        sound_id: sound.id,
        sound_name: sound.name,
        duration_ms: sound.duration_ms,
        started_at: Instant::now(),
        meter_profile: sound.meter_profile,
        normalization_gain,
    });

    Ok(())
}

#[tauri::command]
fn get_playback_status(
    state: tauri::State<'_, Mutex<AppState>>,
) -> Result<PlaybackStatusDto, String> {
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    Ok(app.playback_status())
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_dialog::init())
        .manage(Mutex::new(AppState::load()))
        .manage(Mutex::new(virtual_audio::DriverBootstrap::default()))
        .manage(Mutex::new(NativeAudioRuntime::default()))
        .invoke_handler(tauri::generate_handler![
            list_sounds,
            add_sounds,
            import_from_url,
            set_sound_shortcut,
            remove_sound,
            list_output_devices,
            list_input_devices,
            get_virtual_audio_status,
            install_virtual_audio_driver,
            uninstall_virtual_audio_driver,
            set_virtual_audio_backend,
            test_virtual_audio_backend,
            rename_virtual_microphone,
            set_selected_device,
            get_selected_device,
            set_selected_input_device,
            get_selected_input_device,
            set_volume,
            get_volume,
            set_microphone_gain,
            get_microphone_gain,
            get_sound_overdrive,
            set_sound_overdrive,
            get_monitor_gain,
            set_monitor_gain,
            get_system_audio_enabled,
            set_system_audio_enabled,
            get_system_audio_gain,
            set_system_audio_gain,
            get_voice_processing_settings,
            set_voice_processing_settings,
            get_normalization_settings,
            set_normalization_settings,
            analyze_library_loudness,
            get_native_audio_status,
            list_audio_sessions,
            set_audio_session_volume,
            repair_default_microphone,
            restart_native_audio_engine,
            play_sound,
            stop_playback,
            get_playback_status
        ])
        .setup(|app| {
            let open_item = MenuItem::with_id(
                app,
                "open",
                "Open MicDeck / Otwórz MicDeck",
                true,
                None::<&str>,
            )?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit / Zakończ", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&open_item, &quit_item])?;
            let mut tray = TrayIconBuilder::with_id("micdeck-tray")
                .tooltip("MicDeck — soundboard & audio routing")
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => show_main_window(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main_window(tray.app_handle());
                    }
                });
            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }
            tray.build(app)?;

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_title("MicDeck");
                let start_minimized = std::env::args().any(|arg| arg == "--minimized");
                if start_minimized {
                    let _ = window.hide();
                }

                let app_handle = app.handle().clone();
                tauri::async_runtime::spawn_blocking(move || {
                    let driver_status = virtual_audio::bootstrap_driver();
                    if let Ok(mut state) = app_handle
                        .state::<Mutex<virtual_audio::DriverBootstrap>>()
                        .lock()
                    {
                        *state = driver_status;
                    }
                    if let (Ok(mut app_state), Ok(mut native_state)) = (
                        app_handle.state::<Mutex<AppState>>().lock(),
                        app_handle.state::<Mutex<NativeAudioRuntime>>().lock(),
                    ) {
                        start_native_runtime(&mut app_state, &mut native_state);
                    }
                    let _ = app_handle.emit("native-runtime-ready", ());
                });
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| match event {
        tauri::RunEvent::WindowEvent {
            label,
            event: WindowEvent::CloseRequested { api, .. },
            ..
        } if label == "main" => {
            api.prevent_close();
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.hide();
            }
        }
        tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit => {
            if let Ok(mut native) = app_handle.state::<Mutex<NativeAudioRuntime>>().lock() {
                native.shutdown();
            }
        }
        _ => {}
    });
}

pub fn rename_audio_endpoint_helper(raw_endpoint_id: &str, name: &str) -> Result<(), String> {
    virtual_audio::rename_endpoint_helper(raw_endpoint_id, name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn media_import_accepts_supported_platforms() {
        assert!(validate_media_url("https://www.youtube.com/watch?v=abc").is_ok());
        assert!(validate_media_url("https://youtube.com/shorts/abc").is_ok());
        assert!(validate_media_url("https://vm.tiktok.com/example/").is_ok());
    }

    #[test]
    fn media_import_rejects_files_and_unknown_hosts() {
        assert!(validate_media_url(r"C:\audio\clip.mp3").is_err());
        assert!(validate_media_url("https://example.com/video").is_err());
    }

    #[test]
    fn system_audio_gain_stays_in_safe_range() {
        assert_eq!(clamp_system_audio_gain(-2.0), 0.0);
        assert_eq!(clamp_system_audio_gain(0.85), 0.85);
        assert_eq!(clamp_system_audio_gain(8.0), 2.0);
    }

    #[test]
    fn normalization_pulls_clips_onto_the_target_loudness() {
        let settings = NormalizationSettings {
            enabled: true,
            ..NormalizationSettings::default()
        };
        // Quiet clip with plenty of headroom gets the full boost.
        assert_eq!(settings.gain_db_for(Some(-24.0), Some(-12.0)), Some(8.0));
        // Loud clip gets pulled down.
        assert_eq!(settings.gain_db_for(Some(-10.0), Some(-1.0)), Some(-6.0));
    }

    #[test]
    fn normalization_never_pushes_a_clip_past_the_peak_ceiling() {
        let settings = NormalizationSettings {
            enabled: true,
            ..NormalizationSettings::default()
        };
        // Wants +14 dB to reach -16 LUFS, but the clip already peaks at -2 dBFS and the
        // ceiling is -1 dBFS, so only +1 dB is available.
        assert_eq!(settings.gain_db_for(Some(-30.0), Some(-2.0)), Some(1.0));
    }

    #[test]
    fn normalization_respects_its_gain_limits() {
        let settings = NormalizationSettings {
            enabled: true,
            max_gain_db: 6.0,
            max_attenuation_db: 3.0,
            ..NormalizationSettings::default()
        };
        assert_eq!(settings.gain_db_for(Some(-40.0), Some(-30.0)), Some(6.0));
        assert_eq!(settings.gain_db_for(Some(-4.0), Some(-1.0)), Some(-3.0));
    }

    #[test]
    fn unmeasured_clips_play_at_unity_instead_of_guessing() {
        let settings = NormalizationSettings {
            enabled: true,
            ..NormalizationSettings::default()
        };
        assert_eq!(settings.gain_db_for(None, None), None);
        assert_eq!(settings.linear_gain_for(None, None), 1.0);
    }

    #[test]
    fn disabled_normalization_is_a_no_op() {
        let settings = NormalizationSettings::default();
        assert_eq!(settings.gain_db_for(Some(-40.0), Some(-30.0)), Some(0.0));
    }

    #[test]
    fn microphone_matching_retargets_the_auto_leveller() {
        let mut app = AppState::load();
        app.normalization = NormalizationSettings {
            enabled: true,
            match_microphone: true,
            target_lufs: -18.0,
            ..NormalizationSettings::default()
        };
        let effective = app.effective_voice_processing();
        assert!(effective.auto_level_enabled);
        assert_eq!(effective.target_min_db, -19.5);
        assert_eq!(effective.target_max_db, -16.5);
    }

    #[test]
    fn voice_processing_settings_are_sanitized_for_the_realtime_engine() {
        let settings = VoiceProcessingSettings {
            target_min_db: 5.0,
            target_max_db: -90.0,
            voice_monitor_gain: f32::INFINITY,
            gate_threshold_db: f32::NAN,
            compressor_ratio: 200.0,
            limiter_ceiling_db: 4.0,
            ..VoiceProcessingSettings::default()
        }
        .sanitized();

        assert_eq!(settings.target_min_db, -90.0);
        assert_eq!(settings.target_max_db, 0.0);
        assert_eq!(settings.voice_monitor_gain, 0.25);
        assert_eq!(settings.gate_threshold_db, -55.0);
        assert_eq!(settings.compressor_ratio, 20.0);
        assert_eq!(settings.limiter_ceiling_db, 0.0);
    }
}
