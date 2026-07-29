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
    constexpr MD_ATOMIC_U64() noexcept : value(0) {}
};
struct MD_ATOMIC_U32 {
    std::atomic<uint32_t> value;
    constexpr MD_ATOMIC_U32() noexcept : value(0) {}
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

uint32_t MdAtomicLoad32(const MD_ATOMIC_U32& value) noexcept;
void MdAtomicStore32(MD_ATOMIC_U32& target, uint32_t value) noexcept;
uint32_t MdAtomicIncrement32(MD_ATOMIC_U32& target) noexcept;
uint64_t MdAtomicLoad64(const MD_ATOMIC_U64& value) noexcept;
void MdAtomicStore64(MD_ATOMIC_U64& target, uint64_t value) noexcept;
uint64_t MdAtomicAdd64(MD_ATOMIC_U64& target, uint64_t delta) noexcept;

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

/// Single-producer / single-consumer stereo float ring.
///
/// The two cursors have exactly one writer each: the producer owns write_frame_ and the
/// consumer owns read_frame_. Nothing else may store to them — a control-thread store
/// racing with a DPC that already latched a cursor leaves read_frame_ ahead of
/// write_frame_, and AvailableRead() then reports an empty ring until the producer
/// catches up, which silences the endpoint for as long as the session has been running.
/// Flushes therefore go through RequestFlush() and are applied by the consumer itself.
///
/// The class is trivially constructible on purpose: it lives in a static object, and
/// kernel drivers never run C++ dynamic initialisers.
class MdStereoRing {
public:
    bool Initialize(float* storage, uint32_t capacity_frames) noexcept;
    void Detach() noexcept;
    void RequestFlush() noexcept;
    uint32_t Push(const float* stereo, uint32_t frames) noexcept;
    uint32_t Pop(float* stereo, uint32_t frames, bool fill_silence) noexcept;
    uint32_t DiscardOldest(uint32_t frames) noexcept;
    MdRingStats Stats() const noexcept;
    uint32_t AvailableRead() const noexcept;
    uint32_t AvailableWrite() const noexcept;

private:
    static bool IsPowerOfTwo(uint32_t value) noexcept;
    void ApplyPendingFlush() noexcept;

    float* storage_ = nullptr;
    uint32_t capacity_ = 0;
    uint32_t mask_ = 0;
    MD_ATOMIC_U64 write_frame_{};
    MD_ATOMIC_U64 read_frame_{};
    MD_ATOMIC_U64 dropped_frames_{};
    MD_ATOMIC_U64 silent_frames_{};
    MD_ATOMIC_U64 discarded_frames_{};
    MD_ATOMIC_U32 high_watermark_{};
    MD_ATOMIC_U32 low_watermark_{};
    MD_ATOMIC_U32 generation_{};
    MD_ATOMIC_U32 flush_request_{};
    /// Consumer-private acknowledgement of flush_request_.
    uint32_t flush_acked_ = 0;
};

bool MdValidateFormat(const MdPcmFormat& format) noexcept;
uint32_t MdDecodeToFloatStereo(
    const void* source, uint32_t source_frames, const MdPcmFormat& format,
    float* destination_stereo, uint32_t destination_capacity_frames) noexcept;
uint32_t MdEncodeFromFloatStereo(
    const float* source_stereo, uint32_t source_frames, const MdPcmFormat& format,
    void* destination, uint32_t destination_capacity_frames) noexcept;
