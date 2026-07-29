# Certification levels

The package uses explicit levels instead of the phrase “100% working”.

## Level 0 — source only

Files exist, but no compilation has run.

## Level 1 — portable core verified

Ring, conversion and realtime policy tests compile and pass.

## Level 2 — WDK build verified

`MicDeckVad.sys` is produced by the selected Visual Studio/WDK version.

## Level 3 — package verified

The INF passes `InfVerif /w`, `Inf2Cat` produces a CAT, and all package hashes
are recorded.

## Level 4 — target runtime verified

The test-signed or production-signed package installs and both endpoints exist.

## Level 5 — audio path verified

The automated certifier passes real WASAPI render → driver → capture.

## Level 6 — stability verified

Driver Verifier, sleep/resume, `audiosrv` restart, install/update/uninstall and
the soak suite pass on supported Windows versions.

## Level 7 — distributable

Required HLK tests and Microsoft production signing pass.

Only Level 7 is suitable for calling a release production-ready. Even Level 7
does not mathematically guarantee that software contains no defects.
