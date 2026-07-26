# MicDeck VAD application integration

## Runtime contract

The application exposes two persistent virtual-audio backends:

```text
vbCable
micDeckVad
```

Rust resolves exactly one render endpoint and one capture endpoint for the
selected backend. The native C++ engine receives only raw endpoint IDs:

```rust
NativeAudioConfig {
    input_endpoint_id,
    output_endpoint_id,
    virtual_capture_endpoint_id,
    ...
}
```

The mixer and DSP do not branch on the backend. Both backends use ordinary
shared-mode WASAPI.

## Backend switch sequence

`set_virtual_audio_backend` performs this sequence under the application state
lock:

1. persist the new backend;
2. clear cached render/capture endpoint IDs;
3. clear the generic selected output ID;
4. stop the native runtime;
5. reset driver-install bootstrap status;
6. enumerate the selected backend;
7. restart and configure the native engine only when both endpoints exist.

This prevents the UI from showing MicDeck VAD while the old VB-CABLE route is
still active.

## Embedded custom-driver package

`src-tauri/build.rs` always creates the following `OUT_DIR` contract:

```text
micdeck-vad/MicDeckVad.sys
micdeck-vad/MicDeckVad.inf
micdeck-vad/MicDeckVad.cat
micdeck-vad/driver-manifest.json
micdeck-vad/micdeck-driver-helper.exe
```

If a signed package has been staged under
`src-tauri/resources/micdeck-vad/package`, its bytes are copied into `OUT_DIR`
and embedded by `virtual_audio.rs`. If any required file is absent, empty
placeholders are generated and the UI disables custom-driver installation.

The helper is compiled automatically from
`drivers/micdeck-vad/integration/driver-helper/main.cpp` during every Windows
application build. Developers do not compile the existing bridge, engine, DSP,
or helper manually.

## Installation sequence

1. Rust parses `driver-manifest.json`.
2. Every allowed file is checked against SHA-256.
3. Files are written to a private temporary directory.
4. The fixed-operation helper is launched through UAC.
5. The helper copies the package to Driver Store.
6. The helper creates `ROOT\MICDECKVAD` when missing.
7. Windows binds the INF through `UpdateDriverForPlugAndPlayDevices`.
8. Rust waits for both audio endpoints.
9. The native runtime is started or reconfigured.
10. Temporary files are deleted with the temporary directory.

## Endpoint matching

VB-CABLE is recognized by its VB-Audio manufacturer/driver fingerprint and
standard cable names.

MicDeck VAD is recognized by:

- `MicDeck Driver Input` on the render side;
- `MicDeck Virtual Microphone` on the capture side;
- MicDeck VAD driver/manufacturer fingerprints;
- raw endpoint identifiers containing `MICDECKVAD` when Windows localizes the
  friendly name.

Input-device enumeration removes endpoints belonging to either managed backend,
so a virtual microphone cannot be accidentally selected as the physical input.

## Source locations

| Concern | Location |
| --- | --- |
| Backend enum, detection, installation | `src-tauri/src/virtual_audio.rs` |
| Persistence and Tauri commands | `src-tauri/src/lib.rs` |
| Native automatic build and embedding | `src-tauri/build.rs` |
| Settings selector | `src/main.js` |
| Selector styling | `src/styles.css` |
| Polish/English copy | `src/i18n.js` |
| Elevated helper | `drivers/micdeck-vad/integration/driver-helper/main.cpp` |
| Driver source | `drivers/micdeck-vad/driver` |
| Signed package staging | `scripts/stage-micdeck-vad-package.ps1` |
| Full app + driver build | `scripts/build-micdeck-vad-and-app.ps1` |

Natywny silnik C++ monitoruje również działające strumienie WASAPI. Po restarcie Windows Audio lub unieważnieniu endpointu zamyka martwe klienty i automatycznie ponawia tę samą trasę z sekundowym backoffem.
