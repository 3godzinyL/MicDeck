# WDK bring-up runbook

## Compile phase

1. Install Visual Studio 2022, Windows SDK and WDK.
2. Open `MicDeckVad.sln`, select `Debug | x64`.
3. Run portable tests first.
4. Build the driver and helper.
5. Resolve only concrete selected-WDK interface/descriptor mismatches.
6. Run Code Analysis for Drivers, InfVerif and Static Driver Verifier.

## Disposable VM phase

1. Snapshot a Windows 11 VM and configure kernel dumps.
2. Generate a test certificate.
3. Build the package and catalog.
4. Test-sign the package.
5. Install `ROOT\MICDECKVAD`.
6. Verify Device Manager and both audio endpoints.
7. Open capture first: it must return silence.
8. Run the tone probe and record the virtual mic.
9. Query KS diagnostics.
10. Enable Driver Verifier for `MicDeckVad.sys` only.

## Integration phase

1. Add endpoint discovery to MicDeck.
2. Route the final mix to `MicDeck Driver Input`.
3. Open capture in OBS and Discord simultaneously.
4. Disable/enable the device and confirm reconnect.
5. Restart `audiosrv`.
6. Test sleep, hibernate, fast startup and a 24-hour soak.
