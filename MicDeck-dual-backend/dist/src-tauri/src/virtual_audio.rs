use cpal::traits::{DeviceTrait, HostTrait};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{self, Cursor, Write};
use std::path::{Path, PathBuf};
use tempfile::TempDir;
use zip::ZipArchive;

const VB_DRIVER_ARCHIVE: &[u8] = include_bytes!("../resources/vbcable/VBCABLE_Driver_Pack45.zip");
const VB_DRIVER_SHA256: &str = "B950E39F01AF1D04EA623C8F6D8EB9B6EA5C477C637295FABF20631C85116BFB";

const MICDECK_VAD_SYS: &[u8] =
    include_bytes!(concat!(env!("OUT_DIR"), "/micdeck-vad/MicDeckVad.sys"));
const MICDECK_VAD_INF: &[u8] =
    include_bytes!(concat!(env!("OUT_DIR"), "/micdeck-vad/MicDeckVad.inf"));
const MICDECK_VAD_CAT: &[u8] =
    include_bytes!(concat!(env!("OUT_DIR"), "/micdeck-vad/MicDeckVad.cat"));
const MICDECK_VAD_MANIFEST: &[u8] = include_bytes!(concat!(
    env!("OUT_DIR"),
    "/micdeck-vad/driver-manifest.json"
));
const MICDECK_VAD_HELPER: &[u8] = include_bytes!(concat!(
    env!("OUT_DIR"),
    "/micdeck-vad/micdeck-driver-helper.exe"
));
const MICDECK_VAD_PACKAGE_READY: &str = env!("MICDECK_VAD_PACKAGE_READY");

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum VirtualAudioBackend {
    #[default]
    VbCable,
    MicDeckVad,
}

impl VirtualAudioBackend {
    pub const fn label(self) -> &'static str {
        match self {
            Self::VbCable => "VB-CABLE",
            Self::MicDeckVad => "MicDeck VAD",
        }
    }

    pub const fn vendor(self) -> &'static str {
        match self {
            Self::VbCable => "VB-Audio / VB-CABLE Pack45",
            Self::MicDeckVad => "MicDeck / custom WaveRT driver",
        }
    }

    pub const fn vendor_url(self) -> Option<&'static str> {
        match self {
            Self::VbCable => Some("https://vb-audio.com/Cable/"),
            Self::MicDeckVad => None,
        }
    }

    pub const fn is_third_party(self) -> bool {
        matches!(self, Self::VbCable)
    }

    pub const fn default_microphone_name(self) -> &'static str {
        match self {
            Self::VbCable => "MicDeck Virtual Mic",
            Self::MicDeckVad => "MicDeck Virtual Microphone",
        }
    }

    pub const fn missing_route_message(self) -> &'static str {
        match self {
            Self::VbCable => {
                "VB-CABLE nie jest jeszcze gotowy. Zainstaluj sterownik lub uruchom ponownie Windows."
            }
            Self::MicDeckVad => {
                "MicDeck VAD nie jest jeszcze gotowy. Zbuduj lub zainstaluj pakiet sterownika i odśwież routing."
            }
        }
    }
}

#[derive(Debug, Clone)]
pub struct AudioEndpoint {
    pub cpal_id: String,
    pub raw_id: String,
    pub name: String,
    pub backend: VirtualAudioBackend,
}

#[derive(Debug, Default, Clone)]
pub struct DriverBootstrap {
    pub backend: Option<VirtualAudioBackend>,
    pub installer_attempted: bool,
    pub restart_required: bool,
    pub error: Option<String>,
}

#[derive(Debug, Deserialize)]
struct DriverPackageManifest {
    #[allow(dead_code)]
    version: String,
    #[allow(dead_code)]
    abi: u32,
    files: Vec<DriverPackageFile>,
}

#[derive(Debug, Deserialize)]
struct DriverPackageFile {
    name: String,
    sha256: String,
}

pub fn render_endpoints(backend: VirtualAudioBackend) -> Vec<AudioEndpoint> {
    let Ok(devices) = cpal::default_host().output_devices() else {
        return Vec::new();
    };

    devices
        .filter_map(|device| endpoint_if_backend(device, backend, true))
        .collect()
}

pub fn capture_endpoints(backend: VirtualAudioBackend) -> Vec<AudioEndpoint> {
    let Ok(devices) = cpal::default_host().input_devices() else {
        return Vec::new();
    };

    devices
        .filter_map(|device| endpoint_if_backend(device, backend, false))
        .collect()
}

