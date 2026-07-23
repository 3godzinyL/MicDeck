<p align="center">
  <img src="docs/social-preview.svg" alt="MicDeck — soundboard i dźwięk systemu w jednym wirtualnym mikrofonie" width="100%">
</p>

<h1 align="center">MicDeck</h1>

<p align="center">
  <strong>Natywny soundboard i router dźwięku systemowego dla Windows.</strong>
  <br>
  Odpalaj klipy, udostępniaj to, co gra na komputerze, i wysyłaj cały miks przez jeden wirtualny mikrofon.
</p>

<p align="center">
  <a href="README.md">English</a>
  ·
  <a href="https://github.com/3godzinyL/MicDeck/releases/latest">Pobierz</a>
  ·
  <a href="#jak-to-działa">Jak to działa</a>
  ·
  <a href="#obecny-zakres">Obecny zakres</a>
  ·
  <a href="CHANGELOG.md">Changelog</a>
</p>

<p align="center">
  <a href="https://github.com/3godzinyL/MicDeck/actions/workflows/ci.yml"><img alt="Status CI" src="https://github.com/3godzinyL/MicDeck/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://github.com/3godzinyL/MicDeck/releases/latest"><img alt="Najnowsze wydanie" src="https://img.shields.io/github/v/release/3godzinyL/MicDeck?display_name=tag&style=flat-square&color=c8ff63&labelColor=0c0e11"></a>
  <img alt="Windows 10 i 11 x64" src="https://img.shields.io/badge/Windows-10%20%7C%2011%20x64-0c0e11?style=flat-square&logo=windows&logoColor=c8ff63">
  <a href="LICENSE"><img alt="Licencja MIT" src="https://img.shields.io/badge/license-MIT-0c0e11?style=flat-square&logoColor=c8ff63"></a>
</p>

---

MicDeck łączy soundboard, przechwytywanie dźwięku systemu i routing do komunikatorów w jednej aplikacji. Prosty interfejs działa na Tauri i Rust, a krytyczną ścieżkę audio obsługuje osobny silnik C++/WASAPI.

- **Dźwięk systemu jednym kliknięciem:** cały domyślny miks Windows, w tym przeglądarka, Spotify i gry, trafia do Discorda.
- **Szybki soundboard:** MP3, WAV, FLAC, OGG, AAC i M4A na czytelnym live decku.
- **Globalny bind dla każdego dźwięku:** ustaw np. `Alt+P` i odpal klip nawet wtedy, gdy MicDeck jest schowany w trayu.
- **Quick Capture:** wklej YouTube, Shorts albo TikTok i dodaj audio do biblioteki.
- **Płynny import w tle:** pobieranie, dekodowanie i analiza waveformu nie blokują interfejsu.
- **Jeden miks:** mikrofon, klipy i dźwięk pulpitu wychodzą jako `MicDeck Virtual Mic`.
- **Adaptacyjne low latency:** `IAudioClient3` negocjuje okres dla konkretnego sprzętu zamiast stałego bufora 70 ms.
- **Integracja z Windows:** autostart, uruchamianie w tle i stała ikona w zasobniku systemowym.
- **Dwa języki:** cały interfejs przełącza się między polskim i angielskim z prawego górnego rogu.
- **Local-first:** bez konta, telemetrii, chmury, wstrzykiwania DLL i hooków procesów.

> [!NOTE]
> MicDeck jest obecnie publiczną wersją preview dla Windows 10/11 x64. Binariów jeszcze nie podpisano certyfikatem, dlatego Windows SmartScreen może pokazać ostrzeżenie. Pobieraj aplikację wyłącznie z tego repozytorium i sprawdzaj plik `SHA256SUMS.txt`.

## Wygląd aplikacji

