# Integration validation

## Completed in this package

- Added persisted `VB-CABLE` / `MicDeck VAD` backend selection.
- Added backend-aware render and capture endpoint discovery.
- Added embedded MicDeck VAD package validation using SHA-256 and ABI 3.
- Added a fixed-operation elevated driver installer helper.
- Added automatic native C/C++/Rust DSP/helper compilation through `src-tauri/build.rs`.
- Added route teardown and restart when switching backends.
- Added native WASAPI stream health monitoring and automatic reconnect.
- Added settings UI, Polish/English translations, styling, documentation, staging scripts, and the final Codex task.
- Moved the custom driver source under `drivers/micdeck-vad`.

## Validation performed here

- `node --check src/main.js` — passed.
- `node --check src/i18n.js` — passed.
- Translation-key parity between Polish and English — passed.
- Portable MicDeck VAD `core_tests` — passed.
- Portable MicDeck VAD `pipeline_tests` — passed.
- Static source checks for stale backend function names and old driver paths — passed.
- Driver/application ABI and version aligned to `0.3.0 / ABI 3`.

## Windows-only acceptance still required

The final Codex task must perform the actual Visual Studio/WDK build, Rust/Tauri
build, signed driver package installation, endpoint creation, WASAPI
render-to-capture test, VB-CABLE regression test, Driver Verifier, and lifecycle
testing on a disposable Windows machine.
