#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use windows::core::w;
use windows::Win32::Foundation::{CloseHandle, GetLastError, ERROR_ALREADY_EXISTS};
use windows::Win32::System::Threading::{CreateMutexW, ReleaseMutex};

fn main() {
    let args = std::env::args().collect::<Vec<_>>();
    if args.get(1).map(String::as_str) == Some("--rename-audio-endpoint") {
        let result = match (args.get(2), args.get(3)) {
            (Some(endpoint_id), Some(name)) => {
                micdeck_lib::rename_audio_endpoint_helper(endpoint_id, name)
            }
            _ => Err("Brak identyfikatora urządzenia lub nowej nazwy".into()),
        };
        std::process::exit(if result.is_ok() { 0 } else { 1 });
    }

    let instance_mutex = unsafe {
        let handle = match CreateMutexW(None, true, w!("Local\\MicDeck.App.v2")) {
            Ok(handle) => handle,
            Err(_) => return,
        };
        if GetLastError() == ERROR_ALREADY_EXISTS {
            let _ = CloseHandle(handle);
            return;
        }
        handle
    };

    micdeck_lib::run();

    unsafe {
        let _ = ReleaseMutex(instance_mutex);
        let _ = CloseHandle(instance_mutex);
    }
}
