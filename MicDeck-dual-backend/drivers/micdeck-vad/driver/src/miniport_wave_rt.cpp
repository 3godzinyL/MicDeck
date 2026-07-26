#include "miniport_wave_rt.h"
#include "miniport_wave_rt_stream.h"
#include "format.h"

MicDeckMiniportWaveRT::MicDeckMiniportWaveRT(
    PUNKNOWN outer_unknown,
    bool capture,
    MicDeckVirtualCable* cable) noexcept
    : CUnknown(outer_unknown),
      capture_(capture),
      cable_(cable),
      active_stream_(0) {}

NTSTATUS MicDeckMiniportWaveRT::NonDelegatingQueryInterface(
    REFIID interface_id,
    PVOID* object) {
    PAGED_CODE();
    if (object == nullptr) return STATUS_INVALID_PARAMETER;

    if (IsEqualGUIDAligned(interface_id, IID_IUnknown)) {
        *object = PUNKNOWN(PMINIPORTWAVERT(this));
    } else if (IsEqualGUIDAligned(interface_id, IID_IMiniport)) {
        *object = PMINIPORT(this);
    } else if (IsEqualGUIDAligned(interface_id, IID_IMiniportWaveRT)) {
        *object = PMINIPORTWAVERT(this);
    } else if (IsEqualGUIDAligned(
                   interface_id,
                   IID_IMiniportAudioSignalProcessing)) {
        *object = PMINIPORTAudioSignalProcessing(this);
    } else {
        *object = nullptr;
    }

    if (*object != nullptr) {
        PUNKNOWN(*object)->AddRef();
        return STATUS_SUCCESS;
    }
    return STATUS_INVALID_PARAMETER;
}

NTSTATUS MicDeckMiniportWaveRT::Init(
    PUNKNOWN unknown_adapter,
    PRESOURCELIST resource_list,
    PPORTWAVERT port) {
    PAGED_CODE();
    UNREFERENCED_PARAMETER(unknown_adapter);
    UNREFERENCED_PARAMETER(resource_list);
    return port != nullptr && cable_ != nullptr
        ? STATUS_SUCCESS
        : STATUS_INVALID_PARAMETER;
}

NTSTATUS MicDeckMiniportWaveRT::GetDescription(
    PPCFILTER_DESCRIPTOR* descriptor) {
    PAGED_CODE();
    if (descriptor == nullptr) return STATUS_INVALID_PARAMETER;
    *descriptor = capture_
        ? &g_MicDeckCaptureWaveFilter
        : &g_MicDeckRenderWaveFilter;
    return STATUS_SUCCESS;
}

NTSTATUS MicDeckMiniportWaveRT::DataRangeIntersection(
    ULONG pin_id,
    PKSDATARANGE client_range,
    PKSDATARANGE my_range,
    ULONG output_length,
    PVOID result,
    PULONG result_length) {
    PAGED_CODE();
    UNREFERENCED_PARAMETER(pin_id);
    UNREFERENCED_PARAMETER(my_range);

    if (client_range == nullptr || result_length == nullptr) {
        return STATUS_INVALID_PARAMETER;
    }

    const ULONG required =
        sizeof(KSDATAFORMAT_WAVEFORMATEXTENSIBLE);
    *result_length = required;

    if (output_length == 0) return STATUS_BUFFER_OVERFLOW;
    if (output_length < required || result == nullptr) {
        return STATUS_BUFFER_TOO_SMALL;
    }

    const auto* requested =
        reinterpret_cast<const KSDATAFORMAT*>(client_range);
    const KSDATAFORMAT_WAVEFORMATEXTENSIBLE* chosen =
        &g_MicDeckFloatStereo48;

    if (requested->SubFormat == KSDATAFORMAT_SUBTYPE_PCM) {
        const auto* audio =
            reinterpret_cast<const KSDATARANGE_AUDIO*>(
                client_range);
        if (audio->MinimumBitsPerSample <= 16 &&
            audio->MaximumBitsPerSample >= 16) {
            chosen = audio->MaximumChannels == 1
                ? &g_MicDeckPcm16Mono48
                : &g_MicDeckPcm16Stereo48;
        } else if (audio->MinimumBitsPerSample <= 24 &&
                   audio->MaximumBitsPerSample >= 24) {
            chosen = &g_MicDeckPcm24Stereo48;
        } else {
            chosen = &g_MicDeckPcm32Stereo48;
        }
    }

    RtlCopyMemory(result, chosen, required);
    return STATUS_SUCCESS;
}

