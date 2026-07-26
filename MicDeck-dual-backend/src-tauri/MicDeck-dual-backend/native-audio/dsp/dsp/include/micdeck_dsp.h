#pragma once

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

uint32_t mb_dsp_frame_size(void);
void* mb_dsp_create(void);
void mb_dsp_destroy(void* handle);
int32_t mb_dsp_process_10ms(
    void* handle,
    const float* microphone,
    const float* render_reference,
    float* output,
    int32_t aec_enabled,
    int32_t denoise_enabled,
    float* voice_probability);

#ifdef __cplusplus
}
#endif
