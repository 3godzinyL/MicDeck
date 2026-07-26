#pragma once
#include "common.h"

class MicDeckAudioClock {
public:
    MicDeckAudioClock() noexcept;

    void Configure(
        ULONG bytes_per_second,
        ULONG block_align,
        ULONG buffer_bytes) noexcept;

    void Start() noexcept;
    void Pause() noexcept;
    void Stop() noexcept;

    ULONGLONG LinearBytes() const noexcept;
    ULONG CyclicBytePosition() const noexcept;
    ULONGLONG Qpc100ns() const noexcept;

private:
    ULONGLONG Elapsed100nsLocked(LARGE_INTEGER now) const noexcept;

    mutable KSPIN_LOCK lock_;
    LARGE_INTEGER frequency_;
    LARGE_INTEGER start_qpc_;
    ULONGLONG accumulated_100ns_;
    ULONG bytes_per_second_;
    ULONG block_align_;
    ULONG buffer_bytes_;
    bool running_;
};
