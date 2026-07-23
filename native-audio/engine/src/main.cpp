#define WIN32_LEAN_AND_MEAN
#define NOMINMAX

#include "audio_engine.h"
#include "soundboard_ipc.h"

#include <windows.h>

#include <string>

int WINAPI wWinMain(HINSTANCE, HINSTANCE, PWSTR, int) {
    HANDLE instance_mutex =
        CreateMutexW(nullptr, TRUE, L"Local\\MicDeck.AudioEngine.v5");
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

            engine.stop();
            sb_engine_set_state(1, L"");
            std::wstring error;
            if (engine.start(input_id, output_id, error)) {
                sb_engine_set_state(2, engine.warning().c_str());
            } else {
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
