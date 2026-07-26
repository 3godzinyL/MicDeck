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
    float microphone_input_level;
    float microphone_output_level;
    float system_input_level;
    float system_output_level;
    float voice_probability;
    float microphone_applied_gain;
    float system_applied_gain;
    uint32_t underruns;
    uint32_t capture_overruns;
    uint32_t dropped_audio_frames;
    float estimated_latency_ms;
    wchar_t last_error[256];
} SbStatus;

#define SB_AUDIO_SESSION_NAME_CAPACITY 128u
#ifndef SB_STREAM_SOURCE_CAPACITY
#define SB_STREAM_SOURCE_CAPACITY 12u
#endif

typedef struct SbAudioSession {
    uint64_t session_key;
    uint32_t process_id;
    float peak_level;
    float volume;
    int32_t muted;
    int32_t active;
    uint64_t last_active_age_ms;
    wchar_t name[SB_AUDIO_SESSION_NAME_CAPACITY];
} SbAudioSession;

typedef struct SbStreamSource {
    uint64_t session_key;
    uint32_t process_id;
    float gain;
    int32_t active;
} SbStreamSource;

SB_API int __cdecl sb_open(int create_session);
SB_API void __cdecl sb_close(void);
SB_API int __cdecl sb_reset_session(void);
SB_API int __cdecl sb_set_config(
    const wchar_t* input_id,
    const wchar_t* output_id,
    const wchar_t* virtual_capture_id);
SB_API int __cdecl sb_set_input_device(const wchar_t* endpoint_id);
SB_API int __cdecl sb_set_output_device(const wchar_t* endpoint_id);
SB_API int __cdecl sb_set_virtual_capture_device(const wchar_t* endpoint_id);
SB_API int __cdecl sb_set_gains(float microphone_gain, float sound_gain);
SB_API void __cdecl sb_get_gains(float* microphone_gain, float* sound_gain);
SB_API int __cdecl sb_set_monitor_gain(float monitor_gain);
SB_API float __cdecl sb_get_monitor_gain(void);
SB_API int __cdecl sb_set_system_audio(int enabled, float gain);
SB_API void __cdecl sb_get_system_audio(int* enabled, float* gain);
SB_API int __cdecl sb_set_voice_processing(
    int aec_enabled,
    int rnnoise_enabled,
    int auto_level_enabled,
    float target_min_db,
    float target_max_db,
    int voice_monitor_enabled,
    float voice_monitor_gain,
    int noise_gate_enabled,
    float gate_threshold_db,
    float compressor_ratio,
    float limiter_ceiling_db);
SB_API void __cdecl sb_get_voice_processing(
    int* aec_enabled,
    int* rnnoise_enabled,
    int* auto_level_enabled,
    float* target_min_db,
    float* target_max_db,
    int* voice_monitor_enabled,
    float* voice_monitor_gain,
    int* noise_gate_enabled,
    float* gate_threshold_db,
    float* compressor_ratio,
    float* limiter_ceiling_db);
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
    uint32_t capture_overruns,
    float estimated_latency_ms);
SB_API void __cdecl sb_engine_set_processing_levels(
    float microphone_input_level,
    float microphone_output_level,
    float system_input_level,
    float system_output_level,
    float voice_probability,
    float microphone_applied_gain,
    float system_applied_gain);
SB_API int __cdecl sb_start_audio_session_monitor(void);
SB_API void __cdecl sb_stop_audio_session_monitor(void);
SB_API uint32_t __cdecl sb_get_audio_sessions(SbAudioSession* sessions, uint32_t capacity);
SB_API int __cdecl sb_set_audio_session_volume(uint64_t session_key, float volume);
SB_API int __cdecl sb_set_stream_sources(const SbStreamSource* sources, uint32_t count);
SB_API uint32_t __cdecl sb_get_stream_sources(SbStreamSource* sources, uint32_t capacity);
SB_API uint32_t __cdecl sb_get_audio_session_icon_rgba(
    uint64_t session_key,
    uint8_t* rgba,
    uint32_t capacity,
    uint32_t* width,
    uint32_t* height);
SB_API int __cdecl sb_repair_default_capture_endpoint(
    const wchar_t* endpoint_id,
    wchar_t* error,
    uint32_t error_capacity);

#ifdef __cplusplus
}
#endif
