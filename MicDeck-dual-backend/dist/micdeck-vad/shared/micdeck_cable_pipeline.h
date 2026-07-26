#pragma once
#include "micdeck_audio_core.h"

struct MdCablePolicy {
    MdLatencyMode mode;
    uint32_t prime_frames;
    uint32_t target_frames;
    uint32_t max_queue_frames;
    uint32_t fade_frames;
    static MdCablePolicy ForMode(MdLatencyMode mode) noexcept;
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

class MdCablePipeline {
public:
    MdCablePipeline() noexcept;
    bool Initialize(float* storage, uint32_t capacity_frames,
                    MdLatencyMode mode) noexcept;
    void SetMode(MdLatencyMode mode) noexcept;
    void SetProducerActive(bool active) noexcept;
    void SetConsumerActive(bool active) noexcept;
    void Reset(bool zero_audio) noexcept;
    uint32_t Write(const float* stereo, uint32_t frames) noexcept;
    uint32_t Read(float* stereo, uint32_t frames) noexcept;
    MdCablePipelineStats Stats() const noexcept;

private:
    void TrimStaleAudio() noexcept;
    void RenderUnderflowTail(float* stereo, uint32_t start_frame,
                             uint32_t total_frames) noexcept;
    static float Clamp(float value) noexcept;

    MdStereoRing ring_;
    MdCablePolicy policy_;
    bool primed_;
    bool producer_active_;
    bool consumer_active_;
    float last_output_[2];
    float envelope_;
    uint64_t discontinuities_;
    uint64_t prime_silence_frames_;
    uint64_t fade_frames_generated_;
    uint64_t stale_trim_events_;
    uint32_t epoch_;
};
