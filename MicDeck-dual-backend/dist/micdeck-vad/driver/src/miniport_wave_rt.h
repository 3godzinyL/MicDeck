#pragma once
#include "common.h"
#include "endpoint_descriptors.h"
#include "virtual_cable.h"

class MicDeckWaveRTStream;

class MicDeckMiniportWaveRT final
    : public IMiniportWaveRT,
      public IMiniportAudioSignalProcessing,
      public CUnknown {
public:
    DECLARE_STD_UNKNOWN();

    MicDeckMiniportWaveRT(
        _In_ PUNKNOWN outer_unknown,
        _In_ bool capture,
        _In_ MicDeckVirtualCable* cable) noexcept;

    STDMETHODIMP_(NTSTATUS) NonDelegatingQueryInterface(
        _In_ REFIID interface_id,
        _COM_Outptr_ PVOID* object) override;

    STDMETHODIMP_(NTSTATUS) Init(
        _In_ PUNKNOWN unknown_adapter,
        _In_ PRESOURCELIST resource_list,
        _In_ PPORTWAVERT port) override;

    STDMETHODIMP_(NTSTATUS) GetDescription(
        _Out_ PPCFILTER_DESCRIPTOR* descriptor) override;

    STDMETHODIMP_(NTSTATUS) DataRangeIntersection(
        _In_ ULONG pin_id,
        _In_ PKSDATARANGE client_range,
        _In_ PKSDATARANGE my_range,
        _In_ ULONG output_length,
        _Out_writes_bytes_to_opt_(output_length, *result_length)
            PVOID result,
        _Out_ PULONG result_length) override;

    STDMETHODIMP_(NTSTATUS) NewStream(
        _Out_ PMINIPORTWAVERTSTREAM* out_stream,
        _In_ PPORTWAVERTSTREAM port_stream,
        _In_ ULONG pin,
        _In_ BOOLEAN capture,
        _In_ PKSDATAFORMAT data_format) override;

    STDMETHODIMP_(NTSTATUS) GetDeviceDescription(
        _Out_ PDEVICE_DESCRIPTION description) override;

    STDMETHODIMP_(NTSTATUS) GetModes(
        _In_ ULONG pin,
        _Out_writes_opt_(*mode_count) GUID* modes,
        _Inout_ ULONG* mode_count) override;

    bool IsCapture() const noexcept { return capture_; }
    MicDeckVirtualCable* Cable() const noexcept { return cable_; }
    void StreamClosed() noexcept;

private:
    bool capture_;
    MicDeckVirtualCable* cable_;
    volatile LONG active_stream_;
};
