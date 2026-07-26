#pragma once

#include "audio_ring_buffer.h"
#include "soundboard_ipc.h"

#include <array>
#include <atomic>
#include <cstdint>
#include <functional>
#include <memory>
#include <string>
#include <thread>

class WasapiCapture {
public:
    using FramesCallback = std::function<void(const float*, uint32_t)>;

    WasapiCapture() = default;
    ~WasapiCapture();
    bool start(const std::wstring& endpoint_id, FramesCallback callback, std::wstring& error);
    bool start_loopback(FramesCallback callback, std::wstring& error);
    bool start_process_loopback(
        uint32_t process_id,
        FramesCallback callback,
        std::wstring& error);
    void stop();
    uint32_t period_frames() const noexcept;
    bool active() const noexcept;

private:
    enum class Mode {
        endpoint,
        system_loopback,
        process_loopback
    };
    bool start_internal(
        const std::wstring& endpoint_id,
        FramesCallback callback,
        Mode mode,
        uint32_t process_id,
        std::wstring& error);
    void run(
        std::wstring endpoint_id,
        FramesCallback callback,
        Mode mode,
        uint32_t process_id);
    std::thread thread_;
    std::atomic<bool> stopping_{false};
    std::atomic<bool> started_{false};
    std::atomic<bool> active_{false};
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
    bool active() const noexcept;

private:
    void run(std::wstring endpoint_id, FillCallback callback);
    std::thread thread_;
    std::atomic<bool> stopping_{false};
    std::atomic<bool> started_{false};
    std::atomic<bool> active_{false};
    std::atomic<uint32_t> period_frames_{0};
    std::wstring startup_error_;
};

struct ProcessStreamSource {
    ProcessStreamSource();
    uint64_t session_key = 0;
    uint32_t process_id = 0;
    uint64_t retry_after_tick = 0;
    std::atomic<float> gain{1.0f};
    std::atomic<bool> active{false};
    std::atomic<uint32_t> readers{0};
    StereoRingBuffer audio;
    WasapiCapture capture;
};

class AudioEngine {
public:
    AudioEngine();
    ~AudioEngine();
    bool start(const std::wstring& input_id, const std::wstring& output_id, std::wstring& error);
    void stop();
    bool healthy() const noexcept;
    const std::wstring& warning() const noexcept;

private:
    void accept_microphone(const float* samples, uint32_t frames);
    void accept_system_audio(const float* samples, uint32_t frames);
    void manage_stream_sources();
    void stop_stream_sources();
    void pump_microphone_pipeline();
    void render_mix(float* destination, uint32_t frames);
    void render_monitor(float* destination, uint32_t frames);

    StereoRingBuffer microphone_{48000u};
    StereoRingBuffer processed_microphone_{48000u};
    StereoRingBuffer system_audio_{48000u};
    StereoRingBuffer system_reference_{48000u};
    StereoRingBuffer monitor_{48000u};
    StereoRingBuffer voice_monitor_{48000u};
    WasapiCapture capture_;
    WasapiCapture system_capture_;
    std::array<std::unique_ptr<ProcessStreamSource>, SB_STREAM_SOURCE_CAPACITY>
        stream_sources_;
    std::thread stream_source_manager_;
    std::atomic<bool> stream_source_manager_stopping_{false};
    std::atomic<bool> stream_source_custom_mode_{false};
    std::atomic<uint32_t> expected_stream_sources_{0};
    WasapiRender render_;
    WasapiRender monitor_render_;
    std::atomic<float> microphone_peak_{0.0f};
    std::atomic<float> microphone_output_peak_{0.0f};
    std::atomic<float> system_peak_{0.0f};
    std::atomic<float> system_output_peak_{0.0f};
    std::atomic<float> voice_probability_{0.0f};
    std::atomic<uint32_t> underruns_{0};
    std::atomic<bool> monitor_active_{false};
    std::atomic<float> estimated_latency_ms_{0.0f};
    void* voice_dsp_{nullptr};
    float microphone_leveler_gain_{1.0f};
    float system_leveler_gain_{1.0f};
    float microphone_gate_gain_{1.0f};
    float master_limiter_gain_{1.0f};
    std::wstring warning_;
};
