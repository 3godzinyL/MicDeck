#pragma once
#include "common.h"

enum MICDECK_WAVE_PIN : ULONG {
    MicDeckWavePinSystem = 0,
    MicDeckWavePinBridge = 1,
};

enum MICDECK_TOPOLOGY_PIN : ULONG {
    MicDeckTopologyPinWave = 0,
    MicDeckTopologyPinEndpoint = 1,
};

extern PCFILTER_DESCRIPTOR g_MicDeckRenderWaveFilter;
extern PCFILTER_DESCRIPTOR g_MicDeckCaptureWaveFilter;
extern PCFILTER_DESCRIPTOR g_MicDeckRenderTopologyFilter;
extern PCFILTER_DESCRIPTOR g_MicDeckCaptureTopologyFilter;
