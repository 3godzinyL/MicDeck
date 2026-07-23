#define WIN32_LEAN_AND_MEAN
#define SOUNDBOARD_IPC_EXPORTS

#include "soundboard_ipc.h"
#include "soundboard_protocol.h"

#include <math.h>
#include <string.h>

static HANDLE g_mapping = NULL;
static HANDLE g_audio_event = NULL;
static HANDLE g_config_event = NULL;
static SbSharedState* g_state = NULL;
static SRWLOCK g_config_write_lock = SRWLOCK_INIT;

static LONG clamp_milli(float value) {
    if (!isfinite(value)) {
        return 1000;
    }
    if (value < 0.0f) {
        value = 0.0f;
    } else if (value > 24.0f) {
        /* Overdrive stage lets the soundboard gain reach 600% x4 = 2400%. */
        value = 24.0f;
    }
    return (LONG)(value * 1000.0f + 0.5f);
}

static LONG clamp_level(float value) {
    if (!isfinite(value) || value < 0.0f) {
        return 0;
    }
    if (value > 1.5f) {
        value = 1.5f;
    }
    return (LONG)(value * 1000.0f + 0.5f);
}

static LONG atomic_read(volatile LONG* value) {
    return InterlockedCompareExchange(value, 0, 0);
}

static LONG64 atomic_read64(volatile LONG64* value) {
    return InterlockedCompareExchange64(value, 0, 0);
}

static void copy_wide(wchar_t* destination, size_t capacity, const wchar_t* source) {
    if (capacity == 0) {
        return;
    }
    if (source == NULL) {
        destination[0] = L'\0';
        return;
    }
    wcsncpy_s(destination, capacity, source, _TRUNCATE);
}

int __cdecl sb_open(int create_session) {
    BOOL already_exists = FALSE;

    if (g_state != NULL) {
        return 1;
    }

    if (create_session) {
        g_mapping = CreateFileMappingW(
            INVALID_HANDLE_VALUE,
            NULL,
            PAGE_READWRITE,
            0,
            (DWORD)sizeof(SbSharedState),
            SB_MAPPING_NAME);
        already_exists = GetLastError() == ERROR_ALREADY_EXISTS;
    } else {
        g_mapping = OpenFileMappingW(FILE_MAP_ALL_ACCESS, FALSE, SB_MAPPING_NAME);
    }

    if (g_mapping == NULL) {
        return 0;
    }

    g_state = (SbSharedState*)MapViewOfFile(
        g_mapping,
        FILE_MAP_ALL_ACCESS,
        0,
        0,
        sizeof(SbSharedState));
    if (g_state == NULL) {
        CloseHandle(g_mapping);
        g_mapping = NULL;
        return 0;
    }

    g_audio_event = CreateEventW(NULL, FALSE, FALSE, SB_AUDIO_EVENT_NAME);
    g_config_event = CreateEventW(NULL, FALSE, FALSE, SB_CONFIG_EVENT_NAME);
    if (g_audio_event == NULL || g_config_event == NULL) {
        sb_close();
        return 0;
    }

    if ((create_session && !already_exists) || g_state->magic != SB_PROTOCOL_MAGIC ||
        g_state->version != SB_PROTOCOL_VERSION) {
        ZeroMemory(g_state, sizeof(*g_state));
        g_state->magic = SB_PROTOCOL_MAGIC;
        g_state->version = SB_PROTOCOL_VERSION;
        g_state->mic_gain_milli = 1000;
        g_state->sound_gain_milli = 1000;
        g_state->system_gain_milli = 850;
        MemoryBarrier();
    }

    return 1;
}

void __cdecl sb_close(void) {
    if (g_state != NULL) {
        UnmapViewOfFile(g_state);
        g_state = NULL;
    }
    if (g_audio_event != NULL) {
        CloseHandle(g_audio_event);
        g_audio_event = NULL;
    }
    if (g_config_event != NULL) {
        CloseHandle(g_config_event);
        g_config_event = NULL;
    }
    if (g_mapping != NULL) {
        CloseHandle(g_mapping);
        g_mapping = NULL;
    }
}

