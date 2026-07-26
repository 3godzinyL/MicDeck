# Changelog

## 0.2.0 — custom realtime architecture

* Added `MdCablePipeline` above the raw SPSC ring.
* Added Ultra Low, Balanced and Resilient latency policies.
* Added startup priming and consumer-owned stale-frame trimming.
* Added click-safe fade-in and underflow fade-to-silence.
* Added discarded-frame, discontinuity, trim, prime and fade diagnostics.
* Added versioned KS ABI v2 and runtime latency-mode property.
* Added shared master-clock foundation and power-transition resets.
* Added fixed-operation elevated install/repair/uninstall helper.
* Added MicDeck endpoint discovery and reconnect controller.
* Added Rust/Tauri package verification and helper model.
* Added WASAPI tone probe and pipeline tests.
* Added complete integration, bring-up, security and production-gate docs.


## 0.3.0 — final verification gates

### Added

- exact official Microsoft Windows-driver-samples commit lock;
- official sample clone/build/hash bootstrap;
- one-command WDK build and package gate;
- InfVerif `/w` validation;
- dynamic Inf2Cat target detection;
- optional local test certificate and signature verification;
- immutable SHA-256 release manifest;
- root-device install gate;
- automatic render-to-capture WASAPI certifier;
- RMS, spectral, dropout, discontinuity and latency checks;
- certification report JSON schema;
- explicit source/build/runtime/stability/distribution certification levels.
