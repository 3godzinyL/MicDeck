param(
    [ValidateSet("Debug", "Release")]
    [string]$DriverConfiguration = "Release",

    [string]$PackageDirectory = "",

    [string]$CertificateThumbprint = $env:MICDECK_DRIVER_CERT_THUMBPRINT,

    [switch]$SkipNpmInstall,

    [switch]$RequireValidKernelSignature
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$DriverRoot = Join-Path $Root "drivers\micdeck-vad"
$GeneratedPackage = Join-Path $Root "out\micdeck-vad-package"

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][string]$File,
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [string]$WorkingDirectory = $Root
    )

    Write-Host ">> $File $($Arguments -join ' ')"
    $Previous = Get-Location
    try {
        Set-Location $WorkingDirectory
        & $File @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "$File zakończył się kodem $LASTEXITCODE"
        }
    }
    finally {
        Set-Location $Previous
    }
}

if (-not $PackageDirectory) {
    Write-Host "[1/5] Budowanie MicDeckVad.sys przez WDK..."
    & (Join-Path $DriverRoot "scripts\build.ps1") -Configuration $DriverConfiguration
    if ($LASTEXITCODE -ne 0) {
        throw "Build sterownika nie powiódł się."
    }

    Write-Host "[2/5] Tworzenie INF/CAT i manifestu..."
    & (Join-Path $DriverRoot "scripts\make-release-package.ps1") `
        -Configuration $DriverConfiguration `
        -Output $GeneratedPackage
    if ($LASTEXITCODE -ne 0) {
        throw "Pakowanie sterownika nie powiodło się."
    }

    if ($CertificateThumbprint) {
        $SignTool = Get-ChildItem `
            "${env:ProgramFiles(x86)}\Windows Kits\10\bin" `
            -Filter signtool.exe `
            -File `
            -Recurse `
            -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -match "\\x64\\" } |
            Sort-Object FullName -Descending |
            Select-Object -First 1

        if (-not $SignTool) {
            throw "Nie znaleziono signtool.exe."
        }

        foreach ($Name in @("MicDeckVad.sys", "MicDeckVad.cat")) {
            Invoke-Checked $SignTool.FullName @(
                "sign", "/sha1", $CertificateThumbprint,
                "/fd", "SHA256", "/v",
                (Join-Path $GeneratedPackage $Name)
            )
        }
    }
    else {
        Write-Warning "Brak MICDECK_DRIVER_CERT_THUMBPRINT. Pakiet zostanie osadzony, ale Windows załaduje go wyłącznie, jeśli został podpisany wcześniej lub system testowy akceptuje ten podpis."
    }

    $PackageDirectory = $GeneratedPackage
}

Write-Host "[3/5] Osadzanie pakietu sterownika w aplikacji..."
$StageArguments = @(
    "-NoProfile", "-ExecutionPolicy", "Bypass",
    "-File", (Join-Path $Root "scripts\stage-micdeck-vad-package.ps1"),
    "-PackageDirectory", $PackageDirectory,
    "-Version", "0.3.0"
)
if ($RequireValidKernelSignature) {
    $StageArguments += "-RequireValidKernelSignature"
}
Invoke-Checked "powershell.exe" $StageArguments

if (-not $SkipNpmInstall) {
    Write-Host "[4/5] npm install..."
    Invoke-Checked "npm.cmd" @("install")
}

Write-Host "[5/5] Budowanie MicDeck, C++ engine, helpera i instalatora..."
Invoke-Checked "npm.cmd" @("run", "build:all")

Write-Host ""
Write-Host "Gotowe. Aplikacja zawiera oba backendy: VB-CABLE oraz MicDeck VAD."
Write-Host "Artefakty: $Root\release"
