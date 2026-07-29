# MicDeck VAD — staged driver package

`package/` holds the signed kernel-mode driver that gets embedded into the app binary:

```
MicDeckVad.sys
MicDeckVad.inf
MicDeckVad.cat
driver-manifest.json
```

The files are not in source control because they require the WDK and a code-signing
certificate. Produce them with:

```powershell
.\scripts\build-micdeck-vad-and-app.ps1
```

which builds `drivers/micdeck-vad`, signs the package and runs
`scripts/stage-micdeck-vad-package.ps1` to drop the artifacts here together with a
SHA-256 manifest.

When `package/` is empty the app still builds and runs — it reports the MicDeck VAD
backend as unavailable and falls back to VB-CABLE.
