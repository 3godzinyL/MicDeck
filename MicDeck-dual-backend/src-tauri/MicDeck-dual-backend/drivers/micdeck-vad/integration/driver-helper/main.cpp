#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <cfgmgr32.h>
#include <newdev.h>
#include <setupapi.h>

#include <filesystem>
#include <iostream>
#include <string>
#include <vector>

#pragma comment(lib, "cfgmgr32.lib")
#pragma comment(lib, "newdev.lib")
#pragma comment(lib, "setupapi.lib")

namespace {

constexpr wchar_t kHardwareId[] = L"ROOT\\MICDECKVAD";
constexpr wchar_t kInfName[] = L"MicDeckVad.inf";
constexpr wchar_t kSysName[] = L"MicDeckVad.sys";
constexpr wchar_t kCatName[] = L"MicDeckVad.cat";

struct Result {
    bool ok = false;
    DWORD win32_error = ERROR_SUCCESS;
    bool reboot_required = false;
    bool device_present = false;
    bool package_present = false;
    std::wstring message;
};

void print_json(const Result& result) {
    auto escape = [](const std::wstring& input) {
        std::wstring output;
        for (wchar_t ch : input) {
            switch (ch) {
            case L'\\': output += L"\\\\"; break;
            case L'\"': output += L"\\\""; break;
            case L'\n': output += L"\\n"; break;
            case L'\r': output += L"\\r"; break;
            case L'\t': output += L"\\t"; break;
            default: output += ch; break;
            }
        }
        return output;
    };

    std::wcout
        << L"{"
        << L"\"ok\":" << (result.ok ? L"true" : L"false")
        << L",\"win32Error\":" << result.win32_error
        << L",\"rebootRequired\":"
        << (result.reboot_required ? L"true" : L"false")
        << L",\"devicePresent\":"
        << (result.device_present ? L"true" : L"false")
        << L",\"packagePresent\":"
        << (result.package_present ? L"true" : L"false")
        << L",\"message\":\"" << escape(result.message) << L"\""
        << L"}\n";
}

bool is_elevated() {
    HANDLE token = nullptr;
    if (!OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &token)) {
        return false;
    }

    TOKEN_ELEVATION elevation{};
    DWORD returned = 0;
    const BOOL ok = GetTokenInformation(
        token,
        TokenElevation,
        &elevation,
        sizeof(elevation),
        &returned);
    CloseHandle(token);
    return ok && elevation.TokenIsElevated != 0;
}

bool hardware_ids_contain(const BYTE* buffer, DWORD bytes, const wchar_t* expected) {
    if (buffer == nullptr || bytes < sizeof(wchar_t) * 2) {
        return false;
    }

    const auto* cursor = reinterpret_cast<const wchar_t*>(buffer);
    const auto* end = reinterpret_cast<const wchar_t*>(buffer + bytes);
    while (cursor < end && *cursor != L'\0') {
        if (_wcsicmp(cursor, expected) == 0) {
            return true;
        }
        cursor += wcslen(cursor) + 1;
    }
    return false;
}

std::vector<SP_DEVINFO_DATA> matching_devices(HDEVINFO devices) {
    std::vector<SP_DEVINFO_DATA> matches;
    for (DWORD index = 0;; ++index) {
        SP_DEVINFO_DATA data{};
        data.cbSize = sizeof(data);
        if (!SetupDiEnumDeviceInfo(devices, index, &data)) {
            if (GetLastError() == ERROR_NO_MORE_ITEMS) {
                break;
            }
            continue;
        }

        DWORD required = 0;
        DWORD type = 0;
        SetupDiGetDeviceRegistryPropertyW(
            devices,
            &data,
            SPDRP_HARDWAREID,
            &type,
            nullptr,
            0,
            &required);
        if (required == 0 || type != REG_MULTI_SZ) {
            continue;
        }

        std::vector<BYTE> buffer(required);
        if (!SetupDiGetDeviceRegistryPropertyW(
                devices,
                &data,
                SPDRP_HARDWAREID,
                &type,
                buffer.data(),
                static_cast<DWORD>(buffer.size()),
                nullptr)) {
            continue;
        }

        if (hardware_ids_contain(buffer.data(), static_cast<DWORD>(buffer.size()), kHardwareId)) {
            matches.push_back(data);
        }
    }
    return matches;
}

