# Three final advanced updates

## 1. Official baseline lock

A pinned Microsoft sample is cloned, SHA-verified and optionally built before
the custom driver. This proves whether the machine's VS/SDK/WDK environment is
valid.

## 2. Full WDK/package gate

One command runs portable tests, official baseline, custom WDK build,
`InfVerif /w`, `Inf2Cat`, optional test signing, signature verification,
manifest creation, installation and Driver Verifier setup.

## 3. Real audio-path certifier

A separate program opens the render and capture endpoints simultaneously,
transmits a deterministic 1 kHz signal and rejects the driver when audio,
spectral purity, dropout rate, discontinuities or latency fail thresholds.

These updates do not manufacture certainty. They replace assumptions with
machine-verifiable evidence.
