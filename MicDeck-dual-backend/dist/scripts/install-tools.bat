@echo off
setlocal enableextensions
title MicDeck - pobieranie narzedzi
echo ============================================================
echo   MicDeck - pobieranie wymaganych narzedzi
echo ============================================================
echo.
echo Pobiera yt-dlp + ffmpeg (import z URL) do %LOCALAPPDATA%\micdeck-tools
echo i dodaje ten folder do PATH uzytkownika.
echo.

set "TOOLS=%LOCALAPPDATA%\micdeck-tools"
if not exist "%TOOLS%" mkdir "%TOOLS%"

echo [1/3] yt-dlp...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe' -OutFile (Join-Path $env:LOCALAPPDATA 'micdeck-tools\yt-dlp.exe') -UseBasicParsing; Write-Host '      yt-dlp OK' } catch { Write-Host '      yt-dlp BLAD:' $_.Exception.Message; exit 1 }"
if errorlevel 1 goto :fail

echo [2/3] ffmpeg (kilkadziesiat MB, chwile to potrwa)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $z = Join-Path $env:TEMP 'micdeck-ffmpeg.zip'; $d = Join-Path $env:TEMP 'micdeck-ffmpeg'; Invoke-WebRequest -Uri 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip' -OutFile $z -UseBasicParsing; if (Test-Path $d) { Remove-Item -Recurse -Force $d }; Expand-Archive -LiteralPath $z -DestinationPath $d -Force; $f = Get-ChildItem $d -Recurse -Filter ffmpeg.exe | Select-Object -First 1; Copy-Item $f.FullName (Join-Path $env:LOCALAPPDATA 'micdeck-tools\ffmpeg.exe') -Force; $p = Get-ChildItem $d -Recurse -Filter ffprobe.exe | Select-Object -First 1; if ($p) { Copy-Item $p.FullName (Join-Path $env:LOCALAPPDATA 'micdeck-tools\ffprobe.exe') -Force }; Remove-Item -Recurse -Force $d, $z; Write-Host '      ffmpeg OK' } catch { Write-Host '      ffmpeg BLAD:' $_.Exception.Message; exit 1 }"
if errorlevel 1 goto :fail

echo [3/3] dodaje folder do PATH...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$t = Join-Path $env:LOCALAPPDATA 'micdeck-tools'; $p = [Environment]::GetEnvironmentVariable('Path','User'); if (-not ($p.Split(';') -contains $t)) { [Environment]::SetEnvironmentVariable('Path', ($p.TrimEnd(';') + ';' + $t), 'User'); Write-Host '      PATH zaktualizowany' } else { Write-Host '      juz na PATH' }"

echo.
echo --- Wymagania do budowania ze zrodel (opcjonalne) ---
where node  >nul 2>&1 && (echo   [OK]   Node.js) || (echo   [BRAK] Node.js  -^> https://nodejs.org/)
where cargo >nul 2>&1 && (echo   [OK]   Rust/cargo) || (echo   [BRAK] Rust     -^> https://rustup.rs/)
if exist "%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe" (echo   [OK]   Visual Studio Installer wykryty) else (echo   [BRAK] Visual Studio Build Tools C++  -^> https://visualstudio.microsoft.com/downloads/)

echo.
echo Gotowe. Zrestartuj aplikacje i terminal, zeby zobaczyc nowy PATH.
echo.
pause
exit /b 0

:fail
echo.
echo Instalacja narzedzi nie powiodla sie. Sprawdz polaczenie z internetem i sprobuj ponownie.
echo.
pause
exit /b 1
