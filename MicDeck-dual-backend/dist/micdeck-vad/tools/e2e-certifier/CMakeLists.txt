cmake_minimum_required(VERSION 3.22)
project(MicDeckVadE2ECertifier LANGUAGES CXX)

add_executable(micdeck-vad-e2e-certifier
    main.cpp
    ../../integration/micdeck-native/micdeck_vad_endpoint.cpp
)

target_include_directories(micdeck-vad-e2e-certifier PRIVATE
    ../../integration/micdeck-native
)

target_compile_features(micdeck-vad-e2e-certifier PRIVATE cxx_std_20)
target_compile_definitions(micdeck-vad-e2e-certifier PRIVATE
    UNICODE
    _UNICODE
    WIN32_LEAN_AND_MEAN
)

target_compile_options(micdeck-vad-e2e-certifier PRIVATE
    /W4
    /permissive-
    /sdl
    /guard:cf
)

target_link_options(micdeck-vad-e2e-certifier PRIVATE
    /guard:cf
    /DYNAMICBASE
    /NXCOMPAT
)

target_link_libraries(micdeck-vad-e2e-certifier PRIVATE
    ole32
    mmdevapi
    avrt
    propsys
)
