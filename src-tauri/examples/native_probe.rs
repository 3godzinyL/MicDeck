use libloading::Library;
use std::env;
use std::ffi::c_int;
use std::fs;
use std::path::PathBuf;
use std::thread;
use std::time::Duration;

#[repr(C)]
#[derive(Clone, Copy)]
struct RawStatus {
    protocol_version: u32,
    connected: i32,
    engine_state: i32,
    engine_pid: u32,
    microphone_level: f32,
    mixed_level: f32,
    underruns: u32,
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
            mixed_level: 0.0,
            underruns: 0,
            last_error: [0; 256],
        }
    }
}

fn newest_runtime_dll() -> Result<PathBuf, String> {
    let root = PathBuf::from(env::var_os("LOCALAPPDATA").ok_or("LOCALAPPDATA is missing")?)
        .join("micdeck/native");
    fs::read_dir(&root)
        .map_err(|error| error.to_string())?
        .filter_map(Result::ok)
        .map(|entry| entry.path().join("soundboard_ipc.dll"))
        .filter(|path| path.is_file())
        .max_by_key(|path| fs::metadata(path).and_then(|value| value.modified()).ok())
        .ok_or_else(|| format!("No native runtime DLL in {}", root.display()))
}

fn main() -> Result<(), String> {
    let dll_path = newest_runtime_dll()?;
    let command = env::args().nth(1).unwrap_or_else(|| "status".into());
    unsafe {
        let library = Library::new(&dll_path).map_err(|error| error.to_string())?;
        let open: unsafe extern "C" fn(c_int) -> c_int = *library
            .get(b"sb_open\0")
            .map_err(|error| error.to_string())?;
        let close: unsafe extern "C" fn() = *library
            .get(b"sb_close\0")
            .map_err(|error| error.to_string())?;
        let get_status: unsafe extern "C" fn(*mut RawStatus) -> c_int = *library
            .get(b"sb_get_status\0")
            .map_err(|error| error.to_string())?;
        let push_audio: unsafe extern "C" fn(*const f32, u32, u32) -> u32 = *library
            .get(b"sb_push_audio\0")
            .map_err(|error| error.to_string())?;

        if open(0) == 0 {
            return Err("Native audio session is not running".into());
        }

        if command == "tone" {
            let frames = 24_000usize;
            let mut samples = Vec::with_capacity(frames * 2);
            for frame in 0..frames {
                let sample =
                    ((frame as f32 * 440.0 * std::f32::consts::TAU) / 48_000.0).sin() * 0.22;
                samples.extend_from_slice(&[sample, sample]);
            }
            let mut sent = 0usize;
            while sent < frames {
                let accepted =
                    push_audio(samples[sent * 2..].as_ptr(), (frames - sent) as u32, 2) as usize;
                sent += accepted;
                if accepted == 0 {
                    thread::sleep(Duration::from_millis(5));
                }
            }
            thread::sleep(Duration::from_millis(120));
            println!("tone_frames={sent}");
        }

        let mut status = RawStatus::default();
        get_status(&mut status);
        let error_length = status
            .last_error
            .iter()
            .position(|value| *value == 0)
            .unwrap_or(status.last_error.len());
        println!(
            "dll={}\nprotocol={} connected={} state={} pid={} mic={:.3} mix={:.3} xruns={} error={}",
            dll_path.display(),
            status.protocol_version,
            status.connected,
            status.engine_state,
            status.engine_pid,
            status.microphone_level,
            status.mixed_level,
            status.underruns,
            String::from_utf16_lossy(&status.last_error[..error_length])
        );
        close();
    }
    Ok(())
}
