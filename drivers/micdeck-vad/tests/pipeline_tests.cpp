#include "../shared/micdeck_cable_pipeline.h"
#include <cassert>
#include <iostream>
#include <vector>

namespace {

void fill(std::vector<float>& v, float x) { for (float& s : v) s = x; }

void priming() {
    std::vector<float> storage(2048 * 2), in(720 * 2), out(240 * 2);
    fill(in, .5f);
    MdCablePipeline p;
    assert(p.Initialize(storage.data(), 2048, MdLatencyMode::Balanced));
    p.SetProducerActive(true);
    p.SetConsumerActive(true);
    p.Write(in.data(), 240);
    assert(p.Read(out.data(), 240) == 0);
    p.Write(in.data(), 480);
    assert(p.Read(out.data(), 240) == 240);
}

void trim() {
    std::vector<float> storage(4096 * 2), in(2000 * 2), out(240 * 2);
    for (uint32_t i = 0; i < 2000; ++i) {
        in[i * 2] = in[i * 2 + 1] = static_cast<float>(i) / 2000.f;
    }
    MdCablePipeline p;
    assert(p.Initialize(storage.data(), 4096, MdLatencyMode::UltraLow));
    p.SetProducerActive(true);
    p.SetConsumerActive(true);
    p.Write(in.data(), 2000);
    p.Read(out.data(), 240);
    const auto s = p.Stats();
    assert(s.stale_trim_events > 0);
    assert(s.ring.discarded_frames > 0);
    assert(out[200] > .4f);
}

void fade() {
    std::vector<float> storage(2048 * 2), in(300 * 2), out(512 * 2);
    fill(in, .8f);
    MdCablePipeline p;
    assert(p.Initialize(storage.data(), 2048, MdLatencyMode::UltraLow));
    p.SetProducerActive(true);
    p.SetConsumerActive(true);
    p.Write(in.data(), 300);
    assert(p.Read(out.data(), 512) == 300);
    assert(out[511 * 2] == 0);
    assert(p.Stats().fade_frames_generated > 0);
}

void stop_clears() {
    std::vector<float> storage(2048 * 2), in(800 * 2), out(128 * 2);
    fill(in, .7f);
    MdCablePipeline p;
    assert(p.Initialize(storage.data(), 2048, MdLatencyMode::Balanced));
    p.SetProducerActive(true);
    p.SetConsumerActive(true);
    p.Write(in.data(), 800);
    p.SetProducerActive(false);
    p.Read(out.data(), 128);
    for (float x : out) assert(x == 0);
}

/// A flush issued from the control path used to store 0 into both ring cursors. If the
/// consumer had already latched the read cursor it wrote back a value far ahead of the
/// producer, and the endpoint then stayed silent until the producer counted all the way
/// back up — hours, on a long session. The flush is applied by the consumer now, so the
/// stream must recover on the next reads.
void flush_does_not_strand_the_consumer() {
    std::vector<float> storage(2048 * 2), in(1024 * 2), out(256 * 2);
    fill(in, .6f);
    MdCablePipeline p;
    assert(p.Initialize(storage.data(), 2048, MdLatencyMode::Balanced));
    p.SetProducerActive(true);
    p.SetConsumerActive(true);

    for (int round = 0; round < 40; ++round) {
        p.Write(in.data(), 1024);
        p.Read(out.data(), 256);
    }
    const auto before = p.Stats();
    assert(before.ring.read_frames > 2048);

    p.RequestFlush();
    p.Write(in.data(), 1024);
    assert(p.Read(out.data(), 256) == 0);   // re-primes after the flush
    p.Write(in.data(), 1024);
    assert(p.Read(out.data(), 256) == 256); // and audio flows again straight away

    const auto after = p.Stats();
    assert(after.ring.read_frames <= after.ring.write_frames);
}

void mode_change_is_picked_up_by_the_consumer() {
    std::vector<float> storage(4096 * 2), in(2048 * 2), out(256 * 2);
    fill(in, .5f);
    MdCablePipeline p;
    assert(p.Initialize(storage.data(), 4096, MdLatencyMode::UltraLow));
    p.SetProducerActive(true);
    p.SetConsumerActive(true);
    p.Write(in.data(), 512);
    assert(p.Read(out.data(), 256) == 256);

    p.SetMode(MdLatencyMode::Resilient);
    assert(p.Stats().mode == MdLatencyMode::Resilient);
    // Resilient primes at 1440 frames, so the 256 frames left over are not enough.
    assert(p.Read(out.data(), 256) == 0);
    p.Write(in.data(), 2048);
    assert(p.Read(out.data(), 256) == 256);
}

} // namespace

int main() {
    priming();
    trim();
    fade();
    stop_clears();
    flush_does_not_strand_the_consumer();
    mode_change_is_picked_up_by_the_consumer();
    std::cout << "MicDeck cable pipeline tests: PASS\n";
}
