$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Out = Join-Path $Root "out\core-tests"
New-Item -ItemType Directory -Force -Path $Out | Out-Null

$cl = Get-Command cl.exe -ErrorAction SilentlyContinue
if (-not $cl) {
    throw "cl.exe is not in PATH. Start x64 Native Tools Command Prompt for VS 2022."
}

& cl.exe /nologo /std:c++20 /EHsc /W4 /O2 `
    (Join-Path $Root "tests\core_tests.cpp") `
    (Join-Path $Root "shared\micdeck_audio_core.cpp") `
    /Fe:(Join-Path $Out "core_tests.exe")

& (Join-Path $Out "core_tests.exe")
