#define WIN32_LEAN_AND_MEAN
#define NOMINMAX

#include "default_endpoint.h"

#include <Mmdeviceapi.h>
#include <Unknwn.h>
#include <windows.h>

namespace {

// PolicyConfig is the Windows component used by the system Sound UI to change
// the default endpoint. It is not exposed by windows-rs/WDK headers, so the
// small ABI declaration stays isolated in this file.
struct IPolicyConfig : IUnknown {
    virtual HRESULT STDMETHODCALLTYPE GetMixFormat(PCWSTR, void**) = 0;
    virtual HRESULT STDMETHODCALLTYPE GetDeviceFormat(PCWSTR, INT, void**) = 0;
    virtual HRESULT STDMETHODCALLTYPE ResetDeviceFormat(PCWSTR) = 0;
    virtual HRESULT STDMETHODCALLTYPE SetDeviceFormat(PCWSTR, void*, void*) = 0;
    virtual HRESULT STDMETHODCALLTYPE GetProcessingPeriod(PCWSTR, INT, void*, void*) = 0;
    virtual HRESULT STDMETHODCALLTYPE SetProcessingPeriod(PCWSTR, void*) = 0;
    virtual HRESULT STDMETHODCALLTYPE GetShareMode(PCWSTR, void*) = 0;
    virtual HRESULT STDMETHODCALLTYPE SetShareMode(PCWSTR, void*) = 0;
    virtual HRESULT STDMETHODCALLTYPE GetPropertyValue(PCWSTR, const void*, void*) = 0;
    virtual HRESULT STDMETHODCALLTYPE SetPropertyValue(PCWSTR, const void*, const void*) = 0;
    virtual HRESULT STDMETHODCALLTYPE SetDefaultEndpoint(PCWSTR, ERole) = 0;
    virtual HRESULT STDMETHODCALLTYPE SetEndpointVisibility(PCWSTR, INT) = 0;
};

constexpr GUID CLSID_PolicyConfigClient = {
    0x870af99c,
    0x171d,
    0x4f9e,
    {0xaf, 0x0d, 0xe6, 0x3d, 0xf4, 0x0c, 0x2b, 0xc9}};
constexpr GUID IID_IPolicyConfig = {
    0xf8679f50,
    0x850a,
    0x41cf,
    {0x9c, 0x72, 0x43, 0x0f, 0x29, 0x02, 0x90, 0xc8}};

std::wstring policy_error(HRESULT result) {
    wchar_t text[160]{};
    swprintf_s(
        text,
        L"Windows nie pozwolił ustawić domyślnego mikrofonu (0x%08X).",
        static_cast<unsigned>(result));
    return text;
}

bool initialize_com(bool& uninitialize, std::wstring& error) {
    const HRESULT result = CoInitializeEx(nullptr, COINIT_MULTITHREADED);
    uninitialize = SUCCEEDED(result);
    if (FAILED(result) && result != RPC_E_CHANGED_MODE) {
        error = policy_error(result);
        return false;
    }
    return true;
}

HRESULT get_endpoint_id(IMMDeviceEnumerator* enumerator, ERole role, std::wstring& endpoint_id) {
    IMMDevice* device = nullptr;
    HRESULT result = enumerator->GetDefaultAudioEndpoint(eCapture, role, &device);
    if (FAILED(result)) {
        return result;
    }

    LPWSTR raw_id = nullptr;
    result = device->GetId(&raw_id);
    if (SUCCEEDED(result) && raw_id != nullptr) {
        endpoint_id = raw_id;
    }
    CoTaskMemFree(raw_id);
    device->Release();
    return result;
}

HRESULT create_policy(IPolicyConfig** policy) {
    return CoCreateInstance(
        CLSID_PolicyConfigClient,
        nullptr,
        CLSCTX_ALL,
        IID_IPolicyConfig,
        reinterpret_cast<void**>(policy));
}

bool endpoint_matches(const std::wstring& left, const std::wstring& right) {
    return !left.empty() && !right.empty() && _wcsicmp(left.c_str(), right.c_str()) == 0;
}

} // namespace

bool get_default_capture_endpoints(DefaultCaptureEndpoints& endpoints, std::wstring& error) {
    bool uninitialize = false;
    if (!initialize_com(uninitialize, error)) {
        return false;
    }

    IMMDeviceEnumerator* enumerator = nullptr;
    HRESULT result = CoCreateInstance(
        __uuidof(MMDeviceEnumerator),
        nullptr,
        CLSCTX_ALL,
        __uuidof(IMMDeviceEnumerator),
        reinterpret_cast<void**>(&enumerator));
    if (SUCCEEDED(result)) result = get_endpoint_id(enumerator, eConsole, endpoints.console);
    if (SUCCEEDED(result)) result = get_endpoint_id(enumerator, eMultimedia, endpoints.multimedia);
    if (SUCCEEDED(result)) {
        result = get_endpoint_id(enumerator, eCommunications, endpoints.communications);
    }

    if (enumerator != nullptr) enumerator->Release();
    if (uninitialize) CoUninitialize();
    if (FAILED(result)) {
        error = policy_error(result);
        return false;
    }
    return true;
}

bool set_default_capture_endpoint(const std::wstring& endpoint_id, std::wstring& error) {
    if (endpoint_id.empty()) {
        error = L"Brak identyfikatora systemowego mikrofonu.";
        return false;
    }

    bool uninitialize = false;
    if (!initialize_com(uninitialize, error)) {
        return false;
    }

    IPolicyConfig* policy = nullptr;
    HRESULT result = create_policy(&policy);
    if (SUCCEEDED(result)) result = policy->SetDefaultEndpoint(endpoint_id.c_str(), eConsole);
    if (SUCCEEDED(result)) result = policy->SetDefaultEndpoint(endpoint_id.c_str(), eMultimedia);
    if (SUCCEEDED(result)) result = policy->SetDefaultEndpoint(endpoint_id.c_str(), eCommunications);

    if (policy != nullptr) policy->Release();
    if (uninitialize) CoUninitialize();
    if (FAILED(result)) {
        error = policy_error(result);
        return false;
    }
    return true;
}

bool restore_default_capture_endpoints(
    const DefaultCaptureEndpoints& previous,
    const std::wstring& managed_endpoint_id,
    std::wstring& error) {
    DefaultCaptureEndpoints current;
    if (!get_default_capture_endpoints(current, error)) {
        return false;
    }

    bool uninitialize = false;
    if (!initialize_com(uninitialize, error)) {
        return false;
    }

    IPolicyConfig* policy = nullptr;
    HRESULT result = create_policy(&policy);
    if (SUCCEEDED(result) && endpoint_matches(current.console, managed_endpoint_id) &&
        !previous.console.empty()) {
        result = policy->SetDefaultEndpoint(previous.console.c_str(), eConsole);
    }
    if (SUCCEEDED(result) && endpoint_matches(current.multimedia, managed_endpoint_id) &&
        !previous.multimedia.empty()) {
        result = policy->SetDefaultEndpoint(previous.multimedia.c_str(), eMultimedia);
    }
    if (SUCCEEDED(result) && endpoint_matches(current.communications, managed_endpoint_id) &&
        !previous.communications.empty()) {
        result = policy->SetDefaultEndpoint(previous.communications.c_str(), eCommunications);
    }

    if (policy != nullptr) policy->Release();
    if (uninitialize) CoUninitialize();
    if (FAILED(result)) {
        error = policy_error(result);
        return false;
    }
    return true;
}
