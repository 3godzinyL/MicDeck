#include "common.h"

void* __cdecl operator new(
    size_t size,
    POOL_FLAGS flags,
    ULONG tag) noexcept {
    return ExAllocatePool2(flags, size, tag);
}

void __cdecl operator delete(
    void* memory,
    size_t) noexcept {
    if (memory != nullptr) {
        ExFreePool(memory);
    }
}

void __cdecl operator delete(
    void* memory,
    POOL_FLAGS,
    ULONG tag) noexcept {
    if (memory != nullptr) {
        ExFreePoolWithTag(memory, tag);
    }
}