int __cdecl sb_reset_session(void) {
    if (g_state == NULL) {
        return 0;
    }
    InterlockedExchange(&g_state->shutdown_requested, 0);
    InterlockedExchange(&g_state->engine_state, SB_ENGINE_STOPPED);
    InterlockedExchange(&g_state->engine_pid, 0);
    InterlockedExchange(&g_state->mic_level_milli, 0);
    InterlockedExchange(&g_state->system_level_milli, 0);
    InterlockedExchange(&g_state->mix_level_milli, 0);
    InterlockedExchange(&g_state->underruns, 0);
    InterlockedExchange(&g_state->capture_overruns, 0);
    InterlockedExchange(&g_state->dropped_audio_frames, 0);
    InterlockedExchange(&g_state->latency_us, 0);
    InterlockedExchange64(&g_state->audio_read_frame, atomic_read64(&g_state->audio_write_frame));
    copy_wide(g_state->last_error, SB_ERROR_CAPACITY, L"");
    sb_touch_ui();
    return 1;
}

int __cdecl sb_set_config(
    const wchar_t* input_id,
    const wchar_t* output_id,
    const wchar_t* virtual_capture_id) {
    if (g_state == NULL || input_id == NULL || output_id == NULL ||
        virtual_capture_id == NULL) {
        return 0;
    }

    AcquireSRWLockExclusive(&g_config_write_lock);
    InterlockedIncrement(&g_state->config_sequence);
    MemoryBarrier();
    copy_wide(g_state->input_device_id, SB_DEVICE_ID_CAPACITY, input_id);
    copy_wide(g_state->output_device_id, SB_DEVICE_ID_CAPACITY, output_id);
    copy_wide(
        g_state->virtual_capture_device_id,
        SB_DEVICE_ID_CAPACITY,
        virtual_capture_id);
    MemoryBarrier();
    InterlockedIncrement(&g_state->config_sequence);
    InterlockedIncrement(&g_state->config_generation);
    ReleaseSRWLockExclusive(&g_config_write_lock);
    SetEvent(g_config_event);
    return 1;
}

int __cdecl sb_set_input_device(const wchar_t* endpoint_id) {
    if (g_state == NULL || endpoint_id == NULL) {
        return 0;
    }
    copy_wide(g_state->input_device_id, SB_DEVICE_ID_CAPACITY, endpoint_id);
    MemoryBarrier();
    InterlockedIncrement(&g_state->config_generation);
    SetEvent(g_config_event);
    return 1;
}

int __cdecl sb_set_output_device(const wchar_t* endpoint_id) {
    if (g_state == NULL || endpoint_id == NULL) {
        return 0;
    }
    copy_wide(g_state->output_device_id, SB_DEVICE_ID_CAPACITY, endpoint_id);
    MemoryBarrier();
    InterlockedIncrement(&g_state->config_generation);
    SetEvent(g_config_event);
    return 1;
}

int __cdecl sb_set_virtual_capture_device(const wchar_t* endpoint_id) {
    if (g_state == NULL || endpoint_id == NULL) {
        return 0;
    }
    copy_wide(g_state->virtual_capture_device_id, SB_DEVICE_ID_CAPACITY, endpoint_id);
    MemoryBarrier();
    InterlockedIncrement(&g_state->config_generation);
    SetEvent(g_config_event);
    return 1;
}

int __cdecl sb_set_gains(float microphone_gain, float sound_gain) {
    if (g_state == NULL) {
        return 0;
    }
    InterlockedExchange(&g_state->mic_gain_milli, clamp_milli(microphone_gain));
    InterlockedExchange(&g_state->sound_gain_milli, clamp_milli(sound_gain));
    return 1;
}

void __cdecl sb_get_gains(float* microphone_gain, float* sound_gain) {
    if (microphone_gain != NULL) {
        *microphone_gain = g_state == NULL ? 1.0f : atomic_read(&g_state->mic_gain_milli) / 1000.0f;
    }
    if (sound_gain != NULL) {
        *sound_gain = g_state == NULL ? 1.0f : atomic_read(&g_state->sound_gain_milli) / 1000.0f;
    }
}

int __cdecl sb_set_monitor_gain(float monitor_gain) {
    if (g_state == NULL) {
        return 0;
    }
    InterlockedExchange(&g_state->monitor_gain_milli, clamp_milli(monitor_gain));
    return 1;
}

float __cdecl sb_get_monitor_gain(void) {
    return g_state == NULL ? 0.0f : atomic_read(&g_state->monitor_gain_milli) / 1000.0f;
}

int __cdecl sb_set_system_audio(int enabled, float gain) {
    if (g_state == NULL) {
        return 0;
    }
    InterlockedExchange(&g_state->system_capture_enabled, enabled != 0 ? 1 : 0);
    InterlockedExchange(&g_state->system_gain_milli, clamp_milli(gain));
    return 1;
}

