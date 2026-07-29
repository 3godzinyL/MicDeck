param(
    [Parameter(Mandatory = $true)]
    [string]$PackageDirectory,

    [string]$Version = "0.3.0",

    [switch]$RequireValidKernelSignature
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Source = (Resolve-Path $PackageDirectory).Path
$Destination = Join-Path $Root "src-tauri\resources\micdeck-vad\package"
$Required = @("MicDeckVad.sys", "MicDeckVad.inf", "MicDeckVad.cat")

foreach ($Name in $Required) {
    $Path = Join-Path $Source $Name
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Brak wymaganego pliku: $Path"
    }
    if ((Get-Item -LiteralPath $Path).Attributes -band [IO.FileAttributes]::ReparsePoint) {
        throw "Pakiet nie może zawierać reparse pointów: $Path"
    }
}

if ($RequireValidKernelSignature) {
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
        throw "Nie znaleziono signtool.exe z Windows SDK."
    }

    foreach ($Name in @("MicDeckVad.sys", "MicDeckVad.cat")) {
        & $SignTool.FullName verify /kp /v (Join-Path $Source $Name)
        if ($LASTEXITCODE -ne 0) {
            throw "Podpis kernelowy nie przeszedł weryfikacji: $Name"
        }
    }
}

New-Item -ItemType Directory -Force -Path $Destination | Out-Null
Get-ChildItem -LiteralPath $Destination -File -ErrorAction SilentlyContinue |
    Remove-Item -Force

$Files = foreach ($Name in $Required) {
    $From = Join-Path $Source $Name
    $To = Join-Path $Destination $Name
    Copy-Item -LiteralPath $From -Destination $To -Force
    [ordered]@{
        name = $Name
        bytes = (Get-Item -LiteralPath $To).Length
        sha256 = (Get-FileHash -LiteralPath $To -Algorithm SHA256).Hash.ToLowerInvariant()
    }
}

$Manifest = [ordered]@{
    version = $Version
    abi = 3
    hardwareId = "ROOT\MICDECKVAD"
    renderEndpoint = "MicDeck Driver Input"
    captureEndpoint = "MicDeck Virtual Microphone"
    files = $Files
}

$ManifestPath = Join-Path $Destination "driver-manifest.json"
$ManifestJson = $Manifest | ConvertTo-Json -Depth 6
[IO.File]::WriteAllText(
    $ManifestPath,
    $ManifestJson,
    [Text.UTF8Encoding]::new($false)
)

Write-Host "MicDeck VAD package staged in: $Destination"
Get-Content -LiteralPath $ManifestPath
