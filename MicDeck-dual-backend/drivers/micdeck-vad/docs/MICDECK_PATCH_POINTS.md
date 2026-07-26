# Exact MicDeck patch points

The current repository layout already separates the user interface, bridge and
native audio engine. Apply the integration in this order.

## `native-audio/engine/src/audio_engine.cpp`

Current render startup receives `output_id` and calls the existing WASAPI render
object. Keep `render_mix()` unchanged.

Changes:

1. Before `AudioEngine::start`, resolve MicDeck VAD endpoints when the configured
   backend is `MicDeckVad`.
2. Replace the legacy VB-CABLE render ID with `MicDeckVadEndpointPair::render_id`.
3. Pass WASAPI invalidation errors to `MicDeckVadReconnectController`.
4. On successful reopen, clear `processed_microphone_`, `system_audio_` and any
   output staging ring that could contain audio from the old endpoint.
5. Add reconnect attempts/successes to engine diagnostics.

## `native-audio/engine/src/audio_engine.h`

Add:

* selected virtual-backend enum;
* endpoint probe result;
* reconnect controller ownership;
* atomic reconnect counters;
* explicit `reopen_virtual_output()` method.

## `native-audio/bridge/src/windows_audio_control.cpp`

Add narrow bridge functions:

```
sb_micdeck_vad_status
sb_micdeck_vad_endpoint_ids
sb_micdeck_vad_diagnostics
```

Do not install the driver from the bridge DLL. Driver installation belongs to
the elevated helper launched by Rust.

## `src-tauri/src/lib.rs`

Register Tauri commands for status/install/repair/uninstall and latency mode.
Store no user-provided driver paths. Resolve embedded files through MicDeck's
existing content-addressed native extraction mechanism.

## `src-tauri/build.rs`

Build and embed:

* `micdeck-driver-helper.exe`;
* the production driver package after it exists;
* the manifest with SHA-256 hashes.

The WDK driver itself is best built in a dedicated solution/CI stage rather than
with `cl.exe` inside the normal Tauri build script.

## Settings and first run

Replace the automatic VB-CABLE installation prompt with a MicDeck Driver card.
Keep the legacy backend selectable until production gates pass.
