#pragma once
#include "common.h"
NTSTATUS PropertyHandler_MicDeckVad(_In_ PPCPROPERTY_REQUEST request);
extern PCPROPERTY_ITEM g_MicDeckVadProperties[];
extern const ULONG g_MicDeckVadPropertyCount;
// DEFINE_PCAUTOMATION_TABLE_PROP emits a `const` definition, so this declaration
// must match it or MSVC reports C2373.
extern const PCAUTOMATION_TABLE g_MicDeckVadAutomation;
