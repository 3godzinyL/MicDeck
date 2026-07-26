#pragma once
#include "common.h"
class MicDeckMasterClock{
public:
    MicDeckMasterClock() noexcept;void Initialize() noexcept;void Reset() noexcept;
    ULONGLONG Now100ns() const noexcept;ULONGLONG FramePosition(ULONG rate) const noexcept;
    ULONG Epoch() const noexcept;
private:
    LARGE_INTEGER frequency_,anchor_qpc_;volatile LONG epoch_;mutable KSPIN_LOCK lock_;
};
