#pragma once
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <Mmdeviceapi.h>
#include <optional>
#include <string>
struct MicDeckVadEndpointPair{std::wstring render_id,capture_id,container_id;};
struct MicDeckVadProbeResult{
    bool driver_present=false,render_ready=false,capture_ready=false;
    HRESULT error=S_OK;std::wstring message;
    std::optional<MicDeckVadEndpointPair> endpoints;
};
MicDeckVadProbeResult ProbeMicDeckVadEndpoints();
bool IsMicDeckVadEndpoint(IMMDevice* device,EDataFlow expected,std::wstring* container_id);
HRESULT WaitForMicDeckVadEndpoints(DWORD timeout_ms,MicDeckVadEndpointPair* endpoints);
