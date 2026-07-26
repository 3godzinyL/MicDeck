#include "micdeck_audio_core.h"
#include <string.h>

namespace {
inline float clamp_sample(float v) noexcept {
    if (v < -1.0f) return -1.0f;
    if (v > 1.0f) return 1.0f;
    return v;
}
inline int32_t round_i32(float v) noexcept {
    return v >= 0.0f ? static_cast<int32_t>(v + 0.5f)
                     : static_cast<int32_t>(v - 0.5f);
}
inline float read_pcm16(const uint8_t* p) noexcept {
    const int16_t v = static_cast<int16_t>(
        static_cast<uint16_t>(p[0]) |
        (static_cast<uint16_t>(p[1]) << 8));
    return static_cast<float>(v) / 32768.0f;
}
inline float read_pcm24(const uint8_t* p) noexcept {
    int32_t v = static_cast<int32_t>(p[0]) |
        (static_cast<int32_t>(p[1]) << 8) |
        (static_cast<int32_t>(p[2]) << 16);
    if (v & 0x00800000) v |= static_cast<int32_t>(0xFF000000);
    return static_cast<float>(v) / 8388608.0f;
}
inline float read_pcm32(const uint8_t* p) noexcept {
    int32_t v = 0; memcpy(&v, p, sizeof(v));
    return static_cast<float>(v) / 2147483648.0f;
}
inline float read_float32(const uint8_t* p) noexcept {
    float v = 0.0f; memcpy(&v, p, sizeof(v));
    if (!(v == v)) return 0.0f;
    return clamp_sample(v);
}
inline void write_pcm16(uint8_t* p, float sample) noexcept {
    const int16_t v = static_cast<int16_t>(
        round_i32(clamp_sample(sample) * 32767.0f));
    p[0] = static_cast<uint8_t>(v & 0xFF);
    p[1] = static_cast<uint8_t>((static_cast<uint16_t>(v) >> 8) & 0xFF);
}
inline void write_pcm24(uint8_t* p, float sample) noexcept {
    const int32_t v = round_i32(clamp_sample(sample) * 8388607.0f);
    p[0] = static_cast<uint8_t>(v & 0xFF);
    p[1] = static_cast<uint8_t>((v >> 8) & 0xFF);
    p[2] = static_cast<uint8_t>((v >> 16) & 0xFF);
}
inline void write_pcm32(uint8_t* p, float sample) noexcept {
    const double scaled = static_cast<double>(clamp_sample(sample)) * 2147483647.0;
    const int32_t v = scaled >= 0.0 ? static_cast<int32_t>(scaled + 0.5)
                                    : static_cast<int32_t>(scaled - 0.5);
    memcpy(p, &v, sizeof(v));
}
inline void write_float32(uint8_t* p, float sample) noexcept {
    const float v = clamp_sample(sample); memcpy(p, &v, sizeof(v));
}
}

