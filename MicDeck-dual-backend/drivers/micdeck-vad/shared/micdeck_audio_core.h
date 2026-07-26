#pragma once
#include <stddef.h>
#include <stdint.h>

#ifdef _KERNEL_MODE
#include <ntddk.h>
typedef volatile LONG64 MD_ATOMIC_U64;
typedef volatile LONG MD_ATOMIC_U32;
#else
#include <atomic>
struct MD_ATOMIC_U64 {
    std::atomic<uint64_t> value;
    MD_ATOMIC_U64() noexcept : value(0) {}
};
struct MD_ATOMIC_U32 {
    std::atomic<uint32_t> value;
    MD_ATOMIC_U32() noexcept : value(0) {}
};
#endif

static constexpr uint32_t MD_INTERNAL_SAMPLE_RATE = 48000;
static constexpr uint32_t MD_INTERNAL_CHANNELS = 2;

enum class MdSampleEncoding : uint32_t {
    Pcm16 = 1, Pcm24 = 2, Pcm32 = 3, Float32 = 4,
};
enum class MdLatencyMode : uint32_t {
    UltraLow = 0, Balanced = 1, Resilient = 2,
};

struct MdPcmFormat {
    uint32_t sample_rate;
    uint16_t channels;
    uint16_t bits_per_sample;
    MdSampleEncoding encoding;
    uint32_t block_align() const noexcept {
        return static_cast<uint32_t>(channels) *
            static_cast<uint32_t>((bits_per_sample + 7u) / 8u);
    }
};

struct MdRingStats {
    uint64_t write_frames;
    uint64_t read_frames;
    uint64_t dropped_frames;
    uint64_t silent_frames;
    uint64_t discarded_frames;
    uint32_t fill_frames;
    uint32_t capacity_frames;
    uint32_t high_watermark_frames;
    uint32_t low_watermark_frames;
    uint32_t generation;
};

class MdStereoRing {
public:
    MdStereoRing() noexcept;
    bool Initialize(float* storage, uint32_t capacity_frames) noexcept;
    void Reset(bool zero_storage) noexcept;
    uint32_t Push(const float* stereo, uint32_t frames) noexcept;
    uint32_t Pop(float* stereo, uint32_t frames, bool fill_silence) noexcept;
    uint32_t DiscardOldest(uint32_t frames) noexcept;
    MdRingStats Stats() const noexcept;
    uint32_t AvailableRead() const noexcept;
    uint32_t AvailableWrite() const noexcept;

private:
    static bool IsPowerOfTwo(uint32_t value) noexcept;
    static uint64_t LoadAcquire(const MD_ATOMIC_U64& value) noexcept;
    static void StoreRelease(MD_ATOMIC_U64& target, uint64_t value) noexcept;
    static uint32_t LoadAcquire32(const MD_ATOMIC_U32& value) noexcept;
    static void StoreRelease32(MD_ATOMIC_U32& target, uint32_t value) noexcept;
    static uint64_t Add64(MD_ATOMIC_U64& target, uint64_t delta) noexcept;
    static uint32_t Max32(MD_ATOMIC_U32& target, uint32_t candidate) noexcept;
    static uint32_t Min32(MD_ATOMIC_U32& target, uint32_t candidate) noexcept;

    float* storage_;
    uint32_t capacity_;
    uint32_t mask_;
    MD_ATOMIC_U64 write_frame_;
    MD_ATOMIC_U64 read_frame_;
    MD_ATOMIC_U64 dropped_frames_;
    MD_ATOMIC_U64 silent_frames_;
    MD_ATOMIC_U64 discarded_frames_;
    MD_ATOMIC_U32 high_watermark_;
    MD_ATOMIC_U32 low_watermark_;
    MD_ATOMIC_U32 generation_;
};

bool MdValidateFormat(const MdPcmFormat& format) noexcept;
uint32_t MdDecodeToFloatStereo(
    const void* source, uint32_t source_frames, const MdPcmFormat& format,
    float* destination_stereo, uint32_t destination_capacity_frames) noexcept;
uint32_t MdEncodeFromFloatStereo(
    const float* source_stereo, uint32_t source_frames, const MdPcmFormat& format,
    void* destination, uint32_t destination_capacity_frames) noexcept;
