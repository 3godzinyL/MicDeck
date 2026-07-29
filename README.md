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

```
micdeck/
├── src/                              Front end — vanilla JS, no framework
│   ├── main.js                       Views, state, IPC calls, event wiring
│   ├── i18n.js                       Polish + English copy
│   └── styles.css                    Full design system
│
├── src-tauri/                        Rust shell
│   ├── src/
│   │   ├── lib.rs                    App state, Tauri commands, tray, hotkeys
│   │   ├── loudness.rs               ITU-R BS.1770-4 meter (K-weighting + gating)
│   │   ├── virtual_audio.rs          Backend detection, install, endpoint rename
│   │   └── native_audio.rs           FFI to the C++ engine, decode + push loop
│   ├── build.rs                      Builds the native engine, stages the driver package
│   ├── resources/
│   │   ├── micdeck-vad/package/      Signed driver package lands here (git-ignored)
│   │   └── vbcable/                  Official VB-CABLE archive + SHA-256
│   └── tauri.conf.json
│
├── native-audio/                     Real-time audio core
│   ├── engine/src/                   WASAPI capture/render, mixer, session monitor
│   ├── bridge/                       Shared-memory IPC bridge (soundboard_ipc.dll)
│   ├── dsp/                          Rust DSP static lib (AEC3, RNNoise, dynamics)
│   ├── protocol/                     Versioned IPC struct definitions
│   └── selftest/                     Hardware-independent native tests
│
├── drivers/micdeck-vad/              Kernel-mode virtual audio driver
│   ├── driver/src/
│   │   ├── driver.cpp                DriverEntry, AddDevice, unload chain
│   │   ├── adapter.cpp               Subdevice registration + physical connections
│   │   ├── endpoint_descriptors.cpp  Pin / filter / data-range tables
│   │   ├── miniport_wave_rt*.cpp     WaveRT miniport, stream, DPC transfer
│   │   ├── miniport_topology.cpp     Topology miniport
│   │   ├── virtual_cable.cpp         Ring ownership, stream state, statistics
│   │   ├── format.cpp                KSDATAFORMAT table (constant-initialised)
│   │   ├── audio_clock.cpp           Per-stream position clock
│   │   ├── master_clock.cpp          QPC-anchored shared clock
│   │   ├── property_handlers.cpp     Private KS property set (stats, latency mode)
│   │   ├── power_management.cpp      D0/D3 transitions
│   │   ├── guids.cpp                 The one initguid.h translation unit
│   │   └── new_delete.cpp            Pool-tagged operator new/delete
│   ├── shared/                       Compiles into BOTH kernel and usermode
│   │   ├── micdeck_audio_core.*      SPSC ring, format conversion, atomics
│   │   └── micdeck_cable_pipeline.*  Prime / fade / trim policy
│   ├── integration/
│   │   ├── driver-helper/            Elevated SetupAPI/DIFx installer
│   │   ├── micdeck-native/           Endpoint discovery + reconnect controller
│   │   └── tauri-rust/               Reference Rust bindings
│   ├── package/MicDeckVad.inf        INF (per-subdevice interface registration)
│   ├── tests/                        Usermode tests for the shared code
│   ├── tools/                        vadctl, tone-probe, e2e-certifier
│   ├── scripts/                      Build, sign, install, certification gates
│   └── docs/                         Architecture, bring-up, security model
│
├── scripts/                          App build and packaging
│   ├── build-micdeck-vad-and-app.ps1 Driver + app in one shot
│   ├── stage-micdeck-vad-package.ps1 Verifies signatures, writes the manifest
│   └── tauri.mjs                     Portable / installer targets
│
└── docs/                             Screenshots, release notes
```

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
