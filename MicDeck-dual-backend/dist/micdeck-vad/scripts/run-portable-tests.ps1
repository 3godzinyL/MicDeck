$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$BuildDirectory = Join-Path $Root "out\tests"

$CMake = Get-Command cmake.exe -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty Source -First 1

if (-not $CMake) {
    $VsWhere = Join-Path `
        ${env:ProgramFiles(x86)} `
        "Microsoft Visual Studio\Installer\vswhere.exe"

    if (Test-Path $VsWhere) {
        $VisualStudio = (
            & $VsWhere `
                -latest `
                -products * `
                -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 `
                -property installationPath
        ) | Select-Object -First 1

        if ($VisualStudio) {
            $BundledCMake = Join-Path `
                $VisualStudio `
                "Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe"
            if (Test-Path $BundledCMake) {
                $CMake = $BundledCMake
            }
        }
    }
}

if (-not $CMake) {
    throw "cmake.exe was not found in PATH or the Visual Studio installation."
}

$CTest = Join-Path (Split-Path -Parent $CMake) "ctest.exe"
if (-not (Test-Path $CTest)) {
    throw "ctest.exe was not found next to cmake.exe."
}

& $CMake -S (Join-Path $Root "tests") -B $BuildDirectory -A x64
if ($LASTEXITCODE -ne 0) {
    throw "Portable test configuration failed with exit code $LASTEXITCODE."
}

& $CMake --build $BuildDirectory --config Release --parallel
if ($LASTEXITCODE -ne 0) {
    throw "Portable test build failed with exit code $LASTEXITCODE."
}

& $CTest `
    --test-dir $BuildDirectory `
    -C Release `
    --output-on-failure
if ($LASTEXITCODE -ne 0) {
    throw "Portable tests failed with exit code $LASTEXITCODE."
}
