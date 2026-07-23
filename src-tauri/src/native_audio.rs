use libloading::Library;
use rodio::source::UniformSourceIterator;
use rodio::Decoder;
use sha2::{Digest, Sha256};
use std::ffi::{c_int, OsStr};
use std::fs::{self, File};
use std::io::BufReader;
use std::num::NonZero;
use std::os::windows::ffi::OsStrExt;
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};

const IPC_DLL_BYTES: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/native/soundboard_ipc.dll"));
const ENGINE_EXE_BYTES: &[u8] = include_bytes!(concat!(
    env!("OUT_DIR"),
    "/native/soundboard_audio_engine.exe"
));
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

type OpenFn = unsafe extern "C" fn(c_int) -> c_int;
type CloseFn = unsafe extern "C" fn();
type ResetFn = unsafe extern "C" fn() -> c_int;
type SetDeviceFn = unsafe extern "C" fn(*const u16) -> c_int;
type SetGainsFn = unsafe extern "C" fn(f32, f32) -> c_int;
type SetMonitorGainFn = unsafe extern "C" fn(f32) -> c_int;
type SetSystemAudioFn = unsafe extern "C" fn(c_int, f32) -> c_int;
type PushAudioFn = unsafe extern "C" fn(*const f32, u32, u32) -> u32;
type ClearAudioFn = unsafe extern "C" fn();
type GetStatusFn = unsafe extern "C" fn(*mut RawStatus) -> c_int;
type TouchFn = unsafe extern "C" fn();
type RequestShutdownFn = unsafe extern "C" fn();

#[repr(C)]
#[derive(Clone, Copy)]
struct RawStatus {
    protocol_version: u32,
    connected: i32,
    engine_state: i32,
    engine_pid: u32,
    microphone_level: f32,
    system_level: f32,
    mixed_level: f32,
    underruns: u32,
    estimated_latency_ms: f32,
    last_error: [u16; 256],
}

impl Default for RawStatus {
    fn default() -> Self {
        Self {
            protocol_version: 0,
            connected: 0,
            engine_state: 0,
            engine_pid: 0,
            microphone_level: 0.0,
            system_level: 0.0,
            mixed_level: 0.0,
            underruns: 0,
            estimated_latency_ms: 0.0,
            last_error: [0; 256],
        }
    }
}

#[derive(Debug, Clone)]
pub struct EngineStatus {
    pub protocol_version: u32,
    pub connected: bool,
    pub engine_state: i32,
    pub engine_pid: u32,
    pub microphone_level: f32,
    pub system_level: f32,
    pub mixed_level: f32,
    pub underruns: u32,
    pub estimated_latency_ms: f32,
    pub error: Option<String>,
}

struct Bridge {
    _library: Library,
    close: CloseFn,
    reset: ResetFn,
    set_input: SetDeviceFn,
    set_output: SetDeviceFn,
    set_virtual_capture: SetDeviceFn,
    set_gains: SetGainsFn,
    set_monitor_gain: SetMonitorGainFn,
    set_system_audio: SetSystemAudioFn,
    push_audio: PushAudioFn,
    clear_audio: ClearAudioFn,
    get_status: GetStatusFn,
    touch_ui: TouchFn,
    request_shutdown: RequestShutdownFn,
}

