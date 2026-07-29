param(
    [ValidateSet("Debug", "Release")]
    [string]$Configuration = "Debug",

    [string]$ReportDirectory = "",

    [switch]$SkipOfficialBaseline,
    [switch]$SkipInstall,
    [switch]$TestSign,
    [switch]$EnableVerifierForNextBoot
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

if (-not $ReportDirectory) {
    $Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $ReportDirectory = Join-Path `
        $Root `
        "out\certification-$Stamp"
}

New-Item -ItemType Directory -Force `
    -Path $ReportDirectory |
    Out-Null

$Stages = [System.Collections.Generic.List[object]]::new()

function Add-Stage {
    param(
        [string]$Name,
        [string]$Status,
        [string]$Details = "",
        [string]$Artifact = ""
    )

    $Stages.Add([ordered]@{
        name = $Name
        status = $Status
        details = $Details
        artifact = $Artifact
        utc = (
            Get-Date
        ).ToUniversalTime().ToString("o")
    })
}

function Find-Tool {
    param(
        [Parameter(Mandatory=$true)][string]$Name,
        [string[]]$Roots = @()
    )

    $Command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($Command) {
        return $Command.Source
    }

    foreach ($SearchRoot in $Roots) {
        if (-not (Test-Path $SearchRoot)) {
            continue
        }

        $Match = Get-ChildItem `
            $SearchRoot `
            -Filter $Name `
            -File `
            -Recurse `
            -ErrorAction SilentlyContinue |
            Sort-Object FullName -Descending |
            Select-Object -First 1

        if ($Match) {
            return $Match.FullName
        }
    }

    return $null
}

function Invoke-Gated {
    param(
        [Parameter(Mandatory=$true)][string]$Name,
        [Parameter(Mandatory=$true)][string]$File,
        [Parameter(Mandatory=$true)][string[]]$Arguments,
        [string]$LogFile = ""
    )

    Write-Host "[$Name] $File $($Arguments -join ' ')"

    if ($LogFile) {
        & $File @Arguments *>&1 |
            Tee-Object -FilePath $LogFile
    }
    else {
        & $File @Arguments
    }

    if ($LASTEXITCODE -ne 0) {
        Add-Stage $Name "failed" `
            "$File returned exit code $LASTEXITCODE." `
            $LogFile
        throw "Stage '$Name' failed."
    }

    Add-Stage $Name "passed" "" $LogFile
}

function Is-Administrator {
    $Identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $Principal = [Security.Principal.WindowsPrincipal]::new($Identity)
    return $Principal.IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator
    )
}

function Save-Report {
    param([string]$FinalStatus)

    $Passed = @($Stages | Where-Object status -eq "passed").Count
    $Failed = @($Stages | Where-Object status -eq "failed").Count
    $Skipped = @($Stages | Where-Object status -eq "skipped").Count
    $Pending = @($Stages | Where-Object status -eq "pending").Count

    $Report = [ordered]@{
        schemaVersion = 1
        product = "MicDeck VAD"
        configuration = $Configuration
        finalStatus = $FinalStatus
        passedStages = $Passed
        failedStages = $Failed
        skippedStages = $Skipped
        pendingStages = $Pending
        generatedUtc = (
            Get-Date
        ).ToUniversalTime().ToString("o")
        machine = [ordered]@{
            computerName = $env:COMPUTERNAME
            os = (
                Get-CimInstance Win32_OperatingSystem
            ).Caption
            version = [Environment]::OSVersion.VersionString
        }
        stages = $Stages
    }

    $Report |
        ConvertTo-Json -Depth 8 |
        Set-Content `
            (Join-Path $ReportDirectory "certification-report.json") `
            -Encoding UTF8
}

