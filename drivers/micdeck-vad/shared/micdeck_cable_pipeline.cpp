#include "micdeck_cable_pipeline.h"
#include <string.h>

// prime_frames must exceed one notification period (10 ms / 480 frames at 48 kHz) or the
// consumer starts with zero jitter margin and underruns on the very first late DPC.
MdCablePolicy MdCablePolicy::ForMode(MdLatencyMode mode) noexcept {
    switch (mode) {
    case MdLatencyMode::UltraLow:  return {mode, 240u, 360u, 960u, 48u};
    case MdLatencyMode::Resilient: return {mode, 1440u, 1920u, 3840u, 192u};
    case MdLatencyMode::Balanced:
    default: return {MdLatencyMode::Balanced, 720u, 960u, 1920u, 96u};
    }
}

MdCablePolicy MdCablePolicy::Clamped(MdLatencyMode mode, uint32_t capacity) noexcept {
    MdCablePolicy policy = ForMode(mode);
    if (capacity == 0) return policy;
    if (policy.max_queue_frames >= capacity) {
        policy.max_queue_frames = capacity > 1u ? capacity - 1u : 1u;
    }
    if (policy.target_frames >= policy.max_queue_frames) {
        policy.target_frames = policy.max_queue_frames / 2u;
    }
    if (policy.prime_frames > policy.target_frames) {
        policy.prime_frames = policy.target_frames;
    }
    if (policy.fade_frames == 0) policy.fade_frames = 1u;
    return policy;
}

bool MdCablePipeline::Initialize(float* storage, uint32_t capacity,
                                 MdLatencyMode mode) noexcept {
    if (!ring_.Initialize(storage, capacity)) return false;
    capacity_ = capacity;
    policy_ = MdCablePolicy::Clamped(mode, capacity);
    MdAtomicStore32(requested_mode_, static_cast<uint32_t>(policy_.mode));
    MdAtomicStore32(producer_active_, 0);
    MdAtomicStore32(consumer_active_, 0);
    MdAtomicStore32(epoch_, 0);
    observed_epoch_ = 0;
    primed_ = false;
    envelope_ = 0.0f;
    last_output_[0] = last_output_[1] = 0.0f;
    discontinuities_ = 0;
    prime_silence_frames_ = 0;
    fade_frames_generated_ = 0;
    stale_trim_events_ = 0;
    return true;
}

void MdCablePipeline::Detach() noexcept {
    ring_.Detach();
    capacity_ = 0;
}

void MdCablePipeline::SetMode(MdLatencyMode mode) noexcept {
    if (mode != MdLatencyMode::UltraLow &&
        mode != MdLatencyMode::Balanced &&
        mode != MdLatencyMode::Resilient) {
        mode = MdLatencyMode::Balanced;
    }
    MdAtomicStore32(requested_mode_, static_cast<uint32_t>(mode));
    MdAtomicIncrement32(epoch_);
}

void MdCablePipeline::SetProducerActive(bool active) noexcept {
    const uint32_t next = active ? 1u : 0u;
    if (MdAtomicLoad32(producer_active_) == next) return;
    MdAtomicStore32(producer_active_, next);
    if (!active) ring_.RequestFlush();
    MdAtomicIncrement32(epoch_);
}

void MdCablePipeline::SetConsumerActive(bool active) noexcept {
    const uint32_t next = active ? 1u : 0u;
    if (MdAtomicLoad32(consumer_active_) == next) return;
    MdAtomicStore32(consumer_active_, next);
    MdAtomicIncrement32(epoch_);
}

void MdCablePipeline::RequestFlush() noexcept {
    ring_.RequestFlush();
    MdAtomicIncrement32(epoch_);
}

uint32_t MdCablePipeline::Write(const float* s, uint32_t frames) noexcept {
    if (!s || !MdAtomicLoad32(producer_active_)) return 0;
    return ring_.Push(s, frames);
}

void MdCablePipeline::SyncConsumerState() noexcept {
    const uint32_t epoch = MdAtomicLoad32(epoch_);
    if (epoch == observed_epoch_) return;
    observed_epoch_ = epoch;
    policy_ = MdCablePolicy::Clamped(
        static_cast<MdLatencyMode>(MdAtomicLoad32(requested_mode_)), capacity_);
    primed_ = false;
    envelope_ = 0.0f;
    last_output_[0] = last_output_[1] = 0.0f;
}

void MdCablePipeline::TrimStaleAudio() noexcept {
    const uint32_t fill = ring_.AvailableRead();
    if (fill <= policy_.max_queue_frames) return;
    const uint32_t discard = fill > policy_.target_frames
        ? fill - policy_.target_frames : 0;
    if (discard) {
        ring_.DiscardOldest(discard);
        ++stale_trim_events_;
        ++discontinuities_;
        envelope_ = 0.0f;
    }
}

float MdCablePipeline::Clamp(float v) noexcept {
    return v < 0 ? 0 : (v > 1 ? 1 : v);
}

void MdCablePipeline::RenderUnderflowTail(float* s, uint32_t start,
                                          uint32_t total) noexcept {
    if (start >= total) return;
    const uint32_t fade = policy_.fade_frames ? policy_.fade_frames : 1u;
    for (uint32_t i = 0; i < total - start; ++i) {
        const float factor = Clamp(1.0f - static_cast<float>(i + 1u) / fade);
        s[(start + i) * 2] = last_output_[0] * factor;
        s[(start + i) * 2 + 1] = last_output_[1] * factor;
        ++fade_frames_generated_;
    }
    last_output_[0] = last_output_[1] = 0.0f;
    envelope_ = 0.0f;
}

uint32_t MdCablePipeline::Read(float* s, uint32_t frames) noexcept {
    if (!s || !frames) return 0;
    memset(s, 0, sizeof(float) * frames * 2u);
    SyncConsumerState();
    if (!MdAtomicLoad32(consumer_active_)) return 0;

    TrimStaleAudio();
    const uint32_t fill = ring_.AvailableRead();
    if (!primed_) {
        if (!MdAtomicLoad32(producer_active_) || fill < policy_.prime_frames) {
            prime_silence_frames_ += frames;
            return 0;
        }
        primed_ = true;
        envelope_ = 0.0f;
    }

    const uint32_t copied = ring_.Pop(s, frames, false);
    const uint32_t fade = policy_.fade_frames ? policy_.fade_frames : 1u;
    for (uint32_t f = 0; f < copied; ++f) {
        if (envelope_ < 1.0f) envelope_ = Clamp(envelope_ + 1.0f / fade);
        s[f * 2] *= envelope_;
        s[f * 2 + 1] *= envelope_;
    }
    if (copied) {
        last_output_[0] = s[(copied - 1) * 2];
        last_output_[1] = s[(copied - 1) * 2 + 1];
    }
    if (copied < frames) {
        ++discontinuities_;
        primed_ = false;
        RenderUnderflowTail(s, copied, frames);
    }
    return copied;
}

MdCablePipelineStats MdCablePipeline::Stats() const noexcept {
    MdCablePipelineStats s{};
    s.ring = ring_.Stats();
    s.discontinuities = discontinuities_;
    s.prime_silence_frames = prime_silence_frames_;
    s.fade_frames_generated = fade_frames_generated_;
    s.stale_trim_events = stale_trim_events_;
    s.primed = primed_ ? 1u : 0u;
    s.producer_active = MdAtomicLoad32(producer_active_);
    s.consumer_active = MdAtomicLoad32(consumer_active_);
    s.epoch = MdAtomicLoad32(epoch_);
    s.mode = static_cast<MdLatencyMode>(MdAtomicLoad32(requested_mode_));
    return s;
}
