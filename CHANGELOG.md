# Changelog

All notable MicDeck changes are documented here. The project follows
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Planned

- Hardware controller integrations
- Signed builds and automatic updates

### Added

- Live Studio application-audio activity rack with recency sorting, executable icons,
  live signal meters, and per-session volume controls
- Continuous low-overhead Core Audio session monitoring, including recent activity
  history for minimized and temporarily silent applications
- Windows default microphone repair action for all capture roles
- Native capture overrun and dropped-frame diagnostics
- Persistent per-sound global hotkeys with an in-app shortcut recorder
- Responsive background workers for local imports, URL downloads, decoding, and waveform analysis
- Live import progress with immediate library refresh when prepared audio is ready
- Organic cursor-following ambient glow, enabled by default
- Built-in usage-rights reminder in Quick Capture

### Changed

- Native audio protocol upgraded to version 5 with atomic configuration snapshots
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
