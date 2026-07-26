#pragma once
#include "common.h"
NTSTATUS PropertyHandler_MicDeckVad(_In_ PPCPROPERTY_REQUEST request);
extern PCPROPERTY_ITEM g_MicDeckVadProperties[];
extern const ULONG g_MicDeckVadPropertyCount;
extern PCAUTOMATION_TABLE g_MicDeckVadAutomation;
