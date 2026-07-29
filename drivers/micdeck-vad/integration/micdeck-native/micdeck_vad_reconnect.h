#pragma once
#include "micdeck_vad_endpoint.h"
#include <atomic>
#include <condition_variable>
#include <functional>
#include <mutex>
#include <thread>

class MicDeckVadReconnectController {
public:
    using ReopenCallback = std::function<bool(const std::wstring&, std::wstring&)>;
    explicit MicDeckVadReconnectController(ReopenCallback reopen);
    ~MicDeckVadReconnectController();
    void Start();
    void Stop();
    void NotifyRenderFailure(HRESULT error);
    uint64_t ReconnectAttempts() const noexcept;
    uint64_t ReconnectSuccesses() const noexcept;

private:
    void Run();
    /// Sleeps up to `milliseconds`, returning false as soon as Stop() is called.
    bool WaitOrStop(unsigned milliseconds);

    ReopenCallback reopen_;
    std::thread thread_;
    std::mutex mutex_;
    std::condition_variable wake_;
    std::atomic<bool> running_{false}, requested_{false};
    std::atomic<uint64_t> attempts_{0}, successes_{0};
};
