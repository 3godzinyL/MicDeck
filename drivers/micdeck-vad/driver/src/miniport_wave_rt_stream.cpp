#include "miniport_wave_rt_stream.h"

MicDeckWaveRTStream::~MicDeckWaveRTStream() {
    PAGED_CODE();
    StopTimer();

    if (dma_mdl_ != nullptr) {
        FreeAudioBuffer(dma_mdl_, dma_buffer_bytes_);
    }

    KIRQL old_irql;
    KeAcquireSpinLock(&notification_lock_, &old_irql);
    while (!IsListEmpty(&notification_events_)) {
        PLIST_ENTRY entry = RemoveHeadList(&notification_events_);
        auto* item = CONTAINING_RECORD(
            entry,
            MicDeckNotificationEntry,
            link);
        ExFreePoolWithTag(item, MICDECK_STREAM_POOLTAG);
    }
    KeReleaseSpinLock(&notification_lock_, old_irql);

    if (miniport_ != nullptr) {
        if (capture_) cable_->RemoveCaptureStream();
        else cable_->RemoveRenderStream();
        miniport_->StreamClosed();
        miniport_->Release();
        miniport_ = nullptr;
    }
}

NTSTATUS MicDeckWaveRTStream::Init(
    MicDeckMiniportWaveRT* miniport,
    PPORTWAVERTSTREAM port_stream,
    PKSDATAFORMAT data_format,
    bool capture) {
    PAGED_CODE();
    if (miniport == nullptr ||
        port_stream == nullptr ||
        data_format == nullptr) {
        return STATUS_INVALID_PARAMETER;
    }

    MdPcmFormat format{};
    NTSTATUS status = MdFormatFromKs(data_format, &format);
    if (!NT_SUCCESS(status)) return status;

    miniport_ = miniport;
    miniport_->AddRef();
    port_stream_ = port_stream;
    cable_ = miniport->Cable();
    capture_ = capture;
    format_ = format;

    dma_mdl_ = nullptr;
    dma_buffer_ = nullptr;
    dma_buffer_bytes_ = 0;
    notification_count_ = 0;
    notification_period_ms_ = 10;
    state_ = KSSTATE_STOP;
    transferred_linear_bytes_ = 0;
    timer_armed_ = 0;

    KeInitializeTimerEx(&timer_, NotificationTimer);
    KeInitializeDpc(&dpc_, TimerDpc, this);
    KeInitializeSpinLock(&notification_lock_);
    InitializeListHead(&notification_events_);

    if (capture_) cable_->AddCaptureStream();
    else cable_->AddRenderStream();

    return STATUS_SUCCESS;
}

NTSTATUS MicDeckWaveRTStream::NonDelegatingQueryInterface(
    REFIID interface_id,
    PVOID* object) {
    PAGED_CODE();
    if (object == nullptr) return STATUS_INVALID_PARAMETER;

    if (IsEqualGUIDAligned(interface_id, IID_IUnknown) ||
        IsEqualGUIDAligned(interface_id, IID_IMiniportWaveRTStream)) {
        *object = PVOID(PMINIPORTWAVERTSTREAM(this));
    } else if (IsEqualGUIDAligned(
                   interface_id,
                   IID_IMiniportWaveRTStreamNotification)) {
        *object = PVOID(PMINIPORTWAVERTSTREAMNOTIFICATION(this));
    } else {
        *object = nullptr;
    }

    if (*object != nullptr) {
        PUNKNOWN(*object)->AddRef();
        return STATUS_SUCCESS;
    }
    return STATUS_INVALID_PARAMETER;
}

