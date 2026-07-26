# Requirements traceability

This file maps the requested driver plan to concrete source.

| Requirement | Implementation |
|---|---|
| Separate `.sys/.inf/.cat` package | `driver/`, `package/` |
| No DLL injection | normal PortCls/WaveRT endpoints |
| Final MicDeck mix enters render endpoint | `integration/micdeck-native/` |
| Capture endpoint appears as microphone | capture WaveRT miniport/topology |
| 48 kHz stereo float internal stream | `shared/micdeck_audio_core.*` |
| PCM16/24/32 and float support | edge converters and format table |
| Nonpaged bounded ring | `MdStereoRing` |
| Low-latency behavior | `MdCablePipeline` |
| Stale-frame removal | consumer-owned `DiscardOldest()` |
| Underflow silence | fully initialized reads |
| Click reduction | fade-in and fade-to-silence |
| Diagnostics | custom versioned KS property set |
| Latency modes | Ultra Low / Balanced / Resilient |
| Power reset | `power_management.*` and reset reasons |
| Driver installation | fixed-operation helper and INF |
| Tauri integration | `integration/tauri-rust/` |
| Engine endpoint detection | `micdeck_vad_endpoint.*` |
| Engine reconnect | `micdeck_vad_reconnect.*` |
| Isolated test signal | `tools/tone-probe/` |
| Portable unit/stress tests | `tests/` |
| Release hashes | manifest and release script |
| Production acceptance criteria | `docs/PRODUCTION_GATE.md` |

The kernel still needs WDK compilation and runtime verification; that cannot be
truthfully replaced by source generation.
