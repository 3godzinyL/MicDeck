#pragma once
#include <cstdint>
enum class MicDeckDriverCommand:uint32_t{Status=1,Install=2,Repair=3,Uninstall=4};
struct MicDeckDriverHelperResult{
    bool ok=false;uint32_t win32_error=0;bool reboot_required=false;
    bool device_present=false;bool package_present=false;
};
