# Complete MicDeck integration

## Keep the existing native engine

The replacement is intentionally narrow:

```
old: render_.start(vb_cable_render_id, render_mix)
new: render_.start(micdeck_vad_render_id, render_mix)
```

Everything that produces `render_mix` remains unchanged.

## Native C++ changes

Compile:

```
integration/micdeck-native/micdeck_vad_endpoint.cpp
integration/micdeck-native/micdeck_vad_reconnect.cpp
```

Startup flow:

1. Initialize COM.
2. Run `ProbeMicDeckVadEndpoints()`.
3. Require both render and capture endpoints.
4. Give the render ID to the existing WASAPI renderer.
5. Expose the capture ID/status to Rust and UI.
6. Cache IDs only for the current driver generation.

On `AUDCLNT_E_DEVICE_INVALIDATED`, Windows Audio service loss, device
disable/enable or driver upgrade:

1. stop render;
2. release `IAudioClient` and `IMMDevice`;
3. clear user-mode audio rings;
4. re-enumerate;
5. reopen event-driven shared mode;
6. publish reconnect attempts/successes.

The included reconnect controller uses bounded exponential backoff.

## Rust/Tauri changes

Use `integration/tauri-rust` as the service layer. Add Tauri commands:

```
driver_status
driver_install
driver_repair
driver_uninstall
driver_set_latency_mode
driver_get_diagnostics
```

The webview must never provide an arbitrary executable, INF or directory path.
Rust resolves the content-addressed embedded package, checks filenames and
SHA-256, and then launches only the fixed helper.

## Elevated helper

The helper accepts only:

```
status
install <verified package directory>
repair <verified package directory>
uninstall
```

It emits one JSON object. Keep it separate from `soundboard_ipc.dll`; no DLL
injection and no permanent privileged service are required.

## Build asset layout

```
native/<hash>/soundboard_audio_engine.exe
native/<hash>/soundboard_ipc.dll
driver/0.3.0/MicDeckVad.sys
driver/0.3.0/MicDeckVad.inf
driver/0.3.0/MicDeckVad.cat
driver/0.3.0/driver-manifest.json
helper/<hash>/micdeck-driver-helper.exe
```

## UI state machine

```
NotInstalled -> Installing -> EndpointsStarting -> Ready
Ready -> UpdateRequired -> Installing -> EndpointsStarting -> Ready
any -> RepairRequired | RestartRequired | Error
```

Show version, package verification, endpoint readiness, route status, latency
mode, discontinuities and reconnect counters.

## Migration

Keep VB-CABLE as a manual legacy backend for preview releases. Prefer MicDeck
VAD when ready. Never uninstall VB-CABLE automatically. Remove its bundle only
after every item in `PRODUCTION_GATE.md` passes.
