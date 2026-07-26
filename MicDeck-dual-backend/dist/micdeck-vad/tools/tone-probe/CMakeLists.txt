cmake_minimum_required(VERSION 3.22)
project(MicDeckVadToneProbe LANGUAGES CXX)
add_executable(micdeck-vad-tone-probe main.cpp
 ../../integration/micdeck-native/micdeck_vad_endpoint.cpp)
target_compile_features(micdeck-vad-tone-probe PRIVATE cxx_std_20)
target_compile_definitions(micdeck-vad-tone-probe PRIVATE UNICODE _UNICODE)
target_link_libraries(micdeck-vad-tone-probe PRIVATE ole32 mmdevapi avrt)