bool device_present() {
    HDEVINFO devices = SetupDiGetClassDevsW(
        nullptr,
        nullptr,
        nullptr,
        DIGCF_ALLCLASSES | DIGCF_PRESENT);
    if (devices == INVALID_HANDLE_VALUE) {
        return false;
    }
    const bool present = !matching_devices(devices).empty();
    SetupDiDestroyDeviceInfoList(devices);
    return present;
}

bool package_files_exist(const std::filesystem::path& package_dir) {
    return std::filesystem::is_regular_file(package_dir / kInfName)
        && std::filesystem::is_regular_file(package_dir / kSysName)
        && std::filesystem::is_regular_file(package_dir / kCatName);
}

bool create_root_device(const std::filesystem::path& inf_path, DWORD& error) {
    GUID class_guid{};
    wchar_t class_name[MAX_CLASS_NAME_LEN]{};
    if (!SetupDiGetINFClassW(
            inf_path.c_str(),
            &class_guid,
            class_name,
            ARRAYSIZE(class_name),
            nullptr)) {
        error = GetLastError();
        return false;
    }

    HDEVINFO devices = SetupDiCreateDeviceInfoList(&class_guid, nullptr);
    if (devices == INVALID_HANDLE_VALUE) {
        error = GetLastError();
        return false;
    }

    SP_DEVINFO_DATA device{};
    device.cbSize = sizeof(device);
    if (!SetupDiCreateDeviceInfoW(
            devices,
            class_name,
            &class_guid,
            L"MicDeck Virtual Audio Cable",
            nullptr,
            DICD_GENERATE_ID,
            &device)) {
        error = GetLastError();
        SetupDiDestroyDeviceInfoList(devices);
        return false;
    }

    const wchar_t hardware_ids[] = L"ROOT\\MICDECKVAD\0\0";
    if (!SetupDiSetDeviceRegistryPropertyW(
            devices,
            &device,
            SPDRP_HARDWAREID,
            reinterpret_cast<const BYTE*>(hardware_ids),
            sizeof(hardware_ids))) {
        error = GetLastError();
        SetupDiDestroyDeviceInfoList(devices);
        return false;
    }

    if (!SetupDiCallClassInstaller(DIF_REGISTERDEVICE, devices, &device)) {
        error = GetLastError();
        SetupDiDestroyDeviceInfoList(devices);
        return false;
    }

    SetupDiDestroyDeviceInfoList(devices);
    return true;
}

Result status_result() {
    Result result{};
    result.ok = true;
    result.device_present = device_present();
    result.package_present = result.device_present;
    result.message = result.device_present
        ? L"MicDeck VAD device is present."
        : L"MicDeck VAD device is not installed.";
    return result;
}

