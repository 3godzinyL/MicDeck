# Changelog

All notable MicDeck changes are documented here. The project follows
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Planned

- Per-application audio capture
- Hardware controller integrations
- Signed builds and automatic updates

### Added

- Persistent per-sound global hotkeys with an in-app shortcut recorder
- Responsive background workers for local imports, URL downloads, decoding, and waveform analysis
- Live import progress with immediate library refresh when prepared audio is ready
- Organic cursor-following ambient glow, enabled by default
- Built-in usage-rights reminder in Quick Capture

### Changed

- Sound metadata analysis no longer blocks startup, playback, or the main UI thread
- Library cards and primary surfaces now use the refreshed translucent MicDeck visual system

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
