#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#define SOUNDBOARD_IPC_EXPORTS

#include "soundboard_ipc.h"
#include "default_endpoint.h"

#include <Audioclient.h>
#include <audiopolicy.h>
#include <endpointvolume.h>
#include <Mmdeviceapi.h>
#include <shellapi.h>
#include <windows.h>
#include <wrl/client.h>

#include <algorithm>
#include <atomic>
#include <chrono>
#include <cmath>
#include <condition_variable>
#include <cstdint>
#include <cwctype>
#include <mutex>
#include <string>
#include <thread>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

using Microsoft::WRL::ComPtr;

namespace {

constexpr float kActivityThreshold = 0.0005f;
constexpr uint64_t kMissingSessionRetentionMs = 60'000u;
constexpr uint32_t kIconSize = 32u;

struct ProcessIdentity {
    uint64_t key = 0;
    DWORD process_id = 0;
    std::wstring name;
    std::wstring executable_path;
};

struct ObservedSession {
    ProcessIdentity identity;
    float peak = 0.0f;
    float volume = 1.0f;
    bool muted = false;
    bool active = false;
};

struct SessionHistory {
    ProcessIdentity identity;
    float peak = 0.0f;
    float volume = 1.0f;
    bool muted = false;
    bool active = false;
    uint64_t last_active_tick = 0;
    uint64_t last_seen_tick = 0;
    std::vector<uint8_t> icon_rgba;
};

std::mutex g_state_mutex;
std::unordered_map<uint64_t, SessionHistory> g_history;
std::unordered_map<uint64_t, float> g_desired_volumes;
std::mutex g_wait_mutex;
std::condition_variable g_wait_condition;
std::thread g_monitor_thread;
std::atomic<bool> g_monitor_running{false};
std::atomic<bool> g_monitor_stopping{false};

uint64_t fnv1a_u64(uint64_t hash, const void* data, size_t size) {
    const auto* bytes = static_cast<const uint8_t*>(data);
    for (size_t index = 0; index < size; ++index) {
        hash ^= bytes[index];
        hash *= 1099511628211ull;
    }
    return hash;
}

std::wstring lowercase(std::wstring value) {
    std::transform(
        value.begin(),
        value.end(),
        value.begin(),
        [](wchar_t value) { return static_cast<wchar_t>(std::towlower(value)); });
    return value;
}

std::wstring executable_stem(const std::wstring& path) {
    const size_t slash = path.find_last_of(L"\\/");
    std::wstring name = slash == std::wstring::npos ? path : path.substr(slash + 1u);
    const size_t dot = name.find_last_of(L'.');
    if (dot != std::wstring::npos) {
        name.resize(dot);
    }
    return name;
}

std::wstring friendly_process_name(const std::wstring& stem) {
    const std::wstring normalized = lowercase(stem);
    if (normalized == L"chrome") return L"Google Chrome";
    if (normalized == L"msedge") return L"Microsoft Edge";
    if (normalized == L"firefox") return L"Mozilla Firefox";
    if (normalized == L"spotify") return L"Spotify";
    if (normalized == L"discord") return L"Discord";
    if (normalized == L"steamwebhelper") return L"Steam";
    if (normalized == L"vlc") return L"VLC media player";
    return stem.empty() ? L"Windows audio" : stem;
}

bool query_process_identity(DWORD process_id, ProcessIdentity& identity) {
    identity.process_id = process_id;
    HANDLE process = OpenProcess(
        PROCESS_QUERY_LIMITED_INFORMATION,
        FALSE,
        process_id);
    if (process == nullptr) {
        identity.key = fnv1a_u64(1469598103934665603ull, &process_id, sizeof(process_id));
        identity.name = L"Windows audio";
        return false;
    }

    std::vector<wchar_t> path(32'768u);
    DWORD path_size = static_cast<DWORD>(path.size());
    if (QueryFullProcessImageNameW(process, 0, path.data(), &path_size) != FALSE) {
        identity.executable_path.assign(path.data(), path_size);
        identity.name = friendly_process_name(executable_stem(identity.executable_path));
    }

    FILETIME creation{};
    FILETIME exit{};
    FILETIME kernel{};
    FILETIME user{};
    uint64_t creation_value = 0;
    if (GetProcessTimes(process, &creation, &exit, &kernel, &user) != FALSE) {
        creation_value =
            (static_cast<uint64_t>(creation.dwHighDateTime) << 32u) |
            creation.dwLowDateTime;
    }
    CloseHandle(process);

    uint64_t key = 1469598103934665603ull;
    key = fnv1a_u64(key, &process_id, sizeof(process_id));
    key = fnv1a_u64(key, &creation_value, sizeof(creation_value));
    identity.key = key == 0 ? 1 : key;
    if (identity.name.empty()) {
        identity.name = L"Windows audio";
    }
    return true;
}

bool should_ignore_process(const ProcessIdentity& identity) {
    if (identity.process_id == 0 || identity.process_id == GetCurrentProcessId()) {
        return true;
    }
    const std::wstring normalized = lowercase(executable_stem(identity.executable_path));
    return normalized == L"soundboard_audio_engine" || normalized == L"micdeck";
}

std::vector<uint8_t> extract_icon_rgba(const std::wstring& executable_path) {
    if (executable_path.empty()) {
        return {};
    }

    SHFILEINFOW file_info{};
    if (SHGetFileInfoW(
            executable_path.c_str(),
            FILE_ATTRIBUTE_NORMAL,
            &file_info,
            sizeof(file_info),
            SHGFI_ICON | SHGFI_LARGEICON) == 0 ||
        file_info.hIcon == nullptr) {
        return {};
    }

    HDC screen = GetDC(nullptr);
    HDC memory = screen == nullptr ? nullptr : CreateCompatibleDC(screen);
    BITMAPINFO bitmap_info{};
    bitmap_info.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    bitmap_info.bmiHeader.biWidth = static_cast<LONG>(kIconSize);
    bitmap_info.bmiHeader.biHeight = -static_cast<LONG>(kIconSize);
    bitmap_info.bmiHeader.biPlanes = 1;
    bitmap_info.bmiHeader.biBitCount = 32;
    bitmap_info.bmiHeader.biCompression = BI_RGB;

    void* pixels = nullptr;
    HBITMAP bitmap = memory == nullptr
        ? nullptr
        : CreateDIBSection(
              memory,
              &bitmap_info,
              DIB_RGB_COLORS,
              &pixels,
              nullptr,
              0);
    HGDIOBJ previous = nullptr;
    if (bitmap != nullptr) {
        previous = SelectObject(memory, bitmap);
        ZeroMemory(pixels, kIconSize * kIconSize * 4u);
        DrawIconEx(
            memory,
            0,
            0,
            file_info.hIcon,
            kIconSize,
            kIconSize,
            0,
            nullptr,
            DI_NORMAL);
    }

    std::vector<uint8_t> rgba;
    if (pixels != nullptr) {
        rgba.resize(kIconSize * kIconSize * 4u);
        const auto* bgra = static_cast<const uint8_t*>(pixels);
        bool has_alpha = false;
        for (size_t index = 0; index < rgba.size(); index += 4u) {
            rgba[index] = bgra[index + 2u];
            rgba[index + 1u] = bgra[index + 1u];
            rgba[index + 2u] = bgra[index];
            rgba[index + 3u] = bgra[index + 3u];
            has_alpha = has_alpha || bgra[index + 3u] != 0;
        }
        if (!has_alpha) {
            for (size_t index = 0; index < rgba.size(); index += 4u) {
                rgba[index + 3u] = (std::max)(
                    rgba[index],
                    (std::max)(rgba[index + 1u], rgba[index + 2u]));
            }
        }
    }

    if (previous != nullptr) SelectObject(memory, previous);
    if (bitmap != nullptr) DeleteObject(bitmap);
    if (memory != nullptr) DeleteDC(memory);
    if (screen != nullptr) ReleaseDC(nullptr, screen);
    DestroyIcon(file_info.hIcon);
    return rgba;
}

bool desired_volume_for(uint64_t key, float& volume) {
    std::lock_guard<std::mutex> lock(g_state_mutex);
    const auto desired = g_desired_volumes.find(key);
    if (desired == g_desired_volumes.end()) {
        return false;
    }
    volume = desired->second;
    return true;
}

void observe_device(
    IMMDevice* device,
    std::unordered_map<uint64_t, ObservedSession>& observed) {
    ComPtr<IAudioSessionManager2> manager;
    if (FAILED(device->Activate(
            __uuidof(IAudioSessionManager2),
            CLSCTX_ALL,
            nullptr,
            &manager))) {
        return;
    }

    ComPtr<IAudioSessionEnumerator> sessions;
    if (FAILED(manager->GetSessionEnumerator(&sessions))) {
        return;
    }

    int count = 0;
    if (FAILED(sessions->GetCount(&count))) {
        return;
    }

    for (int index = 0; index < count; ++index) {
        ComPtr<IAudioSessionControl> base_control;
        if (FAILED(sessions->GetSession(index, &base_control))) {
            continue;
        }

        ComPtr<IAudioSessionControl2> control;
        if (FAILED(base_control.As(&control))) {
            continue;
        }

        DWORD process_id = 0;
        if (FAILED(control->GetProcessId(&process_id)) || process_id == 0) {
            continue;
        }

        ProcessIdentity identity;
        query_process_identity(process_id, identity);
        if (should_ignore_process(identity)) {
            continue;
        }

        ComPtr<IAudioMeterInformation> meter;
        float peak = 0.0f;
        if (SUCCEEDED(base_control.As(&meter))) {
            meter->GetPeakValue(&peak);
        }
        peak = std::isfinite(peak) ? (std::max)(0.0f, (std::min)(peak, 1.5f)) : 0.0f;

        AudioSessionState session_state = AudioSessionStateInactive;
        base_control->GetState(&session_state);

        ComPtr<ISimpleAudioVolume> simple_volume;
        float volume = 1.0f;
        BOOL muted = FALSE;
        if (SUCCEEDED(base_control.As(&simple_volume))) {
            float desired = 1.0f;
            if (desired_volume_for(identity.key, desired)) {
                simple_volume->SetMasterVolume(desired, nullptr);
                simple_volume->SetMute(desired <= 0.0001f, nullptr);
            }
            simple_volume->GetMasterVolume(&volume);
            simple_volume->GetMute(&muted);
        }

        auto [entry, inserted] = observed.try_emplace(identity.key);
        if (inserted) {
            entry->second.identity = std::move(identity);
            entry->second.volume = volume;
            entry->second.muted = muted != FALSE;
        }
        entry->second.peak = (std::max)(entry->second.peak, peak);
        entry->second.volume = (std::min)(entry->second.volume, volume);
        entry->second.muted = entry->second.muted || muted != FALSE;
        entry->second.active =
            entry->second.active ||
            (session_state == AudioSessionStateActive && peak >= kActivityThreshold);
    }
}

std::unordered_map<uint64_t, ObservedSession> collect_sessions() {
    std::unordered_map<uint64_t, ObservedSession> observed;
    ComPtr<IMMDeviceEnumerator> enumerator;
    if (FAILED(CoCreateInstance(
            __uuidof(MMDeviceEnumerator),
            nullptr,
            CLSCTX_ALL,
            IID_PPV_ARGS(&enumerator)))) {
        return observed;
    }

    ComPtr<IMMDeviceCollection> devices;
    if (FAILED(enumerator->EnumAudioEndpoints(
            eRender,
            DEVICE_STATE_ACTIVE,
            &devices))) {
        return observed;
    }

    UINT count = 0;
    if (FAILED(devices->GetCount(&count))) {
        return observed;
    }
    for (UINT index = 0; index < count; ++index) {
        ComPtr<IMMDevice> device;
        if (SUCCEEDED(devices->Item(index, &device))) {
            observe_device(device.Get(), observed);
        }
    }
    return observed;
}

bool update_history(std::unordered_map<uint64_t, ObservedSession> observed) {
    const uint64_t now = GetTickCount64();
    bool any_active = false;
    std::lock_guard<std::mutex> lock(g_state_mutex);

    for (auto& [key, session] : observed) {
        const bool has_signal = session.peak >= kActivityThreshold;
        auto existing = g_history.find(key);
        if (!has_signal && existing == g_history.end()) {
            continue;
        }

        auto [history, inserted] = g_history.try_emplace(key);
        if (inserted) {
            history->second.identity = session.identity;
            history->second.icon_rgba =
                extract_icon_rgba(session.identity.executable_path);
        }
        history->second.peak = session.peak;
        history->second.volume = session.muted ? 0.0f : session.volume;
        history->second.muted = session.muted;
        history->second.active = session.active;
        history->second.last_seen_tick = now;
        if (has_signal) {
            history->second.last_active_tick = now;
            any_active = true;
        }
    }

    for (auto history = g_history.begin(); history != g_history.end();) {
        if (!observed.contains(history->first)) {
            history->second.peak = 0.0f;
            history->second.active = false;
            ProcessIdentity current_identity;
            if (query_process_identity(
                    history->second.identity.process_id,
                    current_identity) &&
                current_identity.key == history->first) {
                // Keep a minimized/suspended application in the recent list
                // even when it temporarily destroys its Core Audio session.
                history->second.last_seen_tick = now;
            }
        }
        if (now - history->second.last_seen_tick > kMissingSessionRetentionMs) {
            g_desired_volumes.erase(history->first);
            history = g_history.erase(history);
        } else {
            ++history;
        }
    }
    return any_active;
}

void monitor_main() {
    const HRESULT com_result = CoInitializeEx(nullptr, COINIT_MULTITHREADED);
    const bool uninitialize = SUCCEEDED(com_result);
    while (!g_monitor_stopping.load(std::memory_order_acquire)) {
        const bool any_active = update_history(collect_sessions());
        std::unique_lock<std::mutex> lock(g_wait_mutex);
        g_wait_condition.wait_for(
            lock,
            std::chrono::milliseconds(any_active ? 250 : 700),
            [] { return g_monitor_stopping.load(std::memory_order_acquire); });
    }
    if (uninitialize) {
        CoUninitialize();
    }
    g_monitor_running.store(false, std::memory_order_release);
}

void copy_wide(
    wchar_t* destination,
    uint32_t capacity,
    const std::wstring& source) {
    if (destination == nullptr || capacity == 0) {
        return;
    }
    wcsncpy_s(destination, capacity, source.c_str(), _TRUNCATE);
}

} // namespace

extern "C" {

int __cdecl sb_start_audio_session_monitor(void) {
    bool expected = false;
    if (!g_monitor_running.compare_exchange_strong(expected, true)) {
        return 1;
    }
    g_monitor_stopping.store(false, std::memory_order_release);
    try {
        g_monitor_thread = std::thread(monitor_main);
        return 1;
    } catch (...) {
        g_monitor_running.store(false, std::memory_order_release);
        return 0;
    }
}

void __cdecl sb_stop_audio_session_monitor(void) {
    if (!g_monitor_running.load(std::memory_order_acquire) &&
        !g_monitor_thread.joinable()) {
        return;
    }
    g_monitor_stopping.store(true, std::memory_order_release);
    g_wait_condition.notify_all();
    if (g_monitor_thread.joinable()) {
        g_monitor_thread.join();
    }
    g_monitor_running.store(false, std::memory_order_release);
}

uint32_t __cdecl sb_get_audio_sessions(
    SbAudioSession* sessions,
    uint32_t capacity) {
    std::vector<SessionHistory> ordered;
    const uint64_t now = GetTickCount64();
    {
        std::lock_guard<std::mutex> lock(g_state_mutex);
        ordered.reserve(g_history.size());
        for (const auto& [_, history] : g_history) {
            ordered.push_back(history);
        }
    }

    std::sort(
        ordered.begin(),
        ordered.end(),
        [](const SessionHistory& left, const SessionHistory& right) {
            if (left.active != right.active) return left.active > right.active;
            return left.last_active_tick > right.last_active_tick;
        });

    if (sessions == nullptr || capacity == 0) {
        return static_cast<uint32_t>(ordered.size());
    }

    const uint32_t count = (std::min)(
        capacity,
        static_cast<uint32_t>(ordered.size()));
    for (uint32_t index = 0; index < count; ++index) {
        const auto& source = ordered[index];
        auto& destination = sessions[index];
        ZeroMemory(&destination, sizeof(destination));
        destination.session_key = source.identity.key;
        destination.peak_level = source.peak;
        destination.volume = source.volume;
        destination.muted = source.muted ? 1 : 0;
        destination.active = source.active ? 1 : 0;
        destination.last_active_age_ms =
            source.last_active_tick == 0 ? UINT64_MAX : now - source.last_active_tick;
        copy_wide(
            destination.name,
            SB_AUDIO_SESSION_NAME_CAPACITY,
            source.identity.name);
    }
    return count;
}

int __cdecl sb_set_audio_session_volume(uint64_t session_key, float volume) {
    if (!std::isfinite(volume)) {
        return 0;
    }
    volume = (std::max)(0.0f, (std::min)(volume, 1.0f));
    std::lock_guard<std::mutex> lock(g_state_mutex);
    auto history = g_history.find(session_key);
    if (history == g_history.end()) {
        return 0;
    }
    g_desired_volumes[session_key] = volume;
    history->second.volume = volume;
    history->second.muted = volume <= 0.0001f;
    return 1;
}

uint32_t __cdecl sb_get_audio_session_icon_rgba(
    uint64_t session_key,
    uint8_t* rgba,
    uint32_t capacity,
    uint32_t* width,
    uint32_t* height) {
    std::lock_guard<std::mutex> lock(g_state_mutex);
    const auto history = g_history.find(session_key);
    if (history == g_history.end() || history->second.icon_rgba.empty()) {
        return 0;
    }
    if (width != nullptr) *width = kIconSize;
    if (height != nullptr) *height = kIconSize;
    const uint32_t required =
        static_cast<uint32_t>(history->second.icon_rgba.size());
    if (rgba == nullptr || capacity < required) {
        return required;
    }
    std::copy(
        history->second.icon_rgba.begin(),
        history->second.icon_rgba.end(),
        rgba);
    return required;
}

int __cdecl sb_repair_default_capture_endpoint(
    const wchar_t* endpoint_id,
    wchar_t* error,
    uint32_t error_capacity) {
    if (endpoint_id == nullptr || endpoint_id[0] == L'\0') {
        copy_wide(error, error_capacity, L"Missing physical microphone endpoint.");
        return 0;
    }
    std::wstring repair_error;
    if (!set_default_capture_endpoint(endpoint_id, repair_error)) {
        copy_wide(error, error_capacity, repair_error);
        return 0;
    }
    copy_wide(error, error_capacity, L"");
    return 1;
}

} // extern "C"
