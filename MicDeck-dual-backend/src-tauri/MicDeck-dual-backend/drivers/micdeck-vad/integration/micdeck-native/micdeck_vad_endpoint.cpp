#include "micdeck_vad_endpoint.h"
#include <Functiondiscoverykeys_devpkey.h>
#include <Propkey.h>
#include <propvarutil.h>
#include <wrl/client.h>
#include <chrono>
#include <thread>
using Microsoft::WRL::ComPtr;
namespace{
std::wstring prop(IPropertyStore* s,REFPROPERTYKEY key){
    PROPVARIANT v;PropVariantInit(&v);std::wstring r;
    if(s&&SUCCEEDED(s->GetValue(key,&v))&&v.vt==VT_LPWSTR&&v.pwszVal)r=v.pwszVal;
    PropVariantClear(&v);return r;
}
bool contains_ci(std::wstring a,std::wstring b){
    CharUpperBuffW(a.data(),static_cast<DWORD>(a.size()));
    CharUpperBuffW(b.data(),static_cast<DWORD>(b.size()));return a.find(b)!=std::wstring::npos;
}
std::optional<std::wstring> find(IMMDeviceEnumerator* e,EDataFlow flow,std::wstring* container){
    ComPtr<IMMDeviceCollection> c;if(FAILED(e->EnumAudioEndpoints(flow,DEVICE_STATE_ACTIVE,&c)))return {};
    UINT count=0;c->GetCount(&count);
    for(UINT i=0;i<count;++i){ComPtr<IMMDevice>d;if(FAILED(c->Item(i,&d)))continue;
        std::wstring cid;if(!IsMicDeckVadEndpoint(d.Get(),flow,&cid))continue;
        LPWSTR id=nullptr;if(FAILED(d->GetId(&id))||!id)continue;
        std::wstring result=id;CoTaskMemFree(id);if(container)*container=cid;return result;}
    return {};
}}
bool IsMicDeckVadEndpoint(IMMDevice* d,EDataFlow expected,std::wstring* container){
    if(!d)return false;ComPtr<IMMEndpoint> endpoint;
    if(FAILED(d->QueryInterface(IID_PPV_ARGS(&endpoint))))return false;
    EDataFlow actual=eAll;if(FAILED(endpoint->GetDataFlow(&actual))||actual!=expected)return false;
    ComPtr<IPropertyStore>s;if(FAILED(d->OpenPropertyStore(STGM_READ,&s)))return false;
    const auto instance=prop(s.Get(),PKEY_Device_InstanceId);
    const auto friendly=prop(s.Get(),PKEY_Device_FriendlyName);
    const auto cid=prop(s.Get(),PKEY_Device_ContainerId);
    const bool match=contains_ci(instance,L"ROOT\\MICDECKVAD")||contains_ci(friendly,L"MICDECK");
    if(match&&container)*container=cid;return match;
}
MicDeckVadProbeResult ProbeMicDeckVadEndpoints(){
    MicDeckVadProbeResult r{};ComPtr<IMMDeviceEnumerator>e;
    HRESULT hr=CoCreateInstance(__uuidof(MMDeviceEnumerator),nullptr,CLSCTX_INPROC_SERVER,
                                IID_PPV_ARGS(&e));
    if(FAILED(hr)){r.error=hr;r.message=L"MMDeviceEnumerator failed.";return r;}
    std::wstring rc,cc;auto render=find(e.Get(),eRender,&rc),capture=find(e.Get(),eCapture,&cc);
    r.render_ready=render.has_value();r.capture_ready=capture.has_value();
    r.driver_present=r.render_ready||r.capture_ready;
    if(render&&capture){r.endpoints=MicDeckVadEndpointPair{*render,*capture,
        !rc.empty()?rc:cc};r.message=L"MicDeck VAD ready.";}
    else{r.error=HRESULT_FROM_WIN32(r.driver_present?ERROR_DEVICE_NOT_AVAILABLE:ERROR_NOT_FOUND);
        r.message=r.driver_present?L"Only one MicDeck endpoint is ready.":L"MicDeck VAD not found.";}
    return r;
}
HRESULT WaitForMicDeckVadEndpoints(DWORD timeout,MicDeckVadEndpointPair* out){
    const auto end=std::chrono::steady_clock::now()+std::chrono::milliseconds(timeout);
    do{auto p=ProbeMicDeckVadEndpoints();if(p.endpoints){if(out)*out=*p.endpoints;return S_OK;}
       std::this_thread::sleep_for(std::chrono::milliseconds(250));}
    while(std::chrono::steady_clock::now()<end);return HRESULT_FROM_WIN32(WAIT_TIMEOUT);
}
