#pragma once

#include <string>

struct DefaultCaptureEndpoints {
    std::wstring console;
    std::wstring multimedia;
    std::wstring communications;
};

bool get_default_capture_endpoints(DefaultCaptureEndpoints& endpoints, std::wstring& error);
bool set_default_capture_endpoint(const std::wstring& endpoint_id, std::wstring& error);
bool restore_default_capture_endpoints(
    const DefaultCaptureEndpoints& previous,
    const std::wstring& managed_endpoint_id,
    std::wstring& error);
