param(
    [ValidateSet("Debug", "Release")]
    [string]$Configuration = "Debug",
    [string]$DevconPath = ""
)

# Run only in a disposable test VM.
# This script does not disable Secure Boot or silently enable TESTSIGNING.

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Inf = Join-Path $Root "package\MicDeckVad.inf"

if (-not (Test-Path $Inf)) {
    throw "INF not found: $Inf"
}

if (-not $DevconPath) {
    $candidate = Get-ChildItem `
        "${env:ProgramFiles(x86)}\Windows Kits\10\Tools" `
        -Filter devcon.exe -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match "\\x64\\" } |
        Select-Object -First 1
    if ($candidate) { $DevconPath = $candidate.FullName }
}

if (-not $DevconPath -or -not (Test-Path $DevconPath)) {
    throw "devcon.exe x64 was not found. Pass -DevconPath explicitly."
}

Write-Host "Installing driver package into Driver Store..."
pnputil.exe /add-driver $Inf /install
if ($LASTEXITCODE -ne 0) {
    throw "pnputil failed."
}

Write-Host "Creating/updating root-enumerated MicDeck device..."
& $DevconPath install $Inf "ROOT\MICDECKVAD"
if ($LASTEXITCODE -ne 0) {
    throw "devcon install failed."
}

Write-Host "Installation command completed."
Write-Host "Open Device Manager and Sound Settings to verify the endpoints."
