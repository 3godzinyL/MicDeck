use cpal::traits::{DeviceTrait, HostTrait};
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{self, Cursor};
use std::path::{Path, PathBuf};
use tempfile::TempDir;
use zip::ZipArchive;

const DRIVER_ARCHIVE: &[u8] = include_bytes!("../resources/vbcable/VBCABLE_Driver_Pack45.zip");
const DRIVER_SHA256: &str = "B950E39F01AF1D04EA623C8F6D8EB9B6EA5C477C637295FABF20631C85116BFB";

#[derive(Debug, Clone)]
pub struct AudioEndpoint {
    pub cpal_id: String,
    pub raw_id: String,
    pub name: String,
}

#[derive(Debug, Default, Clone)]
pub struct DriverBootstrap {
    pub installer_attempted: bool,
    pub restart_required: bool,
    pub error: Option<String>,
}

pub fn cable_render_endpoints() -> Vec<AudioEndpoint> {
    let Ok(devices) = cpal::default_host().output_devices() else {
        return Vec::new();
    };

    devices.filter_map(endpoint_if_vb_cable).collect()
}

pub fn cable_capture_endpoints() -> Vec<AudioEndpoint> {
    let Ok(devices) = cpal::default_host().input_devices() else {
        return Vec::new();
    };

    devices.filter_map(endpoint_if_vb_cable).collect()
}

pub fn driver_is_ready() -> bool {
    !cable_render_endpoints().is_empty() && !cable_capture_endpoints().is_empty()
}

fn endpoint_if_vb_cable(device: cpal::Device) -> Option<AudioEndpoint> {
    let description = device.description().ok()?;
    let device_name = description.name().to_lowercase();
    let driver_name = description.driver().unwrap_or_default().to_lowercase();
    let fingerprint = [
        Some(description.name()),
        description.manufacturer(),
        description.driver(),
    ]
    .into_iter()
    .flatten()
    .collect::<Vec<_>>()
    .join(" ")
    .to_lowercase();

    let is_vb_audio = fingerprint.contains("vb-audio") || fingerprint.contains("vbaudio");
    let is_cable = fingerprint.contains("cable");
    let is_standard_driver = driver_name.contains("vb-audio virtual cable");
    let is_standard_default_name = device_name.starts_with("cable input")
        || device_name.starts_with("cable in")
        || device_name.starts_with("cable output");
    if !is_vb_audio || !is_cable || (!is_standard_driver && !is_standard_default_name) {
        return None;
    }

    let id = device.id().ok()?;
    Some(AudioEndpoint {
        cpal_id: id.to_string(),
        raw_id: id.1,
        name: description.name().to_string(),
    })
}

#[cfg(not(debug_assertions))]
pub fn bootstrap_driver() -> DriverBootstrap {
    if driver_is_ready() || std::env::var_os("SOUNDBOARD_SKIP_DRIVER_INSTALL").is_some() {
        return DriverBootstrap::default();
    }

    install_driver_now()
}

pub fn install_driver_now() -> DriverBootstrap {
    if driver_is_ready() {
        return DriverBootstrap::default();
    }

    let mut status = DriverBootstrap {
        installer_attempted: true,
        ..DriverBootstrap::default()
    };

    if let Err(error) = install_official_driver() {
        status.error = Some(error);
        return status;
    }

    for _ in 0..20 {
        if driver_is_ready() {
            return status;
        }
        std::thread::sleep(std::time::Duration::from_millis(250));
    }

    status.restart_required = true;
    status
}

#[cfg(debug_assertions)]
pub fn bootstrap_driver() -> DriverBootstrap {
    DriverBootstrap::default()
}

fn verify_embedded_driver() -> Result<(), String> {
    let actual = format!("{:X}", Sha256::digest(DRIVER_ARCHIVE));
    if actual != DRIVER_SHA256 {
        return Err(format!(
            "Wbudowana paczka sterownika ma nieprawidłowy SHA-256: {actual}"
        ));
    }
    Ok(())
}

fn install_official_driver() -> Result<(), String> {
    verify_embedded_driver()?;
    let temp = tempfile::Builder::new()
        .prefix("micdeck-vbcable-")
        .tempdir()
        .map_err(|error| format!("Nie udało się utworzyć katalogu tymczasowego: {error}"))?;
    extract_driver_archive(&temp)?;

    let setup_name = if cfg!(target_pointer_width = "64") {
        "VBCABLE_Setup_x64.exe"
    } else {
        "VBCABLE_Setup.exe"
    };
    let setup_path = temp.path().join(setup_name);
    if !setup_path.is_file() {
        return Err(format!(
            "Brak oficjalnego instalatora {setup_name} w paczce"
        ));
    }

    let exit_code = run_elevated(&setup_path, "-i -h", temp.path(), false)?;
    if exit_code != 0 {
        return Err(format!(
            "Instalator VB-CABLE zakończył się kodem {exit_code}"
        ));
    }
    Ok(())
}