NTSTATUS MicDeckMiniportWaveRT::NewStream(
    PMINIPORTWAVERTSTREAM* out_stream,
    PPORTWAVERTSTREAM port_stream,
    ULONG pin,
    BOOLEAN capture,
    PKSDATAFORMAT data_format) {
    PAGED_CODE();
    if (out_stream == nullptr ||
        port_stream == nullptr ||
        data_format == nullptr) {
        return STATUS_INVALID_PARAMETER;
    }
    *out_stream = nullptr;

    if ((capture != FALSE) != capture_ ||
        pin != MicDeckWavePinSystem) {
        return STATUS_INVALID_PARAMETER;
    }

    if (!MdKsFormatSupported(data_format)) {
        return STATUS_NOT_SUPPORTED;
    }

    if (InterlockedCompareExchange(
            &active_stream_, 1, 0) != 0) {
        return STATUS_DEVICE_BUSY;
    }

    auto* stream = new (
        POOL_FLAG_NON_PAGED,
        MICDECK_STREAM_POOLTAG)
        MicDeckWaveRTStream(nullptr);
    if (stream == nullptr) {
        InterlockedExchange(&active_stream_, 0);
        return STATUS_INSUFFICIENT_RESOURCES;
    }

    stream->AddRef();
    NTSTATUS status = stream->Init(
        this,
        port_stream,
        data_format,
        capture_);
    if (NT_SUCCESS(status)) {
        *out_stream = PMINIPORTWAVERTSTREAM(stream);
        (*out_stream)->AddRef();
    } else {
        InterlockedExchange(&active_stream_, 0);
    }
    stream->Release();
    return status;
}

NTSTATUS MicDeckMiniportWaveRT::GetDeviceDescription(
    PDEVICE_DESCRIPTION description) {
    PAGED_CODE();
    if (description == nullptr) return STATUS_INVALID_PARAMETER;
    RtlZeroMemory(description, sizeof(*description));
    description->Version = DEVICE_DESCRIPTION_VERSION;
    description->Master = TRUE;
    description->ScatterGather = TRUE;
    description->Dma32BitAddresses = TRUE;
    description->InterfaceType = PCIBus;
    description->MaximumLength = MAXULONG;
    return STATUS_SUCCESS;
}

NTSTATUS MicDeckMiniportWaveRT::GetModes(
    ULONG pin,
    GUID* modes,
    ULONG* mode_count) {
    PAGED_CODE();
    if (mode_count == nullptr ||
        pin != MicDeckWavePinSystem) {
        return STATUS_INVALID_PARAMETER;
    }

    constexpr ULONG kCount = 2;
    if (modes == nullptr) {
        *mode_count = kCount;
        return STATUS_SUCCESS;
    }
    if (*mode_count < kCount) {
        *mode_count = kCount;
        return STATUS_BUFFER_TOO_SMALL;
    }

    modes[0] = AUDIO_SIGNALPROCESSINGMODE_DEFAULT;
    modes[1] = AUDIO_SIGNALPROCESSINGMODE_RAW;
    *mode_count = kCount;
    return STATUS_SUCCESS;
}

void MicDeckMiniportWaveRT::StreamClosed() noexcept {
    InterlockedExchange(&active_stream_, 0);
}
