#pragma once

#include <windows.h>
#include <stdint.h>

#ifdef SOUNDBOARD_IPC_EXPORTS
#define SB_API __declspec(dllexport)
#else
#define SB_API __declspec(dllimport)
#endif

#ifdef __cplusplus
extern "C" {
#endif

typedef struct SbStatus {
    uint32_t protocol_version;
    int32_t connected;
    int32_t engine_state;
    uint32_t engine_pid;
    float microphone_level;
    float system_level;
    float mixed_level;
    uint32_t underruns;
    float estimated_latency_ms;
    wchar_t last_error[256];
} SbStatus;

SB_API int __cdecl sb_open(int create_session);
SB_API void __cdecl sb_close(void);
SB_API int __cdecl sb_reset_session(void);
SB_API int __cdecl sb_set_input_device(const wchar_t* endpoint_id);
SB_API int __cdecl sb_set_output_device(const wchar_t* endpoint_id);
SB_API int __cdecl sb_set_virtual_capture_device(const wchar_t* endpoint_id);
SB_API int __cdecl sb_set_gains(float microphone_gain, float sound_gain);
SB_API void __cdecl sb_get_gains(float* microphone_gain, float* sound_gain);
SB_API int __cdecl sb_set_monitor_gain(float monitor_gain);
SB_API float __cdecl sb_get_monitor_gain(void);
SB_API int __cdecl sb_set_system_audio(int enabled, float gain);
SB_API void __cdecl sb_get_system_audio(int* enabled, float* gain);
SB_API uint32_t __cdecl sb_push_audio(const float* samples, uint32_t frames, uint32_t channels);
SB_API uint32_t __cdecl sb_pop_audio(float* stereo_samples, uint32_t frames);
SB_API void __cdecl sb_clear_audio(void);
SB_API int __cdecl sb_get_status(SbStatus* status);
SB_API int __cdecl sb_get_config(
    wchar_t* input_id,
    uint32_t input_capacity,
    wchar_t* output_id,
    uint32_t output_capacity,
    wchar_t* virtual_capture_id,
    uint32_t virtual_capture_capacity,
    uint32_t* generation);
SB_API uint32_t __cdecl sb_get_config_generation(void);
SB_API void __cdecl sb_touch_ui(void);
SB_API void __cdecl sb_touch_engine(void);
SB_API int __cdecl sb_is_ui_alive(uint32_t timeout_ms);
SB_API void __cdecl sb_request_shutdown(void);
SB_API int __cdecl sb_engine_should_shutdown(void);
SB_API void __cdecl sb_engine_set_state(int state, const wchar_t* error_message);
SB_API void __cdecl sb_engine_set_levels(
    float microphone_level,
    float system_level,
    float mixed_level,
    uint32_t underruns,
    float estimated_latency_ms);

#ifdef __cplusplus
}
#endif
