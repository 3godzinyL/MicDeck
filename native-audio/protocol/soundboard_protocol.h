#pragma once

#include <windows.h>
#include <stdint.h>

#define SB_PROTOCOL_MAGIC 0x53424155u
#define SB_PROTOCOL_VERSION 7u
#define SB_SAMPLE_RATE 48000u
#define SB_CHANNELS 2u
#define SB_AUDIO_CAPACITY_FRAMES (SB_SAMPLE_RATE * 2u)
#define SB_DEVICE_ID_CAPACITY 512u
#define SB_ERROR_CAPACITY 256u
#ifndef SB_STREAM_SOURCE_CAPACITY
#define SB_STREAM_SOURCE_CAPACITY 12u
#endif

#define SB_MAPPING_NAME L"Local\\MicDeck.Audio.v7"
#define SB_AUDIO_EVENT_NAME L"Local\\MicDeck.AudioData.v7"
#define SB_CONFIG_EVENT_NAME L"Local\\MicDeck.Config.v7"

enum SbEngineState {
    SB_ENGINE_STOPPED = 0,
    SB_ENGINE_STARTING = 1,
    SB_ENGINE_READY = 2,
    SB_ENGINE_ERROR = 3
};

typedef struct SbSharedStreamSource {
    volatile LONG64 session_key;
    volatile LONG process_id;
    volatile LONG gain_milli;
    volatile LONG active;
} SbSharedStreamSource;

typedef struct SbSharedState {
    uint32_t magic;
    uint32_t version;
    volatile LONG engine_state;
    volatile LONG engine_pid;
    volatile LONG shutdown_requested;
    volatile LONG config_generation;
    volatile LONG config_sequence;
    volatile LONG mic_gain_milli;
    volatile LONG sound_gain_milli;
    volatile LONG monitor_gain_milli;
    volatile LONG system_gain_milli;
    volatile LONG system_capture_enabled;
    volatile LONG aec_enabled;
    volatile LONG rnnoise_enabled;
    volatile LONG auto_level_enabled;
    volatile LONG target_min_db_centi;
    volatile LONG target_max_db_centi;
    volatile LONG voice_monitor_enabled;
    volatile LONG voice_monitor_gain_milli;
    volatile LONG noise_gate_enabled;
    volatile LONG gate_threshold_db_centi;
    volatile LONG compressor_ratio_milli;
    volatile LONG limiter_ceiling_db_centi;
    volatile LONG stream_sources_sequence;
    volatile LONG stream_sources_generation;
    volatile LONG stream_source_count;
    volatile LONG mic_level_milli;
    volatile LONG system_level_milli;
    volatile LONG mix_level_milli;
    volatile LONG mic_input_level_milli;
    volatile LONG mic_output_level_milli;
    volatile LONG system_input_level_milli;
    volatile LONG system_output_level_milli;
    volatile LONG voice_probability_milli;
    volatile LONG mic_applied_gain_milli;
    volatile LONG system_applied_gain_milli;
    volatile LONG underruns;
    volatile LONG capture_overruns;
    volatile LONG dropped_audio_frames;
    volatile LONG latency_us;
    volatile LONG ui_heartbeat_ms;
    volatile LONG engine_heartbeat_ms;
    volatile LONG64 audio_write_frame;
    volatile LONG64 audio_read_frame;
    wchar_t input_device_id[SB_DEVICE_ID_CAPACITY];
    wchar_t output_device_id[SB_DEVICE_ID_CAPACITY];
    wchar_t virtual_capture_device_id[SB_DEVICE_ID_CAPACITY];
    wchar_t last_error[SB_ERROR_CAPACITY];
    SbSharedStreamSource stream_sources[SB_STREAM_SOURCE_CAPACITY];
    float sound_audio[SB_AUDIO_CAPACITY_FRAMES * SB_CHANNELS];
} SbSharedState;