NTSTATUS MicDeckWaveRTStream::AllocateAudioBuffer(
    ULONG requested_size,
    PMDL* audio_buffer_mdl,
    ULONG* actual_size,
    ULONG* offset_from_first_page,
    MEMORY_CACHING_TYPE* cache_type) {
    PAGED_CODE();
    if (requested_size < format_.block_align() ||
        audio_buffer_mdl == nullptr ||
        actual_size == nullptr ||
        offset_from_first_page == nullptr ||
        cache_type == nullptr ||
        dma_mdl_ != nullptr) {
        return STATUS_INVALID_PARAMETER;
    }

    requested_size -= requested_size % format_.block_align();

    PHYSICAL_ADDRESS high{};
    high.QuadPart = MAXULONG;
    PMDL mdl = port_stream_->AllocatePagesForMdl(
        high,
        requested_size);
    if (mdl == nullptr) return STATUS_INSUFFICIENT_RESOURCES;

    BYTE* buffer = static_cast<BYTE*>(
        port_stream_->MapAllocatedPages(mdl, MmCached));
    if (buffer == nullptr) {
        port_stream_->FreePagesFromMdl(mdl);
        return STATUS_INSUFFICIENT_RESOURCES;
    }

    RtlZeroMemory(buffer, requested_size);
    dma_mdl_ = mdl;
    dma_buffer_ = buffer;
    dma_buffer_bytes_ = requested_size;
    clock_.Configure(
        format_.sample_rate * format_.block_align(),
        format_.block_align(),
        requested_size);

    *audio_buffer_mdl = mdl;
    *actual_size = requested_size;
    *offset_from_first_page = 0;
    *cache_type = MmCached;
    return STATUS_SUCCESS;
}

VOID MicDeckWaveRTStream::FreeAudioBuffer(
    PMDL mdl,
    ULONG size) {
    PAGED_CODE();
    UNREFERENCED_PARAMETER(size);
    StopTimer();

    if (mdl == nullptr || mdl != dma_mdl_) return;

    if (dma_buffer_ != nullptr) {
        port_stream_->UnmapAllocatedPages(dma_buffer_, mdl);
    }
    port_stream_->FreePagesFromMdl(mdl);

    dma_mdl_ = nullptr;
    dma_buffer_ = nullptr;
    dma_buffer_bytes_ = 0;
    notification_count_ = 0;
    transferred_linear_bytes_ = 0;
}

NTSTATUS MicDeckWaveRTStream::AllocateBufferWithNotification(
    ULONG notification_count,
    ULONG requested_size,
    PMDL* audio_buffer_mdl,
    ULONG* actual_size,
    ULONG* offset_from_first_page,
    MEMORY_CACHING_TYPE* cache_type) {
    PAGED_CODE();
    if (notification_count == 0 ||
        notification_count > 128 ||
        requested_size % notification_count != 0) {
        return STATUS_INVALID_PARAMETER;
    }

    NTSTATUS status = AllocateAudioBuffer(
        requested_size,
        audio_buffer_mdl,
        actual_size,
        offset_from_first_page,
        cache_type);
    if (!NT_SUCCESS(status)) return status;

    notification_count_ = notification_count;
    const ULONG bytes_per_second =
        format_.sample_rate * format_.block_align();
    const ULONG bytes_per_period =
        *actual_size / notification_count;
    notification_period_ms_ =
        (bytes_per_period * 1000u) / bytes_per_second;
    if (notification_period_ms_ == 0) {
        notification_period_ms_ = 1;
    }
    return STATUS_SUCCESS;
}

VOID MicDeckWaveRTStream::FreeBufferWithNotification(
    PMDL mdl,
    ULONG size) {
    FreeAudioBuffer(mdl, size);
}

NTSTATUS MicDeckWaveRTStream::RegisterNotificationEvent(
    PKEVENT notification_event) {
    PAGED_CODE();
    if (notification_event == nullptr) {
        return STATUS_INVALID_PARAMETER;
    }

    auto* item = static_cast<MicDeckNotificationEntry*>(
        ExAllocatePool2(
            POOL_FLAG_NON_PAGED,
            sizeof(MicDeckNotificationEntry),
            MICDECK_STREAM_POOLTAG));
    if (item == nullptr) {
        return STATUS_INSUFFICIENT_RESOURCES;
    }
    item->event = notification_event;

    KIRQL old_irql;
    KeAcquireSpinLock(&notification_lock_, &old_irql);
    for (PLIST_ENTRY entry = notification_events_.Flink;
         entry != &notification_events_;
         entry = entry->Flink) {
        auto* current = CONTAINING_RECORD(
            entry,
            MicDeckNotificationEntry,
            link);
        if (current->event == notification_event) {
            KeReleaseSpinLock(&notification_lock_, old_irql);
            ExFreePoolWithTag(item, MICDECK_STREAM_POOLTAG);
            return STATUS_OBJECT_NAME_COLLISION;
        }
    }
    InsertTailList(&notification_events_, &item->link);
    KeReleaseSpinLock(&notification_lock_, old_irql);
    return STATUS_SUCCESS;
}

