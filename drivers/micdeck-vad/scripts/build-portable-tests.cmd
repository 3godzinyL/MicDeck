@echo off
rem Builds and runs the usermode tests for the code shared between the driver and the app.
setlocal
call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" >nul
if errorlevel 1 exit /b %errorlevel%

set ROOT=%~dp0..
set OUT=%~dp0..\..\..\out\vad-tests
set SHARED=%ROOT%\shared
set TESTS=%ROOT%\tests

if not exist "%OUT%" mkdir "%OUT%"
pushd "%OUT%"

cl /nologo /O2 /EHsc /W4 /std:c++20 /UNDEBUG "%TESTS%\pipeline_tests.cpp" ^
  "%SHARED%\micdeck_audio_core.cpp" "%SHARED%\micdeck_cable_pipeline.cpp" /Fe:pipeline_tests.exe
if errorlevel 1 (popd & exit /b 1)

cl /nologo /O2 /EHsc /W4 /std:c++20 /UNDEBUG "%TESTS%\core_tests.cpp" ^
  "%SHARED%\micdeck_audio_core.cpp" "%SHARED%\micdeck_cable_pipeline.cpp" /Fe:core_tests.exe
if errorlevel 1 (popd & exit /b 1)

".\pipeline_tests.exe"
if errorlevel 1 (popd & exit /b 1)
".\core_tests.exe"
if errorlevel 1 (popd & exit /b 1)
popd
echo PORTABLE TESTS OK
