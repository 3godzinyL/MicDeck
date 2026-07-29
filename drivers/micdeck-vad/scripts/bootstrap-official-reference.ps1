param(
    [string]$Destination = "",
    [switch]$Build,
    [ValidateSet("Debug", "Release")]
    [string]$Configuration = "Debug",
    [ValidateSet("x64")]
    [string]$Platform = "x64"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$LockPath = Join-Path $Root "upstream\upstream-lock.json"
$Lock = Get-Content $LockPath -Raw | ConvertFrom-Json

if (-not $Destination) {
    $Destination = Join-Path $Root "out\official-windows-driver-samples"
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory=$true)][string]$File,
        [Parameter(Mandatory=$true)][string[]]$Arguments,
        [string]$WorkingDirectory = ""
    )

    Write-Host ">> $File $($Arguments -join ' ')"
    $Previous = Get-Location
    try {
        if ($WorkingDirectory) {
            Set-Location $WorkingDirectory
        }
        & $File @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "$File failed with exit code $LASTEXITCODE."
        }
    }
    finally {
        Set-Location $Previous
    }
}

if (-not (Get-Command git.exe -ErrorAction SilentlyContinue)) {
    throw "git.exe was not found."
}

if (-not (Test-Path (Join-Path $Destination ".git"))) {
    New-Item -ItemType Directory -Force `
        -Path (Split-Path -Parent $Destination) |
        Out-Null

    Invoke-Checked git.exe @(
        "clone",
        "--filter=blob:none",
        "--no-checkout",
        $Lock.repository,
        $Destination
    )
}

Invoke-Checked git.exe @(
    "fetch",
    "--depth=1",
    "origin",
    $Lock.commit
) $Destination

Invoke-Checked git.exe @(
    "checkout",
    "--detach",
    $Lock.commit
) $Destination

Invoke-Checked git.exe @(
    "submodule",
    "update",
    "--init",
    "--recursive",
    "--depth=1"
) $Destination

$Resolved = (
    & git.exe -C $Destination rev-parse HEAD
).Trim()

if ($Resolved -ne $Lock.commit) {
    throw "Official reference commit mismatch. Expected $($Lock.commit), got $Resolved."
}

$ManifestDirectory = Join-Path $Root "out\official-reference"
New-Item -ItemType Directory -Force `
    -Path $ManifestDirectory |
    Out-Null

$ReferenceFiles = @()
foreach ($Relative in $Lock.referenceProjects) {
    $Directory = Join-Path $Destination $Relative
    if (-not (Test-Path $Directory)) {
        throw "Pinned reference project is missing: $Relative"
    }

    Get-ChildItem $Directory -File -Recurse |
        Where-Object {
            $_.Extension -in @(
                ".cpp", ".c", ".h", ".inf",
                ".inx", ".vcxproj", ".sln"
            )
        } |
        ForEach-Object {
            $ReferenceFiles += [ordered]@{
                path = $_.FullName.Substring(
                    $Destination.Length + 1
                )
                sha256 = (
                    Get-FileHash $_.FullName -Algorithm SHA256
                ).Hash.ToLowerInvariant()
            }
        }
}

$Manifest = [ordered]@{
    repository = $Lock.repository
    expectedCommit = $Lock.commit
    resolvedCommit = $Resolved
    generatedUtc = (
        Get-Date
    ).ToUniversalTime().ToString("o")
    files = $ReferenceFiles
}

$Manifest |
    ConvertTo-Json -Depth 6 |
    Set-Content `
        (Join-Path $ManifestDirectory "manifest.json") `
        -Encoding UTF8

if ($Build) {
    $MsBuild = Get-Command msbuild.exe -ErrorAction SilentlyContinue
    if (-not $MsBuild) {
        throw "msbuild.exe is not in PATH. Run from Developer PowerShell for VS 2022."
    }

    foreach ($Relative in $Lock.referenceProjects) {
        $ProjectDirectory = Join-Path $Destination $Relative
        $Solutions = Get-ChildItem `
            $ProjectDirectory `
            -Filter *.sln `
            -File `
            -Recurse |
            Sort-Object FullName

        if ($Solutions.Count -eq 0) {
            Write-Warning "No solution found below $Relative; skipping baseline build."
            continue
        }

        # Build the smallest solution first. The purpose is to prove that VS,
        # SDK, WDK and the pinned Microsoft reference compile in this machine.
        $Solution = $Solutions |
            Sort-Object Length |
            Select-Object -First 1

        Invoke-Checked msbuild.exe @(
            $Solution.FullName,
            "/m",
            "/restore",
            "/p:Configuration=$Configuration",
            "/p:Platform=$Platform",
            "/bl:$ManifestDirectory\$($Solution.BaseName).binlog"
        )
    }
}

Write-Host "Official Microsoft reference verified at commit $Resolved."
