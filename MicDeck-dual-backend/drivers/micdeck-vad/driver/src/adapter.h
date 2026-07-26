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

private:
    NTSTATUS InstallWave(
        _In_ PDEVICE_OBJECT device_object,
        _In_ PIRP irp,
        _In_ PRESOURCELIST resource_list,
        _In_ PCWSTR name,
        _In_ bool capture);

    NTSTATUS InstallTopology(
        _In_ PDEVICE_OBJECT device_object,
        _In_ PIRP irp,
        _In_ PRESOURCELIST resource_list,
        _In_ PCWSTR name,
        _In_ bool capture);

    static MicDeckVirtualCable cable_;
    static MicDeckMasterClock master_clock_;
};