MdStereoRing::MdStereoRing() noexcept
    : storage_(nullptr), capacity_(0), mask_(0) {
#ifdef _KERNEL_MODE
    write_frame_=read_frame_=dropped_frames_=silent_frames_=discarded_frames_=0;
    high_watermark_=low_watermark_=generation_=0;
#endif
}
bool MdStereoRing::IsPowerOfTwo(uint32_t v) noexcept {
    return v >= 2u && (v & (v - 1u)) == 0u;
}
uint64_t MdStereoRing::LoadAcquire(const MD_ATOMIC_U64& v) noexcept {
#ifdef _KERNEL_MODE
    const uint64_t r = static_cast<uint64_t>(InterlockedCompareExchange64(
        const_cast<volatile LONG64*>(&v), 0, 0));
    KeMemoryBarrier(); return r;
#else
    return v.value.load(std::memory_order_acquire);
#endif
}
void MdStereoRing::StoreRelease(MD_ATOMIC_U64& t, uint64_t v) noexcept {
#ifdef _KERNEL_MODE
    KeMemoryBarrier(); InterlockedExchange64(&t, static_cast<LONG64>(v));
#else
    t.value.store(v, std::memory_order_release);
#endif
}
uint32_t MdStereoRing::LoadAcquire32(const MD_ATOMIC_U32& v) noexcept {
#ifdef _KERNEL_MODE
    const uint32_t r = static_cast<uint32_t>(InterlockedCompareExchange(
        const_cast<volatile LONG*>(&v), 0, 0));
    KeMemoryBarrier(); return r;
#else
    return v.value.load(std::memory_order_acquire);
#endif
}
void MdStereoRing::StoreRelease32(MD_ATOMIC_U32& t, uint32_t v) noexcept {
#ifdef _KERNEL_MODE
    KeMemoryBarrier(); InterlockedExchange(&t, static_cast<LONG>(v));
#else
    t.value.store(v, std::memory_order_release);
#endif
}
uint64_t MdStereoRing::Add64(MD_ATOMIC_U64& t, uint64_t d) noexcept {
#ifdef _KERNEL_MODE
    return static_cast<uint64_t>(InterlockedAdd64(&t, static_cast<LONG64>(d)));
#else
    return t.value.fetch_add(d, std::memory_order_acq_rel) + d;
#endif
}
uint32_t MdStereoRing::Max32(MD_ATOMIC_U32& t, uint32_t c) noexcept {
#ifdef _KERNEL_MODE
    LONG o = InterlockedCompareExchange(&t,0,0);
    while (static_cast<uint32_t>(o) < c) {
        LONG r=InterlockedCompareExchange(&t,static_cast<LONG>(c),o);
        if (r==o) return c; o=r;
    } return static_cast<uint32_t>(o);
#else
    uint32_t o=t.value.load(std::memory_order_relaxed);
    while(o<c && !t.value.compare_exchange_weak(o,c,std::memory_order_release,
                                                 std::memory_order_relaxed)){}
    return o<c?c:o;
#endif
}
uint32_t MdStereoRing::Min32(MD_ATOMIC_U32& t, uint32_t c) noexcept {
#ifdef _KERNEL_MODE
    LONG o = InterlockedCompareExchange(&t,0,0);
    while (static_cast<uint32_t>(o) > c) {
        LONG r=InterlockedCompareExchange(&t,static_cast<LONG>(c),o);
        if (r==o) return c; o=r;
    } return static_cast<uint32_t>(o);
#else
    uint32_t o=t.value.load(std::memory_order_relaxed);
    while(o>c && !t.value.compare_exchange_weak(o,c,std::memory_order_release,
                                                 std::memory_order_relaxed)){}
    return o>c?c:o;
#endif
}
bool MdStereoRing::Initialize(float* storage, uint32_t capacity) noexcept {
    if (!storage || !IsPowerOfTwo(capacity)) return false;
    storage_=storage; capacity_=capacity; mask_=capacity-1u; Reset(true); return true;
}
void MdStereoRing::Reset(bool zero) noexcept {
    if (zero && storage_ && capacity_)
        memset(storage_,0,sizeof(float)*capacity_*MD_INTERNAL_CHANNELS);
    StoreRelease(write_frame_,0); StoreRelease(read_frame_,0);
    StoreRelease(dropped_frames_,0); StoreRelease(silent_frames_,0);
    StoreRelease(discarded_frames_,0); StoreRelease32(high_watermark_,0);
    StoreRelease32(low_watermark_,capacity_);
    StoreRelease32(generation_,LoadAcquire32(generation_)+1u);
}
uint32_t MdStereoRing::AvailableRead() const noexcept {
    const uint64_t w=LoadAcquire(write_frame_), r=LoadAcquire(read_frame_);
    const uint64_t a=w>=r?w-r:0; return static_cast<uint32_t>(a>capacity_?capacity_:a);
}
uint32_t MdStereoRing::AvailableWrite() const noexcept {
    return capacity_-AvailableRead();
}
uint32_t MdStereoRing::Push(const float* s, uint32_t frames) noexcept {
    if(!storage_||!s||!frames) return 0;
    const uint64_t r=LoadAcquire(read_frame_), w=LoadAcquire(write_frame_);
    const uint64_t u64=w>=r?w-r:0;
    const uint32_t used=static_cast<uint32_t>(u64>capacity_?capacity_:u64);
    const uint32_t accepted=frames<(capacity_-used)?frames:(capacity_-used);
    for(uint32_t f=0;f<accepted;++f){
        const uint32_t slot=static_cast<uint32_t>((w+f)&mask_);
        storage_[slot*2]=clamp_sample(s[f*2]);
        storage_[slot*2+1]=clamp_sample(s[f*2+1]);
    }
    StoreRelease(write_frame_,w+accepted);
    Max32(high_watermark_,used+accepted); Min32(low_watermark_,used+accepted);
    if(accepted<frames) Add64(dropped_frames_,frames-accepted);
    return accepted;
}
uint32_t MdStereoRing::Pop(float* d,uint32_t frames,bool fill) noexcept {
    if(!storage_||!d||!frames) return 0;
    const uint64_t w=LoadAcquire(write_frame_), r=LoadAcquire(read_frame_);
    const uint64_t a64=w>=r?w-r:0;
    const uint32_t a=static_cast<uint32_t>(a64>capacity_?capacity_:a64);
    const uint32_t copied=frames<a?frames:a;
    for(uint32_t f=0;f<copied;++f){
        const uint32_t slot=static_cast<uint32_t>((r+f)&mask_);
        d[f*2]=storage_[slot*2]; d[f*2+1]=storage_[slot*2+1];
    }
    StoreRelease(read_frame_,r+copied); Min32(low_watermark_,a-copied);
    if(fill&&copied<frames){
        memset(d+copied*2,0,sizeof(float)*(frames-copied)*2);
        Add64(silent_frames_,frames-copied);
    }
    return copied;
}
uint32_t MdStereoRing::DiscardOldest(uint32_t frames) noexcept {
    if(!storage_||!frames) return 0;
    const uint64_t w=LoadAcquire(write_frame_), r=LoadAcquire(read_frame_);
    const uint64_t a64=w>=r?w-r:0;
    const uint32_t a=static_cast<uint32_t>(a64>capacity_?capacity_:a64);
    const uint32_t discarded=frames<a?frames:a;
    StoreRelease(read_frame_,r+discarded); Add64(discarded_frames_,discarded);
    Min32(low_watermark_,a-discarded); return discarded;
}
MdRingStats MdStereoRing::Stats() const noexcept {
    MdRingStats s{}; s.write_frames=LoadAcquire(write_frame_);
    s.read_frames=LoadAcquire(read_frame_); s.dropped_frames=LoadAcquire(dropped_frames_);
    s.silent_frames=LoadAcquire(silent_frames_); s.discarded_frames=LoadAcquire(discarded_frames_);
    s.capacity_frames=capacity_; s.fill_frames=AvailableRead();
    s.high_watermark_frames=LoadAcquire32(high_watermark_);
    s.low_watermark_frames=LoadAcquire32(low_watermark_);
    s.generation=LoadAcquire32(generation_); return s;
}

