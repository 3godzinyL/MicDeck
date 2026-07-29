use cpal::traits::{DeviceTrait, HostTrait};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{self, Cursor, Write};
use std::path::{Path, PathBuf};
use tempfile::TempDir;
use zip::ZipArchive;

const DRIVER_ARCHIVE: &[u8] = include_bytes!("../resources/vbcable/VBCABLE_Driver_Pack45.zip");
const DRIVER_SHA256: &str = "B950E39F01AF1D04EA623C8F6D8EB9B6EA5C477C637295FABF20631C85116BFB";

const MICDECK_VAD_SYS: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/micdeck-vad/MicDeckVad.sys"));
const MICDECK_VAD_INF: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/micdeck-vad/MicDeckVad.inf"));
const MICDECK_VAD_CAT: &[u8] = include_bytes!(concat!(env!("OUT_DIR"), "/micdeck-vad/MicDeckVad.cat"));
const MICDECK_VAD_MANIFEST: &[u8] =
    include_bytes!(concat!(env!("OUT_DIR"), "/micdeck-vad/driver-manifest.json"));
const MICDECK_VAD_HELPER: &[u8] = include_bytes!(concat!(
    env!("OUT_DIR"),
    "/micdeck-vad/micdeck-driver-helper.exe"
));
const MICDECK_VAD_PACKAGE_READY: &str = env!("MICDECK_VAD_PACKAGE_READY");
const MICDECK_VAD_ABI: u32 = 3;

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum VirtualAudioBackend {
    #[default]
    VbCable,
    MicDeckVad,
}

impl VirtualAudioBackend {
    pub const ALL: [Self; 2] = [Self::MicDeckVad, Self::VbCable];

    pub const fn key(self) -> &'static str {
        match self {
            Self::VbCable => "vbCable",
            Self::MicDeckVad => "micDeckVad",
        }
    }

    pub const fn label(self) -> &'static str {
        match self {
            Self::VbCable => "VB-CABLE",
            Self::MicDeckVad => "MicDeck VAD",
        }
    }

    pub const fn vendor(self) -> &'static str {
        match self {
            Self::VbCable => "VB-Audio / VB-CABLE Pack45",
            Self::MicDeckVad => "MicDeck — własny sterownik WaveRT",
        }
    }

    pub const fn missing_message(self) -> &'static str {
        match self {
            Self::VbCable => {
                "VB-CABLE nie jest gotowy. Zainstaluj sterownik albo uruchom ponownie Windows."
            }
            Self::MicDeckVad => {
                "MicDeck VAD nie odpowiada albo brakuje jednego z jego endpointów audio."
            }
        }
    }
}

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

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackendProbe {
    pub backend: VirtualAudioBackend,
    pub key: &'static str,
    pub label: &'static str,
    pub vendor: &'static str,
    pub installed: bool,
    pub ready: bool,
    pub render_endpoint: Option<String>,
    pub capture_endpoint: Option<String>,
    pub render_responding: bool,
    pub capture_responding: bool,
    pub format_compatible: bool,
    pub message: String,
    /// Only meaningful for MicDeck VAD: whether this build embeds a signed package.
    pub package_available: bool,
}

#[derive(Deserialize)]
struct DriverPackageManifest {
    version: String,
    abi: u32,
    files: Vec<DriverPackageFile>,
}

#[derive(Deserialize)]
struct DriverPackageFile {
    name: String,
    sha256: String,
}

fn fingerprint(device: &cpal::Device) -> Option<(String, String, String, String)> {
    let description = device.description().ok()?;
    let name = description.name().to_string();
    let manufacturer = description.manufacturer().unwrap_or_default().to_lowercase();
    let driver = description.driver().unwrap_or_default().to_lowercase();
    let raw_id = device
        .id()
        .ok()
        .map(|id| id.1.to_lowercase())
        .unwrap_or_default();
    Some((name, manufacturer, driver, raw_id))
}

fn matches_backend(device: &cpal::Device, backend: VirtualAudioBackend, render: bool) -> bool {
    let Some((name, manufacturer, driver, raw_id)) = fingerprint(device) else {
        return false;
    };
    let lower_name = name.to_lowercase();
    let combined = format!("{lower_name} {manufacturer} {driver} {raw_id}");

    match backend {
        VirtualAudioBackend::VbCable => {
            let vendor = combined.contains("vb-audio") || combined.contains("vbaudio");
            let cable = combined.contains("cable");
            let expected_name = if render {
                lower_name.starts_with("cable input") || lower_name.starts_with("cable in")
            } else {
                lower_name.starts_with("cable output")
            };
            vendor && cable && (expected_name || driver.contains("vb-audio virtual cable"))
        }
        VirtualAudioBackend::MicDeckVad => {
            let expected_name = if render {
                lower_name.starts_with("micdeck driver input")
            } else {
                lower_name.starts_with("micdeck virtual microphone")
                    || lower_name.starts_with("micdeck virtual mic")
            };
            let hardware = combined.contains("micdeckvad") || combined.contains("micdeck vad");
            expected_name || hardware
        }
    }
}

