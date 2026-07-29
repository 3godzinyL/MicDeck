#pragma once
#include "common.h"

/// QPC-anchored clock shared by both endpoints.
///
/// No constructor on purpose: the single instance is a static member of MicDeckAdapter,
/// and kernel drivers never run C++ dynamic initialisers. Initialize() sets up the spin
/// lock and the anchor.
class MicDeckMasterClock {
public:
    void Initialize() noexcept;
    void Reset() noexcept;
    ULONGLONG Now100ns() const noexcept;
    ULONGLONG FramePosition(ULONG rate) const noexcept;
    ULONG Epoch() const noexcept;

private:
    LARGE_INTEGER frequency_;
    LARGE_INTEGER anchor_qpc_;
    volatile LONG epoch_;
    volatile LONG initialized_;
    mutable KSPIN_LOCK lock_;
};
