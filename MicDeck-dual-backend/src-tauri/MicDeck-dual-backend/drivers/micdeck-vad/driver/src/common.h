#pragma once

#define WIN32_NO_STATUS
#include <ntddk.h>
#undef WIN32_NO_STATUS

#include <portcls.h>
#include <ks.h>
#include <ksmedia.h>
#include <ntstrsafe.h>

#include "../include/micdeck_vad_public.h"
#include "../../shared/micdeck_audio_core.h"
#include "../../shared/micdeck_cable_pipeline.h"

#define MICDECK_POOLTAG 'DciM'
#define MICDECK_STREAM_POOLTAG 'SriM'
#define MICDECK_RING_FRAMES 8192u
#define MICDECK_MAX_NOTIFICATION_EVENTS 16u

#define MD_TRACE_ERROR(fmt, ...) \
    DbgPrintEx(DPFLTR_IHVDRIVER_ID, DPFLTR_ERROR_LEVEL, \
        "MicDeckVad: " fmt "\n", __VA_ARGS__)
#define MD_TRACE_INFO(fmt, ...) \
    DbgPrintEx(DPFLTR_IHVDRIVER_ID, DPFLTR_INFO_LEVEL, \
        "MicDeckVad: " fmt "\n", __VA_ARGS__)

inline ULONG MdMinUlong(ULONG a, ULONG b) noexcept {
    return a < b ? a : b;
}

inline bool MdIsAudioFormatSpecifier(const KSDATAFORMAT* format) noexcept {
    return format != nullptr &&
        IsEqualGUIDAligned(
            format->Specifier,
            KSDATAFORMAT_SPECIFIER_WAVEFORMATEX);
}
