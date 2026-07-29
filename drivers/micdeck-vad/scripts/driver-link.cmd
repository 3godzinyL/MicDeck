@echo off
rem Link gate: catches unresolved externals and, via LNK4210, static initialisers that a
rem kernel driver would never run. Requires driver-syntax.cmd to have produced the objs.
setlocal
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" >nul
if errorlevel 1 exit /b %errorlevel%

set OUT=%~dp0..\..\..\out\vad-tests
set KMLIB=C:\Program Files (x86)\Windows Kits\10\Lib\10.0.22621.0\km\x64

link /NOLOGO /OUT:"%OUT%\MicDeckVad.sys" /DRIVER /SUBSYSTEM:NATIVE /ENTRY:GsDriverEntry ^
  /NODEFAULTLIB /MACHINE:X64 /RELEASE /INCREMENTAL:NO ^
  /LIBPATH:"%KMLIB%" ^
  "%OUT%\obj\*.obj" ^
  portcls.lib stdunk.lib ksguid.lib wdmsec.lib ntstrsafe.lib ^
  ntoskrnl.lib hal.lib wmilib.lib BufferOverflowFastFailK.lib
if errorlevel 1 exit /b %errorlevel%
echo DRIVER LINK OK
