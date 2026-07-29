param([string]$DevconPath = "")

$ErrorActionPreference = "Stop"

if (-not $DevconPath) {
    $candidate = Get-ChildItem `
        "${env:ProgramFiles(x86)}\Windows Kits\10\Tools" `
        -Filter devcon.exe -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match "\\x64\\" } |
        Select-Object -First 1
    if ($candidate) { $DevconPath = $candidate.FullName }
}

if ($DevconPath -and (Test-Path $DevconPath)) {
    & $DevconPath remove "ROOT\MICDECKVAD"
} else {
    Write-Warning "devcon.exe not found; remove ROOT\MICDECKVAD in Device Manager."
}

Write-Host "The device was requested for removal."
Write-Host "Use 'pnputil /enum-drivers' and remove the matching OEM INF only after verifying its provider/name."
