# Final update 1 — pinned Microsoft baseline

The package now pins one exact commit of Microsoft's official
`Windows-driver-samples` repository.

The bootstrap script:

1. clones the official repository;
2. checks out the exact locked commit;
3. initializes WIL and other submodules;
4. verifies the resolved SHA;
5. hashes the relevant SysVAD and Simple Audio Sample source;
6. optionally builds the official samples with the same Visual Studio/WDK
   environment used for MicDeck VAD.

This separates two problems:

* if the official sample does not build, the workstation/WDK is broken;
* if the official sample builds and MicDeck VAD does not, the remaining issue
  is in the custom source.

Run:

```powershell
.\scripts\bootstrap-official-reference.ps1 -Build
```

The result is saved below `out\official-reference`.
