#define WIN32_LEAN_AND_MEAN
#define NOMINMAX

#include "audio_engine.h"
#include "soundboard_ipc.h"

#include <windows.h>

#include <string>

int WINAPI wWinMain(HINSTANCE, HINSTANCE, PWSTR, int) {
    HANDLE instance_mutex =
        CreateMutexW(nullptr, TRUE, L"Local\\MicDeck.AudioEngine.v8");
    if (instance_mutex == nullptr) {
        return 4;
    }
    if (GetLastError() == ERROR_ALREADY_EXISTS) {
        CloseHandle(instance_mutex);
        return 0;
    }

    if (!sb_open(0)) {
        ReleaseMutex(instance_mutex);
        CloseHandle(instance_mutex);
        return 2;
    }

    sb_engine_set_state(1, L"");
    AudioEngine engine;
    uint32_t active_generation = UINT32_MAX;
    std::wstring active_input_id;
    std::wstring active_output_id;
    bool route_configured = false;
    bool engine_started = false;
    ULONGLONG next_reconnect_tick = 0;

    while (!sb_engine_should_shutdown()) {
        sb_touch_engine();
        if (!sb_is_ui_alive(10000)) {
            break;
        }

        const uint32_t generation = sb_get_config_generation();
        if (generation != active_generation) {
            wchar_t input_id[512]{};
            wchar_t output_id[512]{};
            wchar_t virtual_capture_id[512]{};
            uint32_t current_generation = 0;
            sb_get_config(
                input_id,
                512,
                output_id,
                512,
                virtual_capture_id,
                512,
                &current_generation);
            active_generation = current_generation;
            active_input_id = input_id;
            active_output_id = output_id;
            route_configured =
                !active_input_id.empty() && !active_output_id.empty();
            engine_started = false;
            next_reconnect_tick = 0;
            engine.stop();
        }

        const ULONGLONG now = GetTickCount64();
        const bool route_failed =
            route_configured && (!engine_started || !engine.healthy());
        if (route_failed && now >= next_reconnect_tick) {
            engine.stop();
            sb_engine_set_state(
                1,
                engine_started
                    ? L"Audio endpoint disconnected. Reconnecting..."
                    : L"Starting audio route...");

            std::wstring error;
            if (engine.start(active_input_id, active_output_id, error)) {
                engine_started = true;
                next_reconnect_tick = 0;
                sb_engine_set_state(2, engine.warning().c_str());
            } else {
                engine_started = false;
                next_reconnect_tick = now + 1000;
                sb_engine_set_state(3, error.c_str());
            }
        }

        Sleep(100);
    }

    engine.stop();
    sb_engine_set_state(0, L"");
    sb_close();
    ReleaseMutex(instance_mutex);
    CloseHandle(instance_mutex);
    return 0;
}
