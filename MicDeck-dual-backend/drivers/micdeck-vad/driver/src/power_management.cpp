#include "power_management.h"
#include "adapter.h"
MicDeckPowerManager::MicDeckPowerManager(PUNKNOWN outer) noexcept:CUnknown(outer){}
NTSTATUS MicDeckPowerManager::NonDelegatingQueryInterface(REFIID iid,PVOID* object){
    PAGED_CODE();if(!object)return STATUS_INVALID_PARAMETER;
    if(IsEqualGUIDAligned(iid,IID_IUnknown))*object=PUNKNOWN(PADAPTERPOWERMANAGEMENT(this));
    else if(IsEqualGUIDAligned(iid,IID_IAdapterPowerManagement))
        *object=PADAPTERPOWERMANAGEMENT(this);else *object=nullptr;
    if(*object){PUNKNOWN(*object)->AddRef();return STATUS_SUCCESS;}
    return STATUS_INVALID_PARAMETER;
}
NTSTATUS MicDeckPowerManager::PowerChangeState(POWER_STATE s){
    PAGED_CODE();
    if(s.Type==DevicePowerState){
        MicDeckAdapter::Cable()->Reset(true,MicDeckResetReason::DriverPowerTransition);
        if(s.State.DeviceState==PowerDeviceD0)MicDeckAdapter::MasterClock()->Reset();
    }
    return STATUS_SUCCESS;
}
NTSTATUS MicDeckPowerManager::QueryPowerChangeState(POWER_STATE s){
    PAGED_CODE();UNREFERENCED_PARAMETER(s);return STATUS_SUCCESS;}
NTSTATUS MicDeckPowerManager::QueryDeviceCapabilities(PDEVICE_CAPABILITIES c){
    PAGED_CODE();if(!c)return STATUS_INVALID_PARAMETER;
    c->DeviceD1=FALSE;c->DeviceD2=FALSE;c->WakeFromD0=FALSE;c->WakeFromD1=FALSE;
    c->WakeFromD2=FALSE;c->WakeFromD3=FALSE;return STATUS_SUCCESS;}
