#include "adapter.h"

extern "C" DRIVER_INITIALIZE DriverEntry;

NTSTATUS MicDeckAddDevice(
    _In_ PDRIVER_OBJECT driver_object,
    _In_ PDEVICE_OBJECT physical_device_object);

NTSTATUS MicDeckStartDevice(
    _In_ PDEVICE_OBJECT device_object,
    _In_ PIRP irp,
    _In_ PRESOURCELIST resource_list);

#pragma code_seg("INIT")
extern "C"
NTSTATUS DriverEntry(
    PDRIVER_OBJECT driver_object,
    PUNICODE_STRING registry_path) {
    return PcInitializeAdapterDriver(
        driver_object,
        registry_path,
        MicDeckAddDevice);
}
#pragma code_seg()

#pragma code_seg("PAGE")
NTSTATUS MicDeckAddDevice(
    PDRIVER_OBJECT driver_object,
    PDEVICE_OBJECT physical_device_object) {
    PAGED_CODE();
    return PcAddAdapterDevice(
        driver_object,
        physical_device_object,
        MicDeckStartDevice,
        4,
        0);
}

NTSTATUS MicDeckStartDevice(
    PDEVICE_OBJECT device_object,
    PIRP irp,
    PRESOURCELIST resource_list) {
    PAGED_CODE();

    auto* adapter = static_cast<MicDeckAdapter*>(
        ExAllocatePool2(
            POOL_FLAG_NON_PAGED,
            sizeof(MicDeckAdapter),
            MICDECK_POOLTAG));
    if (adapter == nullptr) {
        return STATUS_INSUFFICIENT_RESOURCES;
    }

    new (adapter) MicDeckAdapter();
    NTSTATUS status = adapter->Initialize(
        device_object,
        irp,
        resource_list);

    // The adapter object contains no per-device state after registration;
    // the shared cable has static lifetime. Release the temporary installer.
    adapter->~MicDeckAdapter();
    ExFreePoolWithTag(adapter, MICDECK_POOLTAG);
    return status;
}
#pragma code_seg()
