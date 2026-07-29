#pragma once
#include "common.h"

NTSTATUS MdFormatFromKs(
    _In_ const KSDATAFORMAT* data_format,
    _Out_ MdPcmFormat* format) noexcept;

bool MdKsFormatSupported(
    _In_ const KSDATAFORMAT* data_format) noexcept;

extern KSDATAFORMAT_WAVEFORMATEXTENSIBLE g_MicDeckFloatStereo48;
extern KSDATAFORMAT_WAVEFORMATEXTENSIBLE g_MicDeckPcm16Stereo48;
extern KSDATAFORMAT_WAVEFORMATEXTENSIBLE g_MicDeckPcm24Stereo48;
extern KSDATAFORMAT_WAVEFORMATEXTENSIBLE g_MicDeckPcm32Stereo48;
extern KSDATAFORMAT_WAVEFORMATEXTENSIBLE g_MicDeckPcm16Mono48;

extern const PKSDATAFORMAT g_MicDeckSupportedFormats[];
extern const ULONG g_MicDeckSupportedFormatCount;
