#include "virtual_cable.h"
namespace{constexpr uint32_t kChunkFrames=256;}
MicDeckVirtualCable::MicDeckVirtualCable() noexcept
    :storage_(nullptr),render_streams_(0),capture_streams_(0),
     render_state_(KSSTATE_STOP),capture_state_(KSSTATE_STOP),
     latency_mode_(static_cast<LONG>(MdLatencyMode::Balanced)),
     last_reset_reason_(static_cast<LONG>(MicDeckResetReason::Initialization)){}
MicDeckVirtualCable::~MicDeckVirtualCable(){Shutdown();}
NTSTATUS MicDeckVirtualCable::Initialize() noexcept{
    if(storage_)return STATUS_SUCCESS;
    const SIZE_T bytes=sizeof(float)*MICDECK_RING_FRAMES*MD_INTERNAL_CHANNELS;
    storage_=static_cast<float*>(ExAllocatePool2(POOL_FLAG_NON_PAGED,bytes,MICDECK_POOLTAG));
    if(!storage_)return STATUS_INSUFFICIENT_RESOURCES;
    RtlZeroMemory(storage_,bytes);
    if(!pipeline_.Initialize(storage_,MICDECK_RING_FRAMES,MdLatencyMode::Balanced)){
        ExFreePoolWithTag(storage_,MICDECK_POOLTAG);storage_=nullptr;
        return STATUS_INVALID_PARAMETER;
    }
    Reset(true,MicDeckResetReason::Initialization);return STATUS_SUCCESS;
}
void MicDeckVirtualCable::Shutdown() noexcept{
    if(storage_){pipeline_.Reset(true);ExFreePoolWithTag(storage_,MICDECK_POOLTAG);storage_=nullptr;}
}
void MicDeckVirtualCable::Reset(bool zero,MicDeckResetReason reason) noexcept{
    if(storage_)pipeline_.Reset(zero);
    InterlockedExchange(&last_reset_reason_,static_cast<LONG>(reason));
}
uint32_t MicDeckVirtualCable::Write(const void* data,uint32_t frames,
                                    const MdPcmFormat& format) noexcept{
    if(!data||!frames)return 0;const uint8_t* bytes=static_cast<const uint8_t*>(data);
    uint32_t consumed=0;float scratch[kChunkFrames*2]{};
    while(consumed<frames){const uint32_t chunk=MdMinUlong(frames-consumed,kChunkFrames);
        const uint32_t decoded=MdDecodeToFloatStereo(
            bytes+static_cast<SIZE_T>(consumed)*format.block_align(),chunk,format,
            scratch,kChunkFrames);if(!decoded)break;pipeline_.Write(scratch,decoded);
        consumed+=decoded;}return consumed;
}
uint32_t MicDeckVirtualCable::Read(void* data,uint32_t frames,
                                   const MdPcmFormat& format) noexcept{
    if(!data||!frames)return 0;uint8_t* bytes=static_cast<uint8_t*>(data);
    uint32_t produced=0;float scratch[kChunkFrames*2]{};
    while(produced<frames){const uint32_t chunk=MdMinUlong(frames-produced,kChunkFrames);
        pipeline_.Read(scratch,chunk);
        const uint32_t encoded=MdEncodeFromFloatStereo(
            scratch,chunk,format,bytes+static_cast<SIZE_T>(produced)*format.block_align(),chunk);
        if(!encoded)break;produced+=encoded;}return produced;
}
MICDECK_VAD_STATS_V2 MicDeckVirtualCable::Stats() const noexcept{
    const auto q=pipeline_.Stats();MICDECK_VAD_STATS_V2 s{};
    s.size=sizeof(s);s.version=MICDECK_VAD_STATS_VERSION;
    s.write_frames=q.ring.write_frames;s.read_frames=q.ring.read_frames;
    s.dropped_frames=q.ring.dropped_frames;s.silent_frames=q.ring.silent_frames;
    s.discarded_frames=q.ring.discarded_frames;s.discontinuities=q.discontinuities;
    s.prime_silence_frames=q.prime_silence_frames;s.fade_frames_generated=q.fade_frames_generated;
    s.stale_trim_events=q.stale_trim_events;s.fill_frames=q.ring.fill_frames;
    s.capacity_frames=q.ring.capacity_frames;s.high_watermark_frames=q.ring.high_watermark_frames;
    s.low_watermark_frames=q.ring.low_watermark_frames;s.generation=q.ring.generation;s.epoch=q.epoch;
    s.render_streams=InterlockedCompareExchange(const_cast<volatile LONG*>(&render_streams_),0,0);
    s.capture_streams=InterlockedCompareExchange(const_cast<volatile LONG*>(&capture_streams_),0,0);
    s.render_state=InterlockedCompareExchange(const_cast<volatile LONG*>(&render_state_),0,0);
    s.capture_state=InterlockedCompareExchange(const_cast<volatile LONG*>(&capture_state_),0,0);
    s.primed=q.primed;s.producer_active=q.producer_active;s.consumer_active=q.consumer_active;
    s.latency_mode=static_cast<uint32_t>(LatencyMode());
    s.last_reset_reason=InterlockedCompareExchange(
        const_cast<volatile LONG*>(&last_reset_reason_),0,0);return s;
}
void MicDeckVirtualCable::SetLatencyMode(MdLatencyMode mode) noexcept{
    if(mode!=MdLatencyMode::UltraLow&&mode!=MdLatencyMode::Balanced&&
       mode!=MdLatencyMode::Resilient)mode=MdLatencyMode::Balanced;
    InterlockedExchange(&latency_mode_,static_cast<LONG>(mode));pipeline_.SetMode(mode);
}
MdLatencyMode MicDeckVirtualCable::LatencyMode() const noexcept{
    return static_cast<MdLatencyMode>(InterlockedCompareExchange(
        const_cast<volatile LONG*>(&latency_mode_),0,0));
}
void MicDeckVirtualCable::SetRenderState(KSSTATE state) noexcept{
    InterlockedExchange(&render_state_,state);
    pipeline_.SetProducerActive(state==KSSTATE_RUN);
    if(state==KSSTATE_STOP)
        InterlockedExchange(&last_reset_reason_,
            static_cast<LONG>(MicDeckResetReason::RenderStopped));
}
void MicDeckVirtualCable::SetCaptureState(KSSTATE state) noexcept{
    InterlockedExchange(&capture_state_,state);pipeline_.SetConsumerActive(state==KSSTATE_RUN);
}
void MicDeckVirtualCable::AddRenderStream() noexcept{InterlockedIncrement(&render_streams_);}
void MicDeckVirtualCable::RemoveRenderStream() noexcept{
    if(InterlockedDecrement(&render_streams_)<0)InterlockedExchange(&render_streams_,0);}
void MicDeckVirtualCable::AddCaptureStream() noexcept{InterlockedIncrement(&capture_streams_);}
void MicDeckVirtualCable::RemoveCaptureStream() noexcept{
    if(InterlockedDecrement(&capture_streams_)<0)InterlockedExchange(&capture_streams_,0);}
