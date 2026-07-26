# Production gate

Do not remove VB-CABLE until all gates pass.

## Packaging
- WDK build succeeds without unexplained warnings.
- InfVerif and Inf2Cat pass.
- Package and application are production-signed.
- Install, repair, update, rollback and uninstall are tested.
- Package hashes are verified before elevation.

## Kernel
- Static Driver Verifier passes.
- Driver Verifier passes 24-hour stress.
- No pool leaks, DPC watchdog failures or teardown races.
- Sleep/resume and `audiosrv` restart reset queue/clock correctly.

## Audio
- All advertised formats pass.
- Channel order and mono downmix pass.
- Underflow is initialized silence.
- No stale audio after MicDeck restart.
- No click on producer loss or stale trim.
- Discord, OBS, Teams and browser WebRTC pass.
- Ultra Low, Balanced and Resilient queue targets pass.

## Certification
- Required HLK audio tests pass.
- Microsoft signing submission is accepted.
- Symbols and reproducible release package are archived.
