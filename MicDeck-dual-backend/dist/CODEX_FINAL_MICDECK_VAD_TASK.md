# Final Codex task — build, validate, and finish MicDeck VAD integration

Work directly in this repository on a disposable Windows 11 x64 driver-test
machine. The application-side integration is already implemented. Your job is
to compile the Windows-specific pieces, correct concrete WDK incompatibilities,
produce a signed package, embed it, and prove that both backends work.

## Non-negotiable rules

- Do not remove VB-CABLE. It remains the default compatibility backend.
- Do not move AEC3, RNNoise, decoding, process capture, mixing, or limiting into
  kernel mode.
- Do not replace the normal WASAPI engine→driver route with arbitrary IOCTL
  audio writes.
- Do not disable fail-closed checks, SHA-256 package verification, or tests.
- Do not expose an arbitrary elevated command runner to the Tauri webview.
- Do not mark a skipped test as passed.
- Do not enable Driver Verifier on a daily-use machine.
- Preserve the persisted backend values `vbCable` and `micDeckVad`.

## Architecture to preserve

```text
Tauri/JavaScript settings
        ↓
Rust backend selection and endpoint discovery
        ↓
versioned shared-memory IPC
        ↓
soundboard_audio_engine.exe (C++20/WASAPI/DSP)
        ↓
selected render endpoint
        ├── VB-CABLE → CABLE Output
        └── MicDeck Driver Input → MicDeckVad.sys → MicDeck Virtual Microphone
```

The C++ engine must remain backend-agnostic and continue receiving raw endpoint
IDs through the existing atomic `sb_set_config` path.

## Phase 1 — inspect the completed application integration

Read these files before changing anything:

- `README.md`
- `README.pl.md`
- `docs/MICDECK_VAD_APPLICATION_INTEGRATION.md`
- `INTEGRATION_VALIDATION.md`
- `src-tauri/src/virtual_audio.rs`
- `src-tauri/src/lib.rs`
- `src-tauri/build.rs`
- `src/main.js`
- `drivers/micdeck-vad/docs/DRIVER_DESCRIPTION.md`
- `drivers/micdeck-vad/docs/KNOWN_GAPS.md`
- `drivers/micdeck-vad/docs/CERTIFICATION_LEVELS.md`

Verify that:

- settings contain a VB-CABLE/MicDeck VAD selector;
- the selected backend is persisted;
- switching stops the previous runtime and clears cached endpoint IDs;
- the custom install button is enabled only when SYS/INF/CAT/manifest/helper are
  embedded;
- physical microphone enumeration excludes both virtual backends;
- the existing engine still accepts arbitrary endpoint IDs.

## Phase 2 — application tests before WDK work

Run:

```powershell
npm ci
npm run build
cargo fmt --manifest-path src-tauri\Cargo.toml --all -- --check
cargo test --manifest-path src-tauri\Cargo.toml --locked
```

Build the existing application once with:

```powershell
npm run build:portable
```

Confirm that `src-tauri/build.rs` automatically builds:

- `soundboard_ipc.dll`;
- `soundboard_audio_engine.exe`;
- `micdeck_dsp.lib`;
- `micdeck-driver-helper.exe`.

No manual C/C++ command should be required outside the normal Tauri build.

## Phase 3 — validate the WDK environment

From an x64 Developer PowerShell:

```powershell
.\drivers\micdeck-vad\scripts\bootstrap-official-reference.ps1 -Build
```

The pinned official Microsoft audio samples must build first. If they fail,
repair Visual Studio/SDK/WDK instead of changing MicDeck source.

Required components:

- Visual Studio 2022;
- Desktop development with C++;
- matching Windows SDK;
- matching Windows Driver Kit;
- C++ ATL only if demanded by the installed sample revision;
- CMake for portable and E2E tools.

## Phase 4 — compile and finish MicDeckVad.sys

Open `drivers/micdeck-vad/MicDeckVad.sln` and build `Debug | x64`.

Correct every concrete compiler/linker error. Pay special attention to:

1. the exact pure-virtual method set for the installed WDK's
   `IMiniportWaveRT`, `IMiniportWaveRTStreamNotification`, and
   `IMiniportAudioSignalProcessing` interfaces;
2. `PCPIN_DESCRIPTOR`, `PCFILTER_DESCRIPTOR`, node, connection, and automation
   table initialization;
3. render and capture pin direction/order;
4. WaveRT buffer allocation, map/unmap, notification registration, and teardown;
5. pageable versus DPC-level code;
6. timer cancellation and prevention of callbacks after destruction;
7. PortCls adapter power-management registration;
8. PnP stop/remove cleanup;
9. custom KS property handler wiring;
10. INF endpoint registration, names, hardware ID, and package isolation.

Do not replace the custom realtime pipeline with a copied sample FIFO. Preserve:

- `MdCablePipeline`;
- latency modes;
- priming;
- stale-frame trimming;
- fade-in/fade-to-silence;
- discontinuity and watermark counters;
- 48 kHz stereo-float canonical transport.