impl Bridge {
    unsafe fn load(path: &Path) -> Result<Self, String> {
        let library = Library::new(path)
            .map_err(|error| format!("Nie udało się załadować native audio DLL: {error}"))?;

        let open: OpenFn = *library
            .get(b"sb_open\0")
            .map_err(|error| format!("Brak sb_open w native DLL: {error}"))?;
        let bridge = Self {
            close: *library
                .get(b"sb_close\0")
                .map_err(|error| format!("Brak sb_close w native DLL: {error}"))?,
            reset: *library
                .get(b"sb_reset_session\0")
                .map_err(|error| format!("Brak sb_reset_session w native DLL: {error}"))?,
            set_input: *library
                .get(b"sb_set_input_device\0")
                .map_err(|error| format!("Brak sb_set_input_device w native DLL: {error}"))?,
            set_output: *library
                .get(b"sb_set_output_device\0")
                .map_err(|error| format!("Brak sb_set_output_device w native DLL: {error}"))?,
            set_virtual_capture: *library.get(b"sb_set_virtual_capture_device\0").map_err(
                |error| format!("Brak sb_set_virtual_capture_device w native DLL: {error}"),
            )?,
            set_gains: *library
                .get(b"sb_set_gains\0")
                .map_err(|error| format!("Brak sb_set_gains w native DLL: {error}"))?,
            set_monitor_gain: *library
                .get(b"sb_set_monitor_gain\0")
                .map_err(|error| format!("Brak sb_set_monitor_gain w native DLL: {error}"))?,
            set_system_audio: *library
                .get(b"sb_set_system_audio\0")
                .map_err(|error| format!("Brak sb_set_system_audio w native DLL: {error}"))?,
            push_audio: *library
                .get(b"sb_push_audio\0")
                .map_err(|error| format!("Brak sb_push_audio w native DLL: {error}"))?,
            clear_audio: *library
                .get(b"sb_clear_audio\0")
                .map_err(|error| format!("Brak sb_clear_audio w native DLL: {error}"))?,
            get_status: *library
                .get(b"sb_get_status\0")
                .map_err(|error| format!("Brak sb_get_status w native DLL: {error}"))?,
            touch_ui: *library
                .get(b"sb_touch_ui\0")
                .map_err(|error| format!("Brak sb_touch_ui w native DLL: {error}"))?,
            request_shutdown: *library
                .get(b"sb_request_shutdown\0")
                .map_err(|error| format!("Brak sb_request_shutdown w native DLL: {error}"))?,
            _library: library,
        };

        if open(1) == 0 {
            return Err("Nie udało się utworzyć pamięci współdzielonej audio".into());
        }
        if (bridge.reset)() == 0 {
            return Err("Nie udało się wyzerować sesji native audio".into());
        }
        Ok(bridge)
    }

    fn set_input(&self, endpoint_id: &str) -> Result<(), String> {
        let wide = wide_null(endpoint_id);
        if unsafe { (self.set_input)(wide.as_ptr()) } == 0 {
            Err("Native engine odrzucił mikrofon wejściowy".into())
        } else {
            Ok(())
        }
    }

    fn set_output(&self, endpoint_id: &str) -> Result<(), String> {
        let wide = wide_null(endpoint_id);
        if unsafe { (self.set_output)(wide.as_ptr()) } == 0 {
            Err("Native engine odrzucił wirtualne wyjście".into())
        } else {
            Ok(())
        }
    }

    fn set_virtual_capture(&self, endpoint_id: &str) -> Result<(), String> {
        let wide = wide_null(endpoint_id);
        if unsafe { (self.set_virtual_capture)(wide.as_ptr()) } == 0 {
            Err("Native engine odrzucił systemowy mikrofon wirtualny".into())
        } else {
            Ok(())
        }
    }

    fn set_gains(&self, microphone_gain: f32, sound_gain: f32) {
        unsafe {
            (self.set_gains)(microphone_gain, sound_gain);
        }
    }

    fn set_monitor_gain(&self, monitor_gain: f32) {
        unsafe {
            (self.set_monitor_gain)(monitor_gain);
        }
    }

    fn set_system_audio(&self, enabled: bool, gain: f32) {
        unsafe {
            (self.set_system_audio)(i32::from(enabled), gain);
        }
    }

    fn clear_audio(&self) {
        unsafe { (self.clear_audio)() }
    }

    fn touch(&self) {
        unsafe { (self.touch_ui)() }
    }

    fn push_audio(&self, samples: &[f32]) -> usize {
        if samples.len() < 2 {
            return 0;
        }
        unsafe { (self.push_audio)(samples.as_ptr(), (samples.len() / 2) as u32, 2) as usize }
    }

    fn status(&self) -> EngineStatus {
        let mut raw = RawStatus::default();
        let connected = unsafe { (self.get_status)(&mut raw) } != 0 && raw.connected != 0;
        let error_length = raw
            .last_error
            .iter()
            .position(|value| *value == 0)
            .unwrap_or(raw.last_error.len());
        let error = String::from_utf16_lossy(&raw.last_error[..error_length]);
        EngineStatus {
            protocol_version: raw.protocol_version,
            connected,
            engine_state: raw.engine_state,
            engine_pid: raw.engine_pid,
            microphone_level: raw.microphone_level,
            system_level: raw.system_level,
            mixed_level: raw.mixed_level,
            underruns: raw.underruns,
            estimated_latency_ms: raw.estimated_latency_ms,
            error: (!error.trim().is_empty()).then_some(error),
        }
    }
}

