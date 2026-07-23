#define WIN32_LEAN_AND_MEAN
#define NOMINMAX

#include "audio_engine.h"
#include "default_endpoint.h"
#include "soundboard_ipc.h"

#include <windows.h>

#include <string>

int WINAPI wWinMain(HINSTANCE, HINSTANCE, PWSTR, int) {
    HANDLE instance_mutex =
        CreateMutexW(nullptr, TRUE, L"Local\\MicDeck.AudioEngine.v4");
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
    DefaultCaptureEndpoints previous_defaults;
    bool captured_previous_defaults = false;
    std::wstring managed_capture_id;

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

            if (!captured_previous_defaults) {
                std::wstring ignored;
                if (!get_default_capture_endpoints(previous_defaults, ignored)) {
                    previous_defaults.console = input_id;
                    previous_defaults.multimedia = input_id;
                    previous_defaults.communications = input_id;
                }
                captured_previous_defaults = true;
            }
            managed_capture_id = virtual_capture_id;

            engine.stop();
            sb_engine_set_state(1, L"");
            std::wstring error;
            if (engine.start(input_id, output_id, error)) {
                std::wstring routing_error;
                set_default_capture_endpoint(virtual_capture_id, routing_error);
                sb_engine_set_state(2, routing_error.c_str());
            } else {
                sb_engine_set_state(3, error.c_str());
            }
        }

        Sleep(100);
    }

    engine.stop();
    if (captured_previous_defaults && !managed_capture_id.empty()) {
        std::wstring ignored;
        restore_default_capture_endpoints(previous_defaults, managed_capture_id, ignored);
    }
    sb_engine_set_state(0, L"");
    sb_close();
    ReleaseMutex(instance_mutex);
    CloseHandle(instance_mutex);
    return 0;
}
