# Third-party notices

MicDeck source code is licensed under the MIT License. The following bundled
or optionally used components are separate works and keep their own licenses
and distribution terms.

## VB-CABLE Driver Pack 45

- Vendor: VB-Audio / Vincent Burel
- Product: [VB-CABLE](https://vb-audio.com/Cable/)
- Distribution terms: [VB-Audio licensing](https://vb-audio.com/Services/licensing.htm)
- Package: official, unmodified `VBCABLE_Driver_Pack45.zip`
- Package release: October 2024
- SHA-256: `B950E39F01AF1D04EA623C8F6D8EB9B6EA5C477C637295FABF20631C85116BFB`

VB-CABLE is donationware. Its vendor identity remains visible and users should
donate or purchase the appropriate license if they find it useful. Professional
or volume deployment may require paid licensing under the vendor's current
terms.

MicDeck extracts the official signed installer into a temporary directory,
invokes it with the user's consent, and removes the temporary files afterward.
More package details are stored in `src-tauri/resources/vbcable/NOTICE.md`.

## yt-dlp and FFmpeg

MicDeck can call [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) and
[`FFmpeg`](https://ffmpeg.org/) when the user enables URL import. These tools
are installed separately, are not linked into MicDeck, and retain their own
licenses.

## AEC3

- Crate: [`aec3` 0.3.1](https://github.com/RubyBit/aec3-rs)
- License: MIT OR BSD-3-Clause
- Use: persistent 48 kHz acoustic echo cancellation in the microphone path

## nnnoiseless / RNNoise

- Crate: [`nnnoiseless` 0.5.2](https://github.com/jneem/nnnoiseless)
- License: BSD-3-Clause
- Use: persistent 48 kHz speech denoising and voice-probability estimation

These DSP components are statically linked into MicDeck's native audio engine
and retain their respective upstream copyright and license terms.
