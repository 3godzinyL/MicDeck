<p align="center">
  <img src="docs/social-preview.svg" alt="MicDeck — soundboard and system audio through one virtual microphone" width="100%">
</p>

<h1 align="center">MicDeck</h1>

<p align="center">
  <strong>A Windows audio desk for voice chat — with its own kernel-mode virtual audio driver.</strong>
  <br>
  Fire sound clips, share what your PC is playing, level everything to one loudness,
  <br>
  and send the whole mix out through a single virtual microphone.
</p>

<p align="center">
  <a href="README.pl.md">Polski</a>
  ·
  <a href="#loudness-matching">Loudness matching</a>
  ·
  <a href="#the-micdeck-vad-driver">The driver</a>
  ·
  <a href="#signal-path">Signal path</a>
  ·
  <a href="#project-layout">Project layout</a>
  ·
  <a href="#build-from-source">Build</a>
  ·
  <a href="CHANGELOG.md">Changelog</a>
</p>

<p align="center">
  <a href="https://github.com/3godzinyL/MicDeck/actions/workflows/ci.yml"><img alt="CI status" src="https://github.com/3godzinyL/MicDeck/actions/workflows/ci.yml/badge.svg"></a>
  <img alt="Windows 10 and 11 x64" src="https://img.shields.io/badge/Windows-10%20%7C%2011%20x64-0c0e11?style=flat-square&logo=windows&logoColor=c8ff63">
  <img alt="Rust and C++20" src="https://img.shields.io/badge/core-Rust%20%2B%20C%2B%2B20-0c0e11?style=flat-square&logo=rust&logoColor=c8ff63">
  <img alt="Kernel WaveRT driver" src="https://img.shields.io/badge/driver-kernel%20WaveRT-0c0e11?style=flat-square&logoColor=c8ff63">
  <img alt="ITU-R BS.1770-4" src="https://img.shields.io/badge/loudness-ITU--R%20BS.1770--4-0c0e11?style=flat-square&logoColor=c8ff63">
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-0c0e11?style=flat-square&logoColor=c8ff63"></a>
</p>

---

MicDeck is a soundboard, a Windows output capture, a broadcast-grade loudness leveller and a
virtual-microphone router in one application. The UI stays deliberately small; a separate
native C++/WASAPI process owns the real-time audio path, and a kernel-mode WaveRT driver
provides the virtual cable itself.

**No account. No telemetry. No cloud mixer. No code injection or process hooks.**

## At a glance

| | |
| --- | --- |
| Platform | Windows 10 2004+ / 11, x64 |
| Inputs | Physical microphone, sound pads, default Windows output (loopback) |
| Output | One virtual microphone — **MicDeck VAD** (own kernel driver) or VB-CABLE |
| Loudness | ITU-R BS.1770-4 gated integrated loudness, per-clip gain, live mic matching |
| Real-time core | Separate C++20 / WASAPI process, 48 kHz float, ~10 ms notification period |
| Shell | Rust + Tauri 2, vanilla-JS front end (no framework, no bundled runtime) |
| Languages | Polish and English, switchable at runtime |

## Highlights

### Loudness matching

Every clip is measured once with a full **ITU-R BS.1770-4** implementation — K-weighting
filters derived from the analog prototype (so 44.1 kHz material is not mis-weighted), 400 ms
blocks with 75 % overlap, and the two-stage absolute/relative gate. The Levels tab then
applies a per-clip gain so everything leaves the mix bus at the same perceived level,
capped so nothing is ever pushed past the peak ceiling.

<p align="center">
  <img src="docs/micdeck-levels.png" alt="Levels tab: BS.1770 loudness normalisation collapsing an 18.9 LU spread to 0.2 LU" width="100%">
</p>

> The library above spans **18.9 LU** between its quietest and loudest clip.
> With normalisation on, the spread after gain is **0.2 LU** — that is the whole point of the tab.

Optionally the same target drives the microphone auto-leveller, so speech and pads sit at
one level on the stream bus instead of fighting each other.

### The MicDeck VAD driver

MicDeck ships its own kernel-mode **WaveRT** virtual audio driver instead of depending on a
third party. The Driver tab lets you pick a backend, install it, and verify that both
endpoints actually respond — with VB-CABLE kept as a working fallback.