try {
    if ($env:OS -ne "Windows_NT") {
        throw "The WDK gate must run on Windows."
    }

    $WindowsKits = "${env:ProgramFiles(x86)}\Windows Kits\10"
    $VsWhere = Find-Tool "vswhere.exe" @(
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer"
    )

    $MsBuild = Find-Tool "msbuild.exe" @(
        "${env:ProgramFiles}\Microsoft Visual Studio",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio"
    )
    $InfVerif = Find-Tool "infverif.exe" @($WindowsKits)
    $Inf2Cat = Find-Tool "inf2cat.exe" @($WindowsKits)
    $SignTool = Find-Tool "signtool.exe" @($WindowsKits)
    $DevCon = Find-Tool "devcon.exe" @($WindowsKits)

    foreach ($Required in @(
        @{ Name = "MSBuild"; Path = $MsBuild },
        @{ Name = "InfVerif"; Path = $InfVerif },
        @{ Name = "Inf2Cat"; Path = $Inf2Cat },
        @{ Name = "SignTool"; Path = $SignTool }
    )) {
        if (-not $Required.Path) {
            Add-Stage "tool-$($Required.Name)" "failed" "Tool was not found."
            throw "$($Required.Name) was not found. Install Visual Studio, Windows SDK and WDK."
        }

        Add-Stage "tool-$($Required.Name)" "passed" $Required.Path
    }

    # 1. Portable source tests.
    $PortableLog = Join-Path $ReportDirectory "portable-tests.log"
    Invoke-Gated `
        "portable-tests" `
        "powershell.exe" `
        @(
            "-NoProfile",
            "-ExecutionPolicy", "Bypass",
            "-File", (Join-Path $Root "scripts\run-portable-tests.ps1")
        ) `
        $PortableLog

    # 2. Official pinned sample baseline.
    if ($SkipOfficialBaseline) {
        Add-Stage "official-baseline" "skipped" "Requested by caller."
    }
    else {
        $BaselineLog = Join-Path $ReportDirectory "official-baseline.log"
        Invoke-Gated `
            "official-baseline" `
            "powershell.exe" `
            @(
                "-NoProfile",
                "-ExecutionPolicy", "Bypass",
                "-File", (Join-Path $Root "scripts\bootstrap-official-reference.ps1"),
                "-Build",
                "-Configuration", $Configuration,
                "-Platform", "x64"
            ) `
            $BaselineLog
    }

    # 3. Custom WDK build.
    $BuildLog = Join-Path $ReportDirectory "micdeck-vad-build.log"
    Invoke-Gated `
        "wdk-build" `
        $MsBuild `
        @(
            (Join-Path $Root "MicDeckVad.sln"),
            "/m",
            "/restore",
            "/p:Configuration=$Configuration",
            "/p:Platform=x64",
            "/bl:$ReportDirectory\micdeck-vad.binlog"
        ) `
        $BuildLog

    $SysCandidates = Get-ChildItem `
        $Root `
        -Filter MicDeckVad.sys `
        -File `
        -Recurse |
        Where-Object {
            $_.FullName -match "\\$Configuration\\" -or
            $_.FullName -match "\\x64\\"
        } |
        Sort-Object LastWriteTimeUtc -Descending

    $Sys = $SysCandidates | Select-Object -First 1
    if (-not $Sys) {
        Add-Stage "locate-sys" "failed" "MicDeckVad.sys was not produced."
        throw "Driver build completed but MicDeckVad.sys was not found."
    }
    Add-Stage "locate-sys" "passed" $Sys.FullName

    # 4. Create isolated package folder.
    $Package = Join-Path $ReportDirectory "driver-package"
    New-Item -ItemType Directory -Force -Path $Package | Out-Null

    Copy-Item $Sys.FullName `
        (Join-Path $Package "MicDeckVad.sys") `
        -Force
    Copy-Item `
        (Join-Path $Root "package\MicDeckVad.inf") `
        (Join-Path $Package "MicDeckVad.inf") `
        -Force

    # 5. INF parser/isolation gate.
    $InfLog = Join-Path $ReportDirectory "infverif.log"
    Invoke-Gated `
        "infverif-w" `
        $InfVerif `
        @(
            "/w",
            (Join-Path $Package "MicDeckVad.inf")
        ) `
        $InfLog

    # 6. Generate CAT with all OS identifiers supported by this WDK.
    $Help = (& $Inf2Cat /? 2>&1 | Out-String)
    $PreferredOs = @(
        "10_25H2_X64",
        "10_GE_X64",
        "10_NI_X64",
        "10_CO_X64",
        "10_VB_X64"
    )
    $SupportedOs = @(
        $PreferredOs |
        Where-Object { $Help -match [regex]::Escape($_) }
    )
    if ($SupportedOs.Count -eq 0) {
        $SupportedOs = @("10_VB_X64", "10_CO_X64")
    }

    $CatLog = Join-Path $ReportDirectory "inf2cat.log"
    Invoke-Gated `
        "inf2cat" `
        $Inf2Cat `
        @(
            "/driver:$Package",
            "/os:$($SupportedOs -join ',')",
            "/uselocaltime",
            "/verbose"
        ) `
        $CatLog

    $Cat = Join-Path $Package "MicDeckVad.cat"
    if (-not (Test-Path $Cat)) {
        Add-Stage "catalog-produced" "failed" "MicDeckVad.cat was not generated."
        throw "Inf2Cat did not produce MicDeckVad.cat."
    }
    Add-Stage "catalog-produced" "passed" $Cat

    # 7. Optional local test signing.
    if ($TestSign) {
        if (-not (Is-Administrator)) {
            Add-Stage "test-sign" "failed" "Administrator rights are required."
            throw "Run PowerShell as administrator for test signing."
        }

        $Certificate = New-SelfSignedCertificate `
            -Type CodeSigningCert `
            -Subject "CN=MicDeck VAD Test Certificate" `
            -CertStoreLocation "Cert:\LocalMachine\My" `
            -HashAlgorithm SHA256 `
            -KeyLength 3072 `
            -KeyExportPolicy NonExportable `
            -NotAfter (Get-Date).AddDays(30)

        $RootStore = New-Object System.Security.Cryptography.X509Certificates.X509Store(
            "Root",
            "LocalMachine"
        )
        $PublisherStore = New-Object System.Security.Cryptography.X509Certificates.X509Store(
            "TrustedPublisher",
            "LocalMachine"
        )

        try {
            $RootStore.Open("ReadWrite")
            $PublisherStore.Open("ReadWrite")
            $RootStore.Add($Certificate)
            $PublisherStore.Add($Certificate)
        }
        finally {
            $RootStore.Close()
            $PublisherStore.Close()
        }

        foreach ($File in @(
            (Join-Path $Package "MicDeckVad.sys"),
            $Cat
        )) {
            Invoke-Gated `
                "sign-$([IO.Path]::GetFileName($File))" `
                $SignTool `
                @(
                    "sign",
                    "/sha1", $Certificate.Thumbprint,
                    "/fd", "SHA256",
                    "/v",
                    $File
                ) `
                (Join-Path $ReportDirectory "sign-$([IO.Path]::GetFileName($File)).log")
        }

        Invoke-Gated `
            "verify-sys-signature" `
            $SignTool `
            @(
                "verify",
                "/kp",
                "/v",
                (Join-Path $Package "MicDeckVad.sys")
            ) `
            (Join-Path $ReportDirectory "verify-sys-signature.log")

        Invoke-Gated `
            "verify-cat-signature" `
            $SignTool `
            @(
                "verify",
                "/kp",
                "/v",
                $Cat
            ) `
            (Join-Path $ReportDirectory "verify-cat-signature.log")
    }
    else {
        Add-Stage "test-sign" "skipped" "Use -TestSign on a disposable test system."
    }

    # 8. Manifest and immutable package hashes.
    $ManifestFiles = @(
        "MicDeckVad.sys",
        "MicDeckVad.inf",
        "MicDeckVad.cat"
    ) | ForEach-Object {
        $Path = Join-Path $Package $_
        [ordered]@{
            name = $_
            bytes = (Get-Item $Path).Length
            sha256 = (
                Get-FileHash $Path -Algorithm SHA256
            ).Hash.ToLowerInvariant()
        }
    }

    [ordered]@{
        version = "0.3.0"
        abi = 3
        operatingSystems = $SupportedOs
        files = $ManifestFiles
    } |
        ConvertTo-Json -Depth 5 |
        Set-Content `
            (Join-Path $Package "driver-manifest.json") `
            -Encoding UTF8

    Add-Stage "package-manifest" "passed" "" `
        (Join-Path $Package "driver-manifest.json")

    # 9. Optional install and endpoint/e2e validation.
    if ($SkipInstall) {
        Add-Stage "driver-install" "skipped" "Requested by caller."
        Add-Stage "endpoint-check" "skipped" "Driver was not installed."
        Add-Stage "audio-e2e" "skipped" "Driver was not installed."
    }
    else {
        if (-not (Is-Administrator)) {
            Add-Stage "driver-install" "failed" "Administrator rights are required."
            throw "Run PowerShell as administrator to install the test driver."
        }

        if (-not $TestSign) {
            Add-Stage "driver-install" "failed" "Install gate requires -TestSign or a production-signed package."
            throw "Use -TestSign in a disposable test machine or provide a production-signed package."
        }

        $Bcd = (& bcdedit.exe /enum).ToString()
        if ($Bcd -notmatch "testsigning\s+Yes") {
            Add-Stage "testsigning-enabled" "failed" `
                "Windows test-signing mode is not enabled. The script deliberately does not change boot policy."
            throw "Enable test signing manually on the disposable target, reboot, and rerun."
        }
        Add-Stage "testsigning-enabled" "passed"

        if (-not $DevCon) {
            Add-Stage "driver-install" "failed" "devcon.exe was not found."
            throw "DevCon is required for the root-enumerated test device."
        }

        Invoke-Gated `
            "driver-install" `
            $DevCon `
            @(
                "install",
                (Join-Path $Package "MicDeckVad.inf"),
                "ROOT\MICDECKVAD"
            ) `
            (Join-Path $ReportDirectory "devcon-install.log")

        # Build end-to-end verifier.
        $E2EBuild = Join-Path $ReportDirectory "e2e-build"
        Invoke-Gated `
            "e2e-configure" `
            "cmake.exe" `
            @(
                "-S", (Join-Path $Root "tools\e2e-certifier"),
                "-B", $E2EBuild,
                "-A", "x64"
            ) `
            (Join-Path $ReportDirectory "e2e-configure.log")

        Invoke-Gated `
            "e2e-build" `
            "cmake.exe" `
            @(
                "--build", $E2EBuild,
                "--config", "Release",
                "--parallel"
            ) `
            (Join-Path $ReportDirectory "e2e-build.log")

        $E2EExe = Get-ChildItem `
            $E2EBuild `
            -Filter micdeck-vad-e2e-certifier.exe `
            -File `
            -Recurse |
            Select-Object -First 1

        if (-not $E2EExe) {
            Add-Stage "e2e-executable" "failed" "E2E certifier was not produced."
            throw "E2E certifier build did not produce an executable."
        }

        $AudioReport = Join-Path $ReportDirectory "audio-e2e.json"
        Invoke-Gated `
            "audio-e2e" `
            $E2EExe.FullName `
            @(
                "--output", $AudioReport,
                "--seconds", "3"
            ) `
            (Join-Path $ReportDirectory "audio-e2e.log")
    }

    # 10. Verifier is a separate reboot/soak gate.
    if ($EnableVerifierForNextBoot) {
        if (-not (Is-Administrator)) {
            Add-Stage "driver-verifier" "failed" "Administrator rights are required."
            throw "Run as administrator to configure Driver Verifier."
        }

        & verifier.exe /standard /driver MicDeckVad.sys
        if ($LASTEXITCODE -ne 0) {
            Add-Stage "driver-verifier" "failed" "verifier.exe failed."
            throw "Could not configure Driver Verifier."
        }

        & verifier.exe /bootmode oneboot
        Add-Stage "driver-verifier" "pending" `
            "Configured for one boot. Reboot, run the stress suite, then record the result."
    }
    else {
        Add-Stage "driver-verifier" "skipped" `
            "Use -EnableVerifierForNextBoot on a disposable target."
    }

    $Blocking = @(
        $Stages |
        Where-Object {
            $_.status -in @("failed", "pending")
        }
    )

    $FinalStatus = if ($Blocking.Count -eq 0) {
        "all-requested-gates-passed"
    }
    else {
        "not-certified"
    }

    Save-Report $FinalStatus

    if ($FinalStatus -ne "all-requested-gates-passed") {
        throw "Certification is incomplete. Read certification-report.json."
    }

    Write-Host "All requested gates passed."
}
catch {
    if (-not (
        $Stages |
        Where-Object status -eq "failed"
    )) {
        Add-Stage "unhandled-error" "failed" $_.Exception.Message
    }

    Save-Report "not-certified"
    Write-Error $_
    exit 1
}
