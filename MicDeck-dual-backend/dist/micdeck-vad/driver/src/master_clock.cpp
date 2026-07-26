#include "master_clock.h"
MicDeckMasterClock::MicDeckMasterClock() noexcept:epoch_(0){
    KeInitializeSpinLock(&lock_);frequency_.QuadPart=anchor_qpc_.QuadPart=0;}
void MicDeckMasterClock::Initialize() noexcept{
    KIRQL i;KeAcquireSpinLock(&lock_,&i);anchor_qpc_=KeQueryPerformanceCounter(&frequency_);
    InterlockedIncrement(&epoch_);KeReleaseSpinLock(&lock_,i);}
void MicDeckMasterClock::Reset() noexcept{Initialize();}
ULONGLONG MicDeckMasterClock::Now100ns() const noexcept{
    KIRQL i;KeAcquireSpinLock(const_cast<KSPIN_LOCK*>(&lock_),&i);
    const auto now=KeQueryPerformanceCounter(nullptr);ULONGLONG r=0;
    if(frequency_.QuadPart>0&&now.QuadPart>=anchor_qpc_.QuadPart)
        r=(static_cast<ULONGLONG>(now.QuadPart-anchor_qpc_.QuadPart)*10000000ull)/
          static_cast<ULONGLONG>(frequency_.QuadPart);
    KeReleaseSpinLock(const_cast<KSPIN_LOCK*>(&lock_),i);return r;}
ULONGLONG MicDeckMasterClock::FramePosition(ULONG rate) const noexcept{
    return Now100ns()*rate/10000000ull;}
ULONG MicDeckMasterClock::Epoch() const noexcept{
    return InterlockedCompareExchange(const_cast<volatile LONG*>(&epoch_),0,0);}