<p align="center">
  <img src="docs/micdeck-driver.png" alt="Driver tab: MicDeck VAD and VB-CABLE side by side with per-endpoint diagnostics" width="100%">
</p>

The screenshot shows the honest behaviour: MicDeck VAD is the selected backend, but this
build carries no signed package, so audio transparently keeps flowing through VB-CABLE and
the UI says exactly why.

### Everything else

- **Soundboard** with global hotkeys, waveform previews, and one-click import.
- **Quick Capture** — paste a YouTube / Shorts / TikTok link, get the audio in your library.
- **System audio broadcast** — share Spotify, a game, or a video call into the same mix.
- **Per-application volume** — the studio view lists live audio sessions with their own faders.
- **Voice DSP chain** — AEC3, RNNoise, noise gate, auto-leveller, compressor, limiter.
- **Tray-resident**, autostart-capable, and quiet about it.

## Interface

<table>
  <tr>
    <td width="50%"><img src="docs/micdeck-library.png" alt="Library"></td>
    <td width="50%"><img src="docs/micdeck-studio.png" alt="Live studio"></td>
  </tr>
  <tr>
    <td align="center"><strong>Library</strong> — pads, hotkeys, Quick Capture</td>
    <td align="center"><strong>Studio</strong> — live mixer and system audio broadcast</td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/micdeck-streamer.png" alt="Streamer"></td>
    <td width="50%"><img src="docs/micdeck-settings.png" alt="Settings"></td>
  </tr>
  <tr>
    <td align="center"><strong>Streamer</strong> — calibration and level match</td>
    <td align="center"><strong>Settings</strong> — engine, Windows integration, guides</td>
  </tr>
</table>

## Signal path

```
 physical mic ─┐
               │   ┌──────────────────────────────────────────────┐
 sound pads ───┼──▶│  soundboard_audio_engine.exe  (C++20/WASAPI) │
               │   │                                              │
 Windows       │   │   AEC3 → RNNoise → gate → leveller → limiter │
 loopback ─────┘   │   + per-clip BS.1770 gain on the pad bus     │
                   └───────────────────┬──────────────────────────┘
                                       │  48 kHz float, ~10 ms
                                       ▼
                   ┌──────────────────────────────────────────────┐
                   │  MicDeck VAD  (kernel WaveRT)  or  VB-CABLE  │
                   │  render endpoint ──▶ SPSC ring ──▶ capture   │
                   └───────────────────┬──────────────────────────┘
                                       ▼
                        Discord / OBS / Teams / anything
```

The Rust/Tauri process never touches the real-time path. It decodes clips, measures
loudness, owns persisted state, and talks to the engine over a shared-memory IPC bridge
(`soundboard_ipc.dll`). If the engine dies, the UI stays alive and restarts it.

## The MicDeck VAD driver

`drivers/micdeck-vad` is a complete PortCls/WaveRT virtual audio device: a render endpoint
("MicDeck Driver Input") and a capture endpoint ("MicDeck Virtual Microphone") joined by a
lock-free ring in non-paged pool.

**Design notes worth knowing about:**

- **Single-writer cursors.** The producer owns `write_frame_`, the consumer owns
  `read_frame_`, and nothing else may store to either. Flushes are *requested* from the
  control path and *applied* by the consumer, because a control-thread store racing a DPC
  that already latched a cursor leaves the read head ahead of the write head — and the
  endpoint then goes silent for as long as the session has been running.
- **Epoch-synchronised state.** Latency mode, producer/consumer activity and re-priming are
  published through an atomic epoch; the fade state machine stays entirely consumer-private.
- **Prime / fade / trim.** The consumer waits for a real jitter margin before it starts
  (more than one notification period), fades in and out of discontinuities instead of
  clicking, and trims stale audio when the queue drifts long.
- **Three latency modes** — UltraLow (5 ms prime), Balanced (15 ms), Resilient (30 ms) —
  switchable at runtime through a private KS property set, alongside live ring statistics.
- **No CRT assumptions.** Static objects are `constinit` and the format tables are
  constant-initialised, so a dynamic initialiser that would never run in kernel mode
  becomes a compile error instead of a boot-time mystery.

