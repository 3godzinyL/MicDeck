#pragma once
#include "common.h"
#include "endpoint_descriptors.h"

class MicDeckMiniportTopology final
    : public IMiniportTopology,
      public CUnknown {
public:
    DECLARE_STD_UNKNOWN();

    MicDeckMiniportTopology(
        _In_ PUNKNOWN outer_unknown,
        _In_ bool capture) noexcept;

    STDMETHODIMP_(NTSTATUS) Init(
        _In_ PUNKNOWN unknown_adapter,
        _In_ PRESOURCELIST resource_list,
        _In_ PPORTTOPOLOGY port) override;

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

private:
    bool capture_;
};
