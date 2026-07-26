param(
    [string]$Output = "",
    [ValidateRange(1, 30)]
    [int]$Seconds = 3
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

if (-not $Output) {
    $Output = Join-Path $Root "out\audio-e2e.json"
}

$Build = Join-Path $Root "out\e2e-certifier"
New-Item -ItemType Directory -Force `
    -Path (Split-Path -Parent $Output) |
    Out-Null

cmake.exe `
    -S (Join-Path $Root "tools\e2e-certifier") `
    -B $Build `
    -A x64

if ($LASTEXITCODE -ne 0) {
    throw "E2E certifier configure failed."
}

cmake.exe `
    --build $Build `
    --config Release `
    --parallel

if ($LASTEXITCODE -ne 0) {
    throw "E2E certifier build failed."
}

$Executable = Get-ChildItem `
    $Build `
    -Filter micdeck-vad-e2e-certifier.exe `
    -File `
    -Recurse |
    Select-Object -First 1

if (-not $Executable) {
    throw "E2E executable was not produced."
}

& $Executable.FullName `
    --output $Output `
    --seconds $Seconds

if ($LASTEXITCODE -ne 0) {
    throw "Render-to-capture certification failed. Read $Output."
}

Write-Host "Render-to-capture certification passed."
