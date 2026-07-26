use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

fn quoted(path: &Path) -> String {
    format!("\"{}\"", path.display())
}

fn copy_or_empty(source: &Path, destination: &Path) -> bool {
    if source.is_file() {
        fs::copy(source, destination).unwrap_or_else(|error| {
            panic!(
                "failed to stage {} as {}: {error}",
                source.display(),
                destination.display()
            )
        });
        destination
            .metadata()
            .map(|meta| meta.len() > 0)
            .unwrap_or(false)
    } else {
        fs::write(destination, [])
            .unwrap_or_else(|error| panic!("failed to create {}: {error}", destination.display()));
        false
    }
}

fn stage_micdeck_vad_package(manifest_dir: &Path, helper_source: Option<&Path>) {
    let out_dir = PathBuf::from(env::var_os("OUT_DIR").unwrap()).join("micdeck-vad");
    fs::create_dir_all(&out_dir).expect("failed to create MicDeck VAD output directory");

    let package_dir = manifest_dir.join("resources/micdeck-vad/package");
    let files = [
        "MicDeckVad.sys",
        "MicDeckVad.inf",
        "MicDeckVad.cat",
        "driver-manifest.json",
    ];

    let mut ready = true;
    for name in files {
        let source = package_dir.join(name);
        println!("cargo:rerun-if-changed={}", source.display());
        ready &= copy_or_empty(&source, &out_dir.join(name));
    }

    let helper_destination = out_dir.join("micdeck-driver-helper.exe");
    ready &= match helper_source {
        Some(source) => copy_or_empty(source, &helper_destination),
        None => {
            fs::write(&helper_destination, [])
                .expect("failed to create MicDeck VAD helper placeholder");
            false
        }
    };

    println!(
        "cargo:rustc-env=MICDECK_VAD_PACKAGE_READY={}",
        if ready { "1" } else { "0" }
    );
}

#[cfg(target_os = "windows")]
fn visual_studio_root() -> PathBuf {
    if let Some(root) = env::var_os("VSINSTALLDIR") {
        let root = PathBuf::from(root);
        if root.join("Common7/Tools/VsDevCmd.bat").is_file() {
            return root;
        }
    }

    let program_files_x86 = env::var_os("ProgramFiles(x86)")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from(r"C:\Program Files (x86)"));
    let vswhere = program_files_x86.join("Microsoft Visual Studio/Installer/vswhere.exe");
    if vswhere.is_file() {
        let output = Command::new(&vswhere)
            .args([
                "-latest",
                "-products",
                "*",
                "-requires",
                "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
                "-property",
                "installationPath",
            ])
            .output()
            .expect("failed to run vswhere.exe");
        let candidate = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if !candidate.is_empty() {
            return PathBuf::from(candidate);
        }
    }

    for edition in ["Community", "Professional", "Enterprise", "BuildTools"] {
        let candidate = PathBuf::from(format!(
            r"C:\Program Files\Microsoft Visual Studio\2022\{edition}"
        ));
        if candidate.join("Common7/Tools/VsDevCmd.bat").is_file() {
            return candidate;
        }
    }

    panic!("Visual Studio 2022 with Desktop development with C++ is required");
}

#[cfg(target_os = "windows")]
fn run_msvc(vsdev: &Path, working_dir: &Path, command_line: &str, script_name: &str) {
    let script = working_dir.join(script_name);
    let command = format!(
        "@echo off\r\ncall {} -no_logo -arch=x64 -host_arch=x64\r\nif errorlevel 1 exit /b %errorlevel%\r\n{}\r\n",
        quoted(vsdev),
        command_line
    );
    fs::write(&script, command).expect("failed to write native build script");
    let output = Command::new("cmd.exe")
        .args(["/d", "/c"])
        .arg(&script)
        .current_dir(working_dir)
        .output()
        .expect("failed to start the MSVC build environment");
    if !output.status.success() {
        panic!(
            "native build failed\nstdout:\n{}\nstderr:\n{}",
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        );
    }
}

