@echo off
rem Fast compile gate for the kernel driver: catches C++ errors without needing the WDK
rem MSBuild targets. The shipping .sys is produced by scripts\build.ps1.
setlocal
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" >nul
if errorlevel 1 exit /b %errorlevel%

set ROOT=%~dp0..
set OUT=%~dp0..\..\..\out\vad-tests
set WDK=C:\Program Files (x86)\Windows Kits\10\Include\10.0.22621.0
set SRC=%ROOT%\driver\src
set INC=%ROOT%\driver\include
set SHARED=%ROOT%\shared

if not exist "%OUT%\obj" mkdir "%OUT%\obj"

cl /nologo /c /kernel /GS /W4 /EHs-c- /GR- /std:c++20 ^
  /D_KERNEL_MODE /D_AMD64_ /DAMD64 /D_WIN64 /DUNICODE /D_UNICODE /DNTDDI_VERSION=0x0A000008 ^
  /I"%WDK%\km" /I"%WDK%\shared" /I"%WDK%\km\crt" ^
  /I"%SRC%" /I"%INC%" /I"%SHARED%" ^
  /Fo:"%OUT%\obj\\" ^
  "%SRC%\guids.cpp" ^
  "%SRC%\adapter.cpp" "%SRC%\audio_clock.cpp" "%SRC%\driver.cpp" "%SRC%\endpoint_descriptors.cpp" ^
  "%SRC%\format.cpp" "%SRC%\miniport_topology.cpp" "%SRC%\miniport_wave_rt.cpp" ^
  "%SRC%\miniport_wave_rt_stream.cpp" "%SRC%\new_delete.cpp" "%SRC%\virtual_cable.cpp" ^
  "%SRC%\property_handlers.cpp" "%SRC%\power_management.cpp" "%SRC%\master_clock.cpp" ^
  "%SHARED%\micdeck_audio_core.cpp" "%SHARED%\micdeck_cable_pipeline.cpp"
if errorlevel 1 exit /b %errorlevel%
echo DRIVER SYNTAX OK