impl Drop for Bridge {
    fn drop(&mut self) {
        unsafe { (self.close)() }
    }
}

pub struct NativeAudioEngine {
    bridge: Arc<Bridge>,
    child: Mutex<Option<Child>>,
    playback_generation: Arc<AtomicU64>,
    stopping: Arc<AtomicBool>,
    heartbeat: Option<JoinHandle<()>>,
}

pub struct NativeAudioConfig<'a> {
    pub input_endpoint_id: &'a str,
    pub output_endpoint_id: &'a str,
    pub virtual_capture_endpoint_id: &'a str,
    pub microphone_gain: f32,
    pub sound_gain: f32,
    pub system_audio_enabled: bool,
    pub system_audio_gain: f32,
}

impl NativeAudioEngine {
    pub fn start() -> Result<Self, String> {
        let runtime_dir = extract_runtime()?;
        let dll_path = runtime_dir.join("soundboard_ipc.dll");
        let engine_path = runtime_dir.join("soundboard_audio_engine.exe");
        let bridge = Arc::new(unsafe { Bridge::load(&dll_path)? });
        bridge.touch();

        let child = Command::new(&engine_path)
            .current_dir(&runtime_dir)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .creation_flags(CREATE_NO_WINDOW)
            .spawn()
            .map_err(|error| format!("Nie udało się uruchomić C++ audio engine: {error}"))?;

        let stopping = Arc::new(AtomicBool::new(false));
        let heartbeat_bridge = Arc::clone(&bridge);
        let heartbeat_stopping = Arc::clone(&stopping);
        let heartbeat = thread::Builder::new()
            .name("soundboard-native-heartbeat".into())
            .spawn(move || {
                while !heartbeat_stopping.load(Ordering::Acquire) {
                    heartbeat_bridge.touch();
                    thread::sleep(Duration::from_millis(750));
                }
            })
            .map_err(|error| format!("Nie udało się uruchomić heartbeat audio: {error}"))?;

        Ok(Self {
            bridge,
            child: Mutex::new(Some(child)),
            playback_generation: Arc::new(AtomicU64::new(0)),
            stopping,
            heartbeat: Some(heartbeat),
        })
    }

    pub fn configure(&self, config: NativeAudioConfig<'_>) -> Result<(), String> {
        self.bridge.set_input(config.input_endpoint_id)?;
        self.bridge.set_output(config.output_endpoint_id)?;
        self.bridge
            .set_virtual_capture(config.virtual_capture_endpoint_id)?;
        self.bridge
            .set_gains(config.microphone_gain, config.sound_gain);
        self.bridge
            .set_system_audio(config.system_audio_enabled, config.system_audio_gain);
        Ok(())
    }

    pub fn set_gains(&self, microphone_gain: f32, sound_gain: f32) {
        self.bridge.set_gains(microphone_gain, sound_gain);
    }

    pub fn set_monitor_gain(&self, monitor_gain: f32) {
        self.bridge.set_monitor_gain(monitor_gain);
    }

    pub fn set_system_audio(&self, enabled: bool, gain: f32) {
        self.bridge.set_system_audio(enabled, gain);
    }

    pub fn status(&self) -> EngineStatus {
        self.bridge.touch();
        self.bridge.status()
    }

