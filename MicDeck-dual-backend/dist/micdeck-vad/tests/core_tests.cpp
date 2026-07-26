#include "../shared/micdeck_audio_core.h"

#include <cassert>
#include <cmath>
#include <cstdint>
#include <iostream>
#include <thread>
#include <vector>

namespace {

bool near(float a, float b, float eps = 0.0002f) {
    return std::fabs(a - b) <= eps;
}

void test_ring_basic() {
    std::vector<float> storage(8 * 2);
    MdStereoRing ring;
    assert(ring.Initialize(storage.data(), 8));

    float input[] = {
        0.1f, -0.1f,
        0.2f, -0.2f,
        0.3f, -0.3f,
    };
    assert(ring.Push(input, 3) == 3);
    assert(ring.AvailableRead() == 3);

    float output[6]{};
    assert(ring.Pop(output, 3, true) == 3);
    for (int i = 0; i < 6; ++i) {
        assert(near(input[i], output[i]));
    }
}

void test_underflow_silence() {
    std::vector<float> storage(4 * 2);
    MdStereoRing ring;
    assert(ring.Initialize(storage.data(), 4));

    float output[6];
    for (float& x : output) x = 123.0f;
    assert(ring.Pop(output, 3, true) == 0);
    for (float x : output) assert(x == 0.0f);
    assert(ring.Stats().silent_frames == 3);
}

void test_overflow_drop_newest() {
    std::vector<float> storage(4 * 2);
    MdStereoRing ring;
    assert(ring.Initialize(storage.data(), 4));

    float input[12]{};
    for (int i = 0; i < 12; ++i) input[i] = i / 20.0f;

    assert(ring.Push(input, 6) == 4);
    const auto stats = ring.Stats();
    assert(stats.dropped_frames == 2);
    assert(stats.fill_frames == 4);
}

void test_wrap() {
    std::vector<float> storage(8 * 2);
    MdStereoRing ring;
    assert(ring.Initialize(storage.data(), 8));

    float a[12]{};
    float b[12]{};
    for (int i = 0; i < 12; ++i) {
        a[i] = 0.01f * i;
        b[i] = -0.01f * i;
    }
    assert(ring.Push(a, 6) == 6);

    float temp[8]{};
    assert(ring.Pop(temp, 4, true) == 4);
    assert(ring.Push(b, 6) == 6);

    float out[16]{};
    assert(ring.Pop(out, 8, true) == 8);
    assert(ring.AvailableRead() == 0);
}

void test_pcm16_roundtrip() {
    MdPcmFormat format{
        48000, 2, 16, MdSampleEncoding::Pcm16
    };
    float input[] = {
        -1.0f, 1.0f,
        -0.5f, 0.5f,
        0.0f, 0.25f,
    };
    int16_t encoded[6]{};
    float decoded[6]{};

    assert(MdEncodeFromFloatStereo(
        input, 3, format, encoded, 3) == 3);
    assert(MdDecodeToFloatStereo(
        encoded, 3, format, decoded, 3) == 3);

    for (int i = 0; i < 6; ++i) {
        assert(near(input[i], decoded[i], 0.0001f));
    }
}

void test_pcm24_roundtrip() {
    MdPcmFormat format{
        48000, 2, 24, MdSampleEncoding::Pcm24
    };
    float input[] = {
        -0.75f, 0.75f,
        -0.1f, 0.1f,
    };
    uint8_t encoded[12]{};
    float decoded[4]{};

    assert(MdEncodeFromFloatStereo(
        input, 2, format, encoded, 2) == 2);
    assert(MdDecodeToFloatStereo(
        encoded, 2, format, decoded, 2) == 2);

    for (int i = 0; i < 4; ++i) {
        assert(near(input[i], decoded[i], 0.000001f));
    }
}

void test_mono_downmix() {
    MdPcmFormat format{
        48000, 1, 16, MdSampleEncoding::Pcm16
    };
    float input[] = {1.0f, -1.0f};
    int16_t encoded[1]{};
    float decoded[2]{};

    MdEncodeFromFloatStereo(input, 1, format, encoded, 1);
    MdDecodeToFloatStereo(encoded, 1, format, decoded, 1);
    assert(near(decoded[0], 0.0f));
    assert(near(decoded[1], 0.0f));
}


void test_consumer_discard() {
    std::vector<float> storage(8 * 2);
    MdStereoRing ring;
    assert(ring.Initialize(storage.data(), 8));
    float input[12]{};
    assert(ring.Push(input, 6) == 6);
    assert(ring.DiscardOldest(4) == 4);
    assert(ring.AvailableRead() == 2);
    assert(ring.Stats().discarded_frames == 4);
}

void test_spsc_stress() {
    constexpr uint32_t capacity = 1024;
    constexpr uint32_t total = 200000;
    std::vector<float> storage(capacity * 2);
    MdStereoRing ring;
    assert(ring.Initialize(storage.data(), capacity));

    std::atomic<bool> done{false};
    std::atomic<uint64_t> received{0};

    std::thread producer([&] {
        float frame[2]{};
        for (uint32_t i = 0; i < total; ++i) {
            frame[0] = static_cast<float>(i % 1000) / 1000.0f;
            frame[1] = -frame[0];
            while (ring.AvailableWrite() == 0) {
                std::this_thread::yield();
            }
            const uint32_t accepted = ring.Push(frame, 1);
            assert(accepted == 1);
        }
        done.store(true, std::memory_order_release);
    });

    std::thread consumer([&] {
        float frame[2]{};
        while (!done.load(std::memory_order_acquire) ||
               ring.AvailableRead() != 0) {
            if (ring.Pop(frame, 1, false) == 1) {
                received.fetch_add(1);
            } else {
                std::this_thread::yield();
            }
        }
    });

    producer.join();
    consumer.join();
    assert(received.load() == total);
}

} // namespace

int main() {
    test_ring_basic();
    test_underflow_silence();
    test_overflow_drop_newest();
    test_wrap();
    test_pcm16_roundtrip();
    test_pcm24_roundtrip();
    test_mono_downmix();
    test_consumer_discard();
    test_spsc_stress();

    std::cout << "MicDeck audio core tests: PASS\n";
    return 0;
}