pub fn all_managed_capture_endpoints() -> Vec<AudioEndpoint> {
    [
        VirtualAudioBackend::VbCable,
        VirtualAudioBackend::MicDeckVad,
    ]
    .into_iter()
    .flat_map(capture_endpoints)
    .collect()
}

pub fn driver_is_ready(backend: VirtualAudioBackend) -> bool {
    !render_endpoints(backend).is_empty() && !capture_endpoints(backend).is_empty()
}

pub fn custom_driver_package_ready() -> bool {
    MICDECK_VAD_PACKAGE_READY == "1"
        && !MICDECK_VAD_SYS.is_empty()
        && !MICDECK_VAD_INF.is_empty()
        && !MICDECK_VAD_CAT.is_empty()
        && !MICDECK_VAD_MANIFEST.is_empty()
        && !MICDECK_VAD_HELPER.is_empty()
}

fn endpoint_if_backend(
    device: cpal::Device,
    backend: VirtualAudioBackend,
    render: bool,
) -> Option<AudioEndpoint> {
    let description = device.description().ok()?;
    let name = description.name().to_string();
    let device_name = name.to_lowercase();
    let driver_name = description.driver().unwrap_or_default().to_lowercase();
    let id = device.id().ok()?;
    let cpal_id = id.to_string();
    let raw_id = id.1;
    let id_fingerprint = raw_id.to_lowercase();
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

    let matches = match backend {
        VirtualAudioBackend::VbCable => {
            let is_vb_audio = fingerprint.contains("vb-audio") || fingerprint.contains("vbaudio");
            let is_cable = fingerprint.contains("cable");
            let is_standard_driver = driver_name.contains("vb-audio virtual cable");
            let is_standard_default_name = device_name.starts_with("cable input")
                || device_name.starts_with("cable in")
                || device_name.starts_with("cable output");
            is_vb_audio && is_cable && (is_standard_driver || is_standard_default_name)
        }
        VirtualAudioBackend::MicDeckVad => {
            let exact_name = if render {
                device_name.starts_with("micdeck driver input")
            } else {
                device_name.starts_with("micdeck virtual microphone")
                    || device_name.starts_with("micdeck virtual mic")
            };
            let driver_identity = fingerprint.contains("micdeck virtual audio")
                || fingerprint.contains("micdeck vad")
                || fingerprint.contains("micdeckvad")
                || id_fingerprint.contains("micdeckvad")
                || id_fingerprint.contains("root\\micdeckvad");
            exact_name || (fingerprint.contains("micdeck") && driver_identity)
        }
    };

    matches.then_some(AudioEndpoint {
        cpal_id,
        raw_id,
        name,
        backend,
    })
}

pub fn bootstrap_driver(backend: VirtualAudioBackend) -> DriverBootstrap {
    DriverBootstrap {
        backend: Some(backend),
        ..DriverBootstrap::default()
    }
}

pub fn install_driver_now(backend: VirtualAudioBackend) -> DriverBootstrap {
    if driver_is_ready(backend) {
        return DriverBootstrap {
            backend: Some(backend),
            ..DriverBootstrap::default()
        };
    }

    let mut status = DriverBootstrap {
        backend: Some(backend),
        installer_attempted: true,
        ..DriverBootstrap::default()
    };

    let installation = match backend {
        VirtualAudioBackend::VbCable => install_official_vb_driver(),
        VirtualAudioBackend::MicDeckVad => install_micdeck_vad_driver(),
    };

    if let Err(error) = installation {
        status.error = Some(error);
        return status;
    }

    for _ in 0..40 {
        if driver_is_ready(backend) {
            return status;
        }
        std::thread::sleep(std::time::Duration::from_millis(250));
    }

    status.restart_required = true;
    status
}

fn verify_vb_driver() -> Result<(), String> {
    let actual = format!("{:X}", Sha256::digest(VB_DRIVER_ARCHIVE));
    if actual != VB_DRIVER_SHA256 {
        return Err(format!(
            "Wbudowana paczka VB-CABLE ma nieprawidłowy SHA-256: {actual}"
        ));
    }
    Ok(())
}

