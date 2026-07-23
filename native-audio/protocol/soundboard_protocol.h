#pragma once

#include <windows.h>
#include <stdint.h>

#define SB_PROTOCOL_MAGIC 0x53424155u
#define SB_PROTOCOL_VERSION 4u
#define SB_SAMPLE_RATE 48000u
#define SB_CHANNELS 2u
#define SB_AUDIO_CAPACITY_FRAMES (SB_SAMPLE_RATE * 2u)
#define SB_DEVICE_ID_CAPACITY 512u
#define SB_ERROR_CAPACITY 256u

#define SB_MAPPING_NAME L"Local\\MicDeck.Audio.v4"
#define SB_AUDIO_EVENT_NAME L"Local\\MicDeck.AudioData.v4"
#define SB_CONFIG_EVENT_NAME L"Local\\MicDeck.Config.v4"

enum SbEngineState {
    SB_ENGINE_STOPPED = 0,
    SB_ENGINE_STARTING = 1,
    SB_ENGINE_READY = 2,
    SB_ENGINE_ERROR = 3
};

typedef struct SbSharedState {
    uint32_t magic;
    uint32_t version;
    volatile LONG engine_state;
    volatile LONG engine_pid;
    volatile LONG shutdown_requested;
    volatile LONG config_generation;
    volatile LONG mic_gain_milli;
    volatile LONG sound_gain_milli;
    volatile LONG monitor_gain_milli;
    volatile LONG system_gain_milli;
    volatile LONG system_capture_enabled;
    volatile LONG mic_level_milli;
    volatile LONG system_level_milli;
    volatile LONG mix_level_milli;
    volatile LONG underruns;
    volatile LONG latency_us;
    volatile LONG ui_heartbeat_ms;
    volatile LONG engine_heartbeat_ms;
    volatile LONG64 audio_write_frame;
    volatile LONG64 audio_read_frame;
    wchar_t input_device_id[SB_DEVICE_ID_CAPACITY];
    wchar_t output_device_id[SB_DEVICE_ID_CAPACITY];
    wchar_t virtual_capture_device_id[SB_DEVICE_ID_CAPACITY];
    wchar_t last_error[SB_ERROR_CAPACITY];
    float sound_audio[SB_AUDIO_CAPACITY_FRAMES * SB_CHANNELS];
} SbSharedState;
