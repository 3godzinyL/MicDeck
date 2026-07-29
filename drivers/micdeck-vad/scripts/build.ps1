param(
    [ValidateSet("Debug", "Release")]
    [string]$Configuration = "Debug"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Solution = Join-Path $Root "MicDeckVad.sln"

$msbuild = Get-Command msbuild.exe -ErrorAction SilentlyContinue
if (-not $msbuild) {
    throw @"
MSBuild is not in PATH.
Install Visual Studio 2022 with:
  - Desktop development with C++
  - Windows Driver Kit
Then run this script from a Developer PowerShell.
"@
}

& msbuild.exe $Solution `
    /m `
    /restore `
    /p:Configuration=$Configuration `
    /p:Platform=x64 `
    /warnAsError:false

if ($LASTEXITCODE -ne 0) {
    throw "Driver build failed with exit code $LASTEXITCODE."
}

Write-Host "Build completed. Inspect driver\x64\$Configuration and package output."
