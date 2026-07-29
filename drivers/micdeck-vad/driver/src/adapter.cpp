#include "adapter.h"
#include "miniport_topology.h"
#include "miniport_wave_rt.h"

// constinit is load-bearing, not decoration: a dynamic initialiser here would never run
// (kernel drivers have no CRT startup), so the cable would come up with garbage state.
// The keyword turns that into a compile error instead of a boot-time mystery.
constinit MicDeckVirtualCable MicDeckAdapter::cable_{};
constinit MicDeckMasterClock MicDeckAdapter::master_clock_{};

MicDeckAdapter::MicDeckAdapter() noexcept = default;
MicDeckAdapter::~MicDeckAdapter() = default;

MicDeckVirtualCable* MicDeckAdapter::Cable() noexcept { return &cable_; }
MicDeckMasterClock* MicDeckAdapter::MasterClock() noexcept { return &master_clock_; }

void MicDeckAdapter::Shutdown() noexcept {
    cable_.Shutdown();
}

NTSTATUS MicDeckAdapter::Initialize(
    PDEVICE_OBJECT device_object,
    PIRP irp,
    PRESOURCELIST resource_list) {
    PAGED_CODE();

    master_clock_.Initialize();
    NTSTATUS status = cable_.Initialize();
    if (!NT_SUCCESS(status)) return status;

    // PcRegisterPhysicalConnection resolves subdevices through ISubdevice, which only
    // the port implements, so the port unknowns have to survive until both connections
    // are registered.
    PUNKNOWN render_topology = nullptr;
    PUNKNOWN render_wave = nullptr;
    PUNKNOWN capture_topology = nullptr;
    PUNKNOWN capture_wave = nullptr;

    status = InstallTopology(
        device_object, irp, resource_list,
        L"MicDeckRenderTopology", false, &render_topology);

    if (NT_SUCCESS(status)) {
        status = InstallWave(
            device_object, irp, resource_list,
            L"MicDeckRenderWave", false, &render_wave);
    }
    if (NT_SUCCESS(status)) {
        status = InstallTopology(
            device_object, irp, resource_list,
            L"MicDeckCaptureTopology", true, &capture_topology);
    }
    if (NT_SUCCESS(status)) {
        status = InstallWave(
            device_object, irp, resource_list,
            L"MicDeckCaptureWave", true, &capture_wave);
    }

    if (NT_SUCCESS(status)) {
        status = PcRegisterPhysicalConnection(
            device_object,
            render_wave,
            MicDeckWavePinBridge,
            render_topology,
            MicDeckTopologyPinWave);
    }
    if (NT_SUCCESS(status)) {
        status = PcRegisterPhysicalConnection(
            device_object,
            capture_topology,
            MicDeckTopologyPinWave,
            capture_wave,
            MicDeckWavePinBridge);
    }

    if (render_topology != nullptr) render_topology->Release();
    if (render_wave != nullptr) render_wave->Release();
    if (capture_topology != nullptr) capture_topology->Release();
    if (capture_wave != nullptr) capture_wave->Release();

    if (!NT_SUCCESS(status)) {
        MD_TRACE_ERROR("adapter initialization failed: 0x%08X", status);
    }
    return status;
}

NTSTATUS MicDeckAdapter::InstallWave(
    PDEVICE_OBJECT device_object,
    PIRP irp,
    PRESOURCELIST resource_list,
    PCWSTR name,
    bool capture,
    PUNKNOWN* port_unknown) {
    PAGED_CODE();

    *port_unknown = nullptr;

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
        // PcRegisterSubdevice only reads Name, and every caller passes a literal.
        status = PcRegisterSubdevice(
            device_object,
            const_cast<PWSTR>(name),
            port);
    }
    if (NT_SUCCESS(status)) {
        status = port->QueryInterface(
            IID_IUnknown,
            reinterpret_cast<PVOID*>(port_unknown));
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
    bool capture,
    PUNKNOWN* port_unknown) {
    PAGED_CODE();

    *port_unknown = nullptr;

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
            const_cast<PWSTR>(name),
            port);
    }
    if (NT_SUCCESS(status)) {
        status = port->QueryInterface(
            IID_IUnknown,
            reinterpret_cast<PVOID*>(port_unknown));
    }

    miniport->Release();
    port->Release();
    return status;
}