Result install_or_repair(const std::filesystem::path& package_dir) {
    Result result{};
    if (!is_elevated()) {
        result.win32_error = ERROR_ELEVATION_REQUIRED;
        result.message = L"Administrator rights are required.";
        return result;
    }

    std::error_code path_error;
    const auto canonical = std::filesystem::weakly_canonical(package_dir, path_error);
    if (path_error || !std::filesystem::is_directory(canonical)) {
        result.win32_error = ERROR_PATH_NOT_FOUND;
        result.message = L"Driver package directory does not exist.";
        return result;
    }
    if (!package_files_exist(canonical)) {
        result.win32_error = ERROR_FILE_NOT_FOUND;
        result.message = L"MicDeckVad.sys, MicDeckVad.inf or MicDeckVad.cat is missing.";
        return result;
    }

    const auto inf = canonical / kInfName;
    wchar_t published_name[MAX_PATH]{};
    if (!SetupCopyOEMInfW(
            inf.c_str(),
            canonical.c_str(),
            SPOST_PATH,
            0,
            published_name,
            ARRAYSIZE(published_name),
            nullptr,
            nullptr)) {
        const DWORD copy_error = GetLastError();
        if (copy_error != ERROR_FILE_EXISTS) {
            result.win32_error = copy_error;
            result.message = L"Windows rejected the driver package.";
            return result;
        }
    }
    result.package_present = true;

    bool created_device = false;
    if (!device_present()) {
        DWORD create_error = ERROR_SUCCESS;
        if (!create_root_device(inf, create_error)) {
            result.win32_error = create_error;
            result.message = L"Could not create the root-enumerated MicDeck VAD device.";
            return result;
        }
        created_device = true;
    }

    BOOL reboot = FALSE;
    if (!UpdateDriverForPlugAndPlayDevicesW(
            nullptr,
            kHardwareId,
            inf.c_str(),
            INSTALLFLAG_FORCE,
            &reboot)) {
        result.win32_error = GetLastError();
        result.message = created_device
            ? L"The device was created, but Windows rejected the driver update."
            : L"Windows rejected the MicDeck VAD driver update.";
        result.device_present = device_present();
        return result;
    }

    result.ok = true;
    result.reboot_required = reboot != FALSE;
    result.device_present = device_present();
    result.package_present = true;
    result.message = result.device_present
        ? L"MicDeck VAD installed successfully."
        : L"The driver package was installed; Windows may require a restart.";
    return result;
}

Result uninstall_device() {
    Result result{};
    if (!is_elevated()) {
        result.win32_error = ERROR_ELEVATION_REQUIRED;
        result.message = L"Administrator rights are required.";
        return result;
    }

    HDEVINFO devices = SetupDiGetClassDevsW(
        nullptr,
        nullptr,
        nullptr,
        DIGCF_ALLCLASSES | DIGCF_PRESENT);
    if (devices == INVALID_HANDLE_VALUE) {
        result.win32_error = GetLastError();
        result.message = L"Could not enumerate Windows devices.";
        return result;
    }

    bool removed_any = false;
    for (auto& data : matching_devices(devices)) {
        SP_REMOVEDEVICE_PARAMS params{};
        params.ClassInstallHeader.cbSize = sizeof(SP_CLASSINSTALL_HEADER);
        params.ClassInstallHeader.InstallFunction = DIF_REMOVE;
        params.Scope = DI_REMOVEDEVICE_GLOBAL;
        params.HwProfile = 0;

        if (!SetupDiSetClassInstallParamsW(
                devices,
                &data,
                &params.ClassInstallHeader,
                sizeof(params))) {
            result.win32_error = GetLastError();
            continue;
        }
        if (!SetupDiCallClassInstaller(DIF_REMOVE, devices, &data)) {
            result.win32_error = GetLastError();
            continue;
        }
        removed_any = true;
    }

    SetupDiDestroyDeviceInfoList(devices);
    result.device_present = device_present();
    result.package_present = result.device_present;
    result.ok = removed_any || !result.device_present;
    result.message = result.ok
        ? L"MicDeck VAD device removed."
        : L"Windows could not remove the MicDeck VAD device.";
    return result;
}

} // namespace

int wmain(int argc, wchar_t** argv) {
    if (argc < 2) {
        Result result{};
        result.win32_error = ERROR_INVALID_PARAMETER;
        result.message = L"Usage: micdeck-driver-helper status|install|repair|uninstall [package-dir]";
        print_json(result);
        return 64;
    }

    const std::wstring command = argv[1];
    Result result{};

    if (command == L"status") {
        result = status_result();
    } else if (command == L"install" || command == L"repair") {
        if (argc < 3) {
            result.win32_error = ERROR_INVALID_PARAMETER;
            result.message = L"A package directory is required.";
        } else {
            result = install_or_repair(argv[2]);
        }
    } else if (command == L"uninstall") {
        result = uninstall_device();
    } else {
        result.win32_error = ERROR_INVALID_PARAMETER;
        result.message = L"Unknown command.";
    }

    print_json(result);
    return result.ok ? 0 : 1;
}
