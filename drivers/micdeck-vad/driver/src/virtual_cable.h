#pragma once
#include "common.h"
#include "../../shared/micdeck_cable_pipeline.h"

enum class MicDeckResetReason : ULONG {
    Initialization = 1, RenderStopped = 2, CaptureStopped = 3,
    DriverPowerTransition = 4, UserRequested = 5, StreamDiscontinuity = 6,
};

/// Owns the non-paged ring the render endpoint writes and the capture endpoint reads.
///
/// Deliberately has no constructor or destructor: the single instance is a static member
/// of MicDeckAdapter, and kernel drivers never run C++ dynamic initialisers or atexit
/// handlers. Zero-initialised static storage plus Initialize()/Shutdown() is the contract.
class MicDeckVirtualCable {
public:
    NTSTATUS Initialize() noexcept;
    void Shutdown() noexcept;
    void Reset(MicDeckResetReason reason) noexcept;
    uint32_t Write(const void* data, uint32_t frames, const MdPcmFormat& format) noexcept;
    uint32_t Read(void* data, uint32_t frames, const MdPcmFormat& format) noexcept;
    MICDECK_VAD_STATS_V2 Stats() const noexcept;
    void SetLatencyMode(MdLatencyMode mode) noexcept;
    MdLatencyMode LatencyMode() const noexcept;
    void SetRenderState(KSSTATE state) noexcept;
    void SetCaptureState(KSSTATE state) noexcept;
    void AddRenderStream() noexcept;
    void RemoveRenderStream() noexcept;
    void AddCaptureStream() noexcept;
    void RemoveCaptureStream() noexcept;

private:
    float* storage_;
    MdCablePipeline pipeline_;
    volatile LONG initialized_;
    volatile LONG render_streams_;
    volatile LONG capture_streams_;
    volatile LONG render_state_;
    volatile LONG capture_state_;
    volatile LONG latency_mode_;
    volatile LONG last_reset_reason_;
};
