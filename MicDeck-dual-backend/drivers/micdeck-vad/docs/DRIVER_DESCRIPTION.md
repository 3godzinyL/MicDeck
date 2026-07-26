# Driver description

## Purpose

MicDeck VAD replaces VB-CABLE with a MicDeck-owned pair of standard Windows
audio endpoints:

* `MicDeck Driver Input` — render endpoint used by MicDeck.
* `MicDeck Virtual Microphone` — capture endpoint used by Discord, OBS, games
  and calls.

The driver transports the already-processed final PCM mix. AEC3, RNNoise,
soundboard playback, microphone/system capture, per-process capture, gate,
leveler, compressor and limiter stay in `soundboard_audio_engine.exe`.

## Kernel data path

The render and capture WaveRT miniports share one `MicDeckVirtualCable`.
Its canonical format is 48 kHz, stereo, 32-bit float in nonpaged memory.
Conversion happens only at the miniport edge for PCM16 mono/stereo, PCM24
stereo, PCM32 stereo and float32 stereo. No kernel resampler is included.

## MicDeck-specific realtime policy

A plain FIFO can accumulate old voice audio after a scheduler stall. MicDeck
VAD instead lets the capture consumer remove stale frames before reading:

| Mode | Prime | Target | Maximum queue |
|---|---:|---:|---:|
| Ultra Low | 3 ms | 5 ms | 15 ms |
| Balanced | 10 ms | 15 ms | 30 ms |
| Resilient | 20 ms | 30 ms | 60 ms |

When the queue exceeds the maximum, capture discards old frames down to the
target and fades the next output in. Underflow fades the last sample to zero
instead of replaying stale data or leaving an uninitialized buffer.

## Failure behavior

* Capture opens before MicDeck: initialized silence until primed.
* MicDeck crashes: queued audio is invalidated and output fades to silence.
* Scheduler spike: old frames are trimmed and a discontinuity is counted.
* Unsupported format: stream creation fails.
* Power transition: queue and clock epoch reset.
* Driver update: MicDeck releases and re-enumerates endpoint IDs.

## Diagnostics

The custom KS property set reports ABI/version, stream states, queue fill,
watermarks, written/read/dropped/discarded/silent frames, priming silence,
fades, stale trims, discontinuities, latency mode, generation, epoch and reset
reason.