NTSTATUS MicDeckWaveRTStream::UnregisterNotificationEvent(
    PKEVENT notification_event) {
    PAGED_CODE();
    if (notification_event == nullptr) {
        return STATUS_INVALID_PARAMETER;
    }

    KIRQL old_irql;
    KeAcquireSpinLock(&notification_lock_, &old_irql);
    for (PLIST_ENTRY entry = notification_events_.Flink;
         entry != &notification_events_;
         entry = entry->Flink) {
        auto* current = CONTAINING_RECORD(
            entry,
            MicDeckNotificationEntry,
            link);
        if (current->event == notification_event) {
            RemoveEntryList(entry);
            KeReleaseSpinLock(&notification_lock_, old_irql);
            ExFreePoolWithTag(current, MICDECK_STREAM_POOLTAG);
            return STATUS_SUCCESS;
        }
    }
    KeReleaseSpinLock(&notification_lock_, old_irql);
    return STATUS_NOT_FOUND;
}

NTSTATUS MicDeckWaveRTStream::GetPosition(
    KSAUDIO_POSITION* position) {
    if (position == nullptr) return STATUS_INVALID_PARAMETER;
    const ULONGLONG linear = clock_.LinearBytes();
    position->PlayOffset = linear;
    position->WriteOffset =
        linear + format_.block_align() * 2u;
    return STATUS_SUCCESS;
}

NTSTATUS MicDeckWaveRTStream::GetClockRegister(
    PKSRTAUDIO_HWREGISTER reg) {
    PAGED_CODE();
    UNREFERENCED_PARAMETER(reg);
    return STATUS_NOT_IMPLEMENTED;
}

NTSTATUS MicDeckWaveRTStream::GetPositionRegister(
    PKSRTAUDIO_HWREGISTER reg) {
    PAGED_CODE();
    UNREFERENCED_PARAMETER(reg);
    return STATUS_NOT_IMPLEMENTED;
}

VOID MicDeckWaveRTStream::GetHWLatency(
    PKSRTAUDIO_HWLATENCY latency) {
    PAGED_CODE();
    if (latency == nullptr) return;
    latency->ChipsetDelay = 0;
    latency->CodecDelay = 0;
    latency->FifoSize =
        format_.block_align() * 240u;
}

NTSTATUS MicDeckWaveRTStream::SetFormat(PKSDATAFORMAT data_format) {
    PAGED_CODE();
    if (data_format == nullptr) return STATUS_INVALID_PARAMETER;

    MdPcmFormat format{};
    const NTSTATUS status = MdFormatFromKs(data_format, &format);
    if (!NT_SUCCESS(status)) return status;

    // The DPC converts samples using format_, so it may only change while the stream is
    // parked; a running stream would start encoding with a mismatched block size.
    if (state_ != KSSTATE_STOP && state_ != KSSTATE_ACQUIRE) {
        return STATUS_INVALID_DEVICE_STATE;
    }
    format_ = format;
    return STATUS_SUCCESS;
}

NTSTATUS MicDeckWaveRTStream::SetState(KSSTATE state) {
    PAGED_CODE();
    if (state > KSSTATE_RUN) return STATUS_INVALID_PARAMETER;

    switch (state) {
    case KSSTATE_STOP:
        StopTimer();
        clock_.Stop();
        transferred_linear_bytes_ = 0;
        if (dma_buffer_ != nullptr) {
            RtlZeroMemory(dma_buffer_, dma_buffer_bytes_);
        }
        if (capture_) cable_->SetCaptureState(state);
        else cable_->SetRenderState(state);
        break;

    case KSSTATE_ACQUIRE:
        break;

    case KSSTATE_PAUSE:
        StopTimer();
        clock_.Pause();
        if (capture_) cable_->SetCaptureState(state);
        else cable_->SetRenderState(state);
        break;

    case KSSTATE_RUN:
        if (dma_buffer_ == nullptr ||
            dma_buffer_bytes_ == 0) {
            return STATUS_INVALID_DEVICE_STATE;
        }
        clock_.Start();
        if (capture_) cable_->SetCaptureState(state);
        else cable_->SetRenderState(state);
        StartTimer();
        break;
    }

    state_ = state;
    return STATUS_SUCCESS;
}