fn extract_driver_archive(temp: &TempDir) -> Result<(), String> {
    let reader = Cursor::new(DRIVER_ARCHIVE);
    let mut archive = ZipArchive::new(reader)
        .map_err(|error| format!("Nie udało się otworzyć paczki sterownika: {error}"))?;

    for index in 0..archive.len() {
        let mut entry = archive
            .by_index(index)
            .map_err(|error| format!("Błąd odczytu paczki sterownika: {error}"))?;
        let relative = entry
            .enclosed_name()
            .ok_or_else(|| "Paczka sterownika zawiera niebezpieczną ścieżkę".to_string())?;
        let output_path = temp.path().join(relative);

        if entry.is_dir() {
            fs::create_dir_all(&output_path)
                .map_err(|error| format!("Nie udało się rozpakować sterownika: {error}"))?;
            continue;
        }

        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent)
                .map_err(|error| format!("Nie udało się rozpakować sterownika: {error}"))?;
        }
        let mut output = File::create(&output_path)
            .map_err(|error| format!("Nie udało się zapisać sterownika: {error}"))?;
        io::copy(&mut entry, &mut output)
            .map_err(|error| format!("Nie udało się rozpakować sterownika: {error}"))?;
    }
    Ok(())
}

pub fn rename_endpoint_elevated(raw_endpoint_id: &str, name: &str) -> Result<(), String> {
    let name = validate_endpoint_name(name)?;
    if raw_endpoint_id.is_empty() || raw_endpoint_id.contains('"') {
        return Err("Nieprawidłowy identyfikator mikrofonu".into());
    }

    let executable = std::env::current_exe()
        .map_err(|error| format!("Nie udało się znaleźć pliku aplikacji: {error}"))?;
    let parameters = format!(
        "--rename-audio-endpoint \"{}\" \"{}\"",
        raw_endpoint_id, name
    );
    let working_directory = executable
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or_else(|| PathBuf::from("."));
    let exit_code = run_elevated(&executable, &parameters, &working_directory, true)?;

    if exit_code != 0 {
        return Err(format!(
            "Zmiana nazwy mikrofonu nie powiodła się (kod {exit_code})"
        ));
    }
    Ok(())
}

fn validate_endpoint_name(name: &str) -> Result<&str, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Nazwa mikrofonu nie może być pusta".into());
    }
    if trimmed.chars().count() > 80 {
        return Err("Nazwa mikrofonu może mieć maksymalnie 80 znaków".into());
    }
    if trimmed.contains('"') || trimmed.chars().any(char::is_control) {
        return Err("Nazwa mikrofonu zawiera niedozwolone znaki".into());
    }
    Ok(trimmed)
}

#[cfg(windows)]
fn run_elevated(
    executable: &Path,
    parameters: &str,
    working_directory: &Path,
    show_window: bool,
) -> Result<u32, String> {
    use windows::core::PCWSTR;
    use windows::Win32::Foundation::{CloseHandle, WAIT_OBJECT_0};
    use windows::Win32::System::Threading::{GetExitCodeProcess, WaitForSingleObject, INFINITE};
    use windows::Win32::UI::Shell::{ShellExecuteExW, SEE_MASK_NOCLOSEPROCESS, SHELLEXECUTEINFOW};

    let verb = wide("runas");
    let executable = wide(&executable.to_string_lossy());
    let parameters = wide(parameters);
    let directory = wide(&working_directory.to_string_lossy());
    let mut info = SHELLEXECUTEINFOW {
        cbSize: std::mem::size_of::<SHELLEXECUTEINFOW>() as u32,
        fMask: SEE_MASK_NOCLOSEPROCESS,
        lpVerb: PCWSTR(verb.as_ptr()),
        lpFile: PCWSTR(executable.as_ptr()),
        lpParameters: PCWSTR(parameters.as_ptr()),
        lpDirectory: PCWSTR(directory.as_ptr()),
        nShow: if show_window { 1 } else { 0 },
        ..Default::default()
    };

    unsafe {
        ShellExecuteExW(&mut info).map_err(|error| {
            format!("Nie udało się uruchomić instalatora jako administrator: {error}")
        })?;
        if info.hProcess.is_invalid() {
            return Err("Windows nie zwrócił uchwytu uruchomionego procesu".into());
        }

        let wait_result = WaitForSingleObject(info.hProcess, INFINITE);
        if wait_result != WAIT_OBJECT_0 {
            let _ = CloseHandle(info.hProcess);
            return Err(format!(
                "Oczekiwanie na proces nie powiodło się: {wait_result:?}"
            ));
        }

        let mut exit_code = 0;
        let exit_result = GetExitCodeProcess(info.hProcess, &mut exit_code);
        let _ = CloseHandle(info.hProcess);
        exit_result.map_err(|error| format!("Nie udało się odczytać wyniku procesu: {error}"))?;
        Ok(exit_code)
    }
}

