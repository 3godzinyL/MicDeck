@echo off
setlocal enableextensions
cd /d "%~dp0.."
title MicDeck - build z MicDeck VAD

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%CD%\scripts\build-micdeck-vad-and-app.ps1"
if errorlevel 1 (
  echo.
  echo [BLAD] Build aplikacji ze sterownikiem nie powiodl sie.
  pause
  exit /b 1
)

echo.
echo [OK] MicDeck z backendami VB-CABLE i MicDeck VAD jest gotowy.
pause