void __cdecl sb_get_system_audio(int* enabled, float* gain) {
    if (enabled != NULL) {
        *enabled = g_state != NULL && atomic_read(&g_state->system_capture_enabled) != 0;
    }
    if (gain != NULL) {
        *gain = g_state == NULL ? 0.85f : atomic_read(&g_state->system_gain_milli) / 1000.0f;
    }
}

uint32_t __cdecl sb_push_audio(const float* samples, uint32_t frames, uint32_t channels) {
    LONG64 write_frame;
    LONG64 read_frame;
    uint32_t available;
    uint32_t accepted;
    uint32_t frame;

    if (g_state == NULL || samples == NULL || frames == 0 || (channels != 1 && channels != 2)) {
        return 0;
    }

    write_frame = atomic_read64(&g_state->audio_write_frame);
    read_frame = atomic_read64(&g_state->audio_read_frame);
    if (write_frame < read_frame) {
        return 0;
    }

    available = SB_AUDIO_CAPACITY_FRAMES -
        (uint32_t)((write_frame - read_frame) > SB_AUDIO_CAPACITY_FRAMES
            ? SB_AUDIO_CAPACITY_FRAMES
            : (write_frame - read_frame));
    accepted = frames < available ? frames : available;
    if (accepted < frames) {
        InterlockedExchangeAdd(
            &g_state->dropped_audio_frames,
            (LONG)(frames - accepted));
    }

    for (frame = 0; frame < accepted; ++frame) {
        const uint32_t destination = (uint32_t)((write_frame + frame) % SB_AUDIO_CAPACITY_FRAMES) * 2u;
        if (channels == 1) {
            const float value = samples[frame];
            g_state->sound_audio[destination] = value;
            g_state->sound_audio[destination + 1u] = value;
        } else {
            g_state->sound_audio[destination] = samples[frame * 2u];
            g_state->sound_audio[destination + 1u] = samples[frame * 2u + 1u];
        }
    }

    MemoryBarrier();
    InterlockedExchange64(&g_state->audio_write_frame, write_frame + accepted);
    if (accepted > 0) {
        SetEvent(g_audio_event);
    }
    return accepted;
}

uint32_t __cdecl sb_pop_audio(float* stereo_samples, uint32_t frames) {
    LONG64 write_frame;
    LONG64 read_frame;
    uint32_t available;
    uint32_t popped;
    uint32_t frame;

    if (g_state == NULL || stereo_samples == NULL || frames == 0) {
        return 0;
    }

    read_frame = atomic_read64(&g_state->audio_read_frame);
    write_frame = atomic_read64(&g_state->audio_write_frame);
    if (write_frame < read_frame) {
        return 0;
    }
    available = (uint32_t)((write_frame - read_frame) > SB_AUDIO_CAPACITY_FRAMES
        ? SB_AUDIO_CAPACITY_FRAMES
        : (write_frame - read_frame));
    popped = frames < available ? frames : available;

    MemoryBarrier();
    for (frame = 0; frame < popped; ++frame) {
        const uint32_t source = (uint32_t)((read_frame + frame) % SB_AUDIO_CAPACITY_FRAMES) * 2u;
        stereo_samples[frame * 2u] = g_state->sound_audio[source];
        stereo_samples[frame * 2u + 1u] = g_state->sound_audio[source + 1u];
    }

    InterlockedExchange64(&g_state->audio_read_frame, read_frame + popped);
    return popped;
}

void __cdecl sb_clear_audio(void) {
    if (g_state != NULL) {
        InterlockedExchange64(&g_state->audio_read_frame, atomic_read64(&g_state->audio_write_frame));
    }
}

int __cdecl sb_get_status(SbStatus* status) {
    if (g_state == NULL || status == NULL) {
        return 0;
    }
    ZeroMemory(status, sizeof(*status));
    status->protocol_version = g_state->version;
    status->connected = 1;
    status->engine_state = atomic_read(&g_state->engine_state);
    status->engine_pid = (uint32_t)atomic_read(&g_state->engine_pid);
    status->microphone_level = atomic_read(&g_state->mic_level_milli) / 1000.0f;
    status->system_level = atomic_read(&g_state->system_level_milli) / 1000.0f;
    status->mixed_level = atomic_read(&g_state->mix_level_milli) / 1000.0f;
    status->underruns = (uint32_t)atomic_read(&g_state->underruns);
    status->capture_overruns = (uint32_t)atomic_read(&g_state->capture_overruns);
    status->dropped_audio_frames =
        (uint32_t)atomic_read(&g_state->dropped_audio_frames);
    status->estimated_latency_ms = atomic_read(&g_state->latency_us) / 1000.0f;
    copy_wide(status->last_error, 256, g_state->last_error);
    return 1;
}

