#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <Audioclient.h>
#include <Mmdeviceapi.h>
#include <avrt.h>
#include <functiondiscoverykeys_devpkey.h>
#include <ksmedia.h>
#include <wrl/client.h>

#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <limits>
#include <mutex>
#include <optional>
#include <sstream>
#include <string>
#include <thread>
#include <vector>

#include "../../integration/micdeck-native/micdeck_vad_endpoint.h"

using Microsoft::WRL::ComPtr;

namespace {

constexpr double kPi =
    3.1415926535897932384626433832795;
constexpr double kToneHz = 1000.0;
constexpr double kToneAmplitude = 0.22;
constexpr double kSilenceBeforeSeconds = 0.50;
constexpr double kSilenceAfterSeconds = 0.50;

struct CoScope {
    HRESULT result;

    CoScope()
        : result(CoInitializeEx(
              nullptr,
              COINIT_MULTITHREADED)) {}

    ~CoScope() {
        if (SUCCEEDED(result)) {
            CoUninitialize();
        }
    }
};

struct Handle {
    HANDLE value = nullptr;

    Handle() = default;
    explicit Handle(HANDLE handle) : value(handle) {}

    ~Handle() {
        if (value != nullptr &&
            value != INVALID_HANDLE_VALUE) {
            CloseHandle(value);
        }
    }

    Handle(const Handle&) = delete;
    Handle& operator=(const Handle&) = delete;

    Handle(Handle&& other) noexcept
        : value(other.value) {
        other.value = nullptr;
    }

    Handle& operator=(Handle&& other) noexcept {
        if (this != &other) {
            if (value != nullptr &&
                value != INVALID_HANDLE_VALUE) {
                CloseHandle(value);
            }
            value = other.value;
            other.value = nullptr;
        }
        return *this;
    }