fn install_official_vb_driver() -> Result<(), String> {
    verify_vb_driver()?;
    let temp = tempfile::Builder::new()
        .prefix("micdeck-vbcable-")
        .tempdir()
        .map_err(|error| format!("Nie udało się utworzyć katalogu tymczasowego: {error}"))?;
    extract_vb_driver_archive(&temp)?;

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

fn extract_vb_driver_archive(temp: &TempDir) -> Result<(), String> {
    let reader = Cursor::new(VB_DRIVER_ARCHIVE);
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

fn embedded_vad_file(name: &str) -> Option<&'static [u8]> {
    match name {
        "MicDeckVad.sys" => Some(MICDECK_VAD_SYS),
        "MicDeckVad.inf" => Some(MICDECK_VAD_INF),
        "MicDeckVad.cat" => Some(MICDECK_VAD_CAT),
        _ => None,
    }
}

fn verify_micdeck_vad_package() -> Result<DriverPackageManifest, String> {
    if !custom_driver_package_ready() {
        return Err(
            "Pakiet MicDeck VAD nie został osadzony w tej kompilacji. Uruchom scripts/stage-micdeck-vad-package.ps1, a następnie przebuduj aplikację."
                .into(),
        );
    }

    let manifest_bytes = MICDECK_VAD_MANIFEST
        .strip_prefix(&[0xEF, 0xBB, 0xBF])
        .unwrap_or(MICDECK_VAD_MANIFEST);
    let manifest: DriverPackageManifest = serde_json::from_slice(manifest_bytes)
        .map_err(|error| format!("Nieprawidłowy manifest MicDeck VAD: {error}"))?;
    if manifest.abi != 3 {
        return Err(format!(
            "Nieobsługiwane ABI pakietu MicDeck VAD: {} (oczekiwano 3)",
            manifest.abi
        ));
    }
    if manifest.version.trim().is_empty() {
        return Err("Manifest MicDeck VAD nie zawiera wersji".into());
    }

    for file in &manifest.files {
        let bytes = embedded_vad_file(&file.name)
            .ok_or_else(|| format!("Manifest zawiera niedozwolony plik: {}", file.name))?;
        let actual = format!("{:x}", Sha256::digest(bytes));
        if !actual.eq_ignore_ascii_case(file.sha256.trim()) {
            return Err(format!(
                "Niezgodny SHA-256 pakietu MicDeck VAD dla {}",
                file.name
            ));
        }
    }

    for required in ["MicDeckVad.sys", "MicDeckVad.inf", "MicDeckVad.cat"] {
        if !manifest.files.iter().any(|file| file.name == required) {
            return Err(format!("Manifest MicDeck VAD nie zawiera {required}"));
        }
    }

    Ok(manifest)
}

fn write_embedded_file(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let mut file = File::create(path)
        .map_err(|error| format!("Nie udało się utworzyć {}: {error}", path.display()))?;
    file.write_all(bytes)
        .and_then(|_| file.sync_all())
        .map_err(|error| format!("Nie udało się zapisać {}: {error}", path.display()))
}

fn install_micdeck_vad_driver() -> Result<(), String> {
    let _manifest = verify_micdeck_vad_package()?;
    let temp = tempfile::Builder::new()
        .prefix("micdeck-vad-")
        .tempdir()
        .map_err(|error| format!("Nie udało się utworzyć katalogu MicDeck VAD: {error}"))?;

    for (name, bytes) in [
        ("MicDeckVad.sys", MICDECK_VAD_SYS),
        ("MicDeckVad.inf", MICDECK_VAD_INF),
        ("MicDeckVad.cat", MICDECK_VAD_CAT),
        ("driver-manifest.json", MICDECK_VAD_MANIFEST),
    ] {
        write_embedded_file(&temp.path().join(name), bytes)?;
    }

    let helper = temp.path().join("micdeck-driver-helper.exe");
    write_embedded_file(&helper, MICDECK_VAD_HELPER)?;

    let parameters = format!("install \"{}\"", temp.path().display());
    let exit_code = run_elevated(&helper, &parameters, temp.path(), false)?;
    if exit_code != 0 {
        return Err(format!(
            "Instalator MicDeck VAD zakończył się kodem {exit_code}"
        ));
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
    fn embedded_vb_driver_has_expected_hash_and_safe_paths() {
        verify_vb_driver().expect("embedded VB-CABLE hash should match");
        let temp = tempfile::Builder::new()
            .prefix("micdeck-driver-test-")
            .tempdir()
            .expect("temporary test directory");
        extract_vb_driver_archive(&temp).expect("driver archive should extract safely");
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

    #[test]
    fn backend_serialization_matches_frontend_contract() {
        assert_eq!(
            serde_json::to_string(&VirtualAudioBackend::VbCable).unwrap(),
            "\"vbCable\""
        );
        assert_eq!(
            serde_json::to_string(&VirtualAudioBackend::MicDeckVad).unwrap(),
            "\"micDeckVad\""
        );
    }

    #[test]
    fn custom_package_is_verified_when_staged() {
        if custom_driver_package_ready() {
            verify_micdeck_vad_package().expect("staged MicDeck VAD package must verify");
        }
    }
}
