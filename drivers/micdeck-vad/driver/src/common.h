#pragma once

// Must precede <stdunk.h>: without it stdunk.h emits its own inline operator
// new/delete, which collide with the pool-tagged versions in new_delete.cpp.
#define _NEW_DELETE_OPERATORS_

#include <ntddk.h>
#include <portcls.h>
#include <stdunk.h>
#include <ks.h>
#include <ksmedia.h>
#include <ntstrsafe.h>

#include "../include/micdeck_vad_public.h"
#include "../../shared/micdeck_audio_core.h"
#include "../../shared/micdeck_cable_pipeline.h"

void* __cdecl operator new(size_t size, POOL_FLAGS flags, ULONG tag) noexcept;
void __cdecl operator delete(void* memory, size_t size) noexcept;
void __cdecl operator delete[](void* memory) noexcept;
void __cdecl operator delete[](void* memory, size_t size) noexcept;
void __cdecl operator delete(void* memory, POOL_FLAGS flags, ULONG tag) noexcept;

inline void* __cdecl operator new(size_t, void* address) noexcept {
    return address;
}

inline void __cdecl operator delete(void*, void*) noexcept {}

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
