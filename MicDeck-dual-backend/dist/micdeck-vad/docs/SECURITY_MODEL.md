# Security model

The driver exposes standard WaveRT buffers and a narrow versioned KS property
set. It does not accept arbitrary kernel addresses, file paths, shell commands
or audio through custom IOCTLs.

Trust boundaries:

* the webview is untrusted for privileged operations;
* Rust resolves a fixed package path and validates hashes;
* the helper performs only fixed driver operations;
* format and structure lengths are validated;
* realtime memory is allocated before streaming;
* kernel DSP plugins and network audio are non-goals.

Test-signed builds belong in a disposable VM or dedicated test machine.
