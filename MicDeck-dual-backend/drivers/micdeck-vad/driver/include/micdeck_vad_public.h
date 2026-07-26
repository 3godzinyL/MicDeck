#pragma once
#include <guiddef.h>
#include <stdint.h>
DEFINE_GUID(KSPROPSETID_MicDeckVad,0xaa275e70,0x911f,0x45ab,0x89,0xce,0xe5,0xa7,0xf3,0x71,0x18,0xa4);
enum MICDECK_VAD_PROPERTY:uint32_t{
    MicDeckVadPropertyStats=1,MicDeckVadPropertyResetStats=2,
    MicDeckVadPropertyVersion=3,MicDeckVadPropertyLatencyMode=4,
};
enum MICDECK_VAD_LATENCY_MODE:uint32_t{
    MicDeckVadLatencyUltraLow=0,MicDeckVadLatencyBalanced=1,
    MicDeckVadLatencyResilient=2,
};
static constexpr uint32_t MICDECK_VAD_STATS_VERSION=2;
static constexpr uint32_t MICDECK_VAD_DRIVER_ABI=3;
struct MICDECK_VAD_STATS_V2{
    uint32_t size,version;
    uint64_t write_frames,read_frames,dropped_frames,silent_frames,discarded_frames;
    uint64_t discontinuities,prime_silence_frames,fade_frames_generated,stale_trim_events;
    uint32_t fill_frames,capacity_frames,high_watermark_frames,low_watermark_frames;
    uint32_t generation,epoch,render_streams,capture_streams,render_state,capture_state;
    uint32_t primed,producer_active,consumer_active,latency_mode,last_reset_reason;
    uint32_t reserved[11];
};
struct MICDECK_VAD_VERSION_V1{
    uint32_t size,abi;uint16_t major,minor,patch,build;wchar_t name[64];
};
struct MICDECK_VAD_LATENCY_CONFIG_V1{
    uint32_t size,version,mode,reserved;
};