The `shared/` directory compiles into both the driver and a usermode test binary, so the
ring and the pipeline are covered by ordinary assertions that run in seconds.

> **Shipping status.** The driver compiles and links clean, and its logic is unit-tested,
> including a regression for the flush race described above. Producing an installable
> `.sys` additionally needs the WDK and a code-signing certificate
> (`scripts/build-micdeck-vad-and-app.ps1`). Builds without an embedded signed package
> report MicDeck VAD as unavailable and fall back to VB-CABLE — no silent failure.

## Project layout

<table>
<tr>
<td width="33%" valign="top">

<img src="https://img.shields.io/badge/01-FRONT%20END-c8ff63?style=flat-square&labelColor=0c0e11" alt="">

#### `src/`

Six views, one mutable state object, no framework and no router. `render()` rewrites the
DOM wholesale; pollers patch the meters in place so it does not have to.

`5 516` lines · `6` views · `317` strings × 2 languages

<sub>JavaScript · CSS</sub>

**[Open tree ↓](#tree-01)**

</td>
<td width="33%" valign="top">

<img src="https://img.shields.io/badge/02-RUST%20SHELL-c8ff63?style=flat-square&labelColor=0c0e11" alt="">

#### `src-tauri/`

Owns state, persistence and every IPC command the webview can reach. Never touches the
real-time path — it decodes, measures and delegates.

`4 624` lines · `42` commands · `22` tests

<sub>Rust · Tauri 2</sub>

**[Open tree ↓](#tree-02)**

</td>
<td width="33%" valign="top">

<img src="https://img.shields.io/badge/03-AUDIO%20CORE-c8ff63?style=flat-square&labelColor=0c0e11" alt="">

#### `native-audio/`

The real-time half: a hidden WASAPI mixer process and the shared-memory DLL both Rust
and C++ link against.

`4 110` lines · `2` binaries · `48 kHz` f32

<sub>C++20 · C · Rust</sub>

**[Open tree ↓](#tree-03)**

</td>
</tr>
<tr>
<td width="33%" valign="top">

<img src="https://img.shields.io/badge/04-KERNEL%20DRIVER-c8ff63?style=flat-square&labelColor=0c0e11" alt="">

#### `drivers/…/driver`

A complete PortCls/WaveRT virtual audio device. No hardware DMA — a periodic DPC clocked
off QPC moves bytes across a lock-free ring.

`3 096` lines · `14` translation units

<sub>C++20 kernel-mode · no CRT, no STL</sub>

**[Open tree ↓](#tree-04)**

</td>
<td width="33%" valign="top">

<img src="https://img.shields.io/badge/05-DRIVER%20TOOLKIT-c8ff63?style=flat-square&labelColor=0c0e11" alt="">

#### `drivers/…/*`

Everything around the `.sys`: the elevated installer, endpoint discovery, portable tests,
certification gates and the INF.

`2 319` lines · `13` scripts · `16` docs

<sub>C++ · Rust · PowerShell · CMake</sub>

**[Open tree ↓](#tree-05)**

</td>
<td width="33%" valign="top">

<img src="https://img.shields.io/badge/06-BUILD%20%26%20DOCS-c8ff63?style=flat-square&labelColor=0c0e11" alt="">

#### `scripts/` `docs/` `.github/`

Portable and installer targets, the driver+app one-shot build, screenshots and CI.

`183` files tracked in total

<sub>Node · PowerShell · YAML</sub>

**[Open tree ↓](#tree-06)**

</td>
</tr>
</table>

```
        01 FRONT ──▶ 02 RUST SHELL ──▶ 03 AUDIO CORE ──▶ 04 KERNEL DRIVER ──▶ Discord
           JS            Rust               C++/WASAPI          WaveRT .sys
                          │                                          ▲
                          └────────── 05 DRIVER TOOLKIT ─────────────┘
                                     install · probe · certify
```

---

<a id="tree-01"></a>

<details>
<summary><b>01 · Front end</b> &nbsp;—&nbsp; <code>src/</code> &nbsp;·&nbsp; 5 516 lines</summary>

<br>

```text
src/
├── main.js        2 600 ln   All six views, app state, IPC calls, event wiring
├── i18n.js          692 ln   Flat PL/EN key tables, {var} interpolation, EN fallback
└── styles.css     2 224 ln   Design tokens, every surface, meters, glow keyframes

index.html                    13-line Vite entry: #app div, theme colour, module script
vite.config.js                Port 1420 strictPort, clearScreen off so Tauri logs stay
package.json                  Vite scripts, Tauri v2 api, autostart/dialog/shortcut

README.md · README.pl.md      Structurally mirrored; headings map one-to-one
CHANGELOG.md                  Keep-a-changelog; Unreleased plus 0.1.0
CONTRIBUTING.md               Setup and the exact CI commands to run before a PR
CODE_OF_CONDUCT.md            Short hand-written policy, private reporting
SECURITY.md                   Private GHSA reporting, 72 h ack, declared scope
THIRD_PARTY_NOTICES.md        VB-CABLE SHA-256 and terms, aec3/nnnoiseless, yt-dlp
LICENSE                       MIT
```

> `main.js` holds one mutable `state` object and re-renders `#app` from scratch on every
> change, rebinding listeners as it goes. The 180 ms and 700 ms pollers deliberately patch
> meter DOM in place instead of re-rendering, which is why the UI stays smooth.

</details>

<a id="tree-02"></a>

<details>
<summary><b>02 · Rust shell</b> &nbsp;—&nbsp; <code>src-tauri/</code> &nbsp;·&nbsp; 4 624 lines</summary>

<br>

```text
src-tauri/
├── src/
│   ├── lib.rs          2 498 ln   AppState, all 42 IPC commands, tray, app lifecycle
│   ├── native_audio.rs   774 ln   libloading bridge to the DLL; spawns/kills the engine
│   ├── virtual_audio.rs  733 ln   Backend detection and install, endpoint rename
│   ├── loudness.rs       354 ln   ITU-R BS.1770-4 meter, K-weighting + two-stage gate
│   └── main.rs            37 ln   Entry point; also its own elevated rename helper
│
├── build.rs              228 ln   Builds the C++ engine and DLL, stages the driver
├── Cargo.toml                     cpal, rodio, tauri 2, windows 0.62
├── tauri.conf.json                1280×820 window, strict CSP, per-user NSIS installer
│
├── capabilities/
│   └── default.json               Core, autostart, dialog and global-shortcut grants
│
├── resources/
│   ├── micdeck-vad/package/       Signed driver package lands here (git-ignored)
│   └── vbcable/                   Official VB-CABLE archive + pinned SHA-256
│
├── examples/
│   ├── audio_route_probe.rs       Tone out one endpoint, verify it returns on the other
│   ├── native_probe.rs            Dumps engine status and audio sessions from the DLL
│   └── default_input.rs           Prints the cpal default input name and raw endpoint id
│
└── icons/                         App and tray icons referenced by tauri.conf.json
```

> `lib.rs` folds each clip's normalisation gain into the sound-bus gain rather than
> extending the engine ABI. `native_audio.rs` asserts the exact size and field offsets of
> the shared structs against the C++ layout, so an ABI drift fails a test instead of
> corrupting audio.

</details>

<a id="tree-03"></a>

<details>
<summary><b>03 · Audio core</b> &nbsp;—&nbsp; <code>native-audio/</code> &nbsp;·&nbsp; 4 110 lines</summary>

<br>

```text
native-audio/
├── engine/                        ──▶ soundboard_audio_engine.exe
│   └── src/
│       ├── audio_engine.cpp   1 536 ln   Capture/render threads, per-app loopback,
│       │                                 DSP chain and the final mix limiter
│       ├── audio_engine.h                WasapiCapture/WasapiRender, ProcessStreamSource
│       ├── audio_ring_buffer.h           Header-only lock-free SPSC float ring
│       ├── default_endpoint.cpp          Undocumented IPolicyConfig vtable: get, set and
│       │                                 restore the default mic for all three roles
│       ├── default_endpoint.h            Declarations for the above
│       └── main.cpp              72 ln   Hidden-window host that runs the engine loop
│
├── bridge/                        ──▶ soundboard_ipc.dll
│   ├── include/soundboard_ipc.h          Public extern "C" ABI: every sb_* export
│   └── src/
│       ├── soundboard_ipc.c     763 ln   Maps SbSharedState, atomic gains, SPSC push/pop
│       └── windows_audio_control.cpp     Core Audio session poller: per-PID list, icons
│
├── dsp/                           ──▶ micdeck_dsp.lib, statically linked into the engine
│   ├── src/lib.rs               175 ln   VoiceDsp: AEC3 + RNNoise on 480-frame mono,
│   │                                     crossfaded, exposes a VAD probability
│   ├── include/micdeck_dsp.h             C header the engine consumes
│   └── Cargo.toml · Cargo.lock           Pinned 37-crate graph, watched by build.rs
│
├── protocol/
│   └── soundboard_protocol.h             The versioned shared-memory contract itself
│
├── selftest/
│   └── selftest.cpp             244 ln   Hardware-free checks: ring, limiter, bus
│                                         selection, downmix, tone RMS
└── README.md                             Design doc: audio contract and lifecycle
```

> The protocol header is the single source of truth shared by the DLL, the engine and the
> Rust side. Everything else is downstream of it.

</details>

<a id="tree-04"></a>

<details>
<summary><b>04 · Kernel driver</b> &nbsp;—&nbsp; <code>drivers/micdeck-vad/driver</code> + <code>shared</code> &nbsp;·&nbsp; 3 096 lines</summary>

<br>

```text
drivers/micdeck-vad/
├── driver/
│   ├── MicDeckVad.vcxproj             WDM/PortCls project; links portcls + stdunk +
│   │                                  ksguid; NTDDI 0x0A000008 for ExAllocatePool2
│   ├── include/
│   │   └── micdeck_vad_public.h       The whole kernel↔usermode ABI (v3): property set
│   │                                  GUID, stats, version and latency structs
│   └── src/
│       ├── common.h                   Kernel prologue: WDK includes, pool tags, tracing
│       ├── driver.cpp                 DriverEntry, AddDevice, unload hook
│       ├── adapter.cpp                StartDevice: 4 subdevices, 2 wave↔topology links,
│       │                              power management registration
│       ├── endpoint_descriptors.cpp   Four PCFILTER_DESCRIPTORs: data ranges, node
│       │                              types, internal wiring
│       ├── miniport_wave_rt.cpp       IMiniportWaveRT: filter, format intersection,
│       │                              one stream per pin
│       ├── miniport_wave_rt_stream.cpp  472 ln — the heart: MDL audio buffer, KTIMER/DPC
│       │                              pump, KSSTATE transitions, notification events
│       ├── miniport_topology.cpp      IMiniportTopology: render or capture filter
│       ├── virtual_cable.cpp          8192-frame ring, PCM↔float chunking, KS stats
│       ├── format.cpp                 KSDATAFORMAT parsing plus 5 advertised formats
│       ├── audio_clock.cpp            Per-stream QPC clock: run/pause, byte position
│       ├── master_clock.cpp           Adapter-wide QPC anchor, re-anchored on D0
│       ├── property_handlers.cpp      KS property set: stats, reset, version, latency
│       ├── power_management.cpp       IAdapterPowerManagement: flush on Dx, re-anchor D0
│       ├── guids.cpp                  The one <initguid.h> translation unit
│       └── new_delete.cpp             Pool-tagged operator new/delete
│
└── shared/                            Compiled into BOTH the .sys and the usermode tests
    ├── micdeck_audio_core.h           MdPcmFormat, MdStereoRing, the atomics shim
    ├── micdeck_audio_core.cpp  317 ln SPSC ring + PCM16/24/32/float codecs
    ├── micdeck_cable_pipeline.h       MdCablePolicy per latency mode, pipeline state
    └── micdeck_cable_pipeline.cpp     Prime / fade / stale-trim over the ring
```

**Three things that look odd and are load-bearing:**

| | |
| --- | --- |
| `guids.cpp` | 12 lines, 10 of them comment. `DEFINE_GUID` only allocates storage in the one translation unit that includes `<initguid.h>` first — without this file every PortCls CLSID is an unresolved external. |
| `shared/` | Compiles in kernel *and* usermode, so no CRT, no STL container and no exceptions may appear here. `_KERNEL_MODE` picks `volatile LONG` + `Interlocked*`; usermode gets `std::atomic` wrappers of identical layout. |
| `constinit` in `adapter.cpp` | Kernel drivers never run C++ dynamic initialisers. The keyword turns "this static would silently be garbage at boot" into a compile error. |

</details>

<a id="tree-05"></a>

<details>
<summary><b>05 · Driver toolkit</b> &nbsp;—&nbsp; installer, probes, tests, gates &nbsp;·&nbsp; 2 319 lines</summary>

<br>

```text
drivers/micdeck-vad/
├── integration/
│   ├── driver-helper/                 The only elevated component
│   │   ├── main.cpp                   status / install / repair / uninstall, prints one
│   │   │                              JSON result; fixed operations, no free-form args
│   │   ├── helper_protocol.h          Exit codes and the JSON contract
│   │   └── *.vcxproj                  Links newdev, setupapi, cfgmgr32
│   │
│   ├── micdeck-native/                C++ the audio engine links against
│   │   ├── micdeck_vad_endpoint.cpp   MMDevice probe for both endpoints; matches the
│   │   │                              INF-provided interface name, not the friendly one
│   │   └── micdeck_vad_reconnect.cpp  Backoff reconnect thread, COM-initialised,
│   │                                  condvar-woken so Stop() returns immediately
│   │
│   └── tauri-rust/                    Standalone crate: a driver service layer
│       ├── src/package.rs             Verifies files exist and SHA-256 match before
│       │                              anything elevates
│       ├── src/helper.rs              Spawns the helper, parses its JSON
│       ├── src/model.rs               DriverState / DriverStatus / DriverError
│       └── src/sha256.rs              Dependency-free SHA-256, forbid(unsafe_code)
│
├── package/
│   ├── MicDeckVad.inf                 Root-enumerated MEDIA INF: service, 10 KS
│   │                                  interfaces registered per subdevice, endpoint names
│   └── driver-manifest.example.json   Shape the Rust verifier expects
│
├── tests/
│   ├── core_tests.cpp                 Ring push/pop/wrap/overflow, PCM roundtrip,
│   │                                  200k-frame SPSC stress
│   ├── pipeline_tests.cpp             Priming, stale trim, fade, stop-clear, the
│   │                                  flush-strand regression, mode change
│   └── CMakeLists.txt                 /UNDEBUG keeps the asserts live
│
├── tools/
│   ├── vadctl/                        CLI over the KS property set: stats, latency mode
│   ├── tone-probe/                    Plays a tone into the cable and measures it back
│   └── e2e-certifier/                 End-to-end audio path certification
│
├── scripts/
│   ├── driver-syntax.cmd              Fast /kernel cl.exe compile, no WDK MSBuild
│   ├── driver-link.cmd                Link gate; LNK4210 catches static initialisers
│   ├── build-portable-tests.cmd       Builds and runs the two usermode test binaries
│   ├── build.ps1                      The real WDK MSBuild driver build
│   ├── make-release-package.ps1       InfVerif + Inf2Cat, writes the SHA-256 manifest
│   ├── full-wdk-certification-gate.ps1  Everything: build, sign, verify, certify
│   ├── run-e2e-certification.ps1      CMake-builds the certifier, then runs it
│   ├── bootstrap-official-reference.ps1  Pins a MS driver-samples commit for comparison
│   ├── install-test.ps1 · uninstall.ps1  Test-signed install / removal
│   └── test-core.ps1 · run-portable-tests.{ps1,sh}
│
├── docs/                              16 documents: architecture, bring-up runbook,
│                                      certification levels, security model, known gaps
├── VALIDATION.json · VALIDATION_V3.json  Self-audits that state plainly what was NOT run
└── .github/workflows/                 Portable tests on win+ubuntu; a job that greps for
                                       leaked .sys/.pfx/private keys
```

</details>

<a id="tree-06"></a>

<details>
<summary><b>06 · Build &amp; docs</b> &nbsp;—&nbsp; <code>scripts/</code> <code>docs/</code> <code>.github/</code></summary>

<br>

```text
scripts/
├── tauri.mjs                      Wraps the Tauri CLI: portable, installer, all
├── build-micdeck-vad-and-app.ps1  Driver, signed package and app in one shot
├── stage-micdeck-vad-package.ps1  Verifies kernel signatures, writes driver-manifest.json
├── build.bat · install-tools.bat  Convenience wrappers for a cold machine
└── diagnose.sh                    Runs the native selftest and reports the audio route

docs/
├── micdeck-library.png            Library: pads, hotkeys, Quick Capture
├── micdeck-studio.png             Studio: live mixer, system audio broadcast
├── micdeck-streamer.png           Streamer: calibration and level match
├── micdeck-levels.png             Levels: BS.1770 normalisation, 18.9 LU → 0.2 LU
├── micdeck-driver.png             Driver: both backends with per-endpoint diagnostics
├── micdeck-settings.png           Settings: engine, Windows integration, guides
├── social-preview.svg/.png        Repository social card
└── releases/                      Per-version release notes

.github/
├── workflows/ci.yml               windows-latest: npm audit, build, fmt, test, clippy
├── ISSUE_TEMPLATE/                Bug and feature forms that ask for engine diagnostics
├── PULL_REQUEST_TEMPLATE.md
└── dependabot.yml
```

</details>

## Build from source

### Requirements

| Component | Needed for |
| --- | --- |
| Rust (stable, MSVC toolchain) | The app shell |
| Node.js 20+ | Front-end build |
| Visual Studio 2022 + "Desktop development with C++" | Native engine and driver |
| Windows SDK 10.0.22621+ | Kernel headers and libraries |
| Windows Driver Kit (WDK) | Producing an installable `.sys` |
| yt-dlp + ffmpeg on `PATH` | Quick Capture (optional) |

### Run it

```bash
npm install
npm run tauri dev
```

`build.rs` compiles the C++ engine and the elevated driver helper along the way, so the
first build takes a while. No WDK is needed for this path — the app runs on VB-CABLE.

### Ship it

```powershell
npm run build:portable                     # single portable .exe
npm run build:installer                    # NSIS installer
.\scripts\build-micdeck-vad-and-app.ps1    # driver + signed package + app
```

### Verify it

```bash
# Rust: BS.1770 calibration, normalisation limits, driver package integrity
cargo test --manifest-path src-tauri/Cargo.toml --lib

# Driver logic: ring, flush-race regression, prime/fade/trim, format conversion
drivers\micdeck-vad\scripts\build-portable-tests.cmd

# Driver compiles clean in kernel mode
drivers\micdeck-vad\scripts\driver-syntax.cmd

# Driver links clean — catches unresolved externals and static initialisers
drivers\micdeck-vad\scripts\driver-link.cmd
```

The BS.1770 implementation is pinned to the standard's own calibration point: a 0 dBFS
1 kHz sine in one channel of a stereo pair must read **−3.01 LKFS**. If the K-weighting
coefficients or the −0.691 offset ever drift, that test fails.

## Privacy and security

- No account, no telemetry, and no network calls other than Quick Capture downloads you start.
- The embedded VB-CABLE archive is SHA-256 verified before it is ever extracted.
- The MicDeck VAD package is verified against a signed manifest before install, and the
  elevated helper only ever runs out of a freshly staged temporary directory.
- Driver installation is an explicit user action — startup only ever *detects*.
- No process hooks, no code injection, no interception of other applications' audio streams.

## Roadmap

- [ ] Authenticode/EV-signed MicDeck VAD package in the release pipeline
- [ ] Automatic recovery when a physical audio device is unplugged and reconnected
- [ ] Per-application capture (route a single app instead of the whole desktop)
- [ ] Multiple decks and profiles
- [ ] Stream Deck and MIDI control
- [ ] Additional community translations

## Third-party software

VB-CABLE is donationware by VB-Audio and is redistributed unmodified under its own terms
(`src-tauri/resources/vbcable/NOTICE.md`). If you use it, support the author — MicDeck VAD
exists so that dependency is optional, not so it goes unpaid. Full attribution lives in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Contributing

Issues and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) and the
[Code of Conduct](CODE_OF_CONDUCT.md). Anything touching the driver or the shared ring
should come with a test in `drivers/micdeck-vad/tests`. When reporting an audio problem,
include the engine status, Windows version, device names, negotiated latency, and the
underrun count from the Driver tab.

## License

MIT — see [LICENSE](LICENSE). Bundled and optional third-party components retain their own
licenses and distribution terms.

---

<p align="center">
  <strong>If MicDeck fixes your voice-chat audio, consider starring the repository.</strong>
</p>
