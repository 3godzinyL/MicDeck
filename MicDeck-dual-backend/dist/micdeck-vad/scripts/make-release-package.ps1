param(
    [ValidateSet("Debug", "Release")]
    [string]$Configuration = "Release",

    [string]$Output = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

if (-not $Output) {
    $Output = Join-Path $Root "out\driver-package"
}
New-Item -ItemType Directory -Force -Path $Output | Out-Null

$Sys = Get-ChildItem $Root -Filter MicDeckVad.sys -File -Recurse |
    Where-Object {
        $_.FullName -match "\\$Configuration\\" -or
        $_.FullName -match "\\x64\\"
    } |
    Sort-Object LastWriteTimeUtc -Descending |
    Select-Object -First 1

if (-not $Sys) {
    throw "MicDeckVad.sys not found. Build the WDK project first."
}

$InfSource = Join-Path $Root "package\MicDeckVad.inf"
$SysTarget = Join-Path $Output "MicDeckVad.sys"
$InfTarget = Join-Path $Output "MicDeckVad.inf"

Copy-Item $Sys.FullName $SysTarget -Force
Copy-Item $InfSource $InfTarget -Force
Remove-Item (Join-Path $Output "MicDeckVad.cat") -Force -ErrorAction SilentlyContinue

$KitRoot = "${env:ProgramFiles(x86)}\Windows Kits\10"
$InfVerif = Get-ChildItem $KitRoot -Filter infverif.exe -File -Recurse `
    -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match "\\x64\\" } |
    Sort-Object FullName -Descending |
    Select-Object -First 1
$Inf2Cat = Get-ChildItem $KitRoot -Filter inf2cat.exe -File -Recurse `
    -ErrorAction SilentlyContinue |
    Sort-Object FullName -Descending |
    Select-Object -First 1

if (-not $Inf2Cat) {
    throw "Inf2Cat.exe was not found in the Windows Driver Kit."
}

if ($InfVerif) {
    & $InfVerif.FullName /w $InfTarget
    if ($LASTEXITCODE -ne 0) {
        throw "InfVerif /w rejected MicDeckVad.inf."
    }
}

$Help = (& $Inf2Cat.FullName /? 2>&1 | Out-String)
$PreferredTargets = @(
    "10_25H2_X64",
    "10_GE_X64",
    "10_NI_X64",
    "10_CO_X64",
    "10_VB_X64"
)
$Targets = @(
    $PreferredTargets |
    Where-Object { $Help -match [regex]::Escape($_) }
)
if ($Targets.Count -eq 0) {
    throw "This WDK did not report any supported Windows 10/11 x64 Inf2Cat identifiers."
}

& $Inf2Cat.FullName `
    "/driver:$Output" `
    "/os:$($Targets -join ',')" `
    /uselocaltime `
    /verbose

if ($LASTEXITCODE -ne 0) {
    throw "Inf2Cat rejected the MicDeck VAD package."
}

$CatTarget = Join-Path $Output "MicDeckVad.cat"
if (-not (Test-Path $CatTarget -PathType Leaf)) {
    throw "Inf2Cat did not create MicDeckVad.cat."
}

$Files = @(
    "MicDeckVad.sys",
    "MicDeckVad.inf",
    "MicDeckVad.cat"
) | ForEach-Object {
    $Path = Join-Path $Output $_
    [ordered]@{
        name = $_
        bytes = (Get-Item $Path).Length
        sha256 = (Get-FileHash $Path -Algorithm SHA256).Hash.ToLowerInvariant()
    }
}

$Manifest = [ordered]@{
    version = "0.3.0"
    abi = 3
    hardwareId = "ROOT\MICDECKVAD"
    renderEndpoint = "MicDeck Driver Input"
    captureEndpoint = "MicDeck Virtual Microphone"
    operatingSystems = $Targets
    files = $Files
}

$ManifestJson = $Manifest | ConvertTo-Json -Depth 6
[IO.File]::WriteAllText(
    (Join-Path $Output "driver-manifest.json"),
    $ManifestJson,
    [Text.UTF8Encoding]::new($false)
)

Write-Host "MicDeck VAD package created at: $Output"