void MicDeckWaveRTStream::StartTimer() noexcept {
    if (InterlockedExchange(&timer_armed_, 1) != 0) return;
    LARGE_INTEGER due{};
    due.QuadPart =
        -static_cast<LONGLONG>(notification_period_ms_) * 10'000ll;
    KeSetTimerEx(
        &timer_,
        due,
        static_cast<LONG>(notification_period_ms_),
        &dpc_);
}

void MicDeckWaveRTStream::StopTimer() noexcept {
    if (InterlockedExchange(&timer_armed_, 0) == 0) return;
    KeCancelTimer(&timer_);
    KeRemoveQueueDpc(&dpc_);
    KeFlushQueuedDpcs();
}

VOID MicDeckWaveRTStream::TimerDpc(
    KDPC* dpc,
    PVOID deferred_context,
    PVOID system_argument1,
    PVOID system_argument2) {
    UNREFERENCED_PARAMETER(dpc);
    UNREFERENCED_PARAMETER(system_argument1);
    UNREFERENCED_PARAMETER(system_argument2);
    auto* self =
        static_cast<MicDeckWaveRTStream*>(deferred_context);
    if (self != nullptr) self->OnTimerDpc();
}

void MicDeckWaveRTStream::OnTimerDpc() noexcept {
    if (InterlockedCompareExchange(
            &timer_armed_, 0, 0) == 0 ||
        state_ != KSSTATE_RUN ||
        dma_buffer_ == nullptr) {
        return;
    }

    const ULONGLONG now = clock_.LinearBytes();
    TransferElapsedBytes(now);
    SignalNotifications();
}

void MicDeckWaveRTStream::TransferElapsedBytes(
    ULONGLONG new_linear_position) noexcept {
    if (new_linear_position <= transferred_linear_bytes_ ||
        dma_buffer_bytes_ == 0) {
        return;
    }

    ULONGLONG pending =
        new_linear_position - transferred_linear_bytes_;
    const ULONGLONG max_pending =
        static_cast<ULONGLONG>(dma_buffer_bytes_) * 4ull;
    if (pending > max_pending) {
        pending = max_pending;
        transferred_linear_bytes_ =
            new_linear_position - pending;
    }

    while (pending != 0) {
        const ULONG offset = static_cast<ULONG>(
            transferred_linear_bytes_ % dma_buffer_bytes_);
        const ULONG contiguous =
            dma_buffer_bytes_ - offset;
        ULONG bytes = static_cast<ULONG>(
            pending > contiguous ? contiguous : pending);
        bytes -= bytes % format_.block_align();
        if (bytes == 0) break;

        TransferSegment(offset, bytes);
        transferred_linear_bytes_ += bytes;
        pending -= bytes;
    }
}

void MicDeckWaveRTStream::TransferSegment(
    ULONG offset,
    ULONG bytes) noexcept {
    if (bytes == 0 || dma_buffer_ == nullptr) return;
    const uint32_t frames =
        bytes / format_.block_align();
    void* segment = dma_buffer_ + offset;

    if (capture_) {
        cable_->Read(segment, frames, format_);
    } else {
        cable_->Write(segment, frames, format_);
    }
}

void MicDeckWaveRTStream::SignalNotifications() noexcept {
    KIRQL old_irql;
    KeAcquireSpinLock(&notification_lock_, &old_irql);
    for (PLIST_ENTRY entry = notification_events_.Flink;
         entry != &notification_events_;
         entry = entry->Flink) {
        auto* item = CONTAINING_RECORD(
            entry,
            MicDeckNotificationEntry,
            link);
        KeSetEvent(item->event, IO_NO_INCREMENT, FALSE);
    }
    KeReleaseSpinLock(&notification_lock_, old_irql);
}
