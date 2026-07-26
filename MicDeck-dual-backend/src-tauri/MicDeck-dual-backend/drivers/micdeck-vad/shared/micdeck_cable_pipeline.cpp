#include "micdeck_cable_pipeline.h"
#include <string.h>

MdCablePolicy MdCablePolicy::ForMode(MdLatencyMode mode) noexcept {
    switch (mode) {
    case MdLatencyMode::UltraLow: return {mode,144u,240u,720u,48u};
    case MdLatencyMode::Resilient:return {mode,960u,1440u,2880u,192u};
    case MdLatencyMode::Balanced:
    default:return {MdLatencyMode::Balanced,480u,720u,1440u,96u};
    }
}
MdCablePipeline::MdCablePipeline() noexcept
    : policy_(MdCablePolicy::ForMode(MdLatencyMode::Balanced)),
      primed_(false),producer_active_(false),consumer_active_(false),
      last_output_{0,0},envelope_(0),discontinuities_(0),
      prime_silence_frames_(0),fade_frames_generated_(0),
      stale_trim_events_(0),epoch_(0){}
bool MdCablePipeline::Initialize(float* storage,uint32_t capacity,
                                 MdLatencyMode mode) noexcept {
    policy_=MdCablePolicy::ForMode(mode);
    if(policy_.max_queue_frames>=capacity) policy_.max_queue_frames=capacity-1u;
    if(policy_.target_frames>=policy_.max_queue_frames)
        policy_.target_frames=policy_.max_queue_frames/2u;
    if(policy_.prime_frames>policy_.target_frames)
        policy_.prime_frames=policy_.target_frames;
    const bool ok=ring_.Initialize(storage,capacity);
    if(ok) {
        Reset(true);
    }
    return ok;
}
void MdCablePipeline::SetMode(MdLatencyMode mode) noexcept {
    MdCablePolicy p=MdCablePolicy::ForMode(mode);
    const auto s=ring_.Stats();
    if(p.max_queue_frames>=s.capacity_frames)
        p.max_queue_frames=s.capacity_frames>1?s.capacity_frames-1u:1u;
    if(p.target_frames>=p.max_queue_frames) p.target_frames=p.max_queue_frames/2u;
    if(p.prime_frames>p.target_frames) p.prime_frames=p.target_frames;
    policy_=p; primed_=false; envelope_=0; ++epoch_;
}
void MdCablePipeline::SetProducerActive(bool active) noexcept {
    if(producer_active_==active) return;
    producer_active_=active; primed_=false; envelope_=0;
    last_output_[0]=last_output_[1]=0; ++epoch_;
    if(!active){ring_.Reset(false);++discontinuities_;}
}
void MdCablePipeline::SetConsumerActive(bool active) noexcept {
    if(consumer_active_==active) return;
    consumer_active_=active; primed_=false; envelope_=0; ++epoch_;
}
void MdCablePipeline::Reset(bool zero) noexcept {
    ring_.Reset(zero); primed_=false; envelope_=0;
    last_output_[0]=last_output_[1]=0; discontinuities_=0;
    prime_silence_frames_=fade_frames_generated_=stale_trim_events_=0; ++epoch_;
}
uint32_t MdCablePipeline::Write(const float* s,uint32_t frames) noexcept {
    return producer_active_&&s?ring_.Push(s,frames):0;
}
void MdCablePipeline::TrimStaleAudio() noexcept {
    const uint32_t fill=ring_.AvailableRead();
    if(fill<=policy_.max_queue_frames) return;
    const uint32_t discard=fill>policy_.target_frames?fill-policy_.target_frames:0;
    if(discard){ring_.DiscardOldest(discard);++stale_trim_events_;
        ++discontinuities_;envelope_=0;}
}
float MdCablePipeline::Clamp(float v) noexcept {
    return v<0?0:(v>1?1:v);
}
void MdCablePipeline::RenderUnderflowTail(float* s,uint32_t start,
                                          uint32_t total) noexcept {
    if(start>=total) return;
    const uint32_t fade=policy_.fade_frames?policy_.fade_frames:1u;
    for(uint32_t i=0;i<total-start;++i){
        const float factor=Clamp(1.0f-static_cast<float>(i+1u)/fade);
        s[(start+i)*2]=last_output_[0]*factor;
        s[(start+i)*2+1]=last_output_[1]*factor;
        ++fade_frames_generated_;
    }
    last_output_[0]=last_output_[1]=0; envelope_=0;
}
uint32_t MdCablePipeline::Read(float* s,uint32_t frames) noexcept {
    if(!s||!frames) return 0;
    memset(s,0,sizeof(float)*frames*2u);
    if(!consumer_active_) return 0;
    TrimStaleAudio();
    const uint32_t fill=ring_.AvailableRead();
    if(!primed_){
        if(!producer_active_||fill<policy_.prime_frames){
            prime_silence_frames_+=frames;return 0;
        }
        primed_=true;envelope_=0;
    }
    const uint32_t copied=ring_.Pop(s,frames,false);
    const uint32_t fade=policy_.fade_frames?policy_.fade_frames:1u;
    for(uint32_t f=0;f<copied;++f){
        if(envelope_<1.0f) envelope_=Clamp(envelope_+1.0f/fade);
        s[f*2]*=envelope_;s[f*2+1]*=envelope_;
    }
    if(copied){last_output_[0]=s[(copied-1)*2];
        last_output_[1]=s[(copied-1)*2+1];}
    if(copied<frames){++discontinuities_;primed_=false;
        RenderUnderflowTail(s,copied,frames);}
    return copied;
}
MdCablePipelineStats MdCablePipeline::Stats() const noexcept {
    MdCablePipelineStats s{};s.ring=ring_.Stats();
    s.discontinuities=discontinuities_;s.prime_silence_frames=prime_silence_frames_;
    s.fade_frames_generated=fade_frames_generated_;s.stale_trim_events=stale_trim_events_;
    s.primed=primed_;s.producer_active=producer_active_;s.consumer_active=consumer_active_;
    s.epoch=epoch_;s.mode=policy_.mode;return s;
}
