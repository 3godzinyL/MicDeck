# MicDeck v0.1.0 — Public Preview

MicDeck is a native Windows soundboard and system-audio router built for Discord, games, OBS, and voice chat.

## Highlights

- Route your physical microphone, sound pads, and Windows desktop audio through one virtual microphone.
- Share YouTube, Spotify, games, and other system audio with one broadcast control.
- Capture audio from YouTube, YouTube Shorts, and TikTok URLs.
- Use the complete interface in English or Polish.
- Launch MicDeck at sign-in and keep it available from the Windows system tray.
- Monitor live levels, estimated latency, engine state, and underruns.
- Run a native C++20/WASAPI audio path with adaptive `IAudioClient3` buffering.

## Downloads

- **`MicDeck-Setup.exe`** — recommended installer for Windows 10/11 x64.
- **`MicDeck-portable.exe`** — portable build; the virtual audio driver may still require setup.
- **`SHA256SUMS.txt`** — checksums for both binaries.

## Before you install

This is an early public preview. The binaries are not code-signed yet, so Windows SmartScreen may display a warning. MicDeck can install the official, unmodified VB-CABLE Driver Pack 45; VB-CABLE remains third-party donationware.

Please report audio-device edge cases through the included bug-report form and attach diagnostics where possible.
