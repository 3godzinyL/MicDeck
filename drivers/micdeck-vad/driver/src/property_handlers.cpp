#include "property_handlers.h"
#include "adapter.h"

namespace{
NTSTATUS basic(PPCPROPERTY_REQUEST r,ULONG flags,ULONG value_size){
    UNREFERENCED_PARAMETER(value_size);
    if(r->ValueSize==0){r->ValueSize=sizeof(ULONG);return STATUS_BUFFER_OVERFLOW;}
    if(r->ValueSize>=sizeof(KSPROPERTY_DESCRIPTION)){
        auto* d=static_cast<PKSPROPERTY_DESCRIPTION>(r->Value);RtlZeroMemory(d,sizeof(*d));
        d->AccessFlags=flags;d->DescriptionSize=sizeof(*d);
        d->PropTypeSet.Set=KSPROPTYPESETID_General;d->PropTypeSet.Id=VT_UI4;
        r->ValueSize=sizeof(*d);return STATUS_SUCCESS;
    }
    if(r->ValueSize>=sizeof(ULONG)){*static_cast<PULONG>(r->Value)=flags;
        r->ValueSize=sizeof(ULONG);return STATUS_SUCCESS;}
    return STATUS_BUFFER_TOO_SMALL;
}
template<class T>NTSTATUS value(PPCPROPERTY_REQUEST r,const T& v){
    if(r->ValueSize==0){r->ValueSize=sizeof(T);return STATUS_BUFFER_OVERFLOW;}
    if(!r->Value||r->ValueSize<sizeof(T)){r->ValueSize=sizeof(T);return STATUS_BUFFER_TOO_SMALL;}
    RtlCopyMemory(r->Value,&v,sizeof(T));r->ValueSize=sizeof(T);return STATUS_SUCCESS;
}
}
NTSTATUS PropertyHandler_MicDeckVad(PPCPROPERTY_REQUEST r){
    PAGED_CODE();if(!r||!r->PropertyItem)return STATUS_INVALID_PARAMETER;
    auto* cable=MicDeckAdapter::Cable();if(!cable)return STATUS_DEVICE_NOT_READY;
    const ULONG id=r->PropertyItem->Id;
    if(r->Verb&KSPROPERTY_TYPE_BASICSUPPORT){
        ULONG flags=KSPROPERTY_TYPE_GET|KSPROPERTY_TYPE_BASICSUPPORT;
        if(id==MicDeckVadPropertyResetStats||id==MicDeckVadPropertyLatencyMode)
            flags|=KSPROPERTY_TYPE_SET;
        ULONG size=sizeof(ULONG);
        if(id==MicDeckVadPropertyStats)size=sizeof(MICDECK_VAD_STATS_V2);
        else if(id==MicDeckVadPropertyVersion)size=sizeof(MICDECK_VAD_VERSION_V1);
        else if(id==MicDeckVadPropertyLatencyMode)size=sizeof(MICDECK_VAD_LATENCY_CONFIG_V1);
        return basic(r,flags,size);
    }
    switch(id){
    case MicDeckVadPropertyStats:
        return (r->Verb&KSPROPERTY_TYPE_GET)?value(r,cable->Stats()):STATUS_INVALID_DEVICE_REQUEST;
    case MicDeckVadPropertyVersion:{
        if(!(r->Verb&KSPROPERTY_TYPE_GET))return STATUS_INVALID_DEVICE_REQUEST;
        MICDECK_VAD_VERSION_V1 v{};v.size=sizeof(v);v.abi=MICDECK_VAD_DRIVER_ABI;
        v.major=0;v.minor=3;v.patch=0;v.build=0;
        RtlStringCchCopyW(v.name,ARRAYSIZE(v.name),L"MicDeck Virtual Audio Driver");
        return value(r,v);}
    case MicDeckVadPropertyLatencyMode:
        if(r->Verb&KSPROPERTY_TYPE_GET){
            MICDECK_VAD_LATENCY_CONFIG_V1 c{sizeof(c),1,
                static_cast<uint32_t>(cable->LatencyMode()),0};return value(r,c);}
        if(r->Verb&KSPROPERTY_TYPE_SET){
            if(!r->Value||r->ValueSize<sizeof(MICDECK_VAD_LATENCY_CONFIG_V1))
                return STATUS_BUFFER_TOO_SMALL;
            const auto* c=static_cast<const MICDECK_VAD_LATENCY_CONFIG_V1*>(r->Value);
            if(c->size<sizeof(*c)||c->version!=1||c->mode>MicDeckVadLatencyResilient)
                return STATUS_INVALID_PARAMETER;
            cable->SetLatencyMode(static_cast<MdLatencyMode>(c->mode));return STATUS_SUCCESS;}
        return STATUS_INVALID_DEVICE_REQUEST;
    case MicDeckVadPropertyResetStats:
        if(!(r->Verb&KSPROPERTY_TYPE_SET))return STATUS_INVALID_DEVICE_REQUEST;
        cable->Reset(MicDeckResetReason::UserRequested);return STATUS_SUCCESS;
    default:return STATUS_NOT_SUPPORTED;
    }
}
PCPROPERTY_ITEM g_MicDeckVadProperties[]={
 {&KSPROPSETID_MicDeckVad,MicDeckVadPropertyStats,
  KSPROPERTY_TYPE_GET|KSPROPERTY_TYPE_BASICSUPPORT,PropertyHandler_MicDeckVad},
 {&KSPROPSETID_MicDeckVad,MicDeckVadPropertyResetStats,
  KSPROPERTY_TYPE_SET|KSPROPERTY_TYPE_BASICSUPPORT,PropertyHandler_MicDeckVad},
 {&KSPROPSETID_MicDeckVad,MicDeckVadPropertyVersion,
  KSPROPERTY_TYPE_GET|KSPROPERTY_TYPE_BASICSUPPORT,PropertyHandler_MicDeckVad},
 {&KSPROPSETID_MicDeckVad,MicDeckVadPropertyLatencyMode,
  KSPROPERTY_TYPE_GET|KSPROPERTY_TYPE_SET|KSPROPERTY_TYPE_BASICSUPPORT,
  PropertyHandler_MicDeckVad},
};
const ULONG g_MicDeckVadPropertyCount=ARRAYSIZE(g_MicDeckVadProperties);
DEFINE_PCAUTOMATION_TABLE_PROP(g_MicDeckVadAutomation,g_MicDeckVadProperties);
