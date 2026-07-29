# Changelog

All notable MicDeck changes are documented here. The project follows
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Planned

- Authenticode/EV-signed MicDeck VAD package in the release pipeline
- Hardware controller integrations
- Signed builds and automatic updates

### Added

- **MicDeck VAD**, an own kernel-mode WaveRT virtual audio driver, selectable from a new
  Driver tab alongside VB-CABLE. The tab probes both backends, installs either one, tests
  each endpoint independently, and reports the active backend when it differs from the
  selected one instead of failing silently.
- **Loudness matching** in a new Levels tab: a full ITU-R BS.1770-4 meter measures every
  clip once (K-weighting derived from the analog prototype, 400 ms blocks with 75 % overlap,
  absolute and relative gating), and the mix bus applies a per-clip gain so everything
  leaves at the same perceived level. Peak ceiling and gain limits are respected, and the
  same target can optionally drive the microphone auto-leveller.
- Driver package staging in `build.rs`, with cryptographic verification of the embedded
  MicDeck VAD package against its signed manifest before any elevated install.
- Fast driver gates: `driver-syntax.cmd`, `driver-link.cmd` and `build-portable-tests.cmd`
  compile, link, and unit-test the driver without needing the WDK MSBuild targets.
- Dedicated bilingual Streamer console with pre/post-processing dBFS meters,
  configurable target range, live headphone calibration, and OBS output metering
- Persistent WebRTC AEC3 and RNNoise processing followed by a smart gate,
  adaptive leveler/compressor, and final limiter in the native 48 kHz audio path
- Private per-process WASAPI loopback bus for application levels that affect only
  the virtual-cable mix, with aggregate-loopback fallback and click-free crossfade
- General and Audio filters settings sections with persistent filter tuning
- Microphone AEC3 and RNNoise switches directly in Live Studio
- Live Studio application-audio activity rack with recency sorting, executable icons,
  live signal meters, and per-application virtual-cable level controls
- Continuous low-overhead Core Audio session monitoring, including recent activity
  history for minimized and temporarily silent applications
- Windows default microphone repair action for all capture roles
- Native capture overrun and dropped-frame diagnostics
- Persistent per-sound global hotkeys with an in-app shortcut recorder
- Responsive background workers for local imports, URL downloads, decoding, and waveform analysis
- Live import progress with immediate library refresh when prepared audio is ready
- Organic cursor-following ambient glow, enabled by default
- Built-in usage-rights reminder in Quick Capture

### Fixed

- **The virtual cable could go permanently silent.** Ring cursors were reset from the
  control path while the capture DPC held a latched copy, leaving the read head ahead of the
  write head. Flushes are now requested from the control path and applied by the consumer,
  so the single-writer invariant holds; covered by a regression test.
- **The driver did not build or link at all.** Missing `<stdunk.h>`, undeclared pool-tagged
  `operator new`/`delete`, a non-existent `KSNAME_Wave`, const-qualified data-range tables,
  a mismatched automation-table declaration, `PcRegisterPhysicalConnection` called with
  strings instead of port objects, a missing `initguid.h` translation unit, and an absent
  `stdunk.lib` all blocked compilation or linking.
- **No audio format could ever be negotiated.** The streaming wave pins advertised
  `SUBTYPE_ANALOG` / `SPECIFIER_NONE`, so KS never found an intersection and the data path
  never ran. Host pins now publish PCM and IEEE-float `WAVEFORMATEX` ranges; the bridge pins
  keep the analog range.
- **The capture endpoint could never stream.** Capture wave and topology pin arrays were
  ordered opposite to the pin-id enum used for the physical connections.
- **Windows built no endpoints from the INF.** Interfaces were registered on `GLOBAL`
  instead of the subdevice reference strings passed to `PcRegisterSubdevice`.
- Advertised `KSDATAFORMAT` tables and the static cable/clock objects relied on dynamic
  initialisers that never run in kernel mode; they are constant-initialised and `constinit`
  now, so the compiler rejects any regression.
- `IMiniportWaveRTStream::SetFormat` was unimplemented (leaving the stream class abstract)
  and `IAdapterPowerManagement::PowerChangeState` had the wrong return type.
- The non-paged ring leaked on driver unload and left a dangling pointer on shutdown.
- The consumer primed on exactly one notification period, leaving no jitter margin.
- Format intersection read `KSDATARANGE_AUDIO` fields out of ranges that may be a plain
  `KSDATARANGE`, over-reading the client's buffer.
- The endpoint reconnect worker never initialised COM, so every reconnect attempt failed,
  and shutdown could block for over five seconds inside a backoff sleep.
- Endpoint detection relied on the user-renameable friendly name; it now also matches the
  device-interface name that comes straight from the INF.

### Changed

- Native audio protocol upgraded to version 7 with atomic configuration snapshots,
  voice-processing state, detailed DSP meters, and fixed-capacity process-source routing
- Native bootstrap no longer installs drivers or changes the Windows default
  microphone during application startup
- Expensive native initialization now runs outside the UI startup path
- Production binaries use additional MSVC control-flow, stack, DEP, ASLR, and
  link-time optimization hardening
- The Windows installer embeds the small WebView2 bootstrapper instead of the
  complete offline runtime
- Tauri now uses a restrictive Content Security Policy
- Sound metadata analysis no longer blocks startup, playback, or the main UI thread
- Library cards and primary surfaces now use the refreshed translucent MicDeck visual system

### Fixed

- Application level controls no longer modify the Windows listening volume
- System-audio enable and gain controls now operate exclusively on the outgoing
  virtual-cable route
- Persisted configuration replacement is now atomic
- Audio-ring and IPC buffer loss is observable instead of being silently discarded
- Loopback startup warnings are retained and exposed to diagnostics
- Native live-probe failures now propagate through the diagnostic script

## [0.1.0] — 2026-07-23

### Added

- MicDeck Library, Live Studio, and Settings workspaces
- Local soundboard for MP3, WAV, FLAC, OGG, AAC, and M4A
- Quick Capture workflow for YouTube, YouTube Shorts, and TikTok
- WASAPI loopback routing for Windows system audio
- Rust/Tauri control layer and C++20 real-time audio engine
- Adaptive `IAudioClient3` period selection with safe fallback
- Live latency, signal-level, engine, and underrun diagnostics
- Guided VB-CABLE installation and virtual microphone management
- Full English and Polish interfaces with a persistent top-right language switcher
- Optional launch-at-sign-in with a quiet, minimized startup
- Windows system-tray controls with close-to-tray behavior
- Portable and NSIS installer builds
- CI, issue forms, security policy, and contributor documentation
