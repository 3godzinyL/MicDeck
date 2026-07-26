# Final update 2 — complete WDK/package gate

`full-wdk-certification-gate.ps1` turns the build into a strict pipeline.

It checks:

1. Visual Studio/WDK tools;
2. portable core tests;
3. the pinned official Microsoft sample build;
4. the custom driver WDK build;
5. production-style `InfVerif /w`;
6. `Inf2Cat` and CAT generation;
7. optional local test signing;
8. signature verification;
9. immutable package SHA-256 manifest;
10. optional root-device installation;
11. automatic end-to-end audio certification;
12. optional Driver Verifier configuration for the next boot.

Every stage is written to `certification-report.json`. A skipped, failed or
pending runtime stage prevents a `fully-certified` result.

The script does not silently:

* disable Secure Boot;
* change boot policy;
* enable test-signing mode;
* install anything without administrator rights;
* treat an untested source build as a working driver.
