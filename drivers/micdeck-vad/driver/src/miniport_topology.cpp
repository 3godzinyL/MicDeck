#include "miniport_topology.h"

MicDeckMiniportTopology::MicDeckMiniportTopology(
    PUNKNOWN outer_unknown,
    bool capture) noexcept
    : CUnknown(outer_unknown),
      capture_(capture) {}

NTSTATUS MicDeckMiniportTopology::NonDelegatingQueryInterface(
    REFIID interface_id,
    PVOID* object) {
    PAGED_CODE();
    if (object == nullptr) return STATUS_INVALID_PARAMETER;

    if (IsEqualGUIDAligned(interface_id, IID_IUnknown)) {
        *object = PUNKNOWN(PMINIPORTTOPOLOGY(this));
    } else if (IsEqualGUIDAligned(interface_id, IID_IMiniport)) {
        *object = PMINIPORT(this);
    } else if (IsEqualGUIDAligned(interface_id, IID_IMiniportTopology)) {
        *object = PMINIPORTTOPOLOGY(this);
    } else {
        *object = nullptr;
    }

    if (*object != nullptr) {
        PUNKNOWN(*object)->AddRef();
        return STATUS_SUCCESS;
    }
    return STATUS_INVALID_PARAMETER;
}

NTSTATUS MicDeckMiniportTopology::Init(
    PUNKNOWN unknown_adapter,
    PRESOURCELIST resource_list,
    PPORTTOPOLOGY port) {
    PAGED_CODE();
    UNREFERENCED_PARAMETER(unknown_adapter);
    UNREFERENCED_PARAMETER(resource_list);
    return port != nullptr
        ? STATUS_SUCCESS
        : STATUS_INVALID_PARAMETER;
}

NTSTATUS MicDeckMiniportTopology::GetDescription(
    PPCFILTER_DESCRIPTOR* descriptor) {
    PAGED_CODE();
    if (descriptor == nullptr) return STATUS_INVALID_PARAMETER;
    *descriptor = capture_
        ? &g_MicDeckCaptureTopologyFilter
        : &g_MicDeckRenderTopologyFilter;
    return STATUS_SUCCESS;
}

NTSTATUS MicDeckMiniportTopology::DataRangeIntersection(
    ULONG pin_id,
    PKSDATARANGE client_range,
    PKSDATARANGE my_range,
    ULONG output_length,
    PVOID result,
    PULONG result_length) {
    PAGED_CODE();
    UNREFERENCED_PARAMETER(pin_id);
    UNREFERENCED_PARAMETER(client_range);
    UNREFERENCED_PARAMETER(my_range);
    UNREFERENCED_PARAMETER(output_length);
    UNREFERENCED_PARAMETER(result);
    if (result_length != nullptr) *result_length = 0;
    return STATUS_NOT_IMPLEMENTED;
}