fn endpoint_dto(device: &cpal::Device) -> Option<AudioEndpoint> {
    let description = device.description().ok()?;
    let id = device.id().ok()?;
    Some(AudioEndpoint {
        cpal_id: id.to_string(),
        raw_id: id.1,
        name: description.name().to_string(),
    })
}

fn collect(backend: VirtualAudioBackend, render: bool) -> Vec<(cpal::Device, AudioEndpoint)> {
    let host = cpal::default_host();
    let devices = if render {
        host.output_devices().ok()
    } else {
        host.input_devices().ok()
    };
    devices
        .into_iter()
        .flatten()
        .filter(|device| matches_backend(device, backend, render))
        .filter_map(|device| endpoint_dto(&device).map(|dto| (device, dto)))
        .collect()
}

pub fn render_endpoints(backend: VirtualAudioBackend) -> Vec<AudioEndpoint> {
    collect(backend, true)
        .into_iter()
        .map(|(_, dto)| dto)
        .collect()
}

pub fn capture_endpoints(backend: VirtualAudioBackend) -> Vec<AudioEndpoint> {
    collect(backend, false)
        .into_iter()
        .map(|(_, dto)| dto)
        .collect()
}

/// Every capture endpoint owned by any supported virtual backend. The app hides
/// these from the physical-microphone picker so users cannot route the loopback
/// into itself.
pub fn managed_capture_endpoints() -> Vec<AudioEndpoint> {
    VirtualAudioBackend::ALL
        .into_iter()
        .flat_map(capture_endpoints)
        .collect()
}

pub fn driver_is_ready(backend: VirtualAudioBackend) -> bool {
    probe(backend).ready
}

pub fn probe(backend: VirtualAudioBackend) -> BackendProbe {
    let render = collect(backend, true).into_iter().next();
    let capture = collect(backend, false).into_iter().next();
    let render_responding = render
        .as_ref()
        .is_some_and(|(device, _)| device.default_output_config().is_ok());
    let capture_responding = capture
        .as_ref()
        .is_some_and(|(device, _)| device.default_input_config().is_ok());
    let render_endpoint = render.map(|(_, dto)| dto);
    let capture_endpoint = capture.map(|(_, dto)| dto);

    let installed = render_endpoint.is_some() || capture_endpoint.is_some();
    let format_compatible = render_responding && capture_responding;
    let ready = render_endpoint.is_some() && capture_endpoint.is_some() && format_compatible;

    BackendProbe {
        backend,
        key: backend.key(),
        label: backend.label(),
        vendor: backend.vendor(),
        installed,
        ready,
        render_endpoint: render_endpoint.map(|endpoint| endpoint.name),
        capture_endpoint: capture_endpoint.map(|endpoint| endpoint.name),
        render_responding,
        capture_responding,
        format_compatible,
        message: if ready {
            format!(
                "{} odpowiada — oba endpointy udostępniają prawidłowy format audio.",
                backend.label()
            )
        } else {
            backend.missing_message().to_string()
        },
        package_available: match backend {
            VirtualAudioBackend::MicDeckVad => custom_driver_package_ready(),
            VirtualAudioBackend::VbCable => true,
        },
    }
}

pub fn probe_all() -> Vec<BackendProbe> {
    VirtualAudioBackend::ALL.into_iter().map(probe).collect()
}

/// The backend the app should use right now: the preferred one when it is ready,
/// otherwise any other backend that is actually working.
pub fn resolve_active_backend(preferred: VirtualAudioBackend) -> VirtualAudioBackend {
    if driver_is_ready(preferred) {
        return preferred;
    }
    VirtualAudioBackend::ALL
        .into_iter()
        .find(|candidate| *candidate != preferred && driver_is_ready(*candidate))
        .unwrap_or(preferred)
}

pub fn bootstrap_driver() -> DriverBootstrap {
    // Startup is detection-only. Driver installation is an explicit user
    // action because it elevates privileges and may require a Windows restart.
    DriverBootstrap::default()
}

