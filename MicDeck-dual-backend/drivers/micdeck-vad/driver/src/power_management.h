#pragma once
#include "common.h"
class MicDeckPowerManager final:public IAdapterPowerManagement,public CUnknown{
public:
    DECLARE_STD_UNKNOWN();
    explicit MicDeckPowerManager(_In_opt_ PUNKNOWN outer_unknown) noexcept;
    STDMETHODIMP_(NTSTATUS) NonDelegatingQueryInterface(
        _In_ REFIID interface_id,_COM_Outptr_ PVOID* object) override;
    STDMETHODIMP_(NTSTATUS) PowerChangeState(_In_ POWER_STATE new_state) override;
    STDMETHODIMP_(NTSTATUS) QueryPowerChangeState(_In_ POWER_STATE new_state) override;
    STDMETHODIMP_(NTSTATUS) QueryDeviceCapabilities(
        _Inout_updates_bytes_(sizeof(DEVICE_CAPABILITIES))
        PDEVICE_CAPABILITIES capabilities) override;
};
