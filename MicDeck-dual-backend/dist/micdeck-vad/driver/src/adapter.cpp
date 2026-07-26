#include "adapter.h"
#include "miniport_topology.h"
#include "miniport_wave_rt.h"

MicDeckVirtualCable MicDeckAdapter::cable_;
MicDeckMasterClock MicDeckAdapter::master_clock_;

MicDeckAdapter::MicDeckAdapter() noexcept = default;
MicDeckAdapter::~MicDeckAdapter() = default;

MicDeckVirtualCable* MicDeckAdapter::Cable() noexcept { return &cable_; }
MicDeckMasterClock* MicDeckAdapter::MasterClock() noexcept { return &master_clock_; }

NTSTATUS MicDeckAdapter::Initialize(
    PDEVICE_OBJECT device_object,
    PIRP irp,
    PRESOURCELIST resource_list) {
    PAGED_CODE();

    master_clock_.Initialize();
    NTSTATUS status = cable_.Initialize();
    if (!NT_SUCCESS(status)) return status;

    status = InstallTopology(
        device_object,
        irp,
        resource_list,
        L"MicDeckRenderTopology",
        false);
    if (!NT_SUCCESS(status)) return status;

    status = InstallWave(
        device_object,
        irp,
        resource_list,
        L"MicDeckRenderWave",
        false);
    if (!NT_SUCCESS(status)) return status;

    status = InstallTopology(
        device_object,
        irp,
        resource_list,
        L"MicDeckCaptureTopology",
        true);
    if (!NT_SUCCESS(status)) return status;

    status = InstallWave(
        device_object,
        irp,
        resource_list,
        L"MicDeckCaptureWave",
        true);
    if (!NT_SUCCESS(status)) return status;

    status = PcRegisterPhysicalConnection(
        device_object,
        L"MicDeckRenderWave",
        MicDeckWavePinBridge,
        L"MicDeckRenderTopology",
        MicDeckTopologyPinWave);
    if (!NT_SUCCESS(status)) return status;

    status = PcRegisterPhysicalConnection(
        device_object,
        L"MicDeckCaptureTopology",
        MicDeckTopologyPinWave,
        L"MicDeckCaptureWave",
        MicDeckWavePinBridge);
    return status;
}

NTSTATUS MicDeckAdapter::InstallWave(
    PDEVICE_OBJECT device_object,
    PIRP irp,
    PRESOURCELIST resource_list,
    PCWSTR name,
    bool capture) {
    PAGED_CODE();

    PPORT port = nullptr;
    NTSTATUS status = PcNewPort(
        &port,
        CLSID_PortWaveRT);
    if (!NT_SUCCESS(status)) return status;

    auto* miniport = new (
        POOL_FLAG_NON_PAGED,
        MICDECK_POOLTAG)
        MicDeckMiniportWaveRT(
            nullptr,
            capture,
            &cable_);
    if (miniport == nullptr) {
        port->Release();
        return STATUS_INSUFFICIENT_RESOURCES;
    }

    miniport->AddRef();
    status = port->Init(
        device_object,
        irp,
        PMINIPORT(miniport),
        nullptr,
        resource_list);
    if (NT_SUCCESS(status)) {
        status = PcRegisterSubdevice(
            device_object,
            name,
            port);
    }

    miniport->Release();
    port->Release();
    return status;
}

NTSTATUS MicDeckAdapter::InstallTopology(
    PDEVICE_OBJECT device_object,
    PIRP irp,
    PRESOURCELIST resource_list,
    PCWSTR name,
    bool capture) {
    PAGED_CODE();

    PPORT port = nullptr;
    NTSTATUS status = PcNewPort(
        &port,
        CLSID_PortTopology);
    if (!NT_SUCCESS(status)) return status;

    auto* miniport = new (
        POOL_FLAG_NON_PAGED,
        MICDECK_POOLTAG)
        MicDeckMiniportTopology(
            nullptr,
            capture);
    if (miniport == nullptr) {
        port->Release();
        return STATUS_INSUFFICIENT_RESOURCES;
    }

    miniport->AddRef();
    status = port->Init(
        device_object,
        irp,
        PMINIPORT(miniport),
        nullptr,
        resource_list);
    if (NT_SUCCESS(status)) {
        status = PcRegisterSubdevice(
            device_object,
            name,
            port);
    }

    miniport->Release();
    port->Release();
    return status;
}
