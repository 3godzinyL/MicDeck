use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

fn quoted(path: &Path) -> String {
    format!("\"{}\"", path.display())
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

    panic!("Visual Studio 2022 with the Desktop development with C++ workload is required");
}

#[cfg(target_os = "windows")]
fn run_msvc(vsdev: &Path, working_dir: &Path, cl_command: &str) {
    let script = working_dir.join("run-msvc.cmd");
    let command = format!(
        "@echo off\r\ncall {} -no_logo -arch=x64 -host_arch=x64\r\nif errorlevel 1 exit /b %errorlevel%\r\n{}\r\n",
        quoted(vsdev),
        cl_command
    );
    fs::write(&script, command).expect("failed to write the native build script");
    let output = Command::new("cmd.exe")
        .args(["/d", "/c"])
        .arg(&script)
        .current_dir(working_dir)
        .output()
        .expect("failed to start the MSVC build environment");
    if !output.status.success() {
        panic!(
            "native audio build failed\nstdout:\n{}\nstderr:\n{}",
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        );
    }
}

#[cfg(target_os = "windows")]
fn build_native_audio() {
    let manifest_dir = PathBuf::from(env::var_os("CARGO_MANIFEST_DIR").unwrap());
    let native_dir = manifest_dir.join("../native-audio");
    let bridge_source = native_dir.join("bridge/src/soundboard_ipc.c");
    let bridge_include = native_dir.join("bridge/include");
    let protocol_include = native_dir.join("protocol");
    let engine_source = native_dir.join("engine/src");
    let out_dir = PathBuf::from(env::var_os("OUT_DIR").unwrap()).join("native");
    fs::create_dir_all(&out_dir).expect("failed to create native output directory");

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
    ];
    for source in watched_sources {
        println!("cargo:rerun-if-changed={}", source.display());
    }

    let vsdev = visual_studio_root().join("Common7/Tools/VsDevCmd.bat");
    let dll = out_dir.join("soundboard_ipc.dll");
    let import_library = out_dir.join("soundboard_ipc.lib");
    let engine = out_dir.join("soundboard_audio_engine.exe");

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
    run_msvc(&vsdev, &out_dir, &bridge_command);

    let engine_command = format!(
        "cl /nologo /O2 /GL /GS /sdl /W4 /EHsc /std:c++20 /DUNICODE /D_UNICODE /I{} /I{} {} {} {} ole32.lib avrt.lib /link /LTCG /guard:cf /DYNAMICBASE /NXCOMPAT /HIGHENTROPYVA /SUBSYSTEM:WINDOWS /OUT:{}",
        quoted(&bridge_include),
        quoted(&engine_source),
        quoted(&engine_source.join("main.cpp")),
        quoted(&engine_source.join("audio_engine.cpp")),
        quoted(&import_library),
        quoted(&engine)
    );
    run_msvc(&vsdev, &out_dir, &engine_command);
}

fn main() {
    #[cfg(target_os = "windows")]
    build_native_audio();
    tauri_build::build();
}
