#include "micdeck_vad_reconnect.h"
#include <Audioclient.h>
#include <objbase.h>
#include <chrono>

MicDeckVadReconnectController::MicDeckVadReconnectController(ReopenCallback r)
    : reopen_(std::move(r)) {}

MicDeckVadReconnectController::~MicDeckVadReconnectController() { Stop(); }

void MicDeckVadReconnectController::Start() {
    if (running_.exchange(true)) return;
    thread_ = std::thread(&MicDeckVadReconnectController::Run, this);
}

void MicDeckVadReconnectController::Stop() {
    if (!running_.exchange(false)) return;
    requested_ = true;
    // Wake the worker instead of letting it finish a backoff sleep; shutdown used to
    // block for up to 5.5 s waiting for that.
    wake_.notify_all();
    if (thread_.joinable()) thread_.join();
}

void MicDeckVadReconnectController::NotifyRenderFailure(HRESULT e) {
    if (e == AUDCLNT_E_DEVICE_INVALIDATED ||
        e == AUDCLNT_E_SERVICE_NOT_RUNNING ||
        e == HRESULT_FROM_WIN32(ERROR_DEVICE_NOT_AVAILABLE)) {
        requested_ = true;
        wake_.notify_all();
    }
}

uint64_t MicDeckVadReconnectController::ReconnectAttempts() const noexcept {
    return attempts_;
}

uint64_t MicDeckVadReconnectController::ReconnectSuccesses() const noexcept {
    return successes_;
}

bool MicDeckVadReconnectController::WaitOrStop(unsigned milliseconds) {
    std::unique_lock<std::mutex> lock(mutex_);
    wake_.wait_for(lock, std::chrono::milliseconds(milliseconds),
                   [this] { return !running_ || requested_; });
    return running_;
}

void MicDeckVadReconnectController::Run() {
    // Every probe goes through CoCreateInstance(MMDeviceEnumerator). Without COM
    // initialised on this thread it fails with CO_E_NOTINITIALIZED forever, so the
    // controller could never actually reconnect.
    const HRESULT com = CoInitializeEx(nullptr, COINIT_MULTITHREADED);
    if (FAILED(com) && com != RPC_E_CHANGED_MODE) {
        running_ = false;
        return;
    }

    unsigned backoff = 250;
    while (running_) {
        if (!requested_.exchange(false)) {
            if (!WaitOrStop(100)) break;
            continue;
        }
        while (running_) {
            ++attempts_;
            MicDeckVadEndpointPair pair;
            if (SUCCEEDED(WaitForMicDeckVadEndpoints(1500, &pair))) {
                std::wstring error;
                if (reopen_(pair.render_id, error)) {
                    ++successes_;
                    backoff = 250;
                    break;
                }
            }
            if (!WaitOrStop(backoff)) break;
            backoff = backoff < 4000 ? backoff * 2 : 4000;
        }
    }

    if (SUCCEEDED(com)) CoUninitialize();
}