    operator HANDLE() const noexcept {
        return value;
    }
};

struct AudioFormat {
    WAVEFORMATEX* wave = nullptr;
    bool floating = false;
    unsigned valid_bits = 0;
    GUID subtype{};
};

struct CaptureResult {
    std::vector<float> mono;
    uint32_t sample_rate = 0;
    uint64_t first_audible_qpc_100ns = 0;
    uint64_t packet_count = 0;
    uint64_t discontinuity_packets = 0;
    uint64_t silent_packets = 0;
    HRESULT error = S_OK;
};

struct Analysis {
    bool passed = false;
    double rms = 0.0;
    double tone_ratio = 0.0;
    double dropout_ratio = 1.0;
    double estimated_latency_ms = -1.0;
    double captured_seconds = 0.0;
    uint64_t captured_frames = 0;
    uint64_t packet_count = 0;
    uint64_t discontinuity_packets = 0;
    std::string failure;
};

uint64_t qpc_now_100ns() {
    LARGE_INTEGER counter{};
    LARGE_INTEGER frequency{};
    QueryPerformanceCounter(&counter);
    QueryPerformanceFrequency(&frequency);

    if (frequency.QuadPart <= 0) {
        return 0;
    }

    return static_cast<uint64_t>(
        (static_cast<long double>(counter.QuadPart) *
         10'000'000.0L) /
        static_cast<long double>(frequency.QuadPart));
}

std::wstring json_escape(const std::wstring& input) {
    std::wstring output;
    output.reserve(input.size() + 16);

    for (wchar_t character : input) {
        switch (character) {
        case L'\\': output += L"\\\\"; break;
        case L'"': output += L"\\\""; break;
        case L'\n': output += L"\\n"; break;
        case L'\r': output += L"\\r"; break;
        case L'\t': output += L"\\t"; break;
        default:
            if (character < 0x20) {
                wchar_t encoded[7]{};
                swprintf_s(
                    encoded,
                    L"\\u%04x",
                    static_cast<unsigned>(character));
                output += encoded;
            }
            else {
                output += character;
            }
        }
    }

    return output;
}

AudioFormat describe_format(WAVEFORMATEX* wave) {
    AudioFormat result{};
    result.wave = wave;
    result.valid_bits = wave->wBitsPerSample;

    if (wave->wFormatTag == WAVE_FORMAT_IEEE_FLOAT) {
        result.floating = true;
        result.subtype = KSDATAFORMAT_SUBTYPE_IEEE_FLOAT;
    }
    else if (wave->wFormatTag == WAVE_FORMAT_PCM) {
        result.floating = false;
        result.subtype = KSDATAFORMAT_SUBTYPE_PCM;
    }
    else if (
        wave->wFormatTag == WAVE_FORMAT_EXTENSIBLE &&
        wave->cbSize >=
            sizeof(WAVEFORMATEXTENSIBLE) -
            sizeof(WAVEFORMATEX)) {
        const auto* extended =
            reinterpret_cast<const WAVEFORMATEXTENSIBLE*>(
                wave);
        result.subtype = extended->SubFormat;
        result.valid_bits =
            extended->Samples.wValidBitsPerSample;
        result.floating =
            IsEqualGUID(
                extended->SubFormat,
                KSDATAFORMAT_SUBTYPE_IEEE_FLOAT);
    }

    return result;
}

float decode_sample(
    const BYTE* sample,
    const AudioFormat& format) {
    const unsigned bits =
        format.wave->wBitsPerSample;

    if (format.floating && bits == 32) {
        float value = 0.0f;
        memcpy(&value, sample, sizeof(value));
        return std::isfinite(value)
            ? std::clamp(value, -1.0f, 1.0f)
            : 0.0f;
    }

    if (bits == 16) {
        int16_t value = 0;
        memcpy(&value, sample, sizeof(value));
        return static_cast<float>(value) / 32768.0f;
    }

    if (bits == 24) {
        int32_t value =
            static_cast<int32_t>(sample[0]) |
            (static_cast<int32_t>(sample[1]) << 8) |
            (static_cast<int32_t>(sample[2]) << 16);
        if ((value & 0x00800000) != 0) {
            value |= static_cast<int32_t>(0xFF000000);
        }
        return static_cast<float>(value) / 8388608.0f;
    }

    if (bits == 32) {
        int32_t value = 0;
        memcpy(&value, sample, sizeof(value));
        return static_cast<float>(
            static_cast<double>(value) /
            2147483648.0);
    }

    return 0.0f;
}

void encode_sample(
    BYTE* sample,
    const AudioFormat& format,
    float input) {
    const float value =
        std::clamp(input, -1.0f, 1.0f);
    const unsigned bits =
        format.wave->wBitsPerSample;

    if (format.floating && bits == 32) {
        memcpy(sample, &value, sizeof(value));
        return;
    }

    if (bits == 16) {
        const int16_t encoded =
            static_cast<int16_t>(
                std::lround(value * 32767.0f));
        memcpy(sample, &encoded, sizeof(encoded));
        return;
    }

    if (bits == 24) {
        const int32_t encoded =
            static_cast<int32_t>(
                std::lround(value * 8388607.0f));
        sample[0] =
            static_cast<BYTE>(encoded & 0xFF);
        sample[1] =
            static_cast<BYTE>((encoded >> 8) & 0xFF);
        sample[2] =
            static_cast<BYTE>((encoded >> 16) & 0xFF);
        return;
    }

    if (bits == 32) {
        const int32_t encoded =
            static_cast<int32_t>(
                std::llround(
                    static_cast<double>(value) *
                    2147483647.0));
        memcpy(sample, &encoded, sizeof(encoded));
    }
}

HRESULT activate_audio_client(
    const std::wstring& endpoint_id,
    ComPtr<IMMDevice>& device,
    ComPtr<IAudioClient>& client) {
    ComPtr<IMMDeviceEnumerator> enumerator;
    HRESULT result = CoCreateInstance(
        __uuidof(MMDeviceEnumerator),
        nullptr,
        CLSCTX_INPROC_SERVER,
        IID_PPV_ARGS(&enumerator));
    if (FAILED(result)) {
        return result;
    }

    result = enumerator->GetDevice(
        endpoint_id.c_str(),
        &device);
    if (FAILED(result)) {
        return result;
    }

    return device->Activate(
        __uuidof(IAudioClient),
        CLSCTX_INPROC_SERVER,
        nullptr,
        &client);
}

HRESULT initialize_shared_event_client(
    IAudioClient* client,
    WAVEFORMATEX* format,
    HANDLE event) {
    const DWORD flags =
        AUDCLNT_STREAMFLAGS_EVENTCALLBACK |
        AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM |
        AUDCLNT_STREAMFLAGS_SRC_DEFAULT_QUALITY;

    HRESULT result = client->Initialize(
        AUDCLNT_SHAREMODE_SHARED,
        flags,
        0,
        0,
        format,
        nullptr);
    if (FAILED(result)) {
        return result;
    }

    return client->SetEventHandle(event);
}

double goertzel_power(
    const std::vector<float>& samples,
    size_t begin,
    size_t end,
    double frequency,
    double sample_rate) {
    if (end <= begin || sample_rate <= 0.0) {
        return 0.0;
    }

    const size_t count = end - begin;
    const double normalized =
        frequency / sample_rate;
    const double omega = 2.0 * kPi * normalized;
    const double coefficient = 2.0 * std::cos(omega);

    double previous = 0.0;
    double previous2 = 0.0;

    for (size_t index = begin; index < end; ++index) {
        const double current =
            static_cast<double>(samples[index]) +
            coefficient * previous -
            previous2;
        previous2 = previous;
        previous = current;
    }

    const double power =
        previous2 * previous2 +
        previous * previous -
        coefficient * previous * previous2;

    return power / static_cast<double>(count * count);
}

Analysis analyze(
    const CaptureResult& capture,
    uint64_t tone_start_qpc_100ns,
    unsigned tone_seconds) {
    Analysis result{};
    result.captured_frames = capture.mono.size();
    result.packet_count = capture.packet_count;
    result.discontinuity_packets =
        capture.discontinuity_packets;

    if (capture.sample_rate == 0 ||
        capture.mono.empty()) {
        result.failure =
            "No capture samples were collected.";
        return result;
    }

    result.captured_seconds =
        static_cast<double>(capture.mono.size()) /
        static_cast<double>(capture.sample_rate);

    const size_t minimum_frames =
        static_cast<size_t>(
            capture.sample_rate *
            (tone_seconds * 0.75));

    if (capture.mono.size() < minimum_frames) {
        result.failure =
            "Captured stream was too short.";
        return result;
    }

    const size_t window =
        std::max<size_t>(
            1,
            capture.sample_rate / 100);

    std::vector<double> window_rms;
    window_rms.reserve(
        capture.mono.size() / window + 1);

    size_t first_active_window =
        std::numeric_limits<size_t>::max();
    size_t last_active_window = 0;

    for (size_t begin = 0;
         begin < capture.mono.size();
         begin += window) {
        const size_t end =
            std::min(
                capture.mono.size(),
                begin + window);

        long double sum = 0.0;
        for (size_t index = begin;
             index < end;
             ++index) {
            const long double sample =
                capture.mono[index];
            sum += sample * sample;
        }

        const double rms =
            std::sqrt(
                static_cast<double>(
                    sum /
                    static_cast<long double>(
                        end - begin)));
        window_rms.push_back(rms);

        if (rms >= 0.025) {
            if (first_active_window ==
                std::numeric_limits<size_t>::max()) {
                first_active_window =
                    window_rms.size() - 1;
            }
            last_active_window =
                window_rms.size() - 1;
        }
    }

    if (first_active_window ==
        std::numeric_limits<size_t>::max()) {
        result.failure =
            "The capture endpoint did not receive the test tone.";
        return result;
    }

    const size_t begin_frame =
        first_active_window * window;
    const size_t end_frame =
        std::min(
            capture.mono.size(),
            (last_active_window + 1) * window);

    long double squared_sum = 0.0;
    for (size_t index = begin_frame;
         index < end_frame;
         ++index) {
        const long double sample =
            capture.mono[index];
        squared_sum += sample * sample;
    }

    result.rms =
        std::sqrt(
            static_cast<double>(
                squared_sum /
                static_cast<long double>(
                    end_frame - begin_frame)));

    const double tone_power =
        goertzel_power(
            capture.mono,
            begin_frame,
            end_frame,
            1000.0,
            capture.sample_rate);
    const double side_power =
        0.5 * (
            goertzel_power(
                capture.mono,
                begin_frame,
                end_frame,
                700.0,
                capture.sample_rate) +
            goertzel_power(
                capture.mono,
                begin_frame,
                end_frame,
                1300.0,
                capture.sample_rate));

    result.tone_ratio =
        tone_power /
        std::max(side_power, 1.0e-12);

    size_t low_windows = 0;
    size_t active_windows = 0;
    for (size_t index = first_active_window;
         index <= last_active_window &&
         index < window_rms.size();
         ++index) {
        ++active_windows;
        if (window_rms[index] < 0.012) {
            ++low_windows;
        }
    }

    result.dropout_ratio =
        active_windows == 0
        ? 1.0
        : static_cast<double>(low_windows) /
          static_cast<double>(active_windows);

    if (capture.first_audible_qpc_100ns != 0 &&
        tone_start_qpc_100ns != 0 &&
        capture.first_audible_qpc_100ns >=
            tone_start_qpc_100ns) {
        result.estimated_latency_ms =
            static_cast<double>(
                capture.first_audible_qpc_100ns -
                tone_start_qpc_100ns) /
            10'000.0;
    }

    if (capture.error != S_OK) {
        result.failure =
            "The capture thread returned a WASAPI error.";
        return result;
    }

    if (result.rms < 0.035) {
        result.failure =
            "Captured tone RMS is below the required threshold.";
        return result;
    }

    if (result.tone_ratio < 8.0) {
        result.failure =
            "The 1 kHz spectral ratio is too low.";
        return result;
    }

    if (result.dropout_ratio > 0.08) {
        result.failure =
            "Too many low-energy windows occurred inside the tone.";
        return result;
    }

    if (result.estimated_latency_ms >= 0.0 &&
        result.estimated_latency_ms > 500.0) {
        result.failure =
            "Estimated render-to-capture latency exceeds 500 ms.";
        return result;
    }

    if (capture.discontinuity_packets > 4) {
        result.failure =
            "The capture stream reported too many discontinuities.";
        return result;
    }

    result.passed = true;
    return result;
}

CaptureResult capture_audio(
    const std::wstring& endpoint_id,
    double total_seconds,
    std::atomic<bool>& ready,
    std::atomic<bool>& stop) {
    CoScope com;
    CaptureResult output{};

    if (FAILED(com.result)) {
        output.error = com.result;
        ready.store(true);
        return output;
    }

    ComPtr<IMMDevice> device;
    ComPtr<IAudioClient> client;
    HRESULT result =
        activate_audio_client(
            endpoint_id,
            device,
            client);
    if (FAILED(result)) {
        output.error = result;
        ready.store(true);
        return output;
    }

    WAVEFORMATEX* raw_format = nullptr;
    result = client->GetMixFormat(&raw_format);
    if (FAILED(result) || raw_format == nullptr) {
        output.error = FAILED(result)
            ? result
            : E_POINTER;
        ready.store(true);
        return output;
    }

    const AudioFormat format =
        describe_format(raw_format);
    output.sample_rate =
        raw_format->nSamplesPerSec;

    Handle event(CreateEventW(
        nullptr,
        FALSE,
        FALSE,
        nullptr));
    if (event.value == nullptr) {
        output.error =
            HRESULT_FROM_WIN32(GetLastError());
        CoTaskMemFree(raw_format);
        ready.store(true);
        return output;
    }

    result = initialize_shared_event_client(
        client.Get(),
        raw_format,
        event.value);
    if (FAILED(result)) {
        output.error = result;
        CoTaskMemFree(raw_format);
        ready.store(true);
        return output;
    }

    ComPtr<IAudioCaptureClient> capture;
    result = client->GetService(
        IID_PPV_ARGS(&capture));
    if (FAILED(result)) {
        output.error = result;
        CoTaskMemFree(raw_format);
        ready.store(true);
        return output;
    }

    result = client->Start();
    if (FAILED(result)) {
        output.error = result;
        CoTaskMemFree(raw_format);
        ready.store(true);
        return output;
    }

    ready.store(true, std::memory_order_release);

    const auto deadline =
        std::chrono::steady_clock::now() +
        std::chrono::duration<double>(total_seconds);

    const unsigned bytes_per_sample =
        raw_format->wBitsPerSample / 8;
    bool first_audible_found = false;

    while (!stop.load(std::memory_order_acquire) &&
           std::chrono::steady_clock::now() < deadline) {
        const DWORD wait =
            WaitForSingleObject(event.value, 500);
        if (wait == WAIT_TIMEOUT) {
            continue;
        }
        if (wait != WAIT_OBJECT_0) {
            output.error =
                HRESULT_FROM_WIN32(GetLastError());
            break;
        }

        UINT32 packet_frames = 0;
        while (SUCCEEDED(
                   capture->GetNextPacketSize(
                       &packet_frames)) &&
               packet_frames != 0) {
            BYTE* data = nullptr;
            UINT32 frames = 0;
            DWORD flags = 0;
            UINT64 device_position = 0;
            UINT64 qpc_position = 0;

            result = capture->GetBuffer(
                &data,
                &frames,
                &flags,
                &device_position,
                &qpc_position);
            if (FAILED(result)) {
                output.error = result;
                break;
            }

            ++output.packet_count;
            if ((flags &
                 AUDCLNT_BUFFERFLAGS_DATA_DISCONTINUITY)
                != 0) {
                ++output.discontinuity_packets;
            }

            const bool silent =
                (flags &
                 AUDCLNT_BUFFERFLAGS_SILENT) != 0 ||
                data == nullptr;
            if (silent) {
                ++output.silent_packets;
            }

            long double packet_energy = 0.0;

            for (UINT32 frame = 0;
                 frame < frames;
                 ++frame) {
                float mono = 0.0f;

                if (!silent) {
                    for (unsigned channel = 0;
                         channel <
                             raw_format->nChannels;
                         ++channel) {
                        const BYTE* sample =
                            data +
                            (
                                static_cast<size_t>(frame) *
                                raw_format->nChannels +
                                channel
                            ) *
                            bytes_per_sample;
                        mono += decode_sample(
                            sample,
                            format);
                    }

                    mono /=
                        std::max<unsigned>(
                            1,
                            raw_format->nChannels);
                }

                output.mono.push_back(mono);
                packet_energy +=
                    static_cast<long double>(mono) *
                    mono;
            }

            if (!first_audible_found &&
                frames != 0) {
                const double packet_rms =
                    std::sqrt(
                        static_cast<double>(
                            packet_energy /
                            static_cast<long double>(
                                frames)));
                if (packet_rms >= 0.025) {
                    output.first_audible_qpc_100ns =
                        qpc_position;
                    first_audible_found = true;
                }
            }

            capture->ReleaseBuffer(frames);

            if (FAILED(result)) {
                break;
            }

            packet_frames = 0;
        }

        if (FAILED(output.error)) {
            break;
        }
    }

    client->Stop();
    CoTaskMemFree(raw_format);
    return output;
}

HRESULT render_test_signal(
    const std::wstring& endpoint_id,
    unsigned tone_seconds,
    uint64_t& tone_start_qpc_100ns,
    std::atomic<bool>& stop) {
    CoScope com;
    if (FAILED(com.result)) {
        return com.result;
    }

    ComPtr<IMMDevice> device;
    ComPtr<IAudioClient> client;
    HRESULT result =
        activate_audio_client(
            endpoint_id,
            device,
            client);
    if (FAILED(result)) {
        return result;
    }

    WAVEFORMATEX* raw_format = nullptr;
    result = client->GetMixFormat(&raw_format);
    if (FAILED(result) || raw_format == nullptr) {
        return FAILED(result) ? result : E_POINTER;
    }

    const AudioFormat format =
        describe_format(raw_format);

    Handle event(CreateEventW(
        nullptr,
        FALSE,
        FALSE,
        nullptr));
    if (event.value == nullptr) {
        CoTaskMemFree(raw_format);
        return HRESULT_FROM_WIN32(GetLastError());
    }

    result = initialize_shared_event_client(
        client.Get(),
        raw_format,
        event.value);
    if (FAILED(result)) {
        CoTaskMemFree(raw_format);
        return result;
    }

    ComPtr<IAudioRenderClient> render;
    result = client->GetService(
        IID_PPV_ARGS(&render));
    if (FAILED(result)) {
        CoTaskMemFree(raw_format);
        return result;
    }

    UINT32 buffer_frames = 0;
    result = client->GetBufferSize(&buffer_frames);
    if (FAILED(result)) {
        CoTaskMemFree(raw_format);
        return result;
    }

    result = client->Start();
    if (FAILED(result)) {
        CoTaskMemFree(raw_format);
        return result;
    }

    const uint64_t silence_before_frames =
        static_cast<uint64_t>(
            raw_format->nSamplesPerSec *
            kSilenceBeforeSeconds);
    const uint64_t tone_frames =
        static_cast<uint64_t>(
            raw_format->nSamplesPerSec *
            tone_seconds);
    const uint64_t total_frames =
        silence_before_frames +
        tone_frames +
        static_cast<uint64_t>(
            raw_format->nSamplesPerSec *
            kSilenceAfterSeconds);

    const unsigned bytes_per_sample =
        raw_format->wBitsPerSample / 8;
    uint64_t generated = 0;
    double phase = 0.0;
    bool tone_started = false;

    while (generated < total_frames &&
           !stop.load(std::memory_order_acquire)) {
        const DWORD wait =
            WaitForSingleObject(event.value, 1000);
        if (wait == WAIT_TIMEOUT) {
            continue;
        }
        if (wait != WAIT_OBJECT_0) {
            result =
                HRESULT_FROM_WIN32(GetLastError());
            break;
        }

        UINT32 padding = 0;
        result = client->GetCurrentPadding(&padding);
        if (FAILED(result)) {
            break;
        }

        const UINT32 available =
            buffer_frames - padding;
        if (available == 0) {
            continue;
        }

        BYTE* data = nullptr;
        result = render->GetBuffer(
            available,
            &data);
        if (FAILED(result)) {
            break;
        }

        bool buffer_contains_audio = false;

        for (UINT32 frame = 0;
             frame < available;
             ++frame) {
            const uint64_t absolute =
                generated + frame;
            const bool inside_tone =
                absolute >= silence_before_frames &&
                absolute <
                    silence_before_frames +
                    tone_frames;

            float value = 0.0f;
            if (inside_tone) {
                value = static_cast<float>(
                    std::sin(phase) *
                    kToneAmplitude);
                phase +=
                    2.0 * kPi * kToneHz /
                    static_cast<double>(
                        raw_format->nSamplesPerSec);
                buffer_contains_audio = true;

                if (!tone_started) {
                    tone_start_qpc_100ns =
                        qpc_now_100ns();
                    tone_started = true;
                }
            }

            for (unsigned channel = 0;
                 channel < raw_format->nChannels;
                 ++channel) {
                BYTE* sample =
                    data +
                    (
                        static_cast<size_t>(frame) *
                        raw_format->nChannels +
                        channel
                    ) *
                    bytes_per_sample;
                encode_sample(
                    sample,
                    format,
                    value);
            }
        }

        result = render->ReleaseBuffer(
            available,
            buffer_contains_audio
                ? 0
                : AUDCLNT_BUFFERFLAGS_SILENT);
        if (FAILED(result)) {
            break;
        }

        generated += available;
    }

    client->Stop();
    CoTaskMemFree(raw_format);
    stop.store(true, std::memory_order_release);
    return result;
}

void write_report(
    const std::filesystem::path& output,
    const MicDeckVadEndpointPair& endpoints,
    const CaptureResult& capture,
    const Analysis& analysis,
    uint64_t tone_start_qpc_100ns,
    HRESULT render_error) {
    std::ofstream file(
        output,
        std::ios::binary | std::ios::trunc);
    if (!file) {
        throw std::runtime_error(
            "Could not create report file.");
    }

    auto bool_text = [](bool value) {
        return value ? "true" : "false";
    };

    file
        << "{\n"
        << "  \"schemaVersion\": 1,\n"
        << "  \"product\": \"MicDeck VAD\",\n"
        << "  \"passed\": "
        << bool_text(analysis.passed) << ",\n"
        << "  \"renderEndpointId\": \"";

    const std::wstring escaped_render =
        json_escape(endpoints.render_id);
    for (wchar_t character : escaped_render) {
        file << static_cast<char>(
            character <= 0x7F ? character : '?');
    }

    file
        << "\",\n"
        << "  \"captureEndpointId\": \"";

    const std::wstring escaped_capture =
        json_escape(endpoints.capture_id);
    for (wchar_t character : escaped_capture) {
        file << static_cast<char>(
            character <= 0x7F ? character : '?');
    }

    file
        << "\",\n"
        << "  \"sampleRate\": "
        << capture.sample_rate << ",\n"
        << "  \"capturedFrames\": "
        << analysis.captured_frames << ",\n"
        << "  \"capturedSeconds\": "
        << std::fixed << std::setprecision(6)
        << analysis.captured_seconds << ",\n"
        << "  \"rms\": "
        << analysis.rms << ",\n"
        << "  \"toneRatio\": "
        << analysis.tone_ratio << ",\n"
        << "  \"dropoutRatio\": "
        << analysis.dropout_ratio << ",\n"
        << "  \"estimatedLatencyMs\": "
        << analysis.estimated_latency_ms << ",\n"
        << "  \"packetCount\": "
        << analysis.packet_count << ",\n"
        << "  \"discontinuityPackets\": "
        << analysis.discontinuity_packets << ",\n"
        << "  \"silentPackets\": "
        << capture.silent_packets << ",\n"
        << "  \"toneStartQpc100ns\": "
        << tone_start_qpc_100ns << ",\n"
        << "  \"firstAudibleQpc100ns\": "
        << capture.first_audible_qpc_100ns << ",\n"
        << "  \"renderHresult\": "
        << static_cast<int32_t>(render_error)
        << ",\n"
        << "  \"captureHresult\": "
        << static_cast<int32_t>(capture.error)
        << ",\n"
        << "  \"failure\": \""
        << analysis.failure
        << "\"\n"
        << "}\n";
}

} // namespace

