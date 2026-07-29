// DEFINE_GUID only declares a GUID; it allocates storage for it exactly when
// <initguid.h> has been included first. Without this translation unit every PortCls
// CLSID/IID the miniports reference — and our own property set GUID — is an unresolved
// external at link time.
//
// Only one translation unit in the driver may include <initguid.h>.

#include <ntddk.h>
#include <initguid.h>
#include <portcls.h>

#include "../include/micdeck_vad_public.h"
