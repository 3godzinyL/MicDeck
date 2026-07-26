#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <winioctl.h>
#include <setupapi.h>
#include <ks.h>
#include <ksmedia.h>
#include <iostream>
#include <string>
#include <vector>
#include <initguid.h>
#include "../../driver/include/micdeck_vad_public.h"
#pragma comment(lib,"setupapi.lib")
#pragma comment(lib,"ksuser.lib")
namespace{
std::vector<std::wstring> paths(){
 std::vector<std::wstring>r;HDEVINFO d=SetupDiGetClassDevsW(
  &KSCATEGORY_AUDIO,nullptr,nullptr,DIGCF_PRESENT|DIGCF_DEVICEINTERFACE);
 if(d==INVALID_HANDLE_VALUE)return r;
 for(DWORD i=0;;++i){SP_DEVICE_INTERFACE_DATA x{};x.cbSize=sizeof(x);
  if(!SetupDiEnumDeviceInterfaces(d,nullptr,&KSCATEGORY_AUDIO,i,&x)){
   if(GetLastError()==ERROR_NO_MORE_ITEMS)break;continue;}
  DWORD n=0;SetupDiGetDeviceInterfaceDetailW(d,&x,nullptr,0,&n,nullptr);
  std::vector<BYTE>b(n);auto*detail=reinterpret_cast<SP_DEVICE_INTERFACE_DETAIL_DATA_W*>(b.data());
  detail->cbSize=sizeof(*detail);
  if(SetupDiGetDeviceInterfaceDetailW(d,&x,detail,n,nullptr,nullptr))r.emplace_back(detail->DevicePath);}
 SetupDiDestroyDeviceInfoList(d);return r;
}
template<class T>bool get(HANDLE h,ULONG id,T&v){
 KSPROPERTY p{KSPROPSETID_MicDeckVad,id,KSPROPERTY_TYPE_GET};DWORD n=0;
 return DeviceIoControl(h,IOCTL_KS_PROPERTY,&p,sizeof(p),&v,sizeof(v),&n,nullptr)&&n>=sizeof(T);
}
const wchar_t* mode(uint32_t m){return m==0?L"UltraLow":m==2?L"Resilient":L"Balanced";}
}
int wmain(){
 bool found=false;for(const auto&p:paths()){HANDLE h=CreateFileW(p.c_str(),GENERIC_READ|GENERIC_WRITE,
  FILE_SHARE_READ|FILE_SHARE_WRITE,nullptr,OPEN_EXISTING,0,nullptr);if(h==INVALID_HANDLE_VALUE)continue;
  MICDECK_VAD_VERSION_V1 v{};MICDECK_VAD_STATS_V2 s{};
  if(get(h,MicDeckVadPropertyVersion,v)&&get(h,MicDeckVadPropertyStats,s)){
   found=true;std::wcout<<L"MicDeck VAD "<<v.major<<L"."<<v.minor<<L" ABI "<<v.abi
    <<L"\n mode="<<mode(s.latency_mode)<<L" queue="<<s.fill_frames<<L"/"<<s.capacity_frames
    <<L"\n written/read="<<s.write_frames<<L"/"<<s.read_frames
    <<L"\n dropped/discarded/silent="<<s.dropped_frames<<L"/"<<s.discarded_frames<<L"/"<<s.silent_frames
    <<L"\n discontinuities="<<s.discontinuities<<L" staleTrims="<<s.stale_trim_events<<L"\n";}
  CloseHandle(h);}
 if(!found){std::wcerr<<L"No MicDeck VAD KS filter found.\n";return 2;}return 0;
}
