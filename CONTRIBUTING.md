# Contributing to MicDeck

Thanks for helping make Windows audio routing less painful.

## Before opening an issue

- Search existing issues and Discussions.
- Use the correct issue form.
- For audio bugs, include Windows version, input/output device names, MicDeck's
  latency and underrun counters, and exact reproduction steps.
- Never attach copyrighted media, private recordings, secrets, or personal data.
- Report security vulnerabilities privately according to `SECURITY.md`.

## Local setup

You need Windows 10/11 x64, Node.js 24+, Rust stable with MSVC, Visual Studio
2022 Build Tools with the **Desktop development with C++** workload, and the
WebView2 Runtime.

```powershell
npm ci
npm run tauri dev
```

Optional URL import also needs `yt-dlp` and `ffmpeg` in `PATH`.

## Before opening a pull request

Run the same core checks as CI:

```powershell
npm audit --audit-level=high
npm run build
cargo fmt --manifest-path src-tauri\Cargo.toml --all -- --check
cargo test --manifest-path src-tauri\Cargo.toml --locked
cargo clippy --manifest-path src-tauri\Cargo.toml --all-targets --locked -- -D warnings
```

Keep pull requests focused. Explain the user-facing problem, the chosen
solution, how it was tested, and any audio-device assumptions. UI changes
should include an updated screenshot.

By contributing, you agree that your contribution is licensed under the MIT
License.