bool MdValidateFormat(const MdPcmFormat& f) noexcept {
    if(f.sample_rate!=MD_INTERNAL_SAMPLE_RATE||(f.channels!=1&&f.channels!=2)) return false;
    switch(f.encoding){
    case MdSampleEncoding::Pcm16:return f.bits_per_sample==16;
    case MdSampleEncoding::Pcm24:return f.bits_per_sample==24;
    case MdSampleEncoding::Pcm32:return f.bits_per_sample==32;
    case MdSampleEncoding::Float32:return f.bits_per_sample==32;
    default:return false;
    }
}
uint32_t MdDecodeToFloatStereo(const void* source,uint32_t sf,const MdPcmFormat& f,
                               float* dst,uint32_t cap) noexcept {
    if(!MdValidateFormat(f)||!source||!dst) return 0;
    const uint32_t frames=sf<cap?sf:cap, sample_bytes=(f.bits_per_sample+7u)/8u;
    const uint8_t* bytes=static_cast<const uint8_t*>(source);
    for(uint32_t frame=0;frame<frames;++frame){
        float v[2]={0,0};
        for(uint16_t ch=0;ch<f.channels;++ch){
            const uint8_t* p=bytes+(frame*f.channels+ch)*sample_bytes;
            switch(f.encoding){
            case MdSampleEncoding::Pcm16:v[ch]=read_pcm16(p);break;
            case MdSampleEncoding::Pcm24:v[ch]=read_pcm24(p);break;
            case MdSampleEncoding::Pcm32:v[ch]=read_pcm32(p);break;
            case MdSampleEncoding::Float32:v[ch]=read_float32(p);break;
            default:return frame;
            }
        }
        dst[frame*2]=v[0]; dst[frame*2+1]=f.channels==1?v[0]:v[1];
    } return frames;
}
uint32_t MdEncodeFromFloatStereo(const float* src,uint32_t sf,const MdPcmFormat& f,
                                 void* destination,uint32_t cap) noexcept {
    if(!MdValidateFormat(f)||!src||!destination) return 0;
    const uint32_t frames=sf<cap?sf:cap, sample_bytes=(f.bits_per_sample+7u)/8u;
    uint8_t* bytes=static_cast<uint8_t*>(destination);
    for(uint32_t frame=0;frame<frames;++frame){
        const float l=src[frame*2],r=src[frame*2+1];
        float v[2]={f.channels==1?(l+r)*0.5f:l,r};
        for(uint16_t ch=0;ch<f.channels;++ch){
            uint8_t* p=bytes+(frame*f.channels+ch)*sample_bytes;
            switch(f.encoding){
            case MdSampleEncoding::Pcm16:write_pcm16(p,v[ch]);break;
            case MdSampleEncoding::Pcm24:write_pcm24(p,v[ch]);break;
            case MdSampleEncoding::Pcm32:write_pcm32(p,v[ch]);break;
            case MdSampleEncoding::Float32:write_float32(p,v[ch]);break;
            default:return frame;
            }
        }
    } return frames;
}
