# MicDeck VAD embedded package staging

The application embeds the custom driver package during `cargo build` when this
folder contains all four files:

- `package/MicDeckVad.sys`
- `package/MicDeckVad.inf`
- `package/MicDeckVad.cat`
- `package/driver-manifest.json`

Use `scripts/stage-micdeck-vad-package.ps1` to copy and validate a built,
signed package. The elevated helper is compiled automatically by
`src-tauri/build.rs`; it is not committed as a binary.
