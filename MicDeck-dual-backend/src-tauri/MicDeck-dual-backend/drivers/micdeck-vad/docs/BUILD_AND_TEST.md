# Build and test

Portable tests:

```bash
./scripts/run-portable-tests.sh
```

or:

```powershell
.\scripts\run-portable-tests.ps1
```

Kernel build requires Visual Studio 2022, Windows SDK and WDK:

```powershell
.\scripts\build.ps1 -Configuration Debug
```

Release package after a successful build:

```powershell
.\scripts\make-release-package.ps1 -Configuration Release
```

End-to-end: build `tools/tone-probe`, send a 1 kHz tone to the render endpoint,
record `MicDeck Virtual Microphone`, and inspect diagnostics with `vadctl`.
