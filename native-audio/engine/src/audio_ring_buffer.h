#pragma once

#include <algorithm>
#include <atomic>
#include <cstdint>
#include <vector>

class StereoRingBuffer {
public:
    explicit StereoRingBuffer(uint32_t capacity_frames)
        : capacity_(capacity_frames), samples_(static_cast<size_t>(capacity_frames) * 2u, 0.0f) {}

    uint32_t push(const float* stereo_samples, uint32_t frames) noexcept {
        const uint64_t write = write_frame_.load(std::memory_order_relaxed);
        const uint64_t read = read_frame_.load(std::memory_order_acquire);
        const uint32_t used = static_cast<uint32_t>(std::min<uint64_t>(write - read, capacity_));
        const uint32_t accepted = std::min(frames, capacity_ - used);
        for (uint32_t frame = 0; frame < accepted; ++frame) {
            const uint32_t target = static_cast<uint32_t>((write + frame) % capacity_) * 2u;
            samples_[target] = stereo_samples[frame * 2u];
            samples_[target + 1u] = stereo_samples[frame * 2u + 1u];
        }
        write_frame_.store(write + accepted, std::memory_order_release);
        return accepted;
    }

    uint32_t pop(float* stereo_samples, uint32_t frames) noexcept {
        const uint64_t read = read_frame_.load(std::memory_order_relaxed);
        const uint64_t write = write_frame_.load(std::memory_order_acquire);
        const uint32_t available = static_cast<uint32_t>(std::min<uint64_t>(write - read, capacity_));
        const uint32_t popped = std::min(frames, available);
        for (uint32_t frame = 0; frame < popped; ++frame) {
            const uint32_t source = static_cast<uint32_t>((read + frame) % capacity_) * 2u;
            stereo_samples[frame * 2u] = samples_[source];
            stereo_samples[frame * 2u + 1u] = samples_[source + 1u];
        }
        read_frame_.store(read + popped, std::memory_order_release);
        return popped;
    }

    void clear() noexcept {
        read_frame_.store(write_frame_.load(std::memory_order_acquire), std::memory_order_release);
    }

private:
    uint32_t capacity_;
    std::vector<float> samples_;
    std::atomic<uint64_t> write_frame_{0};
    std::atomic<uint64_t> read_frame_{0};
};

