#pragma once

#include "audio_ring_buffer.h"

#include <atomic>
#include <functional>
#include <string>
#include <thread>

class WasapiCapture {
public:
    using FramesCallback = std::function<void(const float*, uint32_t)>;

    WasapiCapture() = default;
    ~WasapiCapture();
    bool start(const std::wstring& endpoint_id, FramesCallback callback, std::wstring& error);
    bool start_loopback(FramesCallback callback, std::wstring& error);
    void stop();
    uint32_t period_frames() const noexcept;

private:
    bool start_internal(
        const std::wstring& endpoint_id,
        FramesCallback callback,
        bool loopback,
        std::wstring& error);
    void run(std::wstring endpoint_id, FramesCallback callback, bool loopback);
    std::thread thread_;
    std::atomic<bool> stopping_{false};
    std::atomic<bool> started_{false};
    std::atomic<uint32_t> period_frames_{0};
    std::wstring startup_error_;
};

class WasapiRender {
public:
    using FillCallback = std::function<void(float*, uint32_t)>;

    WasapiRender() = default;
    ~WasapiRender();
    bool start(const std::wstring& endpoint_id, FillCallback callback, std::wstring& error);
    void stop();
    uint32_t period_frames() const noexcept;

private:
    void run(std::wstring endpoint_id, FillCallback callback);
    std::thread thread_;
    std::atomic<bool> stopping_{false};
    std::atomic<bool> started_{false};
    std::atomic<uint32_t> period_frames_{0};
    std::wstring startup_error_;
};

class AudioEngine {
public:
    AudioEngine();
    bool start(const std::wstring& input_id, const std::wstring& output_id, std::wstring& error);
    void stop();
    const std::wstring& warning() const noexcept;

private:
    void accept_microphone(const float* samples, uint32_t frames);
    void accept_system_audio(const float* samples, uint32_t frames);
    void render_mix(float* destination, uint32_t frames);
    void render_monitor(float* destination, uint32_t frames);

    StereoRingBuffer microphone_{48000u};
    StereoRingBuffer system_audio_{48000u};
    StereoRingBuffer monitor_{48000u};
    WasapiCapture capture_;
    WasapiCapture system_capture_;
    WasapiRender render_;
    WasapiRender monitor_render_;
    std::atomic<float> microphone_peak_{0.0f};
    std::atomic<float> system_peak_{0.0f};
    std::atomic<uint32_t> underruns_{0};
    std::atomic<bool> monitor_active_{false};
    std::atomic<float> estimated_latency_ms_{0.0f};
    std::wstring warning_;
};
