// Standalone, hardware-free self-test of the MicDeck audio core.
//
// It exercises the lock-free ring buffer used for the IPC bridge and the
// monitor tap, and re-implements the exact mixer/limiter/overdrive/monitor
// math from audio_engine.cpp to prove that a bind actually produces an
// audible, bounded signal before the real app ever touches a device.
//
// Build + run are driven by scripts/diagnose.sh. Exit code 0 = everything OK.

#define _CRT_SECURE_NO_WARNINGS
#include "../engine/src/audio_ring_buffer.h"

#include <cmath>
#include <cstdint>
#include <cstdio>
#include <vector>

namespace {

int g_failures = 0;
int g_checks = 0;

void check(bool condition, const char* name) {
    ++g_checks;
    if (condition) {
        std::printf("  [ OK ] %s\n", name);
    } else {
        ++g_failures;
        std::printf("  [FAIL] %s\n", name);
    }
}

bool nearly(float a, float b, float epsilon = 1e-4f) {
    return std::fabs(a - b) <= epsilon;
}

// Mirrors AudioEngine::render_mix: mixed = tanh(mic*micGain + sound*soundGain).
float mix_sample(float mic, float sound, float mic_gain, float sound_gain) {
    return std::tanh(mic * mic_gain + sound * sound_gain);
}

float mix_with_system(
    float mic,
    float sound,
    float system,
    float mic_gain,
    float sound_gain,
    float system_gain) {
    return std::tanh(
        mic * mic_gain +
        sound * sound_gain +
        system * system_gain);
}

// Mirrors AudioEngine::render_monitor: monitor = tanh(sound*monitorGain).
float monitor_sample(float sound, float monitor_gain) {
    return std::tanh(sound * monitor_gain);
}

void test_ring_buffer_roundtrip() {
    std::printf("Ring buffer: round-trip\n");
    StereoRingBuffer ring(64);
    std::vector<float> input(16 * 2);
    for (uint32_t frame = 0; frame < 16; ++frame) {
        input[frame * 2] = static_cast<float>(frame) / 16.0f;
        input[frame * 2 + 1] = -static_cast<float>(frame) / 16.0f;
    }
    const uint32_t pushed = ring.push(input.data(), 16);
    check(pushed == 16, "accepts all frames when empty");

    std::vector<float> output(16 * 2, 999.0f);
    const uint32_t popped = ring.pop(output.data(), 16);
    check(popped == 16, "pops the same frame count");

    bool identical = true;
    for (size_t i = 0; i < input.size(); ++i) {
        identical = identical && nearly(input[i], output[i]);
    }
    check(identical, "samples survive the round-trip intact");
    check(ring.pop(output.data(), 16) == 0, "empty ring pops zero frames");
}

void test_ring_buffer_overflow_and_wrap() {
    std::printf("Ring buffer: overflow + wrap-around\n");
    StereoRingBuffer ring(8);
    std::vector<float> block(8 * 2, 0.5f);
    check(ring.push(block.data(), 8) == 8, "fills to capacity");
    check(ring.push(block.data(), 8) == 0, "drops when full (no overrun)");
    check(ring.dropped_frames() == 8, "reports every dropped frame");
    ring.reset_diagnostics();
    check(ring.dropped_frames() == 0, "diagnostics can be reset for a new stream");

    std::vector<float> out(4 * 2, 0.0f);
    check(ring.pop(out.data(), 4) == 4, "drains half");

    // Push again to force the write index to wrap past capacity.
    std::vector<float> tail(4 * 2, 0.25f);
    check(ring.push(tail.data(), 4) == 4, "accepts after draining (wrap)");

    std::vector<float> rest(8 * 2, 0.0f);
    check(ring.pop(rest.data(), 8) == 8, "reads across the wrap boundary");
    check(nearly(rest[0], 0.5f) && nearly(rest[8], 0.25f), "ordering preserved across wrap");
}

void test_ring_buffer_clear() {
    std::printf("Ring buffer: clear\n");
    StereoRingBuffer ring(32);
    std::vector<float> block(10 * 2, 1.0f);
    ring.push(block.data(), 10);
    ring.clear();
    std::vector<float> out(10 * 2, 0.0f);
    check(ring.pop(out.data(), 10) == 0, "clear discards buffered audio");
}

void test_mixer_math() {
    std::printf("Mixer / limiter / overdrive math\n");
    check(nearly(mix_sample(0.0f, 0.0f, 1.0f, 1.0f), 0.0f), "silence in -> silence out");

    const float voice_only = mix_sample(0.4f, 0.0f, 1.0f, 1.0f);
    check(std::fabs(voice_only) > 0.001f && std::fabs(voice_only) < 1.0f, "voice passes through, bounded");

    const float bind_only = mix_sample(0.0f, 0.5f, 1.0f, 1.0f);
    check(std::fabs(bind_only) > 0.001f, "bind is audible in the mix");

    // Overdrive: soundGain = volume(6.0) * overdrive(4.0) = 24.0 -> heavy saturation.
    const float driven = mix_sample(0.0f, 0.5f, 1.0f, 24.0f);
    check(std::fabs(driven) > 0.9f, "overdrive saturates toward full scale");
    check(std::fabs(driven) <= 1.0f, "limiter keeps overdrive bounded (no digital clip)");

    const float desktop_only = mix_with_system(0.0f, 0.0f, 0.4f, 1.0f, 1.0f, 0.85f);
    check(std::fabs(desktop_only) > 0.001f, "system-audio loopback is audible when enabled");

    const float all_sources = mix_with_system(0.3f, 0.4f, 0.5f, 1.0f, 1.5f, 0.85f);
    check(std::fabs(all_sources) <= 1.0f, "three-source mix remains bounded");

    // The soft limiter must never exceed +-1 even for absurd input.
    bool bounded = true;
    for (float s = -2.0f; s <= 2.0f; s += 0.05f) {
        const float m = mix_sample(s, s, 6.0f, 24.0f);
        bounded = bounded && (m >= -1.0f && m <= 1.0f);
    }
    check(bounded, "tanh limiter is bounded over the whole input range");
}

void test_monitor_tap() {
    std::printf("Local monitor tap\n");
    check(nearly(monitor_sample(0.5f, 0.0f), 0.0f), "monitor gain 0 = silent (off)");
    const float audible = monitor_sample(0.5f, 1.0f);
    check(std::fabs(audible) > 0.001f && std::fabs(audible) <= 1.0f, "monitor is audible and bounded");
}

// End-to-end simulation: does a decoded bind actually "come out" of the mixer?
void test_audible_signal_simulation() {
    std::printf("Simulated playback: is the bind audible?\n");
    const uint32_t frames = 4800;            // 100 ms @ 48 kHz
    const double two_pi = 6.283185307179586;
    double sum_sq = 0.0;
    float peak = 0.0f;
    for (uint32_t i = 0; i < frames; ++i) {
        const float bind = 0.3f * static_cast<float>(std::sin(two_pi * 440.0 * i / 48000.0));
        const float out = mix_sample(0.0f, bind, 1.0f, 1.0f);   // 100% soundboard gain
        sum_sq += static_cast<double>(out) * out;
        peak = (std::fabs(out) > peak) ? std::fabs(out) : peak;
    }
    const float rms = static_cast<float>(std::sqrt(sum_sq / frames));
    std::printf("       RMS=%.4f  peak=%.4f\n", rms, peak);
    check(rms > 0.05f, "output carries real signal energy (audible)");
    check(peak <= 1.0f, "output never clips past full scale");
}

} // namespace

int main() {
    std::printf("== MicDeck :: audio core self-test ==\n");
    test_ring_buffer_roundtrip();
    test_ring_buffer_overflow_and_wrap();
    test_ring_buffer_clear();
    test_mixer_math();
    test_monitor_tap();
    test_audible_signal_simulation();
    std::printf("-----------------------------------------------\n");
    std::printf("%d checks, %d failed\n", g_checks, g_failures);
    if (g_failures == 0) {
        std::printf("RESULT: PASS\n");
        return 0;
    }
    std::printf("RESULT: FAIL\n");
    return 1;
}
