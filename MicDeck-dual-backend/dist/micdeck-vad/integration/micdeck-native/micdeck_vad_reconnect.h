#pragma once
#include "micdeck_vad_endpoint.h"
#include <atomic>
#include <functional>
#include <thread>
class MicDeckVadReconnectController{
public:
 using ReopenCallback=std::function<bool(const std::wstring&,std::wstring&)>;
 explicit MicDeckVadReconnectController(ReopenCallback reopen);
 ~MicDeckVadReconnectController();void Start();void Stop();void NotifyRenderFailure(HRESULT error);
 uint64_t ReconnectAttempts() const noexcept;uint64_t ReconnectSuccesses() const noexcept;
private:void Run();ReopenCallback reopen_;std::thread thread_;
 std::atomic<bool> running_{false},requested_{false};
 std::atomic<uint64_t> attempts_{0},successes_{0};
};
