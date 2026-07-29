$ErrorActionPreference="Stop"
$Root=Split-Path -Parent $PSScriptRoot
cmake -S (Join-Path $Root "tests") -B (Join-Path $Root "out\tests") -A x64
cmake --build (Join-Path $Root "out\tests") --config Release --parallel
ctest --test-dir (Join-Path $Root "out\tests") -C Release --output-on-failure
