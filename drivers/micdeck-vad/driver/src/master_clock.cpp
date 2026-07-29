#include "master_clock.h"

void MicDeckMasterClock::Initialize() noexcept {
    if (InterlockedExchange(&initialized_, 1) == 0) {
        KeInitializeSpinLock(&lock_);
    }
    KIRQL irql;
    KeAcquireSpinLock(&lock_, &irql);
    anchor_qpc_ = KeQueryPerformanceCounter(&frequency_);
    InterlockedIncrement(&epoch_);
    KeReleaseSpinLock(&lock_, irql);
}

void MicDeckMasterClock::Reset() noexcept {
    Initialize();
}

ULONGLONG MicDeckMasterClock::Now100ns() const noexcept {
    // The stream can query the clock before the adapter finished starting; touching an
    // uninitialised KSPIN_LOCK would bugcheck.
    if (InterlockedCompareExchange(
            const_cast<volatile LONG*>(&initialized_), 0, 0) == 0) {
        return 0;
    }
    KIRQL irql;
    KeAcquireSpinLock(const_cast<KSPIN_LOCK*>(&lock_), &irql);
    const LARGE_INTEGER now = KeQueryPerformanceCounter(nullptr);
    ULONGLONG result = 0;
    if (frequency_.QuadPart > 0 && now.QuadPart >= anchor_qpc_.QuadPart) {
        result = (static_cast<ULONGLONG>(now.QuadPart - anchor_qpc_.QuadPart) *
                  10000000ull) / static_cast<ULONGLONG>(frequency_.QuadPart);
    }
    KeReleaseSpinLock(const_cast<KSPIN_LOCK*>(&lock_), irql);
    return result;
}

ULONGLONG MicDeckMasterClock::FramePosition(ULONG rate) const noexcept {
    return Now100ns() * rate / 10000000ull;
}

ULONG MicDeckMasterClock::Epoch() const noexcept {
    return InterlockedCompareExchange(const_cast<volatile LONG*>(&epoch_), 0, 0);
}
