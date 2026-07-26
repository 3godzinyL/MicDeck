# Native audio runtime

Natywna ścieżka audio MicDeck dla Windows. Kod nie wstrzykuje DLL do zewnętrznych aplikacji i nie hookuje ich procesów.

## Komponenty

- `protocol/` — wersjonowany layout pamięci współdzielonej, nazwy eventów i format PCM;
- `bridge/` — DLL w C z prostym, stabilnym ABI `extern "C"`;
- `engine/` — ukryty proces C++ z WASAPI capture/render, mikserem i routingiem urządzeń.

Rust oraz C++ ładują tę samą DLL normalnym mechanizmem Windows. Próbki soundboardu trafiają do lock-free bufora SPSC, a konfiguracja i heartbeat do atomowych pól pamięci współdzielonej.

## Kontrakt audio

- 48 000 Hz;
- stereo;
- `float32` interleaved;
- dwie sekundy pojemności ring buffera bindów;
- 20 ms na porcję wysyłaną przez dekoder Rust;
- adaptacyjny okres low-latency negocjowany przez `IAudioClient3` (z bezpiecznym fallbackiem);
- opcjonalny loopback domyślnego wyjścia Windows dla transmisji system audio;
- niezależny gain mikrofonu i soundboardu;
- miękki limiter na wyjściu.

Engine przechwytuje wybrany fizyczny mikrofon, opcjonalnie domyślne wyjście Windows, domiesza próbki soundboardu i renderuje gotowy sygnał do wejścia VB-CABLE. Capture i render używają event-driven WASAPI oraz MMCSS. W gorącym callbacku renderującym nie ma alokacji sterty.

## Lifecycle i bezpieczeństwo

- named mutex pozwala działać tylko jednemu engine;
- UI wysyła heartbeat co 750 ms;
- engine kończy się po żądaniu shutdown lub utracie UI;
- nie zmienia automatycznie domyślnego mikrofonu Windows;
- udostępnia jawną naprawę endpointu dla `Console`, `Multimedia` i `Communications`;
- monitoruje Core Audio Sessions, zachowuje wyłącznie aplikacje, które wydały dźwięk, i pobiera ich ikony bez wstrzykiwania kodu;
- status, poziomy, PID, underruny, overruny i utracone ramki są dostępne przez ABI DLL.

`src-tauri/build.rs` wykrywa MSVC przez `vswhere`, buduje `soundboard_ipc.dll` oraz `soundboard_audio_engine.exe`, po czym oba pliki zostają osadzone w głównym EXE Rust. W runtime są wypakowywane do wersjonowanego katalogu `%LOCALAPPDATA%\micdeck\native\<hash>`.
