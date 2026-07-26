# Remaining platform-verification work

This environment has no Windows WDK, so the kernel source could not be compiled
or loaded here. The portable ring, conversion and latency pipeline were built
and tested.

The first WDK session must verify:

1. exact pure-virtual WaveRT interface methods for the selected WDK;
2. PortCls pin/node descriptor ordering;
3. registration of `IAdapterPowerManagement`;
4. KS automation-table linkage;
5. endpoint friendly names produced by the INF and topology;
6. PnP remove ownership and pageable/DPC annotations;
7. test signing, Driver Verifier, HLK and production signing.

These are platform verification tasks. The custom transport, queue policy,
format conversion, diagnostics ABI, helper protocol and MicDeck integration
are present in source.
