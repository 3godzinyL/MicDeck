#pragma once
#include "micdeck_audio_core.h"

struct MdCablePolicy {
    MdLatencyMode mode;
    uint32_t prime_frames;
    uint32_t target_frames;
    uint32_t max_queue_frames;
    uint32_t fade_frames;
    static MdCablePolicy ForMode(MdLatencyMode mode) noexcept;
    static MdCablePolicy Clamped(MdLatencyMode mode, uint32_t capacity_frames) noexcept;
};

struct MdCablePipelineStats {
    MdRingStats ring;
    uint64_t discontinuities;
    uint64_t prime_silence_frames;
    uint64_t fade_frames_generated;
    uint64_t stale_trim_events;
    uint32_t primed;
    uint32_t producer_active;
    uint32_t consumer_active;
    uint32_t epoch;
    MdLatencyMode mode;
};

/// Prime / fade / trim logic wrapped around the ring.
///
/// Control-path setters run at PASSIVE_LEVEL while Read() runs in the capture DPC, so
/// everything the control path touches is atomic and everything the fade state machine
/// touches is consumer-private. The two halves meet through epoch_: the control path
/// bumps it, the consumer notices and re-primes on its own thread.
///
/// Trivially constructible on purpose — it is embedded in a static object and kernel
/// drivers never run C++ dynamic initialisers.
class MdCablePipeline {
public:
    bool Initialize(float* storage, uint32_t capacity_frames,
                    MdLatencyMode mode) noexcept;
    void Detach() noexcept;
    void SetMode(MdLatencyMode mode) noexcept;
    void SetProducerActive(bool active) noexcept;
    void SetConsumerActive(bool active) noexcept;
    void RequestFlush() noexcept;
    uint32_t Write(const float* stereo, uint32_t frames) noexcept;
    uint32_t Read(float* stereo, uint32_t frames) noexcept;
    MdCablePipelineStats Stats() const noexcept;

private:
    void SyncConsumerState() noexcept;
    void TrimStaleAudio() noexcept;
    void RenderUnderflowTail(float* stereo, uint32_t start_frame,
                             uint32_t total_frames) noexcept;
    static float Clamp(float value) noexcept;

    MdStereoRing ring_;
    uint32_t capacity_ = 0;

    // Written by the control path, read by the audio threads.
    MD_ATOMIC_U32 requested_mode_{};
    MD_ATOMIC_U32 producer_active_{};
    MD_ATOMIC_U32 consumer_active_{};
    MD_ATOMIC_U32 epoch_{};

    // Consumer-private fade state.
    MdCablePolicy policy_{MdLatencyMode::Balanced, 480u, 720u, 1440u, 96u};
    uint32_t observed_epoch_ = 0;
    bool primed_ = false;
    float last_output_[2] = {0.0f, 0.0f};
    float envelope_ = 0.0f;

    // Consumer-written telemetry.
    uint64_t discontinuities_ = 0;
    uint64_t prime_silence_frames_ = 0;
    uint64_t fade_frames_generated_ = 0;
    uint64_t stale_trim_events_ = 0;
};