<table>
  <tr>
    <td width="50%"><img src="docs/micdeck-library-en.png" alt="Biblioteka i Quick Capture w MicDeck"></td>
    <td width="50%"><img src="docs/micdeck-studio-en.png" alt="Studio live i routing dźwięku w MicDeck"></td>
  </tr>
  <tr>
    <td align="center"><strong>Biblioteka</strong><br><sub>Pady, wyszukiwarka, sterowanie odtwarzaniem i pobieranie z URL.</sub></td>
    <td align="center"><strong>Studio live</strong><br><sub>Mikrofon, system audio, mierniki, monitoring i status trasy.</sub></td>
  </tr>
  <tr>
    <td colspan="2"><img src="docs/micdeck-settings-en.png" alt="Ustawienia MicDeck z autostartem i zasobnikiem systemowym"></td>
  </tr>
  <tr>
    <td colspan="2" align="center"><strong>Integracja z Windows</strong><br><sub>Wirtualny mikrofon, diagnostyka silnika, autostart, tray i instrukcja Discorda.</sub></td>
  </tr>
</table>

## Pobieranie

Pobierz najnowsze pliki z [GitHub Releases](https://github.com/3godzinyL/MicDeck/releases/latest):

| Plik | Zastosowanie |
| --- | --- |
| `MicDeck-Setup.exe` | Wersja zalecana, instalowana dla aktualnego użytkownika. |
| `MicDeck-portable.exe` | Aplikacja bez instalacji; sterownik audio nadal może wymagać konfiguracji. |
| `SHA256SUMS.txt` | Sumy SHA-256 obu plików wykonywalnych. |

Sprawdzenie pobranego instalatora:

```powershell
Get-FileHash .\MicDeck-Setup.exe -Algorithm SHA256
```

Porównaj wynik z odpowiednią linią w `SHA256SUMS.txt`.

### Pierwsze uruchomienie

1. Uruchom MicDeck.
2. Otwórz **Ustawienia** i zainstaluj oficjalny sterownik VB-CABLE, jeśli aplikacja nie wykryła zgodnego wirtualnego urządzenia.
3. Wybierz swój prawdziwy mikrofon.
4. W Discordzie lub grze ustaw wejście **MicDeck Virtual Mic**.
5. Dodaj klip albo przejdź do **Studio live** i włącz udostępnianie dźwięku systemu.
6. Opcjonalnie ustaw globalne bindy i włącz **Uruchamiaj przy logowaniu**.

Zamknięcie okna ukrywa MicDeck w zasobniku systemowym obok zegara i nie przerywa routingu. Pełne wyjście jest dostępne w menu ikony jako **Quit / Zakończ**.

## Quick Capture

Obsługiwane są adresy YouTube, YouTube Shorts, `youtu.be` i TikTok. Import wymaga `yt-dlp` oraz `ffmpeg` w `PATH`; skrypt `scripts\install-tools.bat` instaluje oba narzędzia lokalnie.

Pobieraj i udostępniaj wyłącznie materiały, do których masz prawa. MicDeck nie omija zabezpieczeń platform i nie nadaje licencji do cudzych treści.

## Jak to działa

```mermaid
flowchart LR
  mic["Fizyczny mikrofon"] --> capture["WASAPI capture"]
  desktop["Dźwięk systemu"] --> loopback["WASAPI loopback"]
  pads["Pady dźwiękowe"] --> ipc["Lock-free IPC"]
  capture --> mixer["Mikser C++ real-time"]
  loopback --> mixer
  ipc --> mixer
  mixer --> cable["Zarządzany wirtualny kabel"]
  cable --> chat["Discord · gry · OBS · rozmowy"]
```

Warstwa Rust/Tauri odpowiada za UI, bibliotekę, zapis ustawień, pobieranie i cykl życia sterownika. Pobieranie, dekodowanie i analiza plików są wykonywane na workerach blokujących poza wątkiem UI, a biblioteka odświeża się dopiero po przygotowaniu metadanych. Osobny silnik C++20 realizuje event-driven capture, loopback, miksowanie, monitoring i render. Wersjonowany most pamięci współdzielonej trzyma pracę interfejsu z dala od wątku real-time.

MicDeck pyta urządzenia o obsługiwane okresy shared mode i dobiera niski, stabilny okres blisko minimum sprzętu. Gdy `IAudioClient3` nie jest dostępne, używa bezpiecznego okresu domyślnego. Capture i render są sterowane zdarzeniami WASAPI, a wątki audio korzystają z MMCSS. Studio pokazuje wynegocjowaną konfigurację, szacowane opóźnienie i underruny zamiast obiecywać jedną wartość poprawną dla każdego sprzętu.

## Obecny zakres

Ta sekcja celowo opisuje granice wersji preview:

| Obszar | Stan w v0.1 |
| --- | --- |
| Przechwytywanie systemu | Przechwytywany jest cały domyślny miks Windows. Wybór jednej aplikacji jest dopiero w planach. |
| Tryb WASAPI | Adaptacyjny shared mode; projekt nie deklaruje exclusive mode. |
| Monitoring | Przy aktywnym udostępnianiu systemu lokalny odsłuch padów jest wyciszany, aby uniknąć pętli. Pady nadal trafiają do miksu wyjściowego. |
| Zmiana urządzeń | Studio i Ustawienia pokazują stan oraz błędy silnika. Po zmianie konfiguracji dostępny jest ręczny restart silnika audio. |
| Przywracanie urządzenia | Poprzednie domyślne wejście jest przywracane przy normalnym zamknięciu. Awaria Windows, utrata zasilania lub wymuszone ubicie procesu nie daje takiej gwarancji. |
| DSP | Regulacja gainu i łagodna saturacja. Brak hosta VST, odszumiania, noise gate'a i pełnego chainu masteringowego. |
| Dystrybucja | Buildy mają sumy kontrolne, ale nie mają jeszcze podpisu Authenticode ani automatycznych aktualizacji. |
| Platformy | Windows x64. Brak deklarowanego wsparcia macOS, Linux, ARM64, Stream Deck i MIDI. |

## Build ze źródeł

Wymagania: Windows 10/11 x64, Node.js 24+, Rust stable MSVC, Visual Studio 2022 Build Tools z **Desktop development with C++** oraz WebView2 Runtime.

```powershell
npm ci
npm run tauri dev
```

Build produkcyjny:

```powershell
npm run build:portable
npm run build:installer
```

Testy:

```powershell
npm run build
cargo test --manifest-path src-tauri\Cargo.toml --locked
```

## Roadmap

- [ ] Przechwytywanie dźwięku z wybranej aplikacji
- [ ] Normalizacja, limiter i lekki EQ
- [ ] Wiele decków i profili
- [ ] Stream Deck i MIDI
- [ ] Podpisane buildy i automatyczne aktualizacje
- [ ] Kolejne tłumaczenia społeczności

## Prywatność i bezpieczeństwo

- Mikrofon, pady i dźwięk systemu są przetwarzane lokalnie.
- MicDeck nie ma kont, telemetrii, analytics ani chmurowej usługi audio.
- Aplikacja nie wstrzykuje DLL i nie hookuje procesów innych programów.
- Archiwum oficjalnego VB-CABLE jest przed rozpakowaniem porównywane z sumą SHA-256 zapisaną w kodzie.
- Tymczasowe pliki instalatora sterownika są usuwane po jego zakończeniu.

Aktualne pliki wykonywalne nie są podpisane. To jawne ograniczenie wersji preview i najważniejszy pozostały element utwardzenia dystrybucji.

Podejrzenia podatności zgłaszaj prywatnie według [SECURITY.md](SECURITY.md).

## VB-CABLE, wkład i licencja

MicDeck zawiera oficjalny, niezmodyfikowany pakiet **VB-CABLE Driver Pack 45**. Jest to oddzielny produkt VB-Audio udostępniany w modelu donationware. Szczegóły atrybucji i warunków dystrybucji znajdują się w [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Zasady zgłaszania zmian opisuje [CONTRIBUTING.md](CONTRIBUTING.md). Kod MicDeck jest dostępny na [licencji MIT](LICENSE), a zewnętrzne komponenty zachowują własne warunki.

---

<p align="center">
  <strong>Jeśli MicDeck upraszcza Ci audio na Discordzie, zostaw gwiazdkę.</strong>
  <br>
  Dzięki temu projekt ma większą szansę dotrzeć do kolejnych osób.
</p>