int __cdecl sb_get_config(
    wchar_t* input_id,
    uint32_t input_capacity,
    wchar_t* output_id,
    uint32_t output_capacity,
    wchar_t* virtual_capture_id,
    uint32_t virtual_capture_capacity,
    uint32_t* generation) {
    if (g_state == NULL) {
        return 0;
    }
    for (;;) {
        LONG sequence_before;
        LONG sequence_after;
        sequence_before = atomic_read(&g_state->config_sequence);
        if ((sequence_before & 1) != 0) {
            SwitchToThread();
            continue;
        }
        MemoryBarrier();
        if (input_id != NULL) {
            copy_wide(input_id, input_capacity, g_state->input_device_id);
        }
        if (output_id != NULL) {
            copy_wide(output_id, output_capacity, g_state->output_device_id);
        }
        if (virtual_capture_id != NULL) {
            copy_wide(
                virtual_capture_id,
                virtual_capture_capacity,
                g_state->virtual_capture_device_id);
        }
        MemoryBarrier();
        sequence_after = atomic_read(&g_state->config_sequence);
        if (sequence_before == sequence_after && (sequence_after & 1) == 0) {
            break;
        }
    }
    if (generation != NULL) {
        *generation = (uint32_t)atomic_read(&g_state->config_generation);
    }
    return 1;
}

uint32_t __cdecl sb_get_config_generation(void) {
    return g_state == NULL ? 0u : (uint32_t)atomic_read(&g_state->config_generation);
}

void __cdecl sb_touch_ui(void) {
    if (g_state != NULL) {
        InterlockedExchange(&g_state->ui_heartbeat_ms, (LONG)GetTickCount());
    }
}

void __cdecl sb_touch_engine(void) {
    if (g_state != NULL) {
        InterlockedExchange(&g_state->engine_heartbeat_ms, (LONG)GetTickCount());
    }
}

int __cdecl sb_is_ui_alive(uint32_t timeout_ms) {
    DWORD then;
    DWORD now;
    if (g_state == NULL) {
        return 0;
    }
    then = (DWORD)atomic_read(&g_state->ui_heartbeat_ms);
    now = GetTickCount();
    return then != 0 && (DWORD)(now - then) <= timeout_ms;
}

void __cdecl sb_request_shutdown(void) {
    if (g_state != NULL) {
        InterlockedExchange(&g_state->shutdown_requested, 1);
        SetEvent(g_config_event);
    }
}

int __cdecl sb_engine_should_shutdown(void) {
    return g_state == NULL || atomic_read(&g_state->shutdown_requested) != 0;
}

void __cdecl sb_engine_set_state(int state, const wchar_t* error_message) {
    if (g_state == NULL) {
        return;
    }
    InterlockedExchange(&g_state->engine_pid, (LONG)GetCurrentProcessId());
    copy_wide(g_state->last_error, SB_ERROR_CAPACITY, error_message == NULL ? L"" : error_message);
    MemoryBarrier();
    InterlockedExchange(&g_state->engine_state, state);
    sb_touch_engine();
}

void __cdecl sb_engine_set_levels(
    float microphone_level,
    float system_level,
    float mixed_level,
    uint32_t underruns,
    uint32_t capture_overruns,
    float estimated_latency_ms) {
    if (g_state == NULL) {
        return;
    }
    InterlockedExchange(&g_state->mic_level_milli, clamp_level(microphone_level));
    InterlockedExchange(&g_state->system_level_milli, clamp_level(system_level));
    InterlockedExchange(&g_state->mix_level_milli, clamp_level(mixed_level));
    InterlockedExchange(&g_state->underruns, (LONG)underruns);
    InterlockedExchange(&g_state->capture_overruns, (LONG)capture_overruns);
    InterlockedExchange(
        &g_state->latency_us,
        (LONG)(fmaxf(0.0f, fminf(estimated_latency_ms, 1000.0f)) * 1000.0f + 0.5f));
}

BOOL WINAPI DllMain(HINSTANCE instance, DWORD reason, LPVOID reserved) {
    (void)instance;
    (void)reserved;
    if (reason == DLL_PROCESS_DETACH) {
        sb_close();
    }
    return TRUE;
}
