#pragma once
#include "common.h"
class MicDeckPowerManager final:public IAdapterPowerManagement,public CUnknown{
public:
    DECLARE_STD_UNKNOWN();
    explicit MicDeckPowerManager(_In_opt_ PUNKNOWN outer_unknown) noexcept;
    // PowerChangeState returns void in IAdapterPowerManagement; declaring it NTSTATUS
    // does not override the pure virtual and leaves this class abstract.
    STDMETHODIMP_(void) PowerChangeState(_In_ POWER_STATE new_state) override;
    STDMETHODIMP_(NTSTATUS) QueryPowerChangeState(_In_ POWER_STATE new_state) override;
    STDMETHODIMP_(NTSTATUS) QueryDeviceCapabilities(
        _Inout_updates_bytes_(sizeof(DEVICE_CAPABILITIES))
        PDEVICE_CAPABILITIES capabilities) override;
};
