#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <Audioclient.h>
#include <Mmdeviceapi.h>
#include <wrl/client.h>
#include <algorithm>
#include <chrono>
#include <cmath>
#include <iostream>
#include "../../integration/micdeck-native/micdeck_vad_endpoint.h"
using Microsoft::WRL::ComPtr;
int wmain(int argc,wchar_t** argv){
 HRESULT init=CoInitializeEx(nullptr,COINIT_MULTITHREADED);if(FAILED(init))return 2;
 const unsigned seconds=argc>1?std::max(1,_wtoi(argv[1])):5;
 auto endpoints=ProbeMicDeckVadEndpoints();if(!endpoints.endpoints){
  std::wcerr<<L"MicDeck VAD not ready: "<<endpoints.message<<L"\n";CoUninitialize();return 3;}
 ComPtr<IMMDeviceEnumerator>e;CoCreateInstance(__uuidof(MMDeviceEnumerator),nullptr,
  CLSCTX_INPROC_SERVER,IID_PPV_ARGS(&e));ComPtr<IMMDevice>d;
 if(FAILED(e->GetDevice(endpoints.endpoints->render_id.c_str(),&d))){CoUninitialize();return 4;}
 ComPtr<IAudioClient>client;if(FAILED(d->Activate(__uuidof(IAudioClient),CLSCTX_INPROC_SERVER,
  nullptr,&client))){CoUninitialize();return 5;}WAVEFORMATEX*fmt=nullptr;
 if(FAILED(client->GetMixFormat(&fmt))||!fmt){CoUninitialize();return 6;}
 HANDLE event=CreateEventW(nullptr,FALSE,FALSE,nullptr);
 HRESULT hr=client->Initialize(AUDCLNT_SHAREMODE_SHARED,AUDCLNT_STREAMFLAGS_EVENTCALLBACK|
  AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM|AUDCLNT_STREAMFLAGS_SRC_DEFAULT_QUALITY,0,0,fmt,nullptr);
 if(FAILED(hr)||FAILED(client->SetEventHandle(event))){CloseHandle(event);CoTaskMemFree(fmt);
  CoUninitialize();return 7;}ComPtr<IAudioRenderClient>render;
 if(FAILED(client->GetService(IID_PPV_ARGS(&render))))return 8;UINT32 buffer=0;
 client->GetBufferSize(&buffer);client->Start();double phase=0;
 const double pi=3.14159265358979323846,rate=fmt->nSamplesPerSec;
 const auto end=std::chrono::steady_clock::now()+std::chrono::seconds(seconds);
 while(std::chrono::steady_clock::now()<end){
  if(WaitForSingleObject(event,1000)!=WAIT_OBJECT_0)continue;UINT32 padding=0;
  client->GetCurrentPadding(&padding);const UINT32 available=buffer-padding;if(!available)continue;
  BYTE*data=nullptr;if(FAILED(render->GetBuffer(available,&data)))continue;
  if(fmt->wBitsPerSample==32){float*s=reinterpret_cast<float*>(data);
   for(UINT32 f=0;f<available;++f){const float v=static_cast<float>(sin(phase)*.2);
    phase+=2*pi*1000.0/rate;for(unsigned c=0;c<fmt->nChannels;++c)s[f*fmt->nChannels+c]=v;}
   render->ReleaseBuffer(available,0);}
  else render->ReleaseBuffer(available,AUDCLNT_BUFFERFLAGS_SILENT);}
 client->Stop();CloseHandle(event);CoTaskMemFree(fmt);CoUninitialize();
 std::wcout<<L"Tone sent to MicDeck Driver Input for "<<seconds<<L" s.\n";return 0;
}
