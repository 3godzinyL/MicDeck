#include "format.h"

namespace {

constexpr ULONG kStereoMask =
    SPEAKER_FRONT_LEFT | SPEAKER_FRONT_RIGHT;
constexpr ULONG kMonoMask = SPEAKER_FRONT_CENTER;

// The extern GUIDs from ksguid.lib are not constant expressions, so building the format
// table out of them emits a dynamic initialiser — and kernel drivers never run those,
// which would leave every advertised format zeroed at runtime. The STATIC_* forms are
// plain brace initialisers, so the table lands in .data instead.
constexpr GUID kAudioType = {STATICGUIDOF(KSDATAFORMAT_TYPE_AUDIO)};
constexpr GUID kWaveFormatEx = {STATICGUIDOF(KSDATAFORMAT_SPECIFIER_WAVEFORMATEX)};
constexpr GUID kSubtypePcm = {STATICGUIDOF(KSDATAFORMAT_SUBTYPE_PCM)};
constexpr GUID kSubtypeFloat = {STATICGUIDOF(KSDATAFORMAT_SUBTYPE_IEEE_FLOAT)};

constexpr KSDATAFORMAT_WAVEFORMATEXTENSIBLE MakeFormat(
    WORD channels,
    WORD bits,
    const GUID& subtype,
    ULONG channel_mask) {
    KSDATAFORMAT_WAVEFORMATEXTENSIBLE result{};
    result.DataFormat.FormatSize =
        sizeof(KSDATAFORMAT_WAVEFORMATEXTENSIBLE);
    result.DataFormat.Flags = 0;
    result.DataFormat.SampleSize =
        channels * ((bits + 7u) / 8u);
    result.DataFormat.Reserved = 0;
    result.DataFormat.MajorFormat = kAudioType;
    result.DataFormat.SubFormat = subtype;
    result.DataFormat.Specifier = kWaveFormatEx;

    result.WaveFormatExt.Format.wFormatTag =
        WAVE_FORMAT_EXTENSIBLE;
    result.WaveFormatExt.Format.nChannels = channels;
    result.WaveFormatExt.Format.nSamplesPerSec =
        MD_INTERNAL_SAMPLE_RATE;
    result.WaveFormatExt.Format.wBitsPerSample = bits;
    result.WaveFormatExt.Format.nBlockAlign =
        channels * ((bits + 7u) / 8u);
    result.WaveFormatExt.Format.nAvgBytesPerSec =
        result.WaveFormatExt.Format.nBlockAlign *
        MD_INTERNAL_SAMPLE_RATE;
    result.WaveFormatExt.Format.cbSize =
        sizeof(WAVEFORMATEXTENSIBLE) - sizeof(WAVEFORMATEX);
    result.WaveFormatExt.Samples.wValidBitsPerSample = bits;
    result.WaveFormatExt.dwChannelMask = channel_mask;
    result.WaveFormatExt.SubFormat = subtype;
    return result;
}

} // namespace

KSDATAFORMAT_WAVEFORMATEXTENSIBLE g_MicDeckFloatStereo48 =
    MakeFormat(2, 32, kSubtypeFloat, kStereoMask);
KSDATAFORMAT_WAVEFORMATEXTENSIBLE g_MicDeckPcm16Stereo48 =
    MakeFormat(2, 16, kSubtypePcm, kStereoMask);
KSDATAFORMAT_WAVEFORMATEXTENSIBLE g_MicDeckPcm24Stereo48 =
    MakeFormat(2, 24, kSubtypePcm, kStereoMask);
KSDATAFORMAT_WAVEFORMATEXTENSIBLE g_MicDeckPcm32Stereo48 =
    MakeFormat(2, 32, kSubtypePcm, kStereoMask);
KSDATAFORMAT_WAVEFORMATEXTENSIBLE g_MicDeckPcm16Mono48 =
    MakeFormat(1, 16, kSubtypePcm, kMonoMask);

const PKSDATAFORMAT g_MicDeckSupportedFormats[] = {
    &g_MicDeckFloatStereo48.DataFormat,
    &g_MicDeckPcm16Stereo48.DataFormat,
    &g_MicDeckPcm24Stereo48.DataFormat,
    &g_MicDeckPcm32Stereo48.DataFormat,
    &g_MicDeckPcm16Mono48.DataFormat,
};

const ULONG g_MicDeckSupportedFormatCount =
    ARRAYSIZE(g_MicDeckSupportedFormats);

NTSTATUS MdFormatFromKs(
    const KSDATAFORMAT* data_format,
    MdPcmFormat* format) noexcept {
    if (format == nullptr ||
        data_format == nullptr ||
        !MdIsAudioFormatSpecifier(data_format) ||
        data_format->FormatSize < sizeof(KSDATAFORMAT_WAVEFORMATEX)) {
        return STATUS_INVALID_PARAMETER;
    }

    const auto* ks =
        reinterpret_cast<const KSDATAFORMAT_WAVEFORMATEX*>(
            data_format);
    const WAVEFORMATEX& wf = ks->WaveFormatEx;

    MdPcmFormat parsed{};
    parsed.sample_rate = wf.nSamplesPerSec;
    parsed.channels = wf.nChannels;
    parsed.bits_per_sample = wf.wBitsPerSample;

    GUID subtype = data_format->SubFormat;
    if (wf.wFormatTag == WAVE_FORMAT_EXTENSIBLE &&
        data_format->FormatSize >=
            sizeof(KSDATAFORMAT_WAVEFORMATEXTENSIBLE)) {
        const auto* ext =
            reinterpret_cast<
                const KSDATAFORMAT_WAVEFORMATEXTENSIBLE*>(
                data_format);
        subtype = ext->WaveFormatExt.SubFormat;
        parsed.bits_per_sample =
            ext->WaveFormatExt.Samples.wValidBitsPerSample;
    }

    if (IsEqualGUIDAligned(subtype, KSDATAFORMAT_SUBTYPE_IEEE_FLOAT)) {
        parsed.encoding = MdSampleEncoding::Float32;
    } else if (IsEqualGUIDAligned(subtype, KSDATAFORMAT_SUBTYPE_PCM)) {
        switch (parsed.bits_per_sample) {
        case 16: parsed.encoding = MdSampleEncoding::Pcm16; break;
        case 24: parsed.encoding = MdSampleEncoding::Pcm24; break;
        case 32: parsed.encoding = MdSampleEncoding::Pcm32; break;
        default: return STATUS_NOT_SUPPORTED;
        }
    } else {
        return STATUS_NOT_SUPPORTED;
    }

    if (!MdValidateFormat(parsed) ||
        wf.nBlockAlign != parsed.block_align()) {
        return STATUS_NOT_SUPPORTED;
    }

    *format = parsed;
    return STATUS_SUCCESS;
}

bool MdKsFormatSupported(
    const KSDATAFORMAT* data_format) noexcept {
    MdPcmFormat format{};
    return NT_SUCCESS(MdFormatFromKs(data_format, &format));
}
