# Final update 3 — automatic render-to-capture certification

The previous tone tool only sent a signal and required a person to record it.
The new certifier opens both MicDeck endpoints itself:

```
1 kHz generator
    -> MicDeck Driver Input
    -> MicDeckVad.sys
    -> MicDeck Virtual Microphone
    -> WASAPI capture analyzer
```

It fails unless it receives a valid signal.

Measured values:

* captured frame count and duration;
* RMS;
* 1 kHz Goertzel spectral ratio;
* 10 ms dropout-window ratio;
* WASAPI discontinuity packets;
* capture packet count;
* approximate render-to-capture latency using QPC timestamps;
* render and capture HRESULTs.

Default pass conditions include:

* tone RMS of at least 0.035;
* 1 kHz spectral ratio of at least 8:1;
* dropout ratio no greater than 8%;
* no more than four discontinuity packets;
* measured latency no greater than 500 ms when a valid QPC estimate exists.

Run:

```powershell
.\scripts\run-e2e-certification.ps1
```

The machine-readable result is saved as `audio-e2e.json`.
