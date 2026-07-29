#define WIN32_LEAN_AND_MEAN
#define NOMINMAX

#include "audio_engine.h"
#include "micdeck_dsp.h"
#include "soundboard_ipc.h"

#include <Audioclient.h>
#include <audioclientactivationparams.h>
#include <Mmdeviceapi.h>
#include <avrt.h>
#include <objidl.h>
#include <propidl.h>
#include <windows.h>
#include <wrl/client.h>

#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>
#include <cstring>
#include <limits>
#include <new>
#include <vector>

using Microsoft::WRL::ComPtr;

namespace {

constexpr uint32_t kProcessingFrames = 480u;
constexpr uint32_t kStreamSourceRingFrames = 48'000u;

class ProcessLoopbackActivator final
    : public IActivateAudioInterfaceCompletionHandler {
public:
    ProcessLoopbackActivator()
        : completed_(CreateEventW(nullptr, TRUE, FALSE, nullptr)) {}

    HRESULT STDMETHODCALLTYPE QueryInterface(
        REFIID interface_id,
        void** object) override {
        if (object == nullptr) {
            return E_POINTER;
        }
        *object = nullptr;
        if (IsEqualIID(interface_id, __uuidof(IUnknown)) ||
            IsEqualIID(
                interface_id,
                __uuidof(IActivateAudioInterfaceCompletionHandler)) ||
            IsEqualIID(interface_id, __uuidof(IAgileObject))) {
            *object = static_cast<IActivateAudioInterfaceCompletionHandler*>(this);
            AddRef();
            return S_OK;
        }
        return E_NOINTERFACE;
    }

    ULONG STDMETHODCALLTYPE AddRef() override {
        return references_.fetch_add(1, std::memory_order_relaxed) + 1;
    }

    ULONG STDMETHODCALLTYPE Release() override {
        const ULONG remaining =
            references_.fetch_sub(1, std::memory_order_acq_rel) - 1;
        if (remaining == 0) {
            delete this;
        }
        return remaining;
    }

    HRESULT STDMETHODCALLTYPE ActivateCompleted(
        IActivateAudioInterfaceAsyncOperation* operation) override {
        HRESULT interface_result = E_UNEXPECTED;
        ComPtr<IUnknown> audio_interface;
        HRESULT result = operation == nullptr
            ? E_POINTER
            : operation->GetActivateResult(&interface_result, &audio_interface);
        if (SUCCEEDED(result)) {
            result = interface_result;
        }
        if (SUCCEEDED(result)) {
            result = audio_interface.As(&client_);
        }
        result_.store(result, std::memory_order_release);
        if (completed_ != nullptr) {
            SetEvent(completed_);
        }
        mark_lifecycle(kCallbackCompleted);
        return S_OK;
    }

    bool wait_for_result(
        DWORD timeout_ms,
        ComPtr<IAudioClient>& client,
        HRESULT& result,
        bool& callback_signaled) {
        callback_signaled =
            completed_ != nullptr &&
            WaitForSingleObject(completed_, timeout_ms) == WAIT_OBJECT_0;
        if (!callback_signaled) {
            result = HRESULT_FROM_WIN32(ERROR_TIMEOUT);
            return false;
        }
        result = result_.load(std::memory_order_acquire);
        if (SUCCEEDED(result)) {
            client = client_;
        }
        return SUCCEEDED(result) && client != nullptr;
    }

    void abandon_owner_reference() {
        mark_lifecycle(kOwnerAbandoned);
    }

private:
    static constexpr uint32_t kOwnerAbandoned = 1u;
    static constexpr uint32_t kCallbackCompleted = 2u;

    void mark_lifecycle(uint32_t flag) {
        const uint32_t previous =
            lifecycle_.fetch_or(flag, std::memory_order_acq_rel);
        if ((previous | flag) ==
            (kOwnerAbandoned | kCallbackCompleted)) {
            // Exactly the second transition releases the owner's reference.
            // The asynchronous operation retains its own COM reference until
            // the completion callback returns.
            Release();
        }
    }

    ~ProcessLoopbackActivator() {
        if (completed_ != nullptr) {
            CloseHandle(completed_);
        }
    }

    std::atomic<ULONG> references_{1};
    std::atomic<HRESULT> result_{E_PENDING};
    std::atomic<uint32_t> lifecycle_{0};
    HANDLE completed_ = nullptr;
    ComPtr<IAudioClient> client_;
};

struct VoiceProcessingConfig {
    bool aec_enabled = false;
    bool rnnoise_enabled = false;
    bool auto_level_enabled = false;
    float target_min_db = -19.0f;
    float target_max_db = -13.0f;
    bool voice_monitor_enabled = false;
    float voice_monitor_gain = 0.25f;
    bool noise_gate_enabled = false;
    float gate_threshold_db = -55.0f;
    float compressor_ratio = 3.0f;
    float limiter_ceiling_db = -1.0f;
};

VoiceProcessingConfig voice_processing_config() {
    VoiceProcessingConfig config;
    int aec_enabled = 0;
    int rnnoise_enabled = 0;
    int auto_level_enabled = 0;
    int voice_monitor_enabled = 0;
    int noise_gate_enabled = 0;
    sb_get_voice_processing(
        &aec_enabled,
        &rnnoise_enabled,
        &auto_level_enabled,
        &config.target_min_db,
        &config.target_max_db,
        &voice_monitor_enabled,
        &config.voice_monitor_gain,
        &noise_gate_enabled,
        &config.gate_threshold_db,
        &config.compressor_ratio,
        &config.limiter_ceiling_db);
    config.aec_enabled = aec_enabled != 0;
    config.rnnoise_enabled = rnnoise_enabled != 0;
    config.auto_level_enabled = auto_level_enabled != 0;
    config.voice_monitor_enabled = voice_monitor_enabled != 0;
    config.noise_gate_enabled = noise_gate_enabled != 0;
    return config;
}

float linear_to_db(float value) {
    return 20.0f * std::log10((std::max)(value, 0.000001f));
}

float db_to_linear(float value) {
    return std::pow(10.0f, value / 20.0f);
}

float mono_peak(const float* samples, uint32_t frames) {
    float peak = 0.0f;
    for (uint32_t frame = 0; frame < frames; ++frame) {
        peak = (std::max)(peak, std::abs(samples[frame]));
    }
    return peak;
}

float mono_rms(const float* samples, uint32_t frames) {
    if (frames == 0) {
        return 0.0f;
    }
    double energy = 0.0;
    for (uint32_t frame = 0; frame < frames; ++frame) {
        energy += static_cast<double>(samples[frame]) * samples[frame];
    }
    return static_cast<float>(std::sqrt(energy / frames));
}

float stereo_rms(const float* samples, uint32_t frames) {
    if (frames == 0) {
        return 0.0f;
    }
    double energy = 0.0;
    for (uint32_t sample = 0; sample < frames * 2u; ++sample) {
        energy += static_cast<double>(samples[sample]) * samples[sample];
    }
    return static_cast<float>(std::sqrt(energy / (frames * 2u)));
}

bool voice_processing_active(const VoiceProcessingConfig& config) {
    return config.aec_enabled ||
        config.rnnoise_enabled ||
        config.auto_level_enabled ||
        config.noise_gate_enabled;
}

// WASAPI exposes every capture endpoint as stereo because that is the engine's
// transport format. Real microphones are not guaranteed to populate those two
// channels in the same way: some duplicate mono, some use only one side, and
// some interfaces expose opposite-polarity channels. Blindly averaging L+R
// made one-sided microphones 6 dB quieter and could cancel differential inputs
// almost completely. Keep the normal average for a correlated stereo pair, but
// select the stronger channel when averaging would lose real voice energy.
void downmix_microphone(
    const float* stereo,
    float* mono,
    uint32_t frames) {
    double left_energy = 0.0;
    double right_energy = 0.0;
    double correlation = 0.0;
    for (uint32_t frame = 0; frame < frames; ++frame) {
        const float left = stereo[frame * 2u];
        const float right = stereo[frame * 2u + 1u];
        left_energy += static_cast<double>(left) * left;
        right_energy += static_cast<double>(right) * right;
        correlation += static_cast<double>(left) * right;
    }

    const double stronger = (std::max)(left_energy, right_energy);
    const double weaker = (std::min)(left_energy, right_energy);
    const double normalized_correlation = stronger > 1.0e-12
        ? correlation / std::sqrt((std::max)(left_energy * right_energy, 1.0e-24))
        : 1.0;
    const bool unsafe_to_average =
        stronger > 1.0e-12 &&
        (weaker < stronger * 0.04 || normalized_correlation < -0.20);
    const uint32_t selected_channel = right_energy > left_energy ? 1u : 0u;

    for (uint32_t frame = 0; frame < frames; ++frame) {
        mono[frame] = unsafe_to_average
            ? stereo[frame * 2u + selected_channel]
            : (stereo[frame * 2u] + stereo[frame * 2u + 1u]) * 0.5f;
    }
}

void apply_mono_voice_dynamics(
    float* samples,
    uint32_t frames,
    const VoiceProcessingConfig& config,
    float& leveler_gain,
    float& gate_gain) {
    const float rms = mono_rms(samples, frames);
    const float input_db = linear_to_db(rms);

    if (config.noise_gate_enabled) {
        const float gate_target = input_db < config.gate_threshold_db ? 0.04f : 1.0f;
        const float coefficient = gate_target < gate_gain ? 0.35f : 0.06f;
        gate_gain += (gate_target - gate_gain) * coefficient;
    } else {
        gate_gain = 1.0f;
    }

    if (config.auto_level_enabled && input_db > config.gate_threshold_db - 6.0f) {
        const float current_db = input_db + linear_to_db(leveler_gain);
        float desired_gain = leveler_gain;
        if (current_db < config.target_min_db) {
            desired_gain *= db_to_linear(config.target_min_db - current_db);
        } else if (current_db > config.target_max_db) {
            desired_gain *= db_to_linear(config.target_max_db - current_db);
        }
        desired_gain = std::clamp(desired_gain, 0.20f, 8.0f);
        const float coefficient = desired_gain < leveler_gain ? 0.45f : 0.025f;
        leveler_gain += (desired_gain - leveler_gain) * coefficient;
    } else if (!config.auto_level_enabled) {
        leveler_gain = 1.0f;
    }

    const float compressor_threshold = db_to_linear(config.target_max_db);
    const float ratio = (std::max)(1.0f, config.compressor_ratio);
    for (uint32_t frame = 0; frame < frames; ++frame) {
        float value = samples[frame] * leveler_gain * gate_gain;
        const float magnitude = std::abs(value);
        if (config.auto_level_enabled && magnitude > compressor_threshold) {
            const float excess_db = linear_to_db(magnitude / compressor_threshold);
            const float compressed_db = excess_db / ratio;
            value = std::copysign(
                compressor_threshold * db_to_linear(compressed_db),
                value);
        }
        samples[frame] = value;
    }
}

void apply_stereo_leveler(
    float* samples,
    uint32_t frames,
    const VoiceProcessingConfig& config,
    float& leveler_gain) {
    const float rms = stereo_rms(samples, frames);
    const float input_db = linear_to_db(rms);
    if (config.auto_level_enabled && input_db > config.gate_threshold_db - 6.0f) {
        const float current_db = input_db + linear_to_db(leveler_gain);
        float desired_gain = leveler_gain;
        if (current_db < config.target_min_db) {
            desired_gain *= db_to_linear(config.target_min_db - current_db);
        } else if (current_db > config.target_max_db) {
            desired_gain *= db_to_linear(config.target_max_db - current_db);
        }
        desired_gain = std::clamp(desired_gain, 0.25f, 4.0f);
        const float coefficient = desired_gain < leveler_gain ? 0.35f : 0.0125f;
        leveler_gain += (desired_gain - leveler_gain) * coefficient;
    } else if (!config.auto_level_enabled) {
        leveler_gain = 1.0f;
    }

    for (uint32_t sample = 0; sample < frames * 2u; ++sample) {
        samples[sample] *= leveler_gain;
    }
}

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
    for (int attempt = 0; attempt < 1000; ++attempt) {
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
    return start_internal(
        endpoint_id,
        std::move(callback),
        Mode::endpoint,
        0,
        error);
}

bool WasapiCapture::start_loopback(FramesCallback callback, std::wstring& error) {
    return start_internal(
        std::wstring(),
        std::move(callback),
        Mode::system_loopback,
        0,
        error);
}

bool WasapiCapture::start_process_loopback(
    uint32_t process_id,
    FramesCallback callback,
    std::wstring& error) {
    if (process_id == 0) {
        error = L"Process loopback requires a valid process identifier.";
        return false;
    }
    return start_internal(
        std::wstring(),
        std::move(callback),
        Mode::process_loopback,
        process_id,
        error);
}

bool WasapiCapture::start_internal(
    const std::wstring& endpoint_id,
    FramesCallback callback,
    Mode mode,
    uint32_t process_id,
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
        mode,
        process_id);
    if (!wait_for_start(started_, thread_)) {
        error = L"Timed out while starting the WASAPI capture stream.";
        stop();
        return false;
    }
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

void WasapiCapture::run(
    std::wstring endpoint_id,
    FramesCallback callback,
    Mode mode,
    uint32_t process_id) {
    HRESULT result = CoInitializeEx(nullptr, COINIT_MULTITHREADED);
    const bool uninitialize = SUCCEEDED(result);
    HANDLE event = CreateEventW(nullptr, FALSE, FALSE, nullptr);
    HANDLE mmcss = nullptr;
    DWORD task_index = 0;
    ComPtr<IMMDevice> device;
    ComPtr<IAudioClient> client;
    ComPtr<IAudioCaptureClient> capture;
    std::wstring error;

    const bool process_loopback = mode == Mode::process_loopback;
    const bool loopback = mode != Mode::endpoint;
    const EDataFlow flow = loopback ? eRender : eCapture;
    if (event == nullptr ||
        (!process_loopback && !open_endpoint(endpoint_id, flow, device, error))) {
        startup_error_ = event == nullptr ? L"Nie udało się utworzyć eventu capture" : error;
        signal_started(started_);
        if (event) CloseHandle(event);
        if (uninitialize) CoUninitialize();
        return;
    }

    if (process_loopback) {
        AUDIOCLIENT_ACTIVATION_PARAMS activation{};
        activation.ActivationType =
            AUDIOCLIENT_ACTIVATION_TYPE_PROCESS_LOOPBACK;
        activation.ProcessLoopbackParams.TargetProcessId = process_id;
        activation.ProcessLoopbackParams.ProcessLoopbackMode =
            PROCESS_LOOPBACK_MODE_INCLUDE_TARGET_PROCESS_TREE;
        PROPVARIANT parameters{};
        parameters.vt = VT_BLOB;
        parameters.blob.cbSize = sizeof(activation);
        parameters.blob.pBlobData =
            reinterpret_cast<BYTE*>(&activation);

        auto* activator = new (std::nothrow) ProcessLoopbackActivator();
        ComPtr<IActivateAudioInterfaceAsyncOperation> operation;
        bool release_activator = true;
        if (activator == nullptr) {
            result = E_OUTOFMEMORY;
        } else {
            result = ActivateAudioInterfaceAsync(
                VIRTUAL_AUDIO_DEVICE_PROCESS_LOOPBACK,
                __uuidof(IAudioClient),
                &parameters,
                activator,
                &operation);
            if (SUCCEEDED(result)) {
                HRESULT activation_result = E_PENDING;
                bool callback_signaled = false;
                if (!activator->wait_for_result(
                        1800,
                        client,
                        activation_result,
                        callback_signaled)) {
                    result = activation_result;
                }
                if (!callback_signaled) {
                    // Keep the owner reference alive until the API eventually
                    // invokes its completion callback, as required by WASAPI.
                    activator->abandon_owner_reference();
                    release_activator = false;
                }
            }
            if (release_activator) {
                activator->Release();
            }
        }
    } else {
        result = device->Activate(
            __uuidof(IAudioClient),
            CLSCTX_ALL,
            nullptr,
            &client);
    }
    if (FAILED(result)) {
        startup_error_ = hresult_text(
            result,
            process_loopback
                ? L"Nie udało się aktywować prywatnego przechwytywania aplikacji"
                : loopback
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
            process_loopback
                ? L"Nie udało się uruchomić prywatnej magistrali aplikacji"
                : loopback
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
    if (!wait_for_start(started_, thread_)) {
        error = L"Timed out while starting the WASAPI render stream.";
        stop();
        return false;
    }
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

ProcessStreamSource::ProcessStreamSource()
    : audio(kStreamSourceRingFrames) {}

AudioEngine::AudioEngine() {
    for (auto& source : stream_sources_) {
        source = std::make_unique<ProcessStreamSource>();
    }
}

AudioEngine::~AudioEngine() {
    stop();
}

bool AudioEngine::start(const std::wstring& input_id, const std::wstring& output_id, std::wstring& error) {
    stop();
    microphone_.clear();
    processed_microphone_.clear();
    system_audio_.clear();
    system_reference_.clear();
    monitor_.clear();
    voice_monitor_.clear();
    microphone_peak_.store(0.0f);
    microphone_output_peak_.store(0.0f);
    system_peak_.store(0.0f);
    system_output_peak_.store(0.0f);
    voice_probability_.store(0.0f);
    underruns_.store(0);
    microphone_.reset_diagnostics();
    processed_microphone_.reset_diagnostics();
    system_audio_.reset_diagnostics();
    system_reference_.reset_diagnostics();
    monitor_.reset_diagnostics();
    voice_monitor_.reset_diagnostics();
    estimated_latency_ms_.store(0.0f);
    microphone_leveler_gain_ = 1.0f;
    system_leveler_gain_ = 1.0f;
    microphone_gate_gain_ = 1.0f;
    master_limiter_gain_ = 1.0f;
    stream_source_custom_mode_.store(false, std::memory_order_relaxed);
    expected_stream_sources_.store(0, std::memory_order_relaxed);
    stream_source_manager_stopping_.store(false, std::memory_order_relaxed);
    for (auto& source : stream_sources_) {
        source->session_key = 0;
        source->process_id = 0;
        source->retry_after_tick = 0;
        source->gain.store(1.0f, std::memory_order_relaxed);
        source->active.store(false, std::memory_order_relaxed);
        source->readers.store(0, std::memory_order_relaxed);
        source->audio.clear();
        source->audio.reset_diagnostics();
    }
    warning_.clear();

    if (input_id.empty()) {
        error = L"Wybierz prawdziwy mikrofon w MicDeck.";
        return false;
    }
    if (output_id.empty()) {
        error = L"Wirtualne wyjście sterownika nie jest dostępne.";
        return false;
    }

    if (mb_dsp_frame_size() != kProcessingFrames) {
        error = L"The DSP module returned an unsupported frame size.";
        return false;
    }
    voice_dsp_ = mb_dsp_create();
    if (voice_dsp_ == nullptr) {
        error = L"Could not initialize the persistent AEC3/RNNoise state.";
        return false;
    }

    if (!capture_.start(input_id, [this](const float* samples, uint32_t frames) {
            accept_microphone(samples, frames);
        }, error)) {
        mb_dsp_destroy(voice_dsp_);
        voice_dsp_ = nullptr;
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
        mb_dsp_destroy(voice_dsp_);
        voice_dsp_ = nullptr;
        return false;
    }

    const uint32_t capture_period = capture_.period_frames();
    const uint32_t render_period = render_.period_frames();
    const float estimated_latency_ms =
        static_cast<float>(capture_period + render_period + kProcessingFrames) * 1000.0f /
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

    try {
        stream_source_manager_ =
            std::thread(&AudioEngine::manage_stream_sources, this);
    } catch (...) {
        warning_ = warning_.empty()
            ? L"Per-application stream mixing could not be started."
            : warning_ + L" Per-application stream mixing could not be started.";
    }

    return true;
}

void AudioEngine::stop() {
    stream_source_manager_stopping_.store(true, std::memory_order_release);
    if (stream_source_manager_.joinable()) {
        stream_source_manager_.join();
    }
    stream_source_custom_mode_.store(false, std::memory_order_relaxed);
    expected_stream_sources_.store(0, std::memory_order_relaxed);
    monitor_active_.store(false);
    render_.stop();
    monitor_render_.stop();
    monitor_.clear();
    voice_monitor_.clear();
    stop_stream_sources();
    system_capture_.stop();
    capture_.stop();
    microphone_.clear();
    processed_microphone_.clear();
    system_audio_.clear();
    system_reference_.clear();
    if (voice_dsp_ != nullptr) {
        mb_dsp_destroy(voice_dsp_);
        voice_dsp_ = nullptr;
    }
    const uint64_t capture_overruns =
        microphone_.dropped_frames() + processed_microphone_.dropped_frames() +
        system_audio_.dropped_frames() + system_reference_.dropped_frames() +
        monitor_.dropped_frames() + voice_monitor_.dropped_frames();
    uint64_t process_capture_overruns = 0;
    for (const auto& source : stream_sources_) {
        process_capture_overruns += source->audio.dropped_frames();
    }
    sb_engine_set_levels(
        0.0f,
        0.0f,
        0.0f,
        underruns_.load(),
        static_cast<uint32_t>((std::min)(
            capture_overruns + process_capture_overruns,
            uint64_t{UINT32_MAX})),
        0.0f);
    sb_engine_set_processing_levels(0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f, 1.0f);
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
    system_reference_.push(samples, frames);
}

void AudioEngine::stop_stream_sources() {
    for (auto& source : stream_sources_) {
        source->active.store(false, std::memory_order_release);
    }
    for (auto& source : stream_sources_) {
        source->capture.stop();
        source->audio.clear();
        source->session_key = 0;
        source->process_id = 0;
        source->retry_after_tick = 0;
        source->gain.store(1.0f, std::memory_order_relaxed);
        source->readers.store(0, std::memory_order_relaxed);
    }
}

void AudioEngine::manage_stream_sources() {
    std::array<SbStreamSource, SB_STREAM_SOURCE_CAPACITY> desired{};
    std::array<bool, SB_STREAM_SOURCE_CAPACITY> retire{};

    while (!stream_source_manager_stopping_.load(std::memory_order_acquire)) {
        const uint32_t desired_count =
            sb_get_stream_sources(desired.data(), static_cast<uint32_t>(desired.size()));
        bool custom_mode = false;
        uint32_t expected_active = 0;
        for (uint32_t index = 0; index < desired_count; ++index) {
            custom_mode =
                custom_mode || std::abs(desired[index].gain - 1.0f) > 0.0005f;
            if (desired[index].active != 0) {
                ++expected_active;
            }
        }
        if (!custom_mode) {
            expected_active = 0;
        }
        stream_source_custom_mode_.store(custom_mode, std::memory_order_release);
        expected_stream_sources_.store(expected_active, std::memory_order_release);

        retire.fill(false);
        bool any_retired = false;
        for (uint32_t slot_index = 0; slot_index < stream_sources_.size(); ++slot_index) {
            ProcessStreamSource& source = *stream_sources_[slot_index];
            if (source.session_key == 0) {
                continue;
            }
            bool still_desired = false;
            if (custom_mode) {
                for (uint32_t desired_index = 0;
                     desired_index < desired_count;
                     ++desired_index) {
                    const SbStreamSource& candidate = desired[desired_index];
                    if (candidate.active != 0 &&
                        candidate.process_id != 0 &&
                        candidate.session_key == source.session_key &&
                        candidate.process_id == source.process_id) {
                        still_desired = true;
                        source.gain.store(
                            std::clamp(candidate.gain, 0.0f, 1.0f),
                            std::memory_order_relaxed);
                        break;
                    }
                }
            }
            if (!still_desired) {
                source.active.store(false, std::memory_order_release);
                retire[slot_index] = true;
                any_retired = true;
            }
        }

        if (any_retired) {
            for (uint32_t index = 0; index < stream_sources_.size(); ++index) {
                if (!retire[index]) {
                    continue;
                }
                ProcessStreamSource& source = *stream_sources_[index];
                source.capture.stop();
                for (uint32_t attempt = 0;
                     attempt < 200 &&
                     source.readers.load(std::memory_order_acquire) != 0 &&
                     !stream_source_manager_stopping_.load(std::memory_order_acquire);
                     ++attempt) {
                    Sleep(1);
                }
                if (source.readers.load(std::memory_order_acquire) != 0) {
                    // Keep the retired slot intact and retry next cycle. This
                    // avoids clearing a ring still owned by an in-flight render.
                    continue;
                }
                source.audio.clear();
                source.session_key = 0;
                source.process_id = 0;
                source.retry_after_tick = 0;
                source.gain.store(1.0f, std::memory_order_relaxed);
            }
        }

        if (custom_mode) {
            for (uint32_t desired_index = 0;
                 desired_index < desired_count;
                 ++desired_index) {
                const SbStreamSource& candidate = desired[desired_index];
                if (candidate.active == 0 ||
                    candidate.process_id == 0 ||
                    candidate.session_key == 0) {
                    continue;
                }

                ProcessStreamSource* source = nullptr;
                for (auto& slot : stream_sources_) {
                    if (slot->session_key == candidate.session_key &&
                        slot->process_id == candidate.process_id) {
                        source = slot.get();
                        break;
                    }
                }
                if (source == nullptr) {
                    for (auto& slot : stream_sources_) {
                        if (slot->session_key == 0) {
                            source = slot.get();
                            source->session_key = candidate.session_key;
                            source->process_id = candidate.process_id;
                            source->retry_after_tick = 0;
                            source->audio.clear();
                            source->audio.reset_diagnostics();
                            break;
                        }
                    }
                }
                if (source == nullptr) {
                    continue;
                }

                source->gain.store(
                    std::clamp(candidate.gain, 0.0f, 1.0f),
                    std::memory_order_relaxed);
                if (source->active.load(std::memory_order_acquire) ||
                    GetTickCount64() < source->retry_after_tick) {
                    continue;
                }

                source->capture.stop();
                source->audio.clear();
                std::wstring capture_error;
                ProcessStreamSource* callback_source = source;
                const bool started = source->capture.start_process_loopback(
                    source->process_id,
                    [callback_source](const float* samples, uint32_t frames) {
                        callback_source->audio.push(samples, frames);
                    },
                    capture_error);
                if (started) {
                    source->retry_after_tick = 0;
                    source->active.store(true, std::memory_order_release);
                } else {
                    source->retry_after_tick = GetTickCount64() + 5'000u;
                }
            }
        }

        for (uint32_t iteration = 0;
             iteration < 10 &&
             !stream_source_manager_stopping_.load(std::memory_order_acquire);
             ++iteration) {
            Sleep(20);
        }
    }
}

void AudioEngine::pump_microphone_pipeline() {
    if (voice_dsp_ == nullptr || microphone_.available_read() < kProcessingFrames) {
        return;
    }

    std::array<float, kProcessingFrames * 2u> microphone_stereo{};
    std::array<float, kProcessingFrames * 2u> reference_stereo{};
    std::array<float, kProcessingFrames * 2u> processed_stereo{};
    std::array<float, kProcessingFrames> microphone_mono{};
    std::array<float, kProcessingFrames> reference_mono{};
    std::array<float, kProcessingFrames> processed_mono{};

    if (microphone_.pop(microphone_stereo.data(), kProcessingFrames) != kProcessingFrames) {
        return;
    }
    const uint32_t reference_frames =
        system_reference_.pop(reference_stereo.data(), kProcessingFrames);
    if (reference_frames < kProcessingFrames) {
        std::fill(
            reference_stereo.begin() + static_cast<size_t>(reference_frames) * 2u,
            reference_stereo.end(),
            0.0f);
    }

    downmix_microphone(
        microphone_stereo.data(),
        microphone_mono.data(),
        kProcessingFrames);
    for (uint32_t frame = 0; frame < kProcessingFrames; ++frame) {
        reference_mono[frame] =
            (reference_stereo[frame * 2u] + reference_stereo[frame * 2u + 1u]) * 0.5f;
    }

    const VoiceProcessingConfig config = voice_processing_config();
    float voice_probability = 0.0f;
    if (mb_dsp_process_10ms(
            voice_dsp_,
            microphone_mono.data(),
            reference_mono.data(),
            processed_mono.data(),
            config.aec_enabled ? 1 : 0,
            config.rnnoise_enabled ? 1 : 0,
            &voice_probability) == 0) {
        processed_mono = microphone_mono;
    }

    apply_mono_voice_dynamics(
        processed_mono.data(),
        kProcessingFrames,
        config,
        microphone_leveler_gain_,
        microphone_gate_gain_);

    for (uint32_t frame = 0; frame < kProcessingFrames; ++frame) {
        processed_stereo[frame * 2u] = processed_mono[frame];
        processed_stereo[frame * 2u + 1u] = processed_mono[frame];
    }
    processed_microphone_.push(processed_stereo.data(), kProcessingFrames);
    if (config.voice_monitor_enabled) {
        voice_monitor_.push(processed_stereo.data(), kProcessingFrames);
    }

    microphone_peak_.store(
        mono_peak(microphone_mono.data(), kProcessingFrames),
        std::memory_order_relaxed);
    microphone_output_peak_.store(
        mono_peak(processed_mono.data(), kProcessingFrames),
        std::memory_order_relaxed);
    voice_probability_.store(voice_probability, std::memory_order_relaxed);
}

void AudioEngine::render_mix(float* destination, uint32_t frames) {
    float microphone_gain = 1.0f;
    float sound_gain = 1.0f;
    float system_gain = 0.85f;
    int system_enabled = 0;
    sb_get_gains(&microphone_gain, &sound_gain);
    sb_get_system_audio(&system_enabled, &system_gain);
    const VoiceProcessingConfig processing_config = voice_processing_config();
    const bool process_microphone = voice_processing_active(processing_config);

    std::array<float, 4096> microphone{};
    std::array<float, 4096> sound{};
    std::array<float, 4096> system{};
    std::array<float, 4096> process_system{};
    std::array<float, 4096> process_source{};
    std::array<ProcessStreamSource*, SB_STREAM_SOURCE_CAPACITY> active_sources{};
    float mixed_peak = 0.0f;
    uint32_t processed = 0;
    while (processed < frames) {
        const uint32_t chunk = (std::min)(frames - processed, 2048u);
        if (process_microphone) {
            while (processed_microphone_.available_read() < chunk &&
                   microphone_.available_read() >= kProcessingFrames) {
                pump_microphone_pipeline();
            }
        } else {
            // A disabled filter chain is a true dry bypass. In v7 every
            // microphone still went through a 480-frame mono DSP staging path,
            // which changed channel layout, added latency, and retained stale
            // gate/leveler gains even after the UI switches were off.
            processed_microphone_.clear();
            system_reference_.clear();
            microphone_leveler_gain_ = 1.0f;
            microphone_gate_gain_ = 1.0f;
            voice_probability_.store(0.0f, std::memory_order_relaxed);
        }
        std::fill_n(microphone.data(), static_cast<size_t>(chunk) * 2u, 0.0f);
        std::fill_n(sound.data(), static_cast<size_t>(chunk) * 2u, 0.0f);
        std::fill_n(system.data(), static_cast<size_t>(chunk) * 2u, 0.0f);
        std::fill_n(process_system.data(), static_cast<size_t>(chunk) * 2u, 0.0f);
        const uint32_t microphone_frames = process_microphone
            ? processed_microphone_.pop(microphone.data(), chunk)
            : microphone_.pop(microphone.data(), chunk);
        if (!process_microphone) {
            float dry_peak = 0.0f;
            for (uint32_t sample = 0; sample < microphone_frames * 2u; ++sample) {
                dry_peak = (std::max)(dry_peak, std::abs(microphone[sample]));
            }
            microphone_output_peak_.store(dry_peak, std::memory_order_relaxed);
            if (processing_config.voice_monitor_enabled && microphone_frames > 0) {
                voice_monitor_.push(microphone.data(), microphone_frames);
            }
        }
        const uint32_t sound_frames = sb_pop_audio(sound.data(), chunk);
        const uint32_t system_frames = system_audio_.pop(system.data(), chunk);

        uint32_t active_source_count = 0;
        uint32_t minimum_available = UINT32_MAX;
        const bool custom_mode =
            stream_source_custom_mode_.load(std::memory_order_acquire);
        const uint32_t expected_sources =
            expected_stream_sources_.load(std::memory_order_acquire);
        if (custom_mode && expected_sources > 0) {
            for (auto& source : stream_sources_) {
                if (!source->active.load(std::memory_order_acquire)) {
                    continue;
                }
                source->readers.fetch_add(1, std::memory_order_acq_rel);
                if (!source->active.load(std::memory_order_acquire)) {
                    source->readers.fetch_sub(1, std::memory_order_release);
                    continue;
                }
                active_sources[active_source_count++] = source.get();
                minimum_available = (std::min)(
                    minimum_available,
                    source->audio.available_read());
            }
        }

        bool process_mix_ready =
            active_source_count == expected_sources &&
            minimum_available != UINT32_MAX &&
            minimum_available >= chunk;
        if (process_mix_ready) {
            for (uint32_t index = 0; index < active_source_count; ++index) {
                ProcessStreamSource& source = *active_sources[index];
                uint32_t discard = source.audio.available_read() - minimum_available;
                while (discard > 0) {
                    const uint32_t discard_chunk = (std::min)(discard, 2048u);
                    source.audio.pop(process_source.data(), discard_chunk);
                    discard -= discard_chunk;
                }
                std::fill_n(
                    process_source.data(),
                    static_cast<size_t>(chunk) * 2u,
                    0.0f);
                if (source.audio.pop(process_source.data(), chunk) != chunk) {
                    process_mix_ready = false;
                    break;
                }
                const float source_gain =
                    source.gain.load(std::memory_order_relaxed);
                for (uint32_t sample = 0; sample < chunk * 2u; ++sample) {
                    process_system[sample] += process_source[sample] * source_gain;
                }
            }
        }
        for (uint32_t index = 0; index < active_source_count; ++index) {
            active_sources[index]->readers.fetch_sub(1, std::memory_order_release);
        }

        float desktop_input_peak = 0.0f;
        for (uint32_t frame = 0; frame < chunk; ++frame) {
            for (uint32_t channel = 0; channel < 2u; ++channel) {
                const size_t sample = static_cast<size_t>(frame) * 2u + channel;
                const float aggregate_sample =
                    frame < system_frames ? system[sample] : 0.0f;
                const float process_sample =
                    process_mix_ready ? process_system[sample] : 0.0f;
                // Aggregate and process-loopback captures have independent
                // clocks and delays. Crossfading them mixes two copies of the
                // same signal out of phase, producing comb filtering and the
                // severe "underwater" Live quality regression. Select exactly
                // one complete bus; aggregate is the lossless fallback.
                system[sample] = process_mix_ready
                    ? process_sample
                    : aggregate_sample;
                desktop_input_peak =
                    (std::max)(desktop_input_peak, std::abs(system[sample]));
            }
        }
        const uint32_t desktop_frames =
            system_frames > 0 || process_mix_ready
            ? chunk
            : 0u;
        system_peak_.store(desktop_input_peak, std::memory_order_relaxed);
        if (desktop_frames > 0) {
            apply_stereo_leveler(
                system.data(),
                desktop_frames,
                processing_config,
                system_leveler_gain_);
            float output_peak = 0.0f;
            for (uint32_t sample = 0; sample < desktop_frames * 2u; ++sample) {
                output_peak = (std::max)(output_peak, std::abs(system[sample]));
            }
            system_output_peak_.store(output_peak, std::memory_order_relaxed);
        } else {
            system_output_peak_.store(0.0f, std::memory_order_relaxed);
        }
        if (!system_enabled &&
            monitor_active_.load(std::memory_order_relaxed) &&
            sound_frames > 0) {
            // Monitor the same post-gain bind that is sent to the virtual
            // cable. This prevents a loud local preview from hiding a muted or
            // very quiet outgoing soundboard path.
            for (uint32_t sample = 0; sample < sound_frames * 2u; ++sample) {
                process_source[sample] = sound[sample] * sound_gain;
            }
            monitor_.push(process_source.data(), sound_frames);
        }
        if (microphone_frames < chunk) {
            underruns_.fetch_add(1, std::memory_order_relaxed);
        }

        const float ceiling = db_to_linear(processing_config.limiter_ceiling_db);
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
                const float desktop = system_enabled && frame < desktop_frames
                    ? system[source_index] * system_gain
                    : 0.0f;
                const float sum = mic + clip + desktop;
                const float required_gain = std::abs(sum) > ceiling
                    ? ceiling / std::abs(sum)
                    : 1.0f;
                if (required_gain < master_limiter_gain_) {
                    master_limiter_gain_ = required_gain;
                } else {
                    master_limiter_gain_ += (1.0f - master_limiter_gain_) * 0.0005f;
                }
                const float mixed =
                    std::clamp(sum * master_limiter_gain_, -ceiling, ceiling);
                destination[destination_index] = mixed;
                mixed_peak = (std::max)(mixed_peak, std::abs(mixed));
            }
        }
        processed += chunk;
    }

    uint64_t process_capture_overruns = 0;
    for (const auto& source : stream_sources_) {
        process_capture_overruns += source->audio.dropped_frames();
    }
    sb_engine_set_levels(
        microphone_output_peak_.load(std::memory_order_relaxed) * microphone_gain,
        system_enabled
            ? system_peak_.load(std::memory_order_relaxed) * system_gain
            : 0.0f,
        mixed_peak,
        underruns_.load(std::memory_order_relaxed),
        static_cast<uint32_t>((std::min)(
            microphone_.dropped_frames() + processed_microphone_.dropped_frames() +
                system_audio_.dropped_frames() + system_reference_.dropped_frames() +
                monitor_.dropped_frames() + voice_monitor_.dropped_frames() +
                process_capture_overruns,
            uint64_t{UINT32_MAX})),
        estimated_latency_ms_.load(std::memory_order_relaxed));
    sb_engine_set_processing_levels(
        microphone_peak_.load(std::memory_order_relaxed),
        microphone_output_peak_.load(std::memory_order_relaxed) * microphone_gain,
        system_peak_.load(std::memory_order_relaxed),
        system_enabled
            ? system_output_peak_.load(std::memory_order_relaxed) * system_gain
            : 0.0f,
        voice_probability_.load(std::memory_order_relaxed),
        microphone_leveler_gain_,
        system_leveler_gain_);
}

void AudioEngine::render_monitor(float* destination, uint32_t frames) {
    const float monitor_gain = sb_get_monitor_gain();
    float microphone_gain = 1.0f;
    float ignored_sound_gain = 1.0f;
    sb_get_gains(&microphone_gain, &ignored_sound_gain);
    const VoiceProcessingConfig processing_config = voice_processing_config();
    std::array<float, 4096> sound{};
    std::array<float, 4096> voice{};
    uint32_t processed = 0;
    while (processed < frames) {
        const uint32_t chunk = (std::min)(frames - processed, 2048u);
        std::fill_n(sound.data(), static_cast<size_t>(chunk) * 2u, 0.0f);
        std::fill_n(voice.data(), static_cast<size_t>(chunk) * 2u, 0.0f);
        const uint32_t popped = monitor_.pop(sound.data(), chunk);
        uint32_t voice_popped = 0;
        if (processing_config.voice_monitor_enabled) {
            voice_popped = voice_monitor_.pop(voice.data(), chunk);
        } else {
            // The monitor render thread owns this ring's read cursor.
            voice_monitor_.clear();
        }
        for (uint32_t frame = 0; frame < chunk; ++frame) {
            for (uint32_t channel = 0; channel < 2u; ++channel) {
                const size_t source_index = static_cast<size_t>(frame) * 2u + channel;
                const size_t destination_index =
                    static_cast<size_t>(processed + frame) * 2u + channel;
                const float sound_sample = frame < popped
                    ? std::tanh(sound[source_index] * monitor_gain)
                    : 0.0f;
                const float voice_sample = frame < voice_popped
                    ? voice[source_index] * microphone_gain *
                        processing_config.voice_monitor_gain
                    : 0.0f;
                destination[destination_index] =
                    std::clamp(sound_sample + voice_sample, -1.0f, 1.0f);
            }
        }
        processed += chunk;
    }
}
