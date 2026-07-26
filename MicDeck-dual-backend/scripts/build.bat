@echo off
setlocal enableextensions
title MicDeck - kompilacja
cd /d "%~dp0.."
echo ============================================================
echo   MicDeck - kompilacja (Setup + Portable)
echo ============================================================
echo.
echo Katalog projektu: %CD%
echo.

where npm >nul 2>&1 || (echo [BLAD] Brak Node.js/npm w PATH.  -^> https://nodejs.org/ && pause && exit /b 1)
where cargo >nul 2>&1 || (echo [BLAD] Brak Rust/cargo w PATH.  -^> https://rustup.rs/ && pause && exit /b 1)
if not exist "%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe" echo [UWAGA] Nie wykryto Visual Studio Build Tools C++ - kompilacja C/C++ moze sie nie udac.

echo [1/2] npm install...
call npm install
if errorlevel 1 (echo [BLAD] npm install && pause && exit /b 1)

echo.
echo [2/2] npm run build:all  (release - potrwa kilka minut)...
call npm run build:all
if errorlevel 1 (echo [BLAD] kompilacja && pause && exit /b 1)

echo.
echo ============================================================
echo   Gotowe. Artefakty w folderze release\:
echo ============================================================
if exist "release" dir /b release
echo.
pause
exit /b 0
