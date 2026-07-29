#include "common.h"

void* __cdecl operator new(
    size_t size,
    POOL_FLAGS flags,
    ULONG tag) noexcept {
    return ExAllocatePool2(flags, size, tag);
}

// The unsized operator delete(void*) is deliberately NOT defined here: stdunk.lib ships
// one in the same object as CUnknown, so defining it again is a guaranteed LNK2005.
void __cdecl operator delete(
    void* memory,
    size_t) noexcept {
    if (memory != nullptr) {
        ExFreePool(memory);
    }
}

void __cdecl operator delete[](void* memory) noexcept {
    if (memory != nullptr) {
        ExFreePool(memory);
    }
}

void __cdecl operator delete[](
    void* memory,
    size_t) noexcept {
    if (memory != nullptr) {
        ExFreePool(memory);
    }
}

// Only reached when a constructor throws out of a placement-new expression,
// which cannot happen in kernel mode; it must still exist so the compiler can
// emit the matching new expression.
void __cdecl operator delete(
    void* memory,
    POOL_FLAGS,
    ULONG tag) noexcept {
    if (memory != nullptr) {
        ExFreePoolWithTag(memory, tag);
    }
}
