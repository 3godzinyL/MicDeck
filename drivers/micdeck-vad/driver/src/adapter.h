#pragma once
#include "common.h"
#include "virtual_cable.h"
#include "master_clock.h"

class MicDeckAdapter {
public:
    MicDeckAdapter() noexcept;
    ~MicDeckAdapter();

    NTSTATUS Initialize(
        _In_ PDEVICE_OBJECT device_object,
        _In_ PIRP irp,
        _In_ PRESOURCELIST resource_list);

    static MicDeckVirtualCable* Cable() noexcept;
    static MicDeckMasterClock* MasterClock() noexcept;

    static void Shutdown() noexcept;

private:
    NTSTATUS InstallWave(
        _In_ PDEVICE_OBJECT device_object,
        _In_ PIRP irp,
        _In_ PRESOURCELIST resource_list,
        _In_ PCWSTR name,
        _In_ bool capture,
        _Outptr_result_maybenull_ PUNKNOWN* port_unknown);

    NTSTATUS InstallTopology(
        _In_ PDEVICE_OBJECT device_object,
        _In_ PIRP irp,
        _In_ PRESOURCELIST resource_list,
        _In_ PCWSTR name,
        _In_ bool capture,
        _Outptr_result_maybenull_ PUNKNOWN* port_unknown);

    static MicDeckVirtualCable cable_;
    static MicDeckMasterClock master_clock_;
};