    pub fn play_file(&self, path: &Path) -> Result<(), String> {
        let file = File::open(path)
            .map_err(|error| format!("Nie udało się otworzyć pliku dla native engine: {error}"))?;
        let decoder = Decoder::try_from(BufReader::new(file))
            .map_err(|error| format!("Nie udało się zdekodować pliku audio: {error}"))?;

        self.stop_sound();
        let generation = self.playback_generation.load(Ordering::Acquire);
        let playback_generation = Arc::clone(&self.playback_generation);
        let bridge = Arc::clone(&self.bridge);

        thread::Builder::new()
            .name("soundboard-native-decoder".into())
            .spawn(move || {
                let channels = NonZero::new(2u16).unwrap();
                let sample_rate = NonZero::new(48_000u32).unwrap();
                let source = UniformSourceIterator::new(decoder, channels, sample_rate);
                let mut chunk = Vec::with_capacity(960 * 2);

                for sample in source {
                    if playback_generation.load(Ordering::Acquire) != generation {
                        return;
                    }
                    chunk.push(sample);
                    if chunk.len() >= 960 * 2 {
                        if !push_chunk_until_consumed(
                            &bridge,
                            &chunk,
                            &playback_generation,
                            generation,
                        ) {
                            return;
                        }
                        chunk.clear();
                    }
                }

                if !chunk.is_empty() {
                    let _ = push_chunk_until_consumed(
                        &bridge,
                        &chunk,
                        &playback_generation,
                        generation,
                    );
                }
            })
            .map_err(|error| format!("Nie udało się uruchomić dekodera audio: {error}"))?;
        Ok(())
    }

    pub fn stop_sound(&self) {
        self.playback_generation.fetch_add(1, Ordering::AcqRel);
        self.bridge.clear_audio();
    }

    pub fn shutdown(&mut self) {
        self.stop_sound();
        if self.stopping.swap(true, Ordering::AcqRel) {
            return;
        }
        unsafe { (self.bridge.request_shutdown)() };
        if let Some(heartbeat) = self.heartbeat.take() {
            let _ = heartbeat.join();
        }

        if let Ok(mut guard) = self.child.lock() {
            if let Some(child) = guard.as_mut() {
                let deadline = Instant::now() + Duration::from_secs(2);
                while Instant::now() < deadline {
                    if matches!(child.try_wait(), Ok(Some(_))) {
                        break;
                    }
                    thread::sleep(Duration::from_millis(50));
                }
                if matches!(child.try_wait(), Ok(None)) {
                    let _ = child.kill();
                    let _ = child.wait();
                }
            }
            guard.take();
        }
    }
}

impl Drop for NativeAudioEngine {
    fn drop(&mut self) {
        self.shutdown();
    }
}

fn push_chunk_until_consumed(
    bridge: &Bridge,
    chunk: &[f32],
    generation: &AtomicU64,
    expected_generation: u64,
) -> bool {
    let mut offset_frames = 0usize;
    let total_frames = chunk.len() / 2;
    while offset_frames < total_frames {
        if generation.load(Ordering::Acquire) != expected_generation {
            return false;
        }
        let written = bridge.push_audio(&chunk[offset_frames * 2..]);
        if written == 0 {
            thread::sleep(Duration::from_millis(2));
        } else {
            offset_frames += written;
        }
    }
    true
}

fn extract_runtime() -> Result<PathBuf, String> {
    let mut hasher = Sha256::new();
    hasher.update(IPC_DLL_BYTES);
    hasher.update(ENGINE_EXE_BYTES);
    let hash = format!("{:x}", hasher.finalize());
    let base = dirs::data_local_dir()
        .ok_or_else(|| "Brak katalogu LocalAppData dla native audio".to_string())?;
    let runtime_dir = base.join("micdeck").join("native").join(&hash[..16]);
    fs::create_dir_all(&runtime_dir)
        .map_err(|error| format!("Nie udało się utworzyć katalogu native audio: {error}"))?;
    write_if_changed(&runtime_dir.join("soundboard_ipc.dll"), IPC_DLL_BYTES)?;
    write_if_changed(
        &runtime_dir.join("soundboard_audio_engine.exe"),
        ENGINE_EXE_BYTES,
    )?;
    Ok(runtime_dir)
}

fn write_if_changed(path: &Path, bytes: &[u8]) -> Result<(), String> {
    if fs::read(path).ok().as_deref() == Some(bytes) {
        return Ok(());
    }
    fs::write(path, bytes)
        .map_err(|error| format!("Nie udało się zapisać {}: {error}", path.display()))
}

fn wide_null(value: &str) -> Vec<u16> {
    OsStr::new(value).encode_wide().chain(Some(0)).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn embedded_native_runtime_contains_pe_binaries() {
        assert_eq!(&IPC_DLL_BYTES[..2], b"MZ");
        assert_eq!(&ENGINE_EXE_BYTES[..2], b"MZ");
        assert!(IPC_DLL_BYTES.len() > 32_000);
        assert!(ENGINE_EXE_BYTES.len() > 64_000);
    }
}
