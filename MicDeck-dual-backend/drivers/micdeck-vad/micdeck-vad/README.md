# MicDeck VAD — v0.3 final verification gates

MicDeck VAD is a custom WaveRT/PortCls render-to-capture cable intended to
replace VB-CABLE in MicDeck.

This revision adds the final three verification layers:

1. **Pinned official Microsoft baseline** — proves the VS/SDK/WDK environment.
2. **Full WDK/package certification gate** — build, INF, CAT, signing,
   installation and machine-readable reporting.
3. **Automatic WASAPI E2E certifier** — sends a real tone through the driver and
   analyzes the virtual microphone.

## One-command Windows gate

From an administrator Developer PowerShell on a disposable target:

```powershell
.\scripts\full-wdk-certification-gate.ps1 `
  -Configuration Debug `
  -TestSign
```

For the separate Driver Verifier boot:

```powershell
.\scripts\full-wdk-certification-gate.ps1 `
  -Configuration Debug `
  -TestSign `
  -EnableVerifierForNextBoot
```

The script never turns on test-signing mode by itself. It fails and explains
what must be done on the disposable target.

## What “working” means here

The source archive itself is not proof that a kernel driver works. Read
`docs/CERTIFICATION_LEVELS.md`.

A credible working claim requires at minimum:

* WDK build;
* `InfVerif /w`;
* `Inf2Cat`;
* signed package installation;
* both Windows endpoints;
* passing real render-to-capture E2E test.

A production-ready claim additionally requires Driver Verifier, lifecycle and
power tests, HLK and Microsoft signing.

## Architecture

```text
MicDeck native mixer
    -> event-driven WASAPI
    -> MicDeck Driver Input
    -> MicDeckVad.sys custom realtime cable
    -> MicDeck Virtual Microphone
    -> Discord / OBS / games
```

DSP, AEC3, RNNoise, clip decoding and process capture remain in user mode.