int wmain(int argc, wchar_t** argv) {
    std::filesystem::path output =
        L"audio-e2e.json";
    unsigned tone_seconds = 3;

    for (int index = 1; index < argc; ++index) {
        const std::wstring argument = argv[index];

        if (argument == L"--output" &&
            index + 1 < argc) {
            output = argv[++index];
        }
        else if (
            argument == L"--seconds" &&
            index + 1 < argc) {
            tone_seconds =
                std::clamp(
                    static_cast<unsigned>(
                        _wtoi(argv[++index])),
                    1u,
                    30u);
        }
    }

    CoScope main_com;
    if (FAILED(main_com.result)) {
        std::wcerr
            << L"COM initialization failed: 0x"
            << std::hex << main_com.result << L"\n";
        return 2;
    }

    const MicDeckVadProbeResult probe =
        ProbeMicDeckVadEndpoints();

    if (!probe.endpoints.has_value()) {
        std::wcerr
            << L"MicDeck VAD endpoints are not ready: "
            << probe.message << L"\n";
        return 3;
    }

    std::atomic<bool> capture_ready{false};
    std::atomic<bool> stop{false};
    CaptureResult capture;

    const double total_seconds =
        tone_seconds +
        kSilenceBeforeSeconds +
        kSilenceAfterSeconds +
        1.0;

    std::thread capture_thread([&] {
        capture = capture_audio(
            probe.endpoints->capture_id,
            total_seconds,
            capture_ready,
            stop);
    });

    const auto ready_deadline =
        std::chrono::steady_clock::now() +
        std::chrono::seconds(5);

    while (!capture_ready.load(
               std::memory_order_acquire) &&
           std::chrono::steady_clock::now() <
               ready_deadline) {
        std::this_thread::sleep_for(
            std::chrono::milliseconds(10));
    }

    if (!capture_ready.load()) {
        stop.store(true);
        capture_thread.join();
        std::wcerr
            << L"Capture client did not become ready.\n";
        return 4;
    }

    std::this_thread::sleep_for(
        std::chrono::milliseconds(150));

    uint64_t tone_start_qpc_100ns = 0;
    const HRESULT render_error =
        render_test_signal(
            probe.endpoints->render_id,
            tone_seconds,
            tone_start_qpc_100ns,
            stop);

    capture_thread.join();

    const Analysis analysis =
        analyze(
            capture,
            tone_start_qpc_100ns,
            tone_seconds);

    try {
        write_report(
            output,
            *probe.endpoints,
            capture,
            analysis,
            tone_start_qpc_100ns,
            render_error);
    }
    catch (const std::exception& error) {
        std::cerr
            << "Could not write report: "
            << error.what() << "\n";
        return 5;
    }

    std::cout
        << "MicDeck VAD E2E: "
        << (analysis.passed ? "PASS" : "FAIL")
        << "\nRMS: " << analysis.rms
        << "\nTone ratio: " << analysis.tone_ratio
        << "\nDropout ratio: "
        << analysis.dropout_ratio
        << "\nEstimated latency: "
        << analysis.estimated_latency_ms
        << " ms\nReport: "
        << output.string()
        << "\n";

    if (FAILED(render_error)) {
        return 6;
    }

    return analysis.passed ? 0 : 7;
}