#[cfg(not(windows))]
fn run_elevated(
    _executable: &Path,
    _parameters: &str,
    _working_directory: &Path,
    _show_window: bool,
) -> Result<u32, String> {
    Err("Automatyczna instalacja sterownika jest dostępna tylko na Windows".into())
}

#[cfg(windows)]
pub fn rename_endpoint_helper(raw_endpoint_id: &str, name: &str) -> Result<(), String> {
    use std::mem::ManuallyDrop;
    use windows::core::{GUID, PCWSTR, PWSTR};
    use windows::Win32::Foundation::PROPERTYKEY;
    use windows::Win32::Media::Audio::{IMMDeviceEnumerator, MMDeviceEnumerator};
    use windows::Win32::System::Com::StructuredStorage::{
        PROPVARIANT, PROPVARIANT_0, PROPVARIANT_0_0, PROPVARIANT_0_0_0,
    };
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CoUninitialize, CLSCTX_ALL, COINIT_APARTMENTTHREADED,
        STGM_READWRITE,
    };
    use windows::Win32::System::Variant::VT_LPWSTR;

    const PKEY_DEVICE_FRIENDLY_NAME: PROPERTYKEY = PROPERTYKEY {
        fmtid: GUID::from_u128(0xa45c254e_df1c_4efd_8020_67d146a850e0),
        pid: 14,
    };

    let name = validate_endpoint_name(name)?;
    let endpoint_id = wide(raw_endpoint_id);
    let mut endpoint_name = wide(name);

    unsafe {
        CoInitializeEx(None, COINIT_APARTMENTTHREADED)
            .ok()
            .map_err(|error| format!("Nie udało się uruchomić COM: {error}"))?;

        let result = (|| -> windows::core::Result<()> {
            let enumerator: IMMDeviceEnumerator =
                CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)?;
            let endpoint = enumerator.GetDevice(PCWSTR(endpoint_id.as_ptr()))?;
            let store = endpoint.OpenPropertyStore(STGM_READWRITE)?;
            let value = PROPVARIANT {
                Anonymous: PROPVARIANT_0 {
                    Anonymous: ManuallyDrop::new(PROPVARIANT_0_0 {
                        vt: VT_LPWSTR,
                        wReserved1: 0,
                        wReserved2: 0,
                        wReserved3: 0,
                        Anonymous: PROPVARIANT_0_0_0 {
                            pwszVal: PWSTR(endpoint_name.as_mut_ptr()),
                        },
                    }),
                },
            };
            store.SetValue(&PKEY_DEVICE_FRIENDLY_NAME, &value)?;
            store.Commit()?;
            Ok(())
        })();

        CoUninitialize();
        result.map_err(|error| format!("Windows odrzucił zmianę nazwy mikrofonu: {error}"))
    }
}

#[cfg(not(windows))]
pub fn rename_endpoint_helper(_raw_endpoint_id: &str, _name: &str) -> Result<(), String> {
    Err("Zmiana nazwy urządzenia jest dostępna tylko na Windows".into())
}

#[cfg(windows)]
fn wide(value: &str) -> Vec<u16> {
    use std::os::windows::ffi::OsStrExt;
    std::ffi::OsStr::new(value)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn embedded_driver_has_expected_hash_and_safe_paths() {
        verify_embedded_driver().expect("embedded driver hash should match");
        let temp = tempfile::Builder::new()
            .prefix("micdeck-driver-test-")
            .tempdir()
            .expect("temporary test directory");
        extract_driver_archive(&temp).expect("driver archive should extract safely");
        assert!(temp.path().join("VBCABLE_Setup_x64.exe").is_file());
        assert!(temp.path().join("vbMmeCable64_win10.inf").is_file());
        assert!(temp.path().join("vbaudio_cable64_win10.sys").is_file());
    }

    #[test]
    fn endpoint_name_validation_rejects_unsafe_values() {
        assert!(validate_endpoint_name("").is_err());
        assert!(validate_endpoint_name("bad \" name").is_err());
        assert!(validate_endpoint_name(&"x".repeat(81)).is_err());
        assert_eq!(
            validate_endpoint_name("  MicDeck Virtual Mic  ").unwrap(),
            "MicDeck Virtual Mic"
        );
    }
}
