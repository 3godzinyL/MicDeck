#define WIN32_LEAN_AND_MEAN
#define NOMINMAX

#include "audio_engine.h"
#include "soundboard_ipc.h"

#include <Audioclient.h>
#include <Mmdeviceapi.h>
#include <avrt.h>
#include <windows.h>
#include <wrl/client.h>

#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>
#include <cstring>
#include <vector>

using Microsoft::WRL::ComPtr;

namespace {

WAVEFORMATEX fixed_format() {
    WAVEFORMATEX format{};
    format.wFormatTag = WAVE_FORMAT_IEEE_FLOAT;
    format.nChannels = 2;
    format.nSamplesPerSec = 48000;
    format.wBitsPerSample = 32;
    format.nBlockAlign = static_cast<WORD>(format.nChannels * sizeof(float));
    format.nAvgBytesPerSec = format.nSamplesPerSec * format.nBlockAlign;
    return format;
}

std::wstring hresult_text(HRESULT result, const wchar_t* operation) {
    wchar_t system_message[256]{};
    FormatMessageW(
        FORMAT_MESSAGE_FROM_SYSTEM | FORMAT_MESSAGE_IGNORE_INSERTS,
        nullptr,
        static_cast<DWORD>(result),
        0,
        system_message,
        static_cast<DWORD>(std::size(system_message)),
        nullptr);
    wchar_t combined[512]{};
    swprintf_s(combined, L"%s (0x%08X): %s", operation, static_cast<unsigned>(result), system_message);
    return combined;
}

bool open_endpoint(const std::wstring& id, EDataFlow flow, ComPtr<IMMDevice>& device, std::wstring& error) {
    ComPtr<IMMDeviceEnumerator> enumerator;
    HRESULT result = CoCreateInstance(
        __uuidof(MMDeviceEnumerator),
        nullptr,
        CLSCTX_ALL,
        IID_PPV_ARGS(&enumerator));
    if (FAILED(result)) {
        error = hresult_text(result, L"Nie udało się utworzyć enumeratora audio");
        return false;
    }

    result = id.empty()
        ? enumerator->GetDefaultAudioEndpoint(flow, eConsole, &device)
        : enumerator->GetDevice(id.c_str(), &device);
    if (FAILED(result)) {
        error = hresult_text(result, L"Nie udało się otworzyć urządzenia audio");
        return false;
    }
    return true;
}

void set_realtime_thread(const wchar_t* task_name, DWORD& task_index, HANDLE& mmcss) {
    mmcss = AvSetMmThreadCharacteristicsW(task_name, &task_index);
    if (mmcss != nullptr) {
        AvSetMmThreadPriority(mmcss, AVRT_PRIORITY_HIGH);
    }
}

void signal_started(std::atomic<bool>& started) {
    started.store(true, std::memory_order_release);
}

bool wait_for_start(std::atomic<bool>& started, std::thread& thread) {
    for (int attempt = 0; attempt < 400; ++attempt) {
        if (started.load(std::memory_order_acquire)) {
            return true;
        }
        if (!thread.joinable()) {
            return false;
        }
        Sleep(5);
    }
    return started.load(std::memory_order_acquire);
}

HRESULT initialize_low_latency_shared(
    IAudioClient* client,
    DWORD flags,
    WAVEFORMATEX* format,
    UINT32& period_frames) {
    period_frames = 0;

    ComPtr<IAudioClient3> client3;
    HRESULT result = client->QueryInterface(IID_PPV_ARGS(&client3));
    if (SUCCEEDED(result)) {
        UINT32 default_period = 0;
        UINT32 fundamental_period = 0;
        UINT32 minimum_period = 0;
        UINT32 maximum_period = 0;
        result = client3->GetSharedModeEnginePeriod(
            format,
            &default_period,
            &fundamental_period,
            &minimum_period,
            &maximum_period);
        if (SUCCEEDED(result)) {
            // One step above the absolute minimum keeps a small scheduling
            // safety margin while remaining dramatically below the old
            // device-default shared-mode buffer on common Windows hardware.
            UINT32 requested_period = minimum_period;
            if (fundamental_period > 0 &&
                maximum_period >= fundamental_period &&
                requested_period <= maximum_period - fundamental_period) {
                requested_period += fundamental_period;
            }
            result = client3->InitializeSharedAudioStream(
                flags,
                requested_period,
                format,
                nullptr);
            if (SUCCEEDED(result)) {
                period_frames = requested_period;
                return result;
            }
        }
    }

    result = client->Initialize(AUDCLNT_SHAREMODE_SHARED, flags, 0, 0, format, nullptr);
    if (SUCCEEDED(result)) {
        REFERENCE_TIME default_period = 0;
        if (SUCCEEDED(client->GetDevicePeriod(&default_period, nullptr))) {
            period_frames = static_cast<UINT32>(
                (static_cast<uint64_t>(default_period) * 48'000u + 9'999'999u) /
                10'000'000u);
        }
    }
    return result;
}

} // namespace

WasapiCapture::~WasapiCapture() {
    stop();
}

bool WasapiCapture::start(const std::wstring& endpoint_id, FramesCallback callback, std::wstring& error) {
    return start_internal(endpoint_id, std::move(callback), false, error);
}

bool WasapiCapture::start_loopback(FramesCallback callback, std::wstring& error) {
    return start_internal(std::wstring(), std::move(callback), true, error);
}

bool WasapiCapture::start_internal(
    const std::wstring& endpoint_id,
    FramesCallback callback,
    bool loopback,
    std::wstring& error) {
    stop();
    stopping_.store(false);
    started_.store(false);
    period_frames_.store(0);
    startup_error_.clear();
    thread_ = std::thread(
        &WasapiCapture::run,
        this,
        endpoint_id,
        std::move(callback),
        loopback);
    wait_for_start(started_, thread_);
    if (!startup_error_.empty()) {
        error = startup_error_;
        stop();
        return false;
    }
    return started_.load();
}

uint32_t WasapiCapture::period_frames() const noexcept {
    return period_frames_.load(std::memory_order_relaxed);
}

void WasapiCapture::stop() {
    stopping_.store(true);
    if (thread_.joinable()) {
        thread_.join();
    }
    started_.store(false);
}

void WasapiCapture::run(std::wstring endpoint_id, FramesCallback callback, bool loopback) {
    HRESULT result = CoInitializeEx(nullptr, COINIT_MULTITHREADED);
    const bool uninitialize = SUCCEEDED(result);
    HANDLE event = CreateEventW(nullptr, FALSE, FALSE, nullptr);
    HANDLE mmcss = nullptr;
    DWORD task_index = 0;
    ComPtr<IMMDevice> device;
    ComPtr<IAudioClient> client;
    ComPtr<IAudioCaptureClient> capture;
    std::wstring error;

    const EDataFlow flow = loopback ? eRender : eCapture;
    if (event == nullptr || !open_endpoint(endpoint_id, flow, device, error)) {
        startup_error_ = event == nullptr ? L"Nie udało się utworzyć eventu capture" : error;
        signal_started(started_);
        if (event) CloseHandle(event);
        if (uninitialize) CoUninitialize();
        return;
    }

    result = device->Activate(__uuidof(IAudioClient), CLSCTX_ALL, nullptr, &client);
    if (FAILED(result)) {
        startup_error_ = hresult_text(
            result,
            loopback
                ? L"Nie udało się aktywować przechwytywania dźwięku systemowego"
                : L"Nie udało się aktywować mikrofonu");
        signal_started(started_);
        CloseHandle(event);
        if (uninitialize) CoUninitialize();
        return;
    }

    auto format = fixed_format();
    const DWORD flags = AUDCLNT_STREAMFLAGS_EVENTCALLBACK |
        AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM |
        AUDCLNT_STREAMFLAGS_SRC_DEFAULT_QUALITY |
        AUDCLNT_STREAMFLAGS_NOPERSIST |
        (loopback ? AUDCLNT_STREAMFLAGS_LOOPBACK : 0);
    UINT32 period_frames = 0;
    result = initialize_low_latency_shared(client.Get(), flags, &format, period_frames);
    period_frames_.store(period_frames, std::memory_order_relaxed);
    if (SUCCEEDED(result)) result = client->SetEventHandle(event);
    if (SUCCEEDED(result)) result = client->GetService(IID_PPV_ARGS(&capture));
    if (SUCCEEDED(result)) result = client->Start();
    if (FAILED(result)) {
        startup_error_ = hresult_text(
            result,
            loopback
                ? L"Nie udało się uruchomić system audio loopback WASAPI"
                : L"Nie udało się uruchomić mikrofonu WASAPI");
        signal_started(started_);
        CloseHandle(event);
        if (uninitialize) CoUninitialize();
        return;
    }

    set_realtime_thread(L"Audio", task_index, mmcss);
    signal_started(started_);
    std::array<float, 4096> silence{};

    while (!stopping_.load(std::memory_order_acquire)) {
        if (WaitForSingleObject(event, 100) != WAIT_OBJECT_0) {
            continue;
        }

        UINT32 packet_frames = 0;
        while (SUCCEEDED(capture->GetNextPacketSize(&packet_frames)) && packet_frames > 0) {
            BYTE* data = nullptr;
            UINT32 frames = 0;
            DWORD buffer_flags = 0;
            result = capture->GetBuffer(&data, &frames, &buffer_flags, nullptr, nullptr);
            if (FAILED(result)) {
                break;
            }

            if ((buffer_flags & AUDCLNT_BUFFERFLAGS_SILENT) != 0 || data == nullptr) {
                uint32_t remaining = frames;
                while (remaining > 0) {
                    const uint32_t chunk = (std::min)(remaining, 2048u);
                    callback(silence.data(), chunk);
                    remaining -= chunk;
                }
            } else {
                callback(reinterpret_cast<const float*>(data), frames);
            }
            capture->ReleaseBuffer(frames);
        }
    }

    client->Stop();
    if (mmcss != nullptr) AvRevertMmThreadCharacteristics(mmcss);
    CloseHandle(event);
    if (uninitialize) CoUninitialize();
}

WasapiRender::~WasapiRender() {
    stop();
}

bool WasapiRender::start(const std::wstring& endpoint_id, FillCallback callback, std::wstring& error) {
    stop();
    stopping_.store(false);
    started_.store(false);
    period_frames_.store(0);
    startup_error_.clear();
    thread_ = std::thread(&WasapiRender::run, this, endpoint_id, std::move(callback));
    wait_for_start(started_, thread_);
    if (!startup_error_.empty()) {
        error = startup_error_;
        stop();
        return false;
    }
    return started_.load();
}

uint32_t WasapiRender::period_frames() const noexcept {
    return period_frames_.load(std::memory_order_relaxed);
}

void WasapiRender::stop() {
    stopping_.store(true);
    if (thread_.joinable()) {
        thread_.join();
    }
    started_.store(false);
}

void WasapiRender::run(std::wstring endpoint_id, FillCallback callback) {
    HRESULT result = CoInitializeEx(nullptr, COINIT_MULTITHREADED);
    const bool uninitialize = SUCCEEDED(result);
    HANDLE event = CreateEventW(nullptr, FALSE, FALSE, nullptr);
    HANDLE mmcss = nullptr;
    DWORD task_index = 0;
    ComPtr<IMMDevice> device;
    ComPtr<IAudioClient> client;
    ComPtr<IAudioRenderClient> render;
    std::wstring error;

    if (event == nullptr || !open_endpoint(endpoint_id, eRender, device, error)) {
        startup_error_ = event == nullptr ? L"Nie udało się utworzyć eventu render" : error;
        signal_started(started_);
        if (event) CloseHandle(event);
        if (uninitialize) CoUninitialize();
        return;
    }

    result = device->Activate(__uuidof(IAudioClient), CLSCTX_ALL, nullptr, &client);
    if (FAILED(result)) {
        startup_error_ = hresult_text(result, L"Nie udało się aktywować wyjścia audio");
        signal_started(started_);
        CloseHandle(event);
        if (uninitialize) CoUninitialize();
        return;
    }

    auto format = fixed_format();
    const DWORD flags = AUDCLNT_STREAMFLAGS_EVENTCALLBACK |
        AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM |
        AUDCLNT_STREAMFLAGS_SRC_DEFAULT_QUALITY |
        AUDCLNT_STREAMFLAGS_NOPERSIST;
    UINT32 period_frames = 0;
    result = initialize_low_latency_shared(client.Get(), flags, &format, period_frames);
    period_frames_.store(period_frames, std::memory_order_relaxed);
    if (SUCCEEDED(result)) result = client->SetEventHandle(event);
    if (SUCCEEDED(result)) result = client->GetService(IID_PPV_ARGS(&render));

    UINT32 buffer_frames = 0;
    if (SUCCEEDED(result)) result = client->GetBufferSize(&buffer_frames);
    if (SUCCEEDED(result)) {
        BYTE* initial = nullptr;
        result = render->GetBuffer(buffer_frames, &initial);
        if (SUCCEEDED(result)) {
            ZeroMemory(initial, static_cast<size_t>(buffer_frames) * format.nBlockAlign);
            result = render->ReleaseBuffer(buffer_frames, AUDCLNT_BUFFERFLAGS_SILENT);
        }
    }
    if (SUCCEEDED(result)) result = client->Start();
    if (FAILED(result)) {
        startup_error_ = hresult_text(result, L"Nie udało się uruchomić wyjścia WASAPI");
        signal_started(started_);
        CloseHandle(event);
        if (uninitialize) CoUninitialize();
        return;
    }

    set_realtime_thread(L"Pro Audio", task_index, mmcss);
    signal_started(started_);

    while (!stopping_.load(std::memory_order_acquire)) {
        if (WaitForSingleObject(event, 100) != WAIT_OBJECT_0) {
            continue;
        }
        UINT32 padding = 0;
        if (FAILED(client->GetCurrentPadding(&padding)) || padding >= buffer_frames) {
            continue;
        }
        const UINT32 available = buffer_frames - padding;
        BYTE* data = nullptr;
        if (FAILED(render->GetBuffer(available, &data))) {
            continue;
        }
        callback(reinterpret_cast<float*>(data), available);
        render->ReleaseBuffer(available, 0);
    }

    client->Stop();
    if (mmcss != nullptr) AvRevertMmThreadCharacteristics(mmcss);
    CloseHandle(event);
    if (uninitialize) CoUninitialize();
}

AudioEngine::AudioEngine() = default;

bool AudioEngine::start(const std::wstring& input_id, const std::wstring& output_id, std::wstring& error) {
    stop();
    microphone_.clear();
    system_audio_.clear();
    microphone_peak_.store(0.0f);
    system_peak_.store(0.0f);
    underruns_.store(0);
    microphone_.reset_diagnostics();
    system_audio_.reset_diagnostics();
    monitor_.reset_diagnostics();
    estimated_latency_ms_.store(0.0f);
    warning_.clear();

    if (input_id.empty()) {
        error = L"Wybierz prawdziwy mikrofon w MicDeck.";
        return false;
    }
    if (output_id.empty()) {
        error = L"Wirtualne wyjście sterownika nie jest dostępne.";
        return false;
    }

    if (!capture_.start(input_id, [this](const float* samples, uint32_t frames) {
            accept_microphone(samples, frames);
        }, error)) {
        return false;
    }

    // System-audio loopback is best-effort. It stays warm while the engine is
    // running, so the UI toggle is instant and does not interrupt the mic.
    std::wstring system_capture_error;
    if (!system_capture_.start_loopback(
        [this](const float* samples, uint32_t frames) {
            accept_system_audio(samples, frames);
        },
        system_capture_error)) {
        warning_ = system_capture_error.empty()
            ? L"System audio loopback is unavailable."
            : system_capture_error;
    }

    if (!render_.start(output_id, [this](float* destination, uint32_t frames) {
            render_mix(destination, frames);
        }, error)) {
        system_capture_.stop();
        capture_.stop();
        return false;
    }

    const uint32_t capture_period = capture_.period_frames();
    const uint32_t render_period = render_.period_frames();
    const float estimated_latency_ms =
        static_cast<float>(capture_period + render_period) * 1000.0f /
        48'000.0f;
    estimated_latency_ms_.store(estimated_latency_ms, std::memory_order_relaxed);

    // Best-effort local monitor: play the bind on the default output device so
    // the operator hears it too. Failure here (e.g. no default output) must not
    // take down the main cable path.
    monitor_.clear();
    std::wstring monitor_error;
    monitor_active_.store(monitor_render_.start(
        std::wstring(),
        [this](float* destination, uint32_t frames) { render_monitor(destination, frames); },
        monitor_error));

    return true;
}

void AudioEngine::stop() {
    monitor_render_.stop();
    monitor_active_.store(false);
    monitor_.clear();
    render_.stop();
    system_capture_.stop();
    capture_.stop();
    microphone_.clear();
    system_audio_.clear();
    const uint64_t capture_overruns =
        microphone_.dropped_frames() + system_audio_.dropped_frames() +
        monitor_.dropped_frames();
    sb_engine_set_levels(
        0.0f,
        0.0f,
        0.0f,
        underruns_.load(),
        static_cast<uint32_t>((std::min)(capture_overruns, uint64_t{UINT32_MAX})),
        0.0f);
}

const std::wstring& AudioEngine::warning() const noexcept {
    return warning_;
}

void AudioEngine::accept_microphone(const float* samples, uint32_t frames) {
    float peak = 0.0f;
    for (uint32_t i = 0; i < frames * 2u; ++i) {
        peak = std::max(peak, std::abs(samples[i]));
    }
    microphone_peak_.store(peak, std::memory_order_relaxed);
    microphone_.push(samples, frames);
}

void AudioEngine::accept_system_audio(const float* samples, uint32_t frames) {
    float peak = 0.0f;
    for (uint32_t i = 0; i < frames * 2u; ++i) {
        peak = std::max(peak, std::abs(samples[i]));
    }
    system_peak_.store(peak, std::memory_order_relaxed);
    system_audio_.push(samples, frames);
}

void AudioEngine::render_mix(float* destination, uint32_t frames) {
    float microphone_gain = 1.0f;
    float sound_gain = 1.0f;
    float system_gain = 0.85f;
    int system_enabled = 0;
    sb_get_gains(&microphone_gain, &sound_gain);
    sb_get_system_audio(&system_enabled, &system_gain);

    std::array<float, 4096> microphone{};
    std::array<float, 4096> sound{};
    std::array<float, 4096> system{};
    float mixed_peak = 0.0f;
    uint32_t processed = 0;
    while (processed < frames) {
        const uint32_t chunk = (std::min)(frames - processed, 2048u);
        std::fill_n(microphone.data(), static_cast<size_t>(chunk) * 2u, 0.0f);
        std::fill_n(sound.data(), static_cast<size_t>(chunk) * 2u, 0.0f);
        std::fill_n(system.data(), static_cast<size_t>(chunk) * 2u, 0.0f);
        const uint32_t microphone_frames = microphone_.pop(microphone.data(), chunk);
        const uint32_t sound_frames = sb_pop_audio(sound.data(), chunk);
        const uint32_t system_frames = system_audio_.pop(system.data(), chunk);
        if (!system_enabled &&
            monitor_active_.load(std::memory_order_relaxed) &&
            sound_frames > 0) {
            monitor_.push(sound.data(), sound_frames);
        }
        if (microphone_frames < chunk) {
            underruns_.fetch_add(1, std::memory_order_relaxed);
        }

        for (uint32_t frame = 0; frame < chunk; ++frame) {
            for (uint32_t channel = 0; channel < 2u; ++channel) {
                const size_t source_index = static_cast<size_t>(frame) * 2u + channel;
                const size_t destination_index =
                    static_cast<size_t>(processed + frame) * 2u + channel;
                const float mic = frame < microphone_frames
                    ? microphone[source_index] * microphone_gain
                    : 0.0f;
                const float clip = frame < sound_frames
                    ? sound[source_index] * sound_gain
                    : 0.0f;
                const float desktop = system_enabled && frame < system_frames
                    ? system[source_index] * system_gain
                    : 0.0f;
                const float mixed = std::tanh(mic + clip + desktop);
                destination[destination_index] = mixed;
                mixed_peak = (std::max)(mixed_peak, std::abs(mixed));
            }
        }
        processed += chunk;
    }

    sb_engine_set_levels(
        microphone_peak_.load(std::memory_order_relaxed) * microphone_gain,
        system_enabled
            ? system_peak_.load(std::memory_order_relaxed) * system_gain
            : 0.0f,
        mixed_peak,
        underruns_.load(std::memory_order_relaxed),
        static_cast<uint32_t>((std::min)(
            microphone_.dropped_frames() + system_audio_.dropped_frames() +
                monitor_.dropped_frames(),
            uint64_t{UINT32_MAX})),
        estimated_latency_ms_.load(std::memory_order_relaxed));
}

void AudioEngine::render_monitor(float* destination, uint32_t frames) {
    const float monitor_gain = sb_get_monitor_gain();
    std::array<float, 4096> sound{};
    uint32_t processed = 0;
    while (processed < frames) {
        const uint32_t chunk = (std::min)(frames - processed, 2048u);
        std::fill_n(sound.data(), static_cast<size_t>(chunk) * 2u, 0.0f);
        const uint32_t popped = monitor_.pop(sound.data(), chunk);
        for (uint32_t frame = 0; frame < chunk; ++frame) {
            for (uint32_t channel = 0; channel < 2u; ++channel) {
                const size_t source_index = static_cast<size_t>(frame) * 2u + channel;
                const size_t destination_index =
                    static_cast<size_t>(processed + frame) * 2u + channel;
                destination[destination_index] = frame < popped
                    ? std::tanh(sound[source_index] * monitor_gain)
                    : 0.0f;
            }
        }
        processed += chunk;
    }
}
