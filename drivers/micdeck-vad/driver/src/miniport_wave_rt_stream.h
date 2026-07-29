#pragma once
#include "audio_clock.h"
#include "format.h"
#include "miniport_wave_rt.h"

struct MicDeckNotificationEntry {
    LIST_ENTRY link;
    PKEVENT event;
};

class MicDeckWaveRTStream final
    : public IMiniportWaveRTStreamNotification,
      public CUnknown {
public:
    DECLARE_STD_UNKNOWN();
    DEFINE_STD_CONSTRUCTOR(MicDeckWaveRTStream);

    ~MicDeckWaveRTStream();

    NTSTATUS Init(
        _In_ MicDeckMiniportWaveRT* miniport,
        _In_ PPORTWAVERTSTREAM port_stream,
        _In_ PKSDATAFORMAT data_format,
        _In_ bool capture);

    STDMETHODIMP_(NTSTATUS) AllocateAudioBuffer(
        _In_ ULONG requested_size,
        _Out_ PMDL* audio_buffer_mdl,
        _Out_ ULONG* actual_size,
        _Out_ ULONG* offset_from_first_page,
        _Out_ MEMORY_CACHING_TYPE* cache_type) override;

    STDMETHODIMP_(VOID) FreeAudioBuffer(
        _In_opt_ PMDL mdl,
        _In_ ULONG size) override;

    STDMETHODIMP_(NTSTATUS) GetPosition(
        _Out_ KSAUDIO_POSITION* position) override;

    STDMETHODIMP_(NTSTATUS) GetClockRegister(
        _Out_ PKSRTAUDIO_HWREGISTER reg) override;

    STDMETHODIMP_(NTSTATUS) GetPositionRegister(
        _Out_ PKSRTAUDIO_HWREGISTER reg) override;

    STDMETHODIMP_(VOID) GetHWLatency(
        _Out_ PKSRTAUDIO_HWLATENCY latency) override;

    STDMETHODIMP_(NTSTATUS) SetFormat(
        _In_ PKSDATAFORMAT data_format) override;

    STDMETHODIMP_(NTSTATUS) SetState(
        _In_ KSSTATE state) override;

    STDMETHODIMP_(NTSTATUS) AllocateBufferWithNotification(
        _In_ ULONG notification_count,
        _In_ ULONG requested_size,
        _Out_ PMDL* audio_buffer_mdl,
        _Out_ ULONG* actual_size,
        _Out_ ULONG* offset_from_first_page,
        _Out_ MEMORY_CACHING_TYPE* cache_type) override;

    STDMETHODIMP_(VOID) FreeBufferWithNotification(
        _In_ PMDL mdl,
        _In_ ULONG size) override;

    STDMETHODIMP_(NTSTATUS) RegisterNotificationEvent(
        _In_ PKEVENT notification_event) override;

    STDMETHODIMP_(NTSTATUS) UnregisterNotificationEvent(
        _In_ PKEVENT notification_event) override;

private:
    static KDEFERRED_ROUTINE TimerDpc;
    void OnTimerDpc() noexcept;
    void TransferElapsedBytes(
        ULONGLONG new_linear_position) noexcept;
    void TransferSegment(
        ULONG offset,
        ULONG bytes) noexcept;
    void SignalNotifications() noexcept;
    void StartTimer() noexcept;
    void StopTimer() noexcept;

    MicDeckMiniportWaveRT* miniport_;
    PPORTWAVERTSTREAM port_stream_;
    MicDeckVirtualCable* cable_;
    bool capture_;
    MdPcmFormat format_;

    PMDL dma_mdl_;
    BYTE* dma_buffer_;
    ULONG dma_buffer_bytes_;
    ULONG notification_count_;
    ULONG notification_period_ms_;

    KSSTATE state_;
    MicDeckAudioClock clock_;
    ULONGLONG transferred_linear_bytes_;

    KTIMER timer_;
    KDPC dpc_;
    KSPIN_LOCK notification_lock_;
    LIST_ENTRY notification_events_;
    volatile LONG timer_armed_;
};
