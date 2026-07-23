mod native_audio;
mod virtual_audio;

use cpal::traits::{DeviceTrait, HostTrait};
use rodio::{Decoder, Source};
use serde::{Deserialize, Serialize};
use std::f32;
use std::fs::{self, File};
use std::io::BufReader;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Mutex;
use std::time::Instant;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
use tauri_plugin_autostart::MacosLauncher;

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
    underruns: u32,
    #[serde(rename = "estimatedLatencyMs")]
    estimated_latency_ms: f32,
    error: Option<String>,
    runtime: &'static str,
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
    virtual_render_device: Option<String>,
    #[serde(default)]
    virtual_capture_device: Option<String>,
}

struct ActivePlayback {
    sound_id: String,
    sound_name: String,
    duration_ms: u64,
    started_at: Instant,
    meter_profile: Vec<u8>,
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
    next_id: u64,
    playback: Option<ActivePlayback>,
    virtual_render_device: Option<String>,
    virtual_capture_device: Option<String>,
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
        let mut sounds = persisted
            .as_ref()
            .map(|p| p.sounds.clone())
            .unwrap_or_default();

        for sound in &mut sounds {
            if (sound.duration_ms == 0 || sound.meter_profile.is_empty())
                && Path::new(&sound.path).exists()
            {
                if let Ok((duration_ms, meter_profile)) = analyze_audio_file(Path::new(&sound.path))
                {
                    sound.duration_ms = duration_ms;
                    sound.meter_profile = meter_profile;
                }
            }
        }

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
            system_audio_enabled: persisted
                .as_ref()
                .map(|p| p.system_audio_enabled)
                .unwrap_or(false),
            system_audio_gain: persisted
                .as_ref()
                .map(|p| clamp_system_audio_gain(p.system_audio_gain))
                .unwrap_or_else(default_system_audio_gain),
            next_id,
            playback: None,
            virtual_render_device: persisted
                .as_ref()
                .and_then(|p| p.virtual_render_device.clone()),
            virtual_capture_device: persisted
                .as_ref()
                .and_then(|p| p.virtual_capture_device.clone()),
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
            virtual_render_device: self.virtual_render_device.clone(),
            virtual_capture_device: self.virtual_capture_device.clone(),
        };

        let path = config_file_path()?;
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Nie udało się utworzyć katalogu config: {e}"))?;
        }

        let json = serde_json::to_string_pretty(&persisted)
            .map_err(|e| format!("Nie udało się zapisać JSON: {e}"))?;
        fs::write(path, json).map_err(|e| format!("Nie udało się zapisać configu: {e}"))?;
        Ok(())
    }

    fn effective_sound_gain(&self) -> f32 {
        (self.volume * self.sound_overdrive).clamp(0.0, 24.0)
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
            let signal_level_01 =
                level_for_position(&playback.meter_profile, position_ms) * self.volume;
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

fn analyze_audio_file(path: &Path) -> Result<(u64, Vec<u8>), String> {
    let file =
        File::open(path).map_err(|e| format!("Nie udało się otworzyć pliku do analizy: {e}"))?;
    let decoder = Decoder::try_from(BufReader::new(file))
        .map_err(|e| format!("Nie udało się zdekodować pliku: {e}"))?;

    let channels = usize::from(decoder.channels().get().max(1));
    let sample_rate = decoder.sample_rate().get().max(1) as usize;
    let samples_per_chunk = ((sample_rate * channels) / 10).max(channels);
    let total_duration = decoder.total_duration().map(|d| d.as_millis() as u64);

    let mut meter_profile = Vec::new();
    let mut sum_sq = 0.0f64;
    let mut count = 0usize;
    let mut total_samples = 0usize;

    for sample in decoder {
        let s = sample.abs().min(1.25) as f64;
        sum_sq += s * s;
        count += 1;
        total_samples += 1;

        if count >= samples_per_chunk {
            let rms = (sum_sq / count as f64).sqrt().clamp(0.0, 1.0);
            meter_profile.push((rms * 255.0).round() as u8);
            sum_sq = 0.0;
            count = 0;
        }
    }

    if count > 0 {
        let rms = (sum_sq / count as f64).sqrt().clamp(0.0, 1.0);
        meter_profile.push((rms * 255.0).round() as u8);
    }

    let duration_ms = total_duration.unwrap_or_else(|| {
        ((total_samples as f64 / (sample_rate * channels) as f64) * 1000.0).round() as u64
    });

    Ok((duration_ms, meter_profile))
}

fn to_sound_dto(item: &SoundItem) -> SoundDto {
    let source_kind = if item.path.contains("micdeck") || item.path.contains("soundboard-binder") {
        "library"
    } else {
        "file"
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
    }
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
    let virtual_ids = virtual_audio::cable_capture_endpoints()
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
                && fingerprint.contains("cable"));
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
    let render = resolve_managed_endpoint(
        virtual_audio::cable_render_endpoints(),
        app.virtual_render_device.as_deref(),
    );
    let capture = resolve_managed_endpoint(
        virtual_audio::cable_capture_endpoints(),
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
    let (render, capture) = sync_virtual_audio_devices(&mut app);
    let bootstrap = bootstrap
        .lock()
        .map_err(|_| "Driver state lock error".to_string())?
        .clone();
    let ready = render.is_some() && capture.is_some();

    Ok(VirtualAudioStatusDto {
        installed: render.is_some() || capture.is_some(),
        ready,
        installer_attempted: bootstrap.installer_attempted,
        restart_required: bootstrap.restart_required || (bootstrap.installer_attempted && !ready),
        error: bootstrap.error,
        vendor: "VB-Audio / VB-CABLE Pack45",
        render_device_id: render.as_ref().map(|endpoint| endpoint.cpal_id.clone()),
        render_device_name: render.map(|endpoint| endpoint.name),
        microphone_device_id: capture.as_ref().map(|endpoint| endpoint.cpal_id.clone()),
        microphone_name: capture.map(|endpoint| endpoint.name),
    })
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
    bootstrap: tauri::State<'_, Mutex<virtual_audio::DriverBootstrap>>,
    state: tauri::State<'_, Mutex<AppState>>,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<(), String> {
    let result = virtual_audio::install_driver_now();
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
    let (render, capture) = sync_virtual_audio_devices(app);
    let render = render.ok_or_else(|| {
        "Wirtualne wyjście VB-CABLE nie jest jeszcze gotowe. Zainstaluj sterownik lub uruchom ponownie Windows."
            .to_string()
    })?;
    let capture = capture.ok_or_else(|| {
        "Wirtualny mikrofon VB-CABLE nie jest jeszcze gotowy. Uruchom ponownie Windows po instalacji sterownika."
            .to_string()
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
            underruns: 0,
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
        underruns: status.underruns,
        estimated_latency_ms: status.estimated_latency_ms.max(0.0),
        error: status.error.or_else(|| native.startup_error.clone()),
        runtime: "C++ / WASAPI",
    })
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

fn add_sound_path(app: &mut AppState, path: PathBuf) -> Result<(), String> {
    if !path.exists() || !path.is_file() {
        return Err("Plik nie istnieje albo nie jest plikiem audio".into());
    }

    let normalized = path.to_string_lossy().to_string();
    if app.sounds.iter().any(|s| s.path == normalized) {
        return Ok(());
    }

    let (duration_ms, meter_profile) = analyze_audio_file(&path)?;
    let file_size = path.metadata().map(|m| m.len()).unwrap_or(0);
    let item = SoundItem {
        id: app.next_id.to_string(),
        name: file_name_for_path(&path),
        path: normalized,
        extension: extension_for_path(&path),
        file_size,
        duration_ms,
        meter_profile,
    };
    app.next_id += 1;
    app.sounds.push(item);
    Ok(())
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
    Ok(app.sounds.iter().map(to_sound_dto).collect())
}

#[tauri::command]
fn add_sounds(
    paths: Vec<String>,
    state: tauri::State<'_, Mutex<AppState>>,
) -> Result<Vec<SoundDto>, String> {
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;

    for raw in paths {
        let path = PathBuf::from(&raw);
        let _ = add_sound_path(&mut app, path);
    }

    app.persist()?;
    Ok(app.sounds.iter().map(to_sound_dto).collect())
}

#[tauri::command]
fn import_from_url(
    url: String,
    state: tauri::State<'_, Mutex<AppState>>,
) -> Result<Vec<SoundDto>, String> {
    let trimmed = url.trim();
    if trimmed.is_empty() {
        return Err("Wklej link do YouTube, Shorts albo TikToka".into());
    }
    validate_media_url(trimmed)?;

    let downloaded = download_audio_to_library(trimmed)?;
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;
    add_sound_path(&mut app, downloaded)?;
    app.persist()?;
    Ok(app.sounds.iter().map(to_sound_dto).collect())
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
fn play_sound(
    id: String,
    state: tauri::State<'_, Mutex<AppState>>,
    native: tauri::State<'_, Mutex<NativeAudioRuntime>>,
) -> Result<(), String> {
    let mut app = state.lock().map_err(|_| "State lock error".to_string())?;

    let sound_index = app
        .sounds
        .iter()
        .position(|s| s.id == id)
        .ok_or_else(|| "Nie znaleziono dźwięku".to_string())?;

    let needs_analysis = app.sounds[sound_index].duration_ms == 0
        || app.sounds[sound_index].meter_profile.is_empty();
    if needs_analysis {
        let path = PathBuf::from(&app.sounds[sound_index].path);
        let (duration_ms, meter_profile) = analyze_audio_file(&path)?;
        app.sounds[sound_index].duration_ms = duration_ms;
        app.sounds[sound_index].meter_profile = meter_profile;
        let _ = app.persist();
    }

    let sound = app.sounds[sound_index].clone();
    app.playback = None;
    let native = native
        .lock()
        .map_err(|_| "Native audio lock error".to_string())?;
    let engine = native.engine.as_ref().ok_or_else(|| {
        native
            .startup_error
            .clone()
            .unwrap_or_else(|| "C++ audio engine nie działa".into())
    })?;
    engine.set_gains(app.microphone_gain, app.effective_sound_gain());
    engine.play_file(Path::new(&sound.path))?;

    app.playback = Some(ActivePlayback {
        sound_id: sound.id,
        sound_name: sound.name,
        duration_ms: sound.duration_ms,
        started_at: Instant::now(),
        meter_profile: sound.meter_profile,
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
            remove_sound,
            list_output_devices,
            list_input_devices,
            get_virtual_audio_status,
            install_virtual_audio_driver,
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
            get_native_audio_status,
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
                let hide_for_driver_setup = !cfg!(debug_assertions)
                    && !virtual_audio::driver_is_ready()
                    && std::env::var_os("SOUNDBOARD_SKIP_DRIVER_INSTALL").is_none();
                if hide_for_driver_setup || start_minimized {
                    let _ = window.hide();
                }

                let driver_status = virtual_audio::bootstrap_driver();
                if let Ok(mut state) = app.state::<Mutex<virtual_audio::DriverBootstrap>>().lock() {
                    *state = driver_status;
                }

                if let (Ok(mut app_state), Ok(mut native_state)) = (
                    app.state::<Mutex<AppState>>().lock(),
                    app.state::<Mutex<NativeAudioRuntime>>().lock(),
                ) {
                    start_native_runtime(&mut app_state, &mut native_state);
                }

                if hide_for_driver_setup && !start_minimized {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
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
}
