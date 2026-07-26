#include "audio_clock.h"

MicDeckAudioClock::MicDeckAudioClock() noexcept
    : accumulated_100ns_(0),
      bytes_per_second_(0),
      block_align_(0),
      buffer_bytes_(0),
      running_(false) {
    KeInitializeSpinLock(&lock_);
    LARGE_INTEGER ignored{};
    frequency_ = KeQueryPerformanceCounter(&ignored);
    start_qpc_ = ignored;
}

void MicDeckAudioClock::Configure(
    ULONG bytes_per_second,
    ULONG block_align,
    ULONG buffer_bytes) noexcept {
    KIRQL old_irql;
    KeAcquireSpinLock(&lock_, &old_irql);
    bytes_per_second_ = bytes_per_second;
    block_align_ = block_align;
    buffer_bytes_ = buffer_bytes;
    accumulated_100ns_ = 0;
    running_ = false;
    start_qpc_ = KeQueryPerformanceCounter(nullptr);
    KeReleaseSpinLock(&lock_, old_irql);
}

void MicDeckAudioClock::Start() noexcept {
    KIRQL old_irql;
    KeAcquireSpinLock(&lock_, &old_irql);
    if (!running_) {
        start_qpc_ = KeQueryPerformanceCounter(nullptr);
        running_ = true;
    }
    KeReleaseSpinLock(&lock_, old_irql);
}

void MicDeckAudioClock::Pause() noexcept {
    KIRQL old_irql;
    KeAcquireSpinLock(&lock_, &old_irql);
    if (running_) {
        accumulated_100ns_ +=
            Elapsed100nsLocked(KeQueryPerformanceCounter(nullptr));
        running_ = false;
    }
    KeReleaseSpinLock(&lock_, old_irql);
}

void MicDeckAudioClock::Stop() noexcept {
    KIRQL old_irql;
    KeAcquireSpinLock(&lock_, &old_irql);
    accumulated_100ns_ = 0;
    start_qpc_ = KeQueryPerformanceCounter(nullptr);
    running_ = false;
    KeReleaseSpinLock(&lock_, old_irql);
}

ULONGLONG MicDeckAudioClock::Elapsed100nsLocked(
    LARGE_INTEGER now) const noexcept {
    if (frequency_.QuadPart <= 0 ||
        now.QuadPart <= start_qpc_.QuadPart) {
        return 0;
    }
    const ULONGLONG ticks =
        static_cast<ULONGLONG>(now.QuadPart - start_qpc_.QuadPart);
    return (ticks * 10'000'000ull) /
        static_cast<ULONGLONG>(frequency_.QuadPart);
}

ULONGLONG MicDeckAudioClock::Qpc100ns() const noexcept {
    KIRQL old_irql;
    KeAcquireSpinLock(
        const_cast<KSPIN_LOCK*>(&lock_),
        &old_irql);
    ULONGLONG result = accumulated_100ns_;
    if (running_) {
        result += Elapsed100nsLocked(
            KeQueryPerformanceCounter(nullptr));
    }
    KeReleaseSpinLock(
        const_cast<KSPIN_LOCK*>(&lock_),
        old_irql);
    return result;
}

ULONGLONG MicDeckAudioClock::LinearBytes() const noexcept {
    const ULONGLONG time_100ns = Qpc100ns();
    if (bytes_per_second_ == 0 || block_align_ == 0) {
        return 0;
    }
    ULONGLONG bytes =
        (time_100ns * bytes_per_second_) / 10'000'000ull;
    bytes -= bytes % block_align_;
    return bytes;
}

ULONG MicDeckAudioClock::CyclicBytePosition() const noexcept {
    if (buffer_bytes_ == 0) return 0;
    return static_cast<ULONG>(LinearBytes() % buffer_bytes_);
}