pub fn install_driver_now(backend: VirtualAudioBackend) -> DriverBootstrap {
    if driver_is_ready(backend) {
        return DriverBootstrap::default();
    }

    let mut status = DriverBootstrap {
        installer_attempted: true,
        ..DriverBootstrap::default()
    };

    let outcome = match backend {
        VirtualAudioBackend::VbCable => install_official_driver(),
        VirtualAudioBackend::MicDeckVad => install_micdeck_vad(),
    };
    if let Err(error) = outcome {
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

pub fn uninstall_micdeck_vad() -> Result<(), String> {
    verify_micdeck_vad_package()?;
    let staged = stage_micdeck_vad_package()?;
    let helper = staged.path().join("micdeck-driver-helper.exe");
    let exit_code = run_elevated(&helper, "uninstall", staged.path(), false)?;
    if exit_code != 0 {
        return Err(format!(
            "Deinstalacja MicDeck VAD zakończyła się kodem {exit_code}"
        ));
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// VB-CABLE (fallback backend)
// ---------------------------------------------------------------------------

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
        return Err(format!("Brak oficjalnego instalatora {setup_name} w paczce"));
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

// ---------------------------------------------------------------------------
// MicDeck VAD (own kernel-mode WaveRT driver)
// ---------------------------------------------------------------------------

pub fn custom_driver_package_ready() -> bool {
    MICDECK_VAD_PACKAGE_READY == "1"
        && !MICDECK_VAD_SYS.is_empty()
        && !MICDECK_VAD_INF.is_empty()
        && !MICDECK_VAD_CAT.is_empty()
        && !MICDECK_VAD_MANIFEST.is_empty()
        && !MICDECK_VAD_HELPER.is_empty()
}

pub fn custom_driver_package_version() -> Option<String> {
    if !custom_driver_package_ready() {
        return None;
    }
    parse_micdeck_vad_manifest()
        .ok()
        .map(|manifest| manifest.version)
}

fn embedded_driver_file(name: &str) -> Option<&'static [u8]> {
    match name {
        "MicDeckVad.sys" => Some(MICDECK_VAD_SYS),
        "MicDeckVad.inf" => Some(MICDECK_VAD_INF),
        "MicDeckVad.cat" => Some(MICDECK_VAD_CAT),
        _ => None,
    }
}

fn parse_micdeck_vad_manifest() -> Result<DriverPackageManifest, String> {
    let bytes = MICDECK_VAD_MANIFEST
        .strip_prefix(&[0xEF, 0xBB, 0xBF])
        .unwrap_or(MICDECK_VAD_MANIFEST);
    serde_json::from_slice(bytes)
        .map_err(|error| format!("Nieprawidłowy manifest MicDeck VAD: {error}"))
}

fn verify_micdeck_vad_package() -> Result<(), String> {
    if !custom_driver_package_ready() {
        return Err(
            "Ta kompilacja nie zawiera podpisanego pakietu MicDeck VAD. Zbuduj sterownik \
             (scripts/build-micdeck-vad-and-app.ps1) albo użyj backendu VB-CABLE."
                .into(),
        );
    }
    let manifest = parse_micdeck_vad_manifest()?;
    if manifest.abi != MICDECK_VAD_ABI || manifest.version.trim().is_empty() {
        return Err("Manifest MicDeck VAD ma nieobsługiwaną wersję lub ABI.".into());
    }
    for required in ["MicDeckVad.sys", "MicDeckVad.inf", "MicDeckVad.cat"] {
        let entry = manifest
            .files
            .iter()
            .find(|file| file.name == required)
            .ok_or_else(|| format!("Manifest MicDeck VAD nie zawiera {required}"))?;
        let bytes = embedded_driver_file(required).expect("required embedded driver file");
        let actual = format!("{:x}", Sha256::digest(bytes));
        if !actual.eq_ignore_ascii_case(entry.sha256.trim()) {
            return Err(format!("Niezgodny SHA-256 pakietu MicDeck VAD dla {required}"));
        }
    }
    if manifest
        .files
        .iter()
        .any(|file| embedded_driver_file(&file.name).is_none())
    {
        return Err("Manifest MicDeck VAD zawiera niedozwolony plik.".into());
    }
    Ok(())
}

fn write_verified(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let mut file = File::create(path)
        .map_err(|error| format!("Nie udało się utworzyć {}: {error}", path.display()))?;
    file.write_all(bytes)
        .and_then(|_| file.sync_all())
        .map_err(|error| format!("Nie udało się zapisać {}: {error}", path.display()))
}

fn stage_micdeck_vad_package() -> Result<TempDir, String> {
    let temporary = tempfile::Builder::new()
        .prefix("micdeck-vad-")
        .tempdir()
        .map_err(|error| format!("Nie udało się utworzyć katalogu tymczasowego: {error}"))?;
    for (name, bytes) in [
        ("MicDeckVad.sys", MICDECK_VAD_SYS),
        ("MicDeckVad.inf", MICDECK_VAD_INF),
        ("MicDeckVad.cat", MICDECK_VAD_CAT),
        ("driver-manifest.json", MICDECK_VAD_MANIFEST),
        ("micdeck-driver-helper.exe", MICDECK_VAD_HELPER),
    ] {
        write_verified(&temporary.path().join(name), bytes)?;
    }
    Ok(temporary)
}

fn install_micdeck_vad() -> Result<(), String> {
    verify_micdeck_vad_package()?;
    let staged = stage_micdeck_vad_package()?;
    let helper = staged.path().join("micdeck-driver-helper.exe");
    let parameters = format!("install \"{}\"", staged.path().display());
    let exit_code = run_elevated(&helper, &parameters, staged.path(), false)?;
    if exit_code != 0 {
        return Err(format!(
            "Instalator MicDeck VAD zakończył się kodem {exit_code}"
        ));
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// Endpoint rename (shared by both backends)
// ---------------------------------------------------------------------------

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
        for backend in VirtualAudioBackend::ALL {
            assert_eq!(
                serde_json::to_string(&backend).unwrap(),
                format!("\"{}\"", backend.key())
            );
        }
    }

    #[test]
    fn staged_custom_package_is_cryptographically_verified() {
        if custom_driver_package_ready() {
            verify_micdeck_vad_package().expect("staged MicDeck VAD package must verify");
        }
    }
}
