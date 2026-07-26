# Architecture

## Separation of privilege

The kernel component is intentionally small relative to MicDeck:

```
Tauri/Rust control plane
       |
       | versioned shared-memory IPC
       v
soundboard_audio_engine.exe
       |
       | ordinary event-driven WASAPI render
       v
MicDeck Driver Input (WaveRT render)
       |
       | bounded internal 48 kHz stereo float ring
       v
MicDeck Virtual Microphone (WaveRT capture)
       |
       v
voice/recording clients
```

AEC3, RNNoise, process loopback, per-application gain, clip decoding,
limiting and all UI work stay in user mode.

## Stream timing

Each WaveRT stream owns:

* its mapped cyclic DMA buffer;
* a QPC-backed clock;
* a periodic DPC used to simulate hardware progress;
* notification event registration;
* a monotonically increasing linear byte position.

When a render stream advances, completed bytes are decoded and pushed to the
shared cable. When capture advances, bytes are filled from the cable. Cyclic
wrap is split into contiguous segments.

## Ring policy

The ring is a single-render/single-capture queue. Shared-mode Windows Audio
Engine normally creates one stream on each miniport even when many client apps
are open.

* Overflow: accept available space and drop newest frames.
* Underflow: return silence and increment `silent_frames`.
* Stop/restart: reset positions and zero DMA buffers.
* No dynamic allocation on transfer/DPC paths.
* No kernel wait on a user process.

## Format policy

The cable's canonical representation is 48 kHz, stereo, IEEE float.

The miniports accept:

* PCM16 mono/stereo;
* PCM24 stereo;
* PCM32 stereo;
* float32 stereo;

all at 48 kHz. In shared mode Windows Audio Engine performs ordinary client
resampling and format conversion. Keeping resampling out of the kernel makes
the first driver smaller and safer.

## Production hardening still required

A shipping driver still needs:

* WDK build cleanup against the chosen SDK revision;
* complete SysVAD-style endpoint property automation;
* verified endpoint naming through INF/KS registration;
* ETW/WPP tracing;
* KS property wiring for `vadctl`;
* PnP/power callbacks and audiosrv restart tests;
* Driver Verifier;
* HLK audio tests;
* Microsoft production signing.