#[cfg(target_os = "windows")]
fn build_native_audio_and_helper() -> PathBuf {
    let manifest_dir = PathBuf::from(env::var_os("CARGO_MANIFEST_DIR").unwrap());
    let project_dir = manifest_dir.join("..");
    let native_dir = project_dir.join("native-audio");
    let driver_dir = project_dir.join("drivers/micdeck-vad");
    let dsp_dir = native_dir.join("dsp");
    let bridge_source = native_dir.join("bridge/src/soundboard_ipc.c");
    let bridge_include = native_dir.join("bridge/include");
    let protocol_include = native_dir.join("protocol");
    let engine_source = native_dir.join("engine/src");
    let out_dir = PathBuf::from(env::var_os("OUT_DIR").unwrap()).join("native");
    fs::create_dir_all(&out_dir).expect("failed to create native output directory");

    let helper_source = driver_dir.join("integration/driver-helper/main.cpp");
    let watched_sources = [
        bridge_source.clone(),
        native_dir.join("protocol/soundboard_protocol.h"),
        native_dir.join("bridge/include/soundboard_ipc.h"),
        native_dir.join("engine/src/audio_ring_buffer.h"),
        native_dir.join("engine/src/audio_engine.h"),
        native_dir.join("engine/src/audio_engine.cpp"),
        native_dir.join("engine/src/default_endpoint.h"),
        native_dir.join("engine/src/default_endpoint.cpp"),
        native_dir.join("bridge/src/windows_audio_control.cpp"),
        native_dir.join("engine/src/main.cpp"),
        dsp_dir.join("Cargo.toml"),
        dsp_dir.join("Cargo.lock"),
        dsp_dir.join("src/lib.rs"),
        dsp_dir.join("include/micdeck_dsp.h"),
        helper_source.clone(),
    ];
    for source in watched_sources {
        println!("cargo:rerun-if-changed={}", source.display());
    }

    let vsdev = visual_studio_root().join("Common7/Tools/VsDevCmd.bat");
    let dll = out_dir.join("soundboard_ipc.dll");
    let import_library = out_dir.join("soundboard_ipc.lib");
    let engine = out_dir.join("soundboard_audio_engine.exe");
    let helper = out_dir.join("micdeck-driver-helper.exe");
    let dsp_target = out_dir.join("dsp-target");

    let cargo = env::var_os("CARGO").unwrap_or_else(|| "cargo".into());
    let dsp_build = Command::new(cargo)
        .args(["build", "--release", "--manifest-path"])
        .arg(dsp_dir.join("Cargo.toml"))
        .arg("--target-dir")
        .arg(&dsp_target)
        .output()
        .expect("failed to build the MicDeck DSP static library");
    if !dsp_build.status.success() {
        panic!(
            "MicDeck DSP build failed\nstdout:\n{}\nstderr:\n{}",
            String::from_utf8_lossy(&dsp_build.stdout),
            String::from_utf8_lossy(&dsp_build.stderr)
        );
    }
    let dsp_library = dsp_target.join("release/micdeck_dsp.lib");

    let bridge_command = format!(
        "cl /nologo /O2 /GL /GS /sdl /W4 /EHsc /std:c++20 /DUNICODE /D_UNICODE /LD /I{} /I{} /I{} {} {} {} ole32.lib shell32.lib gdi32.lib user32.lib /link /LTCG /guard:cf /DYNAMICBASE /NXCOMPAT /HIGHENTROPYVA /OUT:{} /IMPLIB:{}",
        quoted(&bridge_include),
        quoted(&protocol_include),
        quoted(&engine_source),
        quoted(&bridge_source),
        quoted(&native_dir.join("bridge/src/windows_audio_control.cpp")),
        quoted(&engine_source.join("default_endpoint.cpp")),
        quoted(&dll),
        quoted(&import_library)
    );
    run_msvc(&vsdev, &out_dir, &bridge_command, "run-msvc-bridge.cmd");

    let engine_command = format!(
        "cl /nologo /O2 /GL /GS /sdl /W4 /EHsc /std:c++20 /DUNICODE /D_UNICODE /I{} /I{} /I{} {} {} {} {} ole32.lib mmdevapi.lib avrt.lib advapi32.lib bcrypt.lib ntdll.lib userenv.lib ws2_32.lib /link /LTCG /guard:cf /DYNAMICBASE /NXCOMPAT /HIGHENTROPYVA /SUBSYSTEM:WINDOWS /OUT:{}",
        quoted(&bridge_include),
        quoted(&engine_source),
        quoted(&dsp_dir.join("include")),
        quoted(&engine_source.join("main.cpp")),
        quoted(&engine_source.join("audio_engine.cpp")),
        quoted(&import_library),
        quoted(&dsp_library),
        quoted(&engine)
    );
    run_msvc(&vsdev, &out_dir, &engine_command, "run-msvc-engine.cmd");

    let helper_command = format!(
        "cl /nologo /O2 /GL /GS /sdl /W4 /EHsc /std:c++20 /permissive- /DUNICODE /D_UNICODE {} newdev.lib setupapi.lib cfgmgr32.lib /link /LTCG /guard:cf /DYNAMICBASE /NXCOMPAT /HIGHENTROPYVA /SUBSYSTEM:CONSOLE /OUT:{}",
        quoted(&helper_source),
        quoted(&helper)
    );
    run_msvc(
        &vsdev,
        &out_dir,
        &helper_command,
        "run-msvc-driver-helper.cmd",
    );

    helper
}

fn main() {
    let manifest_dir = PathBuf::from(env::var_os("CARGO_MANIFEST_DIR").unwrap());

    #[cfg(target_os = "windows")]
    {
        let helper = build_native_audio_and_helper();
        stage_micdeck_vad_package(&manifest_dir, Some(&helper));
    }

    #[cfg(not(target_os = "windows"))]
    stage_micdeck_vad_package(&manifest_dir, None);

    tauri_build::build();
}