## Phase 5 — run the strict driver gates

On the disposable target, prepare test signing manually according to Microsoft
WDK documentation. The scripts deliberately do not silently change boot policy.

Run:

```powershell
.\drivers\micdeck-vad\scripts\full-wdk-certification-gate.ps1 `
  -Configuration Debug `
  -TestSign
```

The following must pass:

- portable core tests;
- official Microsoft baseline;
- custom WDK build;
- `InfVerif /w`;
- `Inf2Cat`;
- SYS and CAT signature verification;
- root-device installation;
- render endpoint presence;
- capture endpoint presence;
- automatic WASAPI render→capture certifier.

Keep the generated:

- `certification-report.json`;
- `audio-e2e.json`;
- MSBuild binary log;
- InfVerif/Inf2Cat logs.

## Phase 6 — stage the signed package into MicDeck

Use the exact package that passed the gates:

```powershell
.\scripts\stage-micdeck-vad-package.ps1 `
  -PackageDirectory C:\path\to\passed\driver-package `
  -Version 0.3.0 `
  -RequireValidKernelSignature
```

Confirm the staged directory contains:

```text
src-tauri/resources/micdeck-vad/package/MicDeckVad.sys
src-tauri/resources/micdeck-vad/package/MicDeckVad.inf
src-tauri/resources/micdeck-vad/package/MicDeckVad.cat
src-tauri/resources/micdeck-vad/package/driver-manifest.json
```

Rebuild the complete application:

```powershell
npm run build:all
```

The build log must show `MICDECK_VAD_PACKAGE_READY=1` through the resulting UI
behavior: the MicDeck VAD install button is enabled.

## Phase 7 — application end-to-end acceptance

Start from a clean VM snapshot.

### VB-CABLE regression path

1. Select **VB-CABLE** in Settings.
2. Install or detect VB-CABLE.
3. Confirm the C++ engine becomes `ONLINE`.
4. Play a sound pad and capture it in OBS/Discord.
5. Enable system audio and confirm it reaches the virtual microphone.
6. Restart the engine and confirm the route recovers.

### MicDeck VAD path

1. Select **MicDeck VAD**.
2. Confirm the previous VB-CABLE engine route stops immediately.
3. Install MicDeck VAD through the application UAC flow.
4. Confirm both endpoints are detected:
   - `MicDeck Driver Input`;
   - `MicDeck Virtual Microphone`.
5. Confirm the native engine restarts with the MicDeck VAD render/capture IDs.
6. Play a sound pad and capture it in OBS and Discord.
7. Enable physical microphone DSP and system audio simultaneously.
8. Verify AEC3/RNNoise/gate/leveler/limiter behavior is unchanged from VB-CABLE.
9. Switch repeatedly between backends and verify no stale route remains.
10. Restart `audiosrv`, disable/enable the device, and verify that the C++ engine detects the dead WASAPI stream and automatically reconnects the same route with its one-second backoff.
11. Restart Windows and verify the persisted backend is restored.
12. Rename the virtual microphone and verify the operation remains scoped to the
    selected capture endpoint.

Run the application route probe for both backends:

```powershell
cargo run --manifest-path src-tauri\Cargo.toml --example audio_route_probe
cargo run --manifest-path src-tauri\Cargo.toml --example audio_route_probe -- --micdeck-vad
```

## Phase 8 — stability

On the disposable target:

```powershell
verifier /standard /driver MicDeckVad.sys
verifier /bootmode oneboot
```

After reboot, run:

- 10,000 open/close stream cycles;
- simultaneous OBS and Discord capture;
- MicDeck process crash while capture stays open;
- `audiosrv` restart;
- device disable/enable;
- sleep/resume;
- hibernation/resume;
- 24-hour mixed microphone + pads + desktop soak;
- install/repair/update/uninstall cycle.

Record dumps and correct every MicDeckVad.sys verifier failure. Disable verifier
after the run.

## Phase 9 — repository cleanup

Before the final commit:

- remove `*.obj`, `*.exe`, `target/`, `dist/`, generated SYS/CAT/PFX files, and
  local WDK output from Git tracking;
- keep only the intentionally redistributed VB-CABLE ZIP exception;
- do not commit certificates or private keys;
- run frontend build, Rust format/tests, portable driver tests, and source-policy
  workflows;
- use meaningful commits such as:
  - `feat(audio): add selectable virtual audio backends`
  - `feat(driver): embed and install MicDeck VAD package`
  - `fix(wavert): complete render-to-capture endpoint bring-up`
  - `test(driver): add application dual-backend acceptance`

## Required final report

Return:

1. exact files changed;
2. WDK errors encountered and their fixes;
3. `certification-report.json` summary;
4. `audio-e2e.json` metrics;
5. VB-CABLE regression result;
6. MicDeck VAD application result;
7. Driver Verifier result;
8. remaining HLK/Microsoft production-signing work;
9. final release package SHA-256 values.

Do not use “fully working” unless the runtime gates and both application paths
actually pass on Windows.
