(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))r(n);new MutationObserver(n=>{for(const c of n)if(c.type==="childList")for(const m of c.addedNodes)m.tagName==="LINK"&&m.rel==="modulepreload"&&r(m)}).observe(document,{childList:!0,subtree:!0});function s(n){const c={};return n.integrity&&(c.integrity=n.integrity),n.referrerPolicy&&(c.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?c.credentials="include":n.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function r(n){if(n.ep)return;n.ep=!0;const c=s(n);fetch(n.href,c)}})();function Ce(e,a=!1){return window.__TAURI_INTERNALS__.transformCallback(e,a)}async function d(e,a={},s){return window.__TAURI_INTERNALS__.invoke(e,a,s)}var X;(function(e){e.WINDOW_RESIZED="tauri://resize",e.WINDOW_MOVED="tauri://move",e.WINDOW_CLOSE_REQUESTED="tauri://close-requested",e.WINDOW_DESTROYED="tauri://destroyed",e.WINDOW_FOCUS="tauri://focus",e.WINDOW_BLUR="tauri://blur",e.WINDOW_SCALE_FACTOR_CHANGED="tauri://scale-change",e.WINDOW_THEME_CHANGED="tauri://theme-changed",e.WINDOW_CREATED="tauri://window-created",e.WEBVIEW_CREATED="tauri://webview-created",e.DRAG_ENTER="tauri://drag-enter",e.DRAG_OVER="tauri://drag-over",e.DRAG_DROP="tauri://drag-drop",e.DRAG_LEAVE="tauri://drag-leave"})(X||(X={}));async function Le(e,a){window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener(e,a),await d("plugin:event|unlisten",{event:e,eventId:a})}async function Q(e,a,s){var r;const n=(r=void 0)!==null&&r!==void 0?r:{kind:"Any"};return d("plugin:event|listen",{event:e,target:n,handler:Ce(a)}).then(c=>async()=>Le(e,c))}async function me(){return await d("plugin:autostart|is_enabled")}async function Te(){await d("plugin:autostart|enable")}async function Ne(){await d("plugin:autostart|disable")}async function Re(e={}){return typeof e=="object"&&Object.freeze(e),await d("plugin:dialog|open",{options:e})}function g(e,a,s,r){if(typeof a=="function"?e!==a||!r:!a.has(e))throw new TypeError("Cannot read private member from an object whose class did not declare it");return s==="m"?r:s==="a"?r.call(e):r?r.value:a.get(e)}function M(e,a,s,r,n){if(typeof a=="function"?e!==a||!0:!a.has(e))throw new TypeError("Cannot write private member to an object whose class did not declare it");return a.set(e,s),s}var $,v,A,P;const ee="__TAURI_TO_IPC_KEY__";function Pe(e,a=!1){return window.__TAURI_INTERNALS__.transformCallback(e,a)}class Oe{constructor(a){$.set(this,void 0),v.set(this,0),A.set(this,[]),P.set(this,void 0),M(this,$,a||(()=>{})),this.id=Pe(s=>{const r=s.index;if("end"in s){r==g(this,v,"f")?this.cleanupCallback():M(this,P,r);return}const n=s.message;if(r==g(this,v,"f")){for(g(this,$,"f").call(this,n),M(this,v,g(this,v,"f")+1);g(this,v,"f")in g(this,A,"f");){const c=g(this,A,"f")[g(this,v,"f")];g(this,$,"f").call(this,c),delete g(this,A,"f")[g(this,v,"f")],M(this,v,g(this,v,"f")+1)}g(this,v,"f")===g(this,P,"f")&&this.cleanupCallback()}else g(this,A,"f")[r]=n})}cleanupCallback(){window.__TAURI_INTERNALS__.unregisterCallback(this.id)}set onmessage(a){M(this,$,a)}get onmessage(){return g(this,$,"f")}[($=new WeakMap,v=new WeakMap,A=new WeakMap,P=new WeakMap,ee)](){return`__CHANNEL__:${this.id}`}toJSON(){return this[ee]()}}async function ge(e,a={},s){return window.__TAURI_INTERNALS__.invoke(e,a,s)}async function _e(e,a){const s=new Oe;return s.onmessage=a,await ge("plugin:global-shortcut|register",{shortcuts:Array.isArray(e)?e:[e],handler:s})}async function ve(){return await ge("plugin:global-shortcut|unregister_all",{})}const he="micdeck.language";function Be(){try{const e=localStorage.getItem(he);if(e==="pl"||e==="en")return e}catch{}return navigator.language.toLowerCase().startsWith("pl")?"pl":"en"}const te={pl:{"common.adaptive":"adaptacyjne","common.save":"Zapisz","common.installing":"Instalowanie…","common.restarting":"Restartowanie…","common.ready":"GOTOWY","common.setup":"KONFIGURACJA","common.online":"ONLINE","common.on":"WŁ.","common.off":"WYŁ.","common.alwaysOn":"ZAWSZE AKTYWNY","common.openSettings":"Otwórz ustawienia","common.stop":"Zatrzymaj","common.remove":"Usuń","common.cancel":"Anuluj","language.label":"Język aplikacji","language.polish":"Polski","language.english":"English","toolbar.tray":"Aktywna w zasobniku Windows","toast.soundsAdded.one":"Dodano {count} dźwięk.","toast.soundsAdded.many":"Dodano {count} dźwięki.","toast.imported":"Audio z {source} jest gotowe w bibliotece.","toast.removed":"Dźwięk usunięty.","toast.playFailed":"Nie udało się odtworzyć dźwięku: {error}","toast.inputChanged":"Mikrofon wejściowy został zmieniony.","toast.engineRequired":"Najpierw uruchom silnik audio i skonfiguruj wirtualny mikrofon.","toast.systemOn":"Transmisja dźwięku systemowego jest aktywna.","toast.systemOff":"Transmisja dźwięku systemowego została wyłączona.","toast.driverFailed":"Instalacja sterownika nie powiodła się: {error}","toast.driverInstalled":"Sterownik {backend} został zainstalowany.","toast.audioBackendChanged":"Backend audio przełączony na {backend}.","toast.micRenamed":"Nazwa wirtualnego mikrofonu została zmieniona.","toast.engineRestarted":"Silnik audio został uruchomiony ponownie.","toast.microphoneRepaired":"Domyślny mikrofon Windows został przywrócony: {name}.","toast.autostartOn":"MicDeck uruchomi się z Windows i pozostanie schowany w zasobniku.","toast.autostartOff":"Autostart MicDeck został wyłączony.","toast.languageChanged":"Język aplikacji został zmieniony.","toast.shortcutSaved":"Globalny bind został zapisany.","toast.shortcutCleared":"Globalny bind został usunięty.","toast.shortcutUnavailable":"Ten skrót jest zajęty przez Windows lub inną aplikację. Wybierz inną kombinację.","toast.glowOn":"Cursor glow został włączony.","toast.glowOff":"Cursor glow został wyłączony.","confirm.remove":"Usunąć ten dźwięk z biblioteki?","alert.restartWindows":"Sterownik jest zainstalowany. Uruchom Windows ponownie, aby aktywować wirtualny mikrofon.","alert.driver":"Sterownik audio: {error}","alert.engine":"Silnik audio nie wystartował. Otwórz Ustawienia i uruchom go ponownie.","nav.aria":"Główna nawigacja","nav.workspace":"Workspace","nav.library":"Biblioteka","nav.studio":"Studio live","nav.streamer":"Streamer","nav.settings":"Ustawienia","nav.routeReady":"Trasa aktywna","nav.routeSetup":"Wymaga konfiguracji","nav.routeReadyDescription":"Miks trafia do wirtualnego mikrofonu.","nav.routeSetupDescription":"Sprawdź silnik i sterownik w Ustawieniach.","capture.source":"Źródło nagrania","player.nowPlaying":"TERAZ GRA","player.label":"ODTWARZACZ","player.untitled":"Bez nazwy","player.silence":"Cisza na decku","player.pickSound":"Wybierz dźwięk z biblioteki, aby rozpocząć.","player.signal":"Poziom sygnału","player.playing":"Odtwarzanie","player.play":"Odtwórz","sound.downloaded":"Pobrane","sound.local":"Plik lokalny","shortcut.label":"GLOBALNY BIND","shortcut.assign":"Ustaw bind","shortcut.clickToEdit":"Kliknij, aby ustawić lub zmienić globalny bind","shortcut.unavailable":"Bind jest obecnie zajęty przez Windows lub inną aplikację","shortcut.title":"Nagraj kombinację","shortcut.waiting":"Wciśnij klawisze","shortcut.pressFirst":"Wciśnij modyfikator, np. Alt, Ctrl lub Shift — albo od razu klawisz aktywacji.","shortcut.pressTrigger":"Modyfikator zapisany. Teraz wciśnij klawisz aktywacji, np. P.","shortcut.ready":"Kombinacja jest gotowa. Zapisz ją albo wciśnij inny klawisz, aby go podmienić.","shortcut.undo":"cofnij klawisz","shortcut.clear":"Usuń bind","shortcut.unsupported":"Ten klawisz nie może być użyty jako globalny bind.","worker.captureTitle":"Quick Capture pracuje w tle","worker.filesTitle":"Biblioteka pracuje w tle","worker.thread":"UI POZOSTAJE PŁYNNE","worker.queued":"Zadanie czeka na worker","worker.validating":"Sprawdzam link i źródło","worker.downloading":"Pobieram najlepszą ścieżkę audio","worker.analyzing":"Analizuję plik i przygotowuję waveform","worker.finalizing":"Odświeżam bibliotekę","worker.complete":"Gotowe","worker.failed":"Worker zatrzymał zadanie z błędem","library.kicker":"Sound library","library.title":"Twoje dźwięki","library.description":"Importuj, organizuj i odpalaj materiały bez wychodzenia z jednego widoku.","library.addFiles":"Dodaj pliki","library.captureTitle":"Pobierz audio z linku","library.captureDescription":"Wklej YouTube, Shorts lub TikTok. MicDeck pobierze najlepszą ścieżkę audio i doda ją do biblioteki.","library.downloading":"Pobieram","library.download":"Pobierz","library.requirements":"Wymaga yt-dlp + ffmpeg w PATH","library.rightsNotice":"Pobieraj i udostępniaj tylko materiały, do których masz prawa.","library.sectionTitle":"Biblioteka","library.item.one":"element","library.item.many":"elementów","library.search":"Szukaj dźwięku…","library.noResults":"Brak pasujących wyników","library.empty":"Twój deck czeka na pierwszy dźwięk","library.changeSearch":"Zmień wyszukiwaną frazę.","library.emptyDescription":"Dodaj plik lokalny albo pobierz audio z obsługiwanego linku.","library.addFirst":"Dodaj pierwszy plik","studio.kicker":"Live routing","studio.title":"Studio","studio.description":"Steruj miksem, poziomami i transmisją dźwięku systemowego w czasie rzeczywistym.","studio.live":"TRANSMISJA AKTYWNA","studio.systemAudio":"SYSTEM AUDIO","studio.broadcastingTitle":"Dźwięk pulpitu leci na Discorda","studio.broadcastTitle":"Udostępnij to, co słyszysz","studio.broadcastingDescription":"YouTube, Spotify, gry i pozostałe aplikacje są domieszane do wirtualnego mikrofonu.","studio.broadcastDescription":"Jednym przyciskiem przechwyć domyślne wyjście Windows i skieruj je do rozmowy głosowej.","studio.stopBroadcast":"Zatrzymaj transmisję","studio.startBroadcast":"Włącz transmisję","studio.echoNote":"Podsłuch bindów jest automatycznie wyciszany podczas transmisji, aby uniknąć echa.","studio.sources":"ŹRÓDŁA","studio.sourceApps":"Spotify / YouTube / gry","studio.mixer":"MIKSER","studio.output":"WYJŚCIE","studio.mixerTitle":"Mikser","studio.engineOnline":"ENGINE ONLINE","studio.engineOffline":"ENGINE OFFLINE","studio.microphone":"Mikrofon","studio.yourVoice":"Twój głos","studio.physicalInput":"Wejście fizyczne","studio.bindsFiles":"Bindy i pliki","studio.extraSaturation":"Dodatkowe nasycenie","studio.transmissionActive":"Transmisja aktywna","studio.transmissionOff":"Transmisja wyłączona","studio.bindMonitoring":"Podsłuch bindów","studio.mutedDuringBroadcast":"Wyciszony podczas transmisji","studio.yourHeadphones":"Twoje słuchawki","studio.virtualMicrophone":"Wirtualny mikrofon","studio.voiceSource":"Źródło głosu","studio.physicalMicrophone":"Fizyczny mikrofon","studio.noMicrophone":"Nie znaleziono mikrofonu","studio.latency":"Opóźnienie","studio.process":"Proces","studio.format":"Format","studio.stopBind":"Zatrzymaj bind","studio.restartEngine":"Restart silnika","studio.sourceRackKicker":"APLIKACJE AUDIO","studio.sourceRackTitle":"Źródła transmisji","studio.sourceRackDescription":"Poziomy poniżej sterują wyłącznie kopią wysyłaną na wirtualny kabel. Nie zmieniają głośności aplikacji w Windows.","studio.apps":"aplikacji","studio.playingNow":"TERAZ ODTWARZA","studio.heardJustNow":"Słychać przed chwilą","studio.heardSeconds":"Słychać {count} s temu","studio.heardMinutes":"Słychać {count} min temu","studio.volume":"POZIOM NA KABLU","studio.noAudioApps":"Jeszcze nie wykryto dźwięku z aplikacji","studio.noAudioAppsHelp":"Uruchom muzykę, film lub grę. Źródło pojawi się automatycznie i pozostanie w historii.","streamer.kicker":"Broadcast control","streamer.title":"Konsola streamera","streamer.description":"Wyrównuj głos i dźwięk pulpitu do jednego bezpiecznego zakresu, zanim miks trafi do OBS.","streamer.live":"TRANSMISJA AKTYWNA","streamer.ready":"GOTOWY DO TRANSMISJI","streamer.liveTitle":"Inteligentny miks trafia do OBS","streamer.readyTitle":"Ustaw docelowy poziom i rozpocznij","streamer.liveDescription":"Głos oraz kopia dźwięku systemowego są obrabiane niezależnie i łączone dopiero na magistrali streamu.","streamer.readyDescription":"Silnik analizuje krótkie okna sygnału bez zatrzymywania interfejsu i zachowuje ustawienia między sesjami.","streamer.microphone":"Głos streamera","streamer.systemAudio":"Dźwięk systemowy","streamer.beforeFilters":"Wejście przed filtrami","streamer.toObs":"Po obróbce · do OBS","streamer.voiceDetection":"Pewność wykrycia mowy","streamer.capturedCopy":"Kopia z WASAPI","streamer.systemRouteNote":"Przetwarzana jest kopia na magistralę streamu — odsłuch i suwaki Windows pozostają bez zmian.","streamer.targetCenter":"Poziom docelowy","streamer.tolerance":"Tolerancja","streamer.activeRange":"Aktywny zakres","streamer.levelMatch":"Adaptacyjne wyrównanie poziomu","streamer.levelMatchDescription":"Ciche wypowiedzi i materiały są łagodnie wzmacniane, a krzyki oraz głośne filmy redukowane do ustawionego zakresu.","streamer.silenceSafety":"Bramka mowy i ograniczenie maksymalnego wzmocnienia zapobiegają podnoszeniu ciszy oraz szumu tła.","streamer.calibration":"Kalibracja na żywo","streamer.monitoring":"Podsłuch kalibracyjny","streamer.saySomething":"Powiedz kilka zdań normalnym głosem","streamer.saySomethingHelp":"Mów cicho, normalnie i głośno. Mierniki pokażą rzeczywisty poziom przed i po obróbce.","streamer.monitorLevel":"Głośność podsłuchu","streamer.headphonesOnly":"Tylko lokalne słuchawki","streamer.headphoneWarning":"Używaj słuchawek — odsłuch przez głośniki może pogorszyć redukcję echa.","streamer.filters":"Filtry mikrofonu","streamer.tuneFilters":"Dostrój","streamer.outputGains":"Wzmocnienia wyjściowe","streamer.cableOnly":"Tylko miks na wirtualny kabel","streamer.masterOutput":"Suma wysyłana do OBS","filters.voiceCleanup":"Oczyszczanie głosu","filters.voiceCleanupDescription":"Filtry pracują na mikrofonie przed automatycznym wyrównaniem poziomu. Zmiany są przełączane płynnie, bez restartu silnika.","filters.aec":"Redukcja echa","filters.aecDescription":"WebRTC AEC3 używa dźwięku systemowego jako sygnału referencyjnego i usuwa jego powrót z mikrofonu.","filters.aecShort":"Usuwa z mikrofonu echo materiału odtwarzanego na komputerze.","filters.rnnoise":"Redukcja szumu","filters.rnnoiseDescription":"RNNoise tłumi stały szum komputera, wentylatory i tło, zachowując naturalne brzmienie mowy.","filters.rnnoiseShort":"Tłumi wentylatory, szum elektryczny i stałe tło.","filters.gate":"Inteligentna bramka","filters.gateDescription":"Miękka bramka wycisza samo tło, ale nie odcina cichych końcówek słów.","filters.gateShort":"Chroni ciszę bez agresywnego obcinania słów.","filters.dynamics":"Dynamika i zabezpieczenia","filters.gateThreshold":"Próg bramki","filters.gateThresholdHelp":"Sygnał tła poniżej tego poziomu jest łagodnie ściszany.","filters.compressor":"Kompresor głosu","filters.compressorHelp":"Kontroluje różnicę między szeptem, zwykłą mową i krzykiem.","filters.limiter":"Sufit limitera","filters.limiterHelp":"Twarde zabezpieczenie ostatniego stopnia przed przesterowaniem.","filters.order":"Kolejność przetwarzania","filters.orderDescription":"Redukcja echa i szumu działa przed bramką, wyrównaniem głośności i limiterem, dlatego automatyka nie wzmacnia niepotrzebnego tła.","settings.kicker":"Configuration","settings.title":"Ustawienia","settings.description":"Zarządzaj wirtualnym mikrofonem, silnikiem i integracją z aplikacjami głosowymi.","settings.sections":"Sekcje ustawień","settings.general":"Ogólne","settings.filters":"Filtry audio","settings.virtualMicrophone":"Wirtualny mikrofon","settings.audioBackend":"Backend wirtualnego urządzenia","settings.backendCompatibility":"Domyślna zgodność","settings.backendCustom":"Własny sterownik WaveRT","settings.vbBackendDescription":"Stabilna ścieżka zgodności wykorzystująca oficjalny VB-CABLE.","settings.customBackendDescription":"Własny kabel MicDeck oparty o PortCls/WaveRT, bez zależności od VB-CABLE.","settings.mixOutput":"WYJŚCIE MIKSU","settings.systemName":"Nazwa widoczna w systemie","settings.systemNameHelp":"Ta nazwa pojawi się w Discordzie, grach i OBS. Zmiana może wywołać monit UAC.","settings.deviceInactive":"Wirtualne urządzenie nie jest aktywne","settings.driverInstalledRestart":"Sterownik jest zainstalowany — uruchom Windows ponownie.","settings.installDriverHelp":"Zainstaluj podpisany sterownik VB-CABLE, aby uruchomić routing.","settings.installCustomDriverHelp":"Zainstaluj osadzony pakiet MicDeck VAD, aby uruchomić własny wirtualny mikrofon.","settings.customPackageMissing":"Ta kompilacja nie zawiera jeszcze podpisanego pakietu MicDeck VAD. Zbuduj i osadź go skryptem stage-micdeck-vad-package.ps1.","settings.installDriver":"Zainstaluj VB-CABLE","settings.installCustomDriver":"Zainstaluj MicDeck VAD","settings.driverArchitecture":"Architektura własnego sterownika","settings.driverArchitectureDescription":"C++ tworzy końcowy miks, renderuje go przez WASAPI do endpointu sterownika, a MicDeckVad.sys udostępnia ten sam strumień jako mikrofon capture.","settings.driverSource":"własny sterownik MicDeck","settings.deviceLayer":"Warstwa urządzenia","settings.donationware":"licencja donationware","settings.nativeEngine":"Silnik natywny","settings.protocol":"Protokół","settings.bufferMode":"Tryb bufora","settings.estimatedLatency":"Szacowane opóźnienie","settings.engineError":"Błąd silnika","settings.restartEngine":"Uruchom ponownie silnik","settings.windowsIntegration":"Integracja z Windows","settings.autostart":"Uruchamiaj przy logowaniu","settings.autostartDescription":"MicDeck wystartuje w tle i od razu będzie dostępny w zasobniku systemowym.","settings.tray":"Zasobnik systemowy","settings.trayDescription":"Zamknięcie okna ukrywa aplikację. Aby ją wyłączyć, użyj menu ikony obok zegara.","settings.cursorGlow":"Cursor glow","settings.cursorGlowDescription":"Subtelny, organiczny rozbłysk podąża za kursorem i przenika przez półprzezroczyste panele. Domyślnie włączony.","settings.repairMicrophone":"Napraw domyślny mikrofon","settings.repairMicrophoneDescription":"Przywróć wybrany fizyczny mikrofon we wszystkich rolach Windows po awarii lub wymuszonym zamknięciu.","settings.repairMicrophoneAction":"Napraw","settings.repairingMicrophone":"Naprawianie…","settings.discordTitle":"Discord w 60 sekund","settings.discordOpen":"Otwórz Głos i wideo","settings.discordOpenHelp":"Discord → Ustawienia użytkownika → Głos i wideo.","settings.discordInput":"Wybierz wejście","settings.discordInputHelp":"Ustaw Default albo {microphone}.","settings.discordProcessing":"Wyłącz obróbkę głosu","settings.discordProcessingHelp":"Krisp, redukcja echa i automatyczna regulacja potrafią wycinać bindy.","settings.discordTip":"Fizyczny mikrofon wybierasz w MicDeck. Discord powinien słuchać wirtualnego miksu.","settings.about":"Natywny soundboard i mikser systemowy dla Windows, zbudowany na Rust, C++ i WASAPI.","boot.title":"MicDeck nie może wystartować"},en:{"common.adaptive":"adaptive","common.save":"Save","common.installing":"Installing…","common.restarting":"Restarting…","common.ready":"READY","common.setup":"SETUP","common.online":"ONLINE","common.on":"ON","common.off":"OFF","common.alwaysOn":"ALWAYS ON","common.openSettings":"Open Settings","common.stop":"Stop","common.remove":"Remove","common.cancel":"Cancel","language.label":"App language","language.polish":"Polski","language.english":"English","toolbar.tray":"Running in the Windows tray","toast.soundsAdded.one":"Added {count} sound.","toast.soundsAdded.many":"Added {count} sounds.","toast.imported":"{source} audio is ready in your library.","toast.removed":"Sound removed.","toast.playFailed":"Could not play the sound: {error}","toast.inputChanged":"Input microphone changed.","toast.engineRequired":"Start the audio engine and configure the virtual microphone first.","toast.systemOn":"System-audio broadcast is live.","toast.systemOff":"System-audio broadcast is off.","toast.driverFailed":"Driver installation failed: {error}","toast.driverInstalled":"{backend} driver installed.","toast.audioBackendChanged":"Audio backend switched to {backend}.","toast.micRenamed":"Virtual microphone renamed.","toast.engineRestarted":"Audio engine restarted.","toast.microphoneRepaired":"The Windows default microphone was restored: {name}.","toast.autostartOn":"MicDeck will start with Windows and stay in the system tray.","toast.autostartOff":"MicDeck autostart is disabled.","toast.languageChanged":"App language changed.","toast.shortcutSaved":"Global hotkey saved.","toast.shortcutCleared":"Global hotkey removed.","toast.shortcutUnavailable":"Windows or another app already owns this shortcut. Choose another combination.","toast.glowOn":"Cursor glow enabled.","toast.glowOff":"Cursor glow disabled.","confirm.remove":"Remove this sound from the library?","alert.restartWindows":"The driver is installed. Restart Windows to activate the virtual microphone.","alert.driver":"Audio driver: {error}","alert.engine":"The audio engine did not start. Open Settings and restart it.","nav.aria":"Main navigation","nav.workspace":"Workspace","nav.library":"Library","nav.studio":"Live Studio","nav.streamer":"Streamer","nav.settings":"Settings","nav.routeReady":"Route active","nav.routeSetup":"Setup required","nav.routeReadyDescription":"The mix is reaching your virtual microphone.","nav.routeSetupDescription":"Check the engine and driver in Settings.","capture.source":"Capture source","player.nowPlaying":"NOW PLAYING","player.label":"PLAYER","player.untitled":"Untitled","player.silence":"Nothing on the deck","player.pickSound":"Pick a library sound to get started.","player.signal":"Signal level","player.playing":"Playing","player.play":"Play","sound.downloaded":"Downloaded","sound.local":"Local file","shortcut.label":"GLOBAL HOTKEY","shortcut.assign":"Set hotkey","shortcut.clickToEdit":"Click to set or edit the global hotkey","shortcut.unavailable":"Windows or another application currently owns this hotkey","shortcut.title":"Record a combination","shortcut.waiting":"Press your keys","shortcut.pressFirst":"Press a modifier such as Alt, Ctrl, or Shift — or press the trigger key directly.","shortcut.pressTrigger":"Modifier captured. Now press the trigger key, for example P.","shortcut.ready":"Your combination is ready. Save it or press another trigger key to replace it.","shortcut.undo":"undo key","shortcut.clear":"Clear hotkey","shortcut.unsupported":"That key cannot be used as a global hotkey.","worker.captureTitle":"Quick Capture is working","worker.filesTitle":"Library worker is active","worker.thread":"UI STAYS RESPONSIVE","worker.queued":"Waiting for the background worker","worker.validating":"Validating the link and source","worker.downloading":"Downloading the best audio track","worker.analyzing":"Analyzing audio and preparing the waveform","worker.finalizing":"Refreshing your library","worker.complete":"Complete","worker.failed":"The worker stopped with an error","library.kicker":"Sound library","library.title":"Your sounds","library.description":"Import, organize, and trigger everything from one focused workspace.","library.addFiles":"Add files","library.captureTitle":"Capture audio from a link","library.captureDescription":"Paste YouTube, Shorts, or TikTok. MicDeck grabs the best audio track and adds it to your library.","library.downloading":"Capturing","library.download":"Capture","library.requirements":"Requires yt-dlp + ffmpeg in PATH","library.rightsNotice":"Only download and broadcast media you are allowed to use.","library.sectionTitle":"Library","library.item.one":"item","library.item.many":"items","library.search":"Search sounds…","library.noResults":"No matching results","library.empty":"Your deck is ready for its first sound","library.changeSearch":"Try a different search.","library.emptyDescription":"Add a local file or capture audio from a supported link.","library.addFirst":"Add your first file","studio.kicker":"Live routing","studio.title":"Studio","studio.description":"Control your mix, levels, and system-audio broadcast in real time.","studio.live":"BROADCAST LIVE","studio.systemAudio":"SYSTEM AUDIO","studio.broadcastingTitle":"Your desktop audio is live","studio.broadcastTitle":"Share what you hear","studio.broadcastingDescription":"YouTube, Spotify, games, and other apps are mixed into the virtual microphone.","studio.broadcastDescription":"Capture the default Windows output and route it into voice chat with one button.","studio.stopBroadcast":"Stop broadcast","studio.startBroadcast":"Start broadcast","studio.echoNote":"Sound-pad monitoring is muted automatically during a broadcast to prevent echo.","studio.sources":"SOURCES","studio.sourceApps":"Spotify / YouTube / games","studio.mixer":"MIXER","studio.output":"OUTPUT","studio.mixerTitle":"Mixer","studio.engineOnline":"ENGINE ONLINE","studio.engineOffline":"ENGINE OFFLINE","studio.microphone":"Microphone","studio.yourVoice":"Your voice","studio.physicalInput":"Physical input","studio.bindsFiles":"Pads and files","studio.extraSaturation":"Extra saturation","studio.transmissionActive":"Broadcast live","studio.transmissionOff":"Broadcast off","studio.bindMonitoring":"Pad monitoring","studio.mutedDuringBroadcast":"Muted while broadcasting","studio.yourHeadphones":"Your headphones","studio.virtualMicrophone":"Virtual microphone","studio.voiceSource":"Voice source","studio.physicalMicrophone":"Physical microphone","studio.noMicrophone":"No microphone found","studio.latency":"Latency","studio.process":"Process","studio.format":"Format","studio.stopBind":"Stop sound","studio.restartEngine":"Restart engine","studio.sourceRackKicker":"AUDIO APPLICATIONS","studio.sourceRackTitle":"Broadcast sources","studio.sourceRackDescription":"The levels below affect only the copy sent to the virtual cable. They never change app volume in Windows.","studio.apps":"apps","studio.playingNow":"PLAYING NOW","studio.heardJustNow":"Heard just now","studio.heardSeconds":"Heard {count}s ago","studio.heardMinutes":"Heard {count}m ago","studio.volume":"CABLE LEVEL","studio.noAudioApps":"No application audio detected yet","studio.noAudioAppsHelp":"Start music, a video, or a game. The source appears automatically and stays in history.","streamer.kicker":"Broadcast control","streamer.title":"Streamer console","streamer.description":"Match voice and desktop audio to one safe target range before the mix reaches OBS.","streamer.live":"BROADCAST LIVE","streamer.ready":"READY TO BROADCAST","streamer.liveTitle":"The smart mix is feeding OBS","streamer.readyTitle":"Set your target and go live","streamer.liveDescription":"Voice and captured desktop audio are processed independently, then combined only on the stream bus.","streamer.readyDescription":"The engine analyzes short signal windows without blocking the interface and persists settings between sessions.","streamer.microphone":"Streamer voice","streamer.systemAudio":"System audio","streamer.beforeFilters":"Input before filters","streamer.toObs":"Processed · to OBS","streamer.voiceDetection":"Voice detection confidence","streamer.capturedCopy":"WASAPI capture copy","streamer.systemRouteNote":"Only the stream-bus copy is processed — Windows listening levels and sliders remain unchanged.","streamer.targetCenter":"Target level","streamer.tolerance":"Tolerance","streamer.activeRange":"Active range","streamer.levelMatch":"Adaptive level matching","streamer.levelMatchDescription":"Quiet speech and media are raised smoothly, while shouts and loud videos are reduced into your selected range.","streamer.silenceSafety":"Voice gating and a maximum-gain guard prevent silence and room noise from being lifted.","streamer.calibration":"Live calibration","streamer.monitoring":"Calibration monitoring","streamer.saySomething":"Say a few sentences in your normal voice","streamer.saySomethingHelp":"Speak quietly, normally, and loudly. The meters show the real signal before and after processing.","streamer.monitorLevel":"Monitor volume","streamer.headphonesOnly":"Local headphones only","streamer.headphoneWarning":"Use headphones — loudspeaker monitoring can reduce echo-canceller performance.","streamer.filters":"Microphone filters","streamer.tuneFilters":"Tune","streamer.outputGains":"Output gains","streamer.cableOnly":"Virtual-cable mix only","streamer.masterOutput":"Master signal sent to OBS","filters.voiceCleanup":"Voice cleanup","filters.voiceCleanupDescription":"Filters run on the microphone before adaptive level matching. Changes crossfade smoothly without restarting the engine.","filters.aec":"Echo cancellation","filters.aecDescription":"WebRTC AEC3 uses desktop audio as its reference signal and removes that audio returning through the microphone.","filters.aecShort":"Removes echo from media playing on the computer.","filters.rnnoise":"Noise suppression","filters.rnnoiseDescription":"RNNoise suppresses computer hum, fans, and steady background noise while preserving natural speech.","filters.rnnoiseShort":"Suppresses fans, electrical noise, and steady room ambience.","filters.gate":"Smart noise gate","filters.gateDescription":"A soft gate lowers background-only sections without cutting quiet word endings.","filters.gateShort":"Protects silence without aggressively chopping words.","filters.dynamics":"Dynamics and safety","filters.gateThreshold":"Gate threshold","filters.gateThresholdHelp":"Background below this level is attenuated smoothly.","filters.compressor":"Voice compressor","filters.compressorHelp":"Controls the gap between whispers, regular speech, and shouts.","filters.limiter":"Limiter ceiling","filters.limiterHelp":"The final hard safety ceiling that prevents clipping.","filters.order":"Processing order","filters.orderDescription":"Echo and noise reduction run before gating, leveling, and limiting, so the adaptive stage does not amplify unwanted background.","settings.kicker":"Configuration","settings.title":"Settings","settings.description":"Manage the virtual microphone, audio engine, and voice-app integration.","settings.sections":"Settings sections","settings.general":"General","settings.filters":"Audio filters","settings.virtualMicrophone":"Virtual microphone","settings.audioBackend":"Virtual-device backend","settings.backendCompatibility":"Default compatibility","settings.backendCustom":"Custom WaveRT driver","settings.vbBackendDescription":"Compatibility path using the official VB-CABLE package.","settings.customBackendDescription":"MicDeck-owned PortCls/WaveRT cable without a VB-CABLE dependency.","settings.mixOutput":"MIX OUTPUT","settings.systemName":"System display name","settings.systemNameHelp":"This name appears in Discord, games, and OBS. Changing it may trigger a UAC prompt.","settings.deviceInactive":"The virtual device is not active","settings.driverInstalledRestart":"The driver is installed — restart Windows to finish.","settings.installDriverHelp":"Install the signed VB-CABLE driver to enable routing.","settings.installCustomDriverHelp":"Install the embedded MicDeck VAD package to enable the custom virtual microphone.","settings.customPackageMissing":"This build does not contain a signed MicDeck VAD package yet. Build and stage it with stage-micdeck-vad-package.ps1.","settings.installDriver":"Install VB-CABLE","settings.installCustomDriver":"Install MicDeck VAD","settings.driverArchitecture":"Custom driver architecture","settings.driverArchitectureDescription":"C++ creates the final mix and renders it through WASAPI to the driver endpoint; MicDeckVad.sys exposes the same stream as a capture microphone.","settings.driverSource":"MicDeck-owned driver","settings.deviceLayer":"Device layer","settings.donationware":"donationware license","settings.nativeEngine":"Native engine","settings.protocol":"Protocol","settings.bufferMode":"Buffer mode","settings.estimatedLatency":"Estimated latency","settings.engineError":"Engine error","settings.restartEngine":"Restart audio engine","settings.windowsIntegration":"Windows integration","settings.autostart":"Launch at sign-in","settings.autostartDescription":"MicDeck starts in the background and is immediately available from the system tray.","settings.tray":"System tray","settings.trayDescription":"Closing the window hides the app. Use the icon next to the clock when you want to quit.","settings.cursorGlow":"Cursor glow","settings.cursorGlowDescription":"A subtle organic glow follows the pointer beneath the translucent panels. Enabled by default.","settings.repairMicrophone":"Repair default microphone","settings.repairMicrophoneDescription":"Restore the selected physical microphone for every Windows role after a crash or forced shutdown.","settings.repairMicrophoneAction":"Repair","settings.repairingMicrophone":"Repairing…","settings.discordTitle":"Discord in 60 seconds","settings.discordOpen":"Open Voice & Video","settings.discordOpenHelp":"Discord → User Settings → Voice & Video.","settings.discordInput":"Choose the input","settings.discordInputHelp":"Select Default or {microphone}.","settings.discordProcessing":"Disable voice processing","settings.discordProcessingHelp":"Krisp, echo cancellation, and automatic gain control can cut out sound pads.","settings.discordTip":"Choose your physical microphone in MicDeck. Discord should listen to the virtual mix.","settings.about":"A native Windows soundboard and system mixer built with Rust, C++, and WASAPI.","boot.title":"MicDeck could not start"}};function je(e,a,s={}){let r=te[e]?.[a]??te.en[a]??a;return Object.entries(s).forEach(([n,c])=>{r=r.replaceAll(`{${n}}`,String(c))}),r}const ye="micdeck.cursorGlow.v2";function xe(e,a=!1){try{const s=localStorage.getItem(e);return s===null?a:s==="true"}catch{return a}}const t={activeView:"library",settingsSection:"general",language:Be(),autostartEnabled:!1,isUpdatingAutostart:!1,cursorGlowEnabled:xe(ye,!0),sounds:[],inputDevices:[],selectedInputDevice:null,microphoneGain:1,volume:1,soundOverdrive:1,monitorGain:0,systemAudioEnabled:!1,systemAudioGain:.85,voiceProcessing:{aecEnabled:!1,rnnoiseEnabled:!1,autoLevelEnabled:!1,targetMinDb:-19,targetMaxDb:-13,voiceMonitorEnabled:!1,voiceMonitorGain:.25,noiseGateEnabled:!1,gateThresholdDb:-55,compressorRatio:3,limiterCeilingDb:-1},audioSessions:[],nativeAudio:{available:!1,ready:!1,state:"starting",protocolVersion:0,enginePid:0,microphoneLevel01:0,systemLevel01:0,mixedLevel01:0,microphoneInputLevel01:0,microphoneOutputLevel01:0,systemInputLevel01:0,systemOutputLevel01:0,voiceProbability01:0,microphoneAppliedGain:1,systemAppliedGain:1,estimatedLatencyMs:0,underruns:0,captureOverruns:0,droppedAudioFrames:0,error:null,runtime:"C++ / WASAPI"},virtualAudio:{installed:!1,ready:!1,backend:"vbCable",backendLabel:"VB-CABLE",installerAttempted:!1,restartRequired:!1,customDriverPackageReady:!1,thirdParty:!0,error:null,vendor:"VB-Audio / VB-CABLE Pack45",vendorUrl:"https://vb-audio.com/Cable/",renderDeviceName:null,microphoneName:null},microphoneNameInput:"MicDeck Virtual Mic",microphoneNameDirty:!1,isInstallingDriver:!1,isSwitchingAudioBackend:!1,isRenamingMicrophone:!1,isRestartingEngine:!1,isRepairingDefaultMicrophone:!1,filter:"",urlInput:"",mediaPlatform:"auto",isImporting:!1,isAddingSounds:!1,libraryWorker:null,shortcutRecorder:null,shortcutErrors:new Map,toast:null,playback:{isPlaying:!1,soundId:null,soundName:null,positionMs:0,durationMs:0,progress01:0,signalDbfs:-90,signalLevel01:0}};let _=null,ie=null,ae=null,H=null;const C=new Map;let be=null,z=new Set,U=null,se=window.innerWidth*.72,re=window.innerHeight*.22;const We={library:'<path d="M4 5.5h16M4 12h16M4 18.5h10"/><circle cx="18" cy="18.5" r="2.5"/>',studio:'<path d="M4 8v8M8 5v14M12 9v6M16 3v18M20 7v10"/>',streamer:'<path d="M4 17a8 8 0 0 1 16 0M7 17a5 5 0 0 1 10 0M10 17a2 2 0 0 1 4 0"/><circle cx="12" cy="20" r="1"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',plus:'<path d="M12 5v14M5 12h14"/>',download:'<path d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',play:'<path d="m9 7 8 5-8 5Z"/>',stop:'<rect x="7" y="7" width="10" height="10" rx="1"/>',trash:'<path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6"/>',mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/>',monitor:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',route:'<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h4a4 4 0 0 1 4 4v4m-8 4h4"/>',link:'<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.15 1.15M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.15-1.15"/>',bolt:'<path d="m13 2-8 12h7l-1 8 8-12h-7Z"/>',check:'<path d="m5 12 4 4L19 6"/>',alert:'<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v4m0 3h.01"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',refresh:'<path d="M20 6v6h-6M4 18v-6h6"/><path d="M18.5 9A7 7 0 0 0 6 6.5L4 9m2 6.5A7 7 0 0 0 18 15l2-2"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',tray:'<path d="M5 5h14v10H5zM8 19h8M12 15v4"/><path d="M8 9h8"/>',power:'<path d="M12 3v9M6.2 6.2a8 8 0 1 0 11.6 0"/>',keyboard:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M10 10h.01M13 10h.01M16 10h.01M7 14h.01M10 14h7"/>',sparkle:'<path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3Z"/><path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>'};document.documentElement.lang=t.language;function i(e,a){return je(t.language,e,a)}function o(e,a=""){return`<svg class="icon ${a}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${We[e]||""}</svg>`}function Z(){return`
    <svg class="brand-glyph" viewBox="0 0 44 44" aria-hidden="true">
      <path d="M7 35V9h7l8 12 8-12h7v26h-7V20l-8 12-8-12v15Z"/>
    </svg>
  `}function u(e){return String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function B(e){const a=Math.floor((Number(e)||0)/1e3);return`${String(Math.floor(a/60)).padStart(2,"0")}:${String(a%60).padStart(2,"0")}`}function x(e){return`${Math.round((Number(e)||0)*100)}%`}function fe(e){return`×${(Number(e)||1).toFixed(1)}`}function k(e){return!Number.isFinite(e)||e<=-90?"−∞ dB":`${e>0?"+":""}${e.toFixed(1)} dB`}function we(e){return Math.round((Math.max(-60,Math.min(12,e))+60)/72*100)}function D(e){return Math.round((Math.max(-60,Math.min(0,e))+60)/60*100)}function h(e){return Math.round(Math.max(0,Math.min(1,Number(e)||0))*100)}function ke(e){const a=Number(e);return a>3e-5?20*Math.log10(a):-90}function j(e){return`×${Math.max(0,Number(e)||0).toFixed(2)}`}function L(){const e=Number(t.nativeAudio.estimatedLatencyMs);return e>0?`~${e.toFixed(1)} ms`:i("common.adaptive")}function Ve(){if(t.mediaPlatform!=="auto")return t.mediaPlatform;const e=t.urlInput.toLowerCase();return e.includes("tiktok.com")?"tiktok":e.includes("/shorts/")?"shorts":e.includes("youtube.com")||e.includes("youtu.be")?"youtube":"auto"}function W(e=Ve()){return{auto:"Auto",youtube:"YouTube",shorts:"Shorts",tiktok:"TikTok"}[e]||"Auto"}function p(e,a="info"){t.toast={message:String(e),kind:a},Y(),clearTimeout(ae),ae=setTimeout(()=>{t.toast=null,Y()},4200)}function Y(){const e=document.getElementById("toast-host");e&&(e.innerHTML=t.toast?`<div class="toast toast-${u(t.toast.kind)}">${o(t.toast.kind==="error"?"alert":"check")}<span>${u(t.toast.message)}</span></div>`:"")}function $e(e){return String(e||"").split("+").map(a=>a.trim()).filter(Boolean)}function Ae(e,a=i("shortcut.assign")){const s=$e(e);return s.length===0?`<span class="shortcut-empty">${o("keyboard")} ${a}</span>`:`<span class="shortcut-keys">${s.map(r=>`<kbd>${u(r)}</kbd>`).join("<i>+</i>")}</span>`}function Ge(){return t.shortcutRecorder?.key?[...t.shortcutRecorder.modifiers,t.shortcutRecorder.key].join("+"):null}function Ue(){const e=t.shortcutRecorder;return e&&[...e.modifiers,...e.key?[e.key]:[]].join("+")||null}function Fe(e){return/^Key[A-Z]$/.test(e.code)?e.code.slice(3):/^Digit[0-9]$/.test(e.code)?e.code.slice(5):/^Numpad[0-9]$/.test(e.code)?`Numpad${e.code.slice(6)}`:/^F([1-9]|1[0-9]|2[0-4])$/.test(e.code)?e.code:{Space:"Space",Enter:"Enter",Tab:"Tab",Escape:"Escape",ArrowUp:"ArrowUp",ArrowDown:"ArrowDown",ArrowLeft:"ArrowLeft",ArrowRight:"ArrowRight",Home:"Home",End:"End",PageUp:"PageUp",PageDown:"PageDown",Insert:"Insert",Delete:"Delete",Backquote:"Backquote",Minus:"Minus",Equal:"Equal",BracketLeft:"BracketLeft",BracketRight:"BracketRight",Backslash:"Backslash",Semicolon:"Semicolon",Quote:"Quote",Comma:"Comma",Period:"Period",Slash:"Slash",NumpadAdd:"NumpadAdd",NumpadSubtract:"NumpadSubtract",NumpadMultiply:"NumpadMultiply",NumpadDivide:"NumpadDivide",NumpadDecimal:"NumpadDecimal"}[e.code]||null}function qe(e){return e.key==="Control"?"Ctrl":e.key==="Alt"||e.key==="AltGraph"?"Alt":e.key==="Shift"?"Shift":e.key==="Meta"?"Super":null}async function V(){if(t.shortcutRecorder)return;const e=new Map;await ve().catch(()=>{});for(const a of t.sounds.filter(s=>s.shortcut))try{await _e(a.shortcut,async s=>{if(s.state==="Pressed")try{await d("play_sound",{id:a.id}),J()}catch(r){p(i("toast.playFailed",{error:r}),"error")}})}catch(s){e.set(a.id,String(s))}return t.shortcutErrors=e,e}async function He(e){const a=t.sounds.find(n=>n.id===e);if(!a)return;await ve().catch(()=>{});const s=$e(a.shortcut),r=new Set(["Ctrl","Alt","Shift","Super"]);t.shortcutRecorder={soundId:e,soundName:a.name.replace(/\.[^/.]+$/,""),modifiers:s.filter(n=>r.has(n)),key:s.find(n=>!r.has(n))||null},l(),document.querySelector(".shortcut-dialog")?.focus()}async function K(){t.shortcutRecorder=null,l(),await V()}async function ne(e){const a=t.shortcutRecorder;if(a)try{t.sounds=await d("set_sound_shortcut",{id:a.soundId,shortcut:e}),t.shortcutRecorder=null,l();const s=await V();e&&s?.has(a.soundId)?p(i("toast.shortcutUnavailable"),"error"):p(i(e?"toast.shortcutSaved":"toast.shortcutCleared"),"success")}catch(s){p(s,"error")}}function Ye(e){const a=t.shortcutRecorder;if(!a||e.repeat)return;if(e.preventDefault(),e.stopPropagation(),e.key==="Escape"){K();return}if(e.key==="Backspace"){a.key?a.key=null:a.modifiers.pop(),l();return}const s=qe(e);if(s){a.modifiers.includes(s)||a.modifiers.push(s),l();return}const r=Fe(e);if(!r){p(i("shortcut.unsupported"),"error");return}a.key=r,l()}function Ke(){t.cursorGlowEnabled=!t.cursorGlowEnabled;try{localStorage.setItem(ye,String(t.cursorGlowEnabled))}catch{}l(),p(i(t.cursorGlowEnabled?"toast.glowOn":"toast.glowOff"),"success")}function Ze(){window.addEventListener("pointermove",e=>{t.cursorGlowEnabled&&(se=e.clientX,re=e.clientY,!U&&(U=requestAnimationFrame(()=>{U=null,document.documentElement.style.setProperty("--cursor-x",`${se}px`),document.documentElement.style.setProperty("--cursor-y",`${re}px`)})))},{passive:!0})}async function Je(){await Q("library-worker-progress",({payload:e})=>{t.libraryWorker=e,t.activeView==="library"&&l()}),await Q("native-runtime-ready",()=>{y().catch(()=>{})})}async function y(){const[e,a,s,r,n,c,m,b,N,R,ze,G,De,Me,Ie]=await Promise.all([d("list_sounds"),d("list_input_devices"),d("get_selected_input_device"),d("get_microphone_gain"),d("get_volume"),d("get_sound_overdrive"),d("get_monitor_gain"),d("get_system_audio_enabled"),d("get_system_audio_gain"),d("get_voice_processing_settings"),d("get_playback_status"),d("get_virtual_audio_status"),d("get_native_audio_status"),d("list_audio_sessions"),me().catch(()=>!1)]);Object.assign(t,{sounds:e,inputDevices:a,selectedInputDevice:s,microphoneGain:Number(r??1),volume:Number(n??1),soundOverdrive:Number(c??1),monitorGain:Number(m??0),systemAudioEnabled:!!b,systemAudioGain:Number(N??.85),voiceProcessing:R,playback:ze,virtualAudio:G,nativeAudio:De,audioSessions:Me,autostartEnabled:!!Ie}),t.microphoneNameDirty||(t.microphoneNameInput=G.microphoneName||(G.backend==="micDeckVad"?"MicDeck Virtual Microphone":"MicDeck Virtual Mic")),l()}async function oe(){if(t.isAddingSounds)return;const e=await Re({multiple:!0,filters:[{name:"Audio",extensions:["mp3","wav","flac","ogg","m4a","aac","wma"]}]});if(!e||Array.isArray(e)&&e.length===0)return;const a=Array.isArray(e)?e:[e],s=new Set(t.sounds.map(r=>r.id));t.isAddingSounds=!0,t.libraryWorker={kind:"files",stage:"queued",current:0,total:a.length,fileName:null},l();try{t.sounds=await d("add_sounds",{paths:a}),z=new Set(t.sounds.filter(n=>!s.has(n.id)).map(n=>n.id)),t.isAddingSounds=!1,t.libraryWorker=null,l();const r=z.size;p(i(r===1?"toast.soundsAdded.one":"toast.soundsAdded.many",{count:r}),"success"),setTimeout(()=>z.clear(),1400)}catch(r){t.isAddingSounds=!1,t.libraryWorker=null,l(),p(r,"error")}}async function ce(){const e=t.urlInput.trim();if(!e||t.isImporting)return;const a=new Set(t.sounds.map(s=>s.id));t.isImporting=!0,t.libraryWorker={kind:"url",stage:"validating",current:0,total:1,fileName:null},l();try{t.sounds=await d("import_from_url",{url:e}),z=new Set(t.sounds.filter(r=>!a.has(r.id)).map(r=>r.id));const s=W();t.urlInput="",t.mediaPlatform="auto",t.isImporting=!1,t.libraryWorker=null,l(),p(i("toast.imported",{source:s}),"success"),setTimeout(()=>z.clear(),1400)}catch(s){t.isImporting=!1,t.libraryWorker=null,l(),p(s,"error")}}async function Xe(e){if(confirm(i("confirm.remove")))try{await d("remove_sound",{id:e}),await y(),await V(),p(i("toast.removed"),"success")}catch(a){p(a,"error")}}async function Qe(e){try{await d("play_sound",{id:e}),await y(),J()}catch(a){p(i("toast.playFailed",{error:a}),"error")}}async function et(){try{await d("stop_playback"),await y()}catch(e){p(e,"error")}}async function tt(e){try{t.selectedInputDevice=e,await d("set_selected_input_device",{deviceId:e}),await y(),p(i("toast.inputChanged"),"success")}catch(a){p(a,"error"),await y()}}async function S(e,a,s,r,n=x){t[a]=Number(s);const c=document.querySelector(r);c&&(c.textContent=n(t[a]));try{await d(e,e==="set_sound_overdrive"?{overdrive:t[a]}:{gain:t[a]})}catch(m){p(m,"error")}}async function le(){clearTimeout(H);try{t.voiceProcessing=await d("set_voice_processing_settings",{settings:t.voiceProcessing})}catch(e){p(e,"error")}}function E(e,{rerender:a=!1,immediate:s=!1}={}){Object.assign(t.voiceProcessing,e),clearTimeout(H),s?le():H=setTimeout(le,90),a&&l()}function it(e){t.volume=Number(e);const a=document.querySelector(".sound-gain-value");a&&(a.textContent=x(t.volume)),d("set_volume",{volume:t.volume}).catch(s=>p(s,"error"))}async function F(){if(!t.nativeAudio.ready){p(i("toast.engineRequired"),"error");return}const e=t.systemAudioEnabled;t.systemAudioEnabled=!e,l();try{await d("set_system_audio_enabled",{enabled:t.systemAudioEnabled}),p(t.systemAudioEnabled?i("toast.systemOn"):i("toast.systemOff"),"success")}catch(a){t.systemAudioEnabled=e,l(),p(a,"error")}}async function at(e){if(t.isSwitchingAudioBackend||e===t.virtualAudio.backend)return;const a=t.virtualAudio.backend;t.isSwitchingAudioBackend=!0,t.virtualAudio.backend=e,l();try{await d("set_virtual_audio_backend",{backend:e}),await y(),p(i("toast.audioBackendChanged",{backend:t.virtualAudio.backendLabel||e}),"success")}catch(s){t.virtualAudio.backend=a,await y().catch(()=>{}),p(s,"error")}finally{t.isSwitchingAudioBackend=!1,l()}}async function st(){if(!t.isInstallingDriver){t.isInstallingDriver=!0,l();try{await d("install_virtual_audio_driver"),await y(),p(i("toast.driverInstalled",{backend:t.virtualAudio.backendLabel||t.virtualAudio.backend}),"success")}catch(e){p(i("toast.driverFailed",{error:e}),"error")}finally{t.isInstallingDriver=!1,l()}}}async function de(){const e=t.microphoneNameInput.trim();if(!(!e||t.isRenamingMicrophone)){t.isRenamingMicrophone=!0,l();try{await d("rename_virtual_microphone",{name:e}),await new Promise(a=>setTimeout(a,500)),t.microphoneNameDirty=!1,t.isRenamingMicrophone=!1,await y(),p(i("toast.micRenamed"),"success")}catch(a){t.isRenamingMicrophone=!1,l(),p(a,"error")}}}async function rt(){if(!t.isRestartingEngine){t.isRestartingEngine=!0,l();try{await d("restart_native_audio_engine"),await new Promise(e=>setTimeout(e,350)),t.isRestartingEngine=!1,await y(),p(i("toast.engineRestarted"),"success")}catch(e){t.isRestartingEngine=!1,l(),p(e,"error")}}}async function nt(){if(!t.isRepairingDefaultMicrophone){t.isRepairingDefaultMicrophone=!0,l();try{const e=await d("repair_default_microphone");t.isRepairingDefaultMicrophone=!1,l(),p(i("toast.microphoneRepaired",{name:e}),"success")}catch(e){t.isRepairingDefaultMicrophone=!1,l(),p(e,"error")}}}function ot(e,a){const s=Math.max(0,Math.min(1,Number(a))),r=t.audioSessions.find(c=>c.id===e);r&&(r.volume=s,r.muted=s<=.001);const n=document.querySelector(`[data-session-volume-output="${e}"]`);n&&(n.textContent=`${Math.round(s*100)}%`),clearTimeout(C.get(e)),C.set(e,setTimeout(async()=>{C.delete(e);try{await d("set_audio_session_volume",{id:e,volume:s})}catch(c){p(c,"error")}},60))}function ct(e){if(!(!["pl","en"].includes(e)||t.language===e)){t.language=e,document.documentElement.lang=e;try{localStorage.setItem(he,e)}catch{}l(),p(i("toast.languageChanged"),"success")}}async function lt(){if(t.isUpdatingAutostart)return;const e=!t.autostartEnabled;t.isUpdatingAutostart=!0,l();try{e?await Te():await Ne(),t.autostartEnabled=await me(),p(i(t.autostartEnabled?"toast.autostartOn":"toast.autostartOff"),"success")}catch(a){p(a,"error")}finally{t.isUpdatingAutostart=!1,l()}}function dt(){const e=t.filter.trim().toLowerCase();return e?t.sounds.filter(a=>[a.name,a.path,a.extension,a.sourceKind].join(" ").toLowerCase().includes(e)):t.sounds}function ut(){return t.virtualAudio.restartRequired?i("alert.restartWindows"):t.virtualAudio.error?i("alert.driver",{error:t.virtualAudio.error}):t.nativeAudio.state==="error"?t.nativeAudio.error||i("alert.engine"):null}function O(e,a,s){return`
    <button class="nav-item ${t.activeView===e?"is-active":""}" data-view="${e}">
      ${o(s)}
      <span>${a}</span>
      ${(e==="studio"||e==="streamer")&&t.systemAudioEnabled?'<i class="nav-live-dot"></i>':""}
    </button>
  `}function pt(){const e=t.nativeAudio.ready&&t.virtualAudio.ready;return`
    <aside class="app-sidebar">
      <div class="brand-lockup">
        <div class="brand-symbol">${Z()}</div>
        <div class="brand-copy">
          <strong>MICDECK</strong>
          <span>Audio routing suite</span>
        </div>
      </div>

      <nav class="app-nav" aria-label="${i("nav.aria")}">
        <div class="nav-caption">${i("nav.workspace")}</div>
        ${O("library",i("nav.library"),"library")}
        ${O("studio",i("nav.studio"),"studio")}
        ${O("streamer",i("nav.streamer"),"streamer")}
        ${O("settings",i("nav.settings"),"settings")}
      </nav>

      <div class="sidebar-spacer"></div>
      <div class="route-status ${e?"is-ready":"is-waiting"}">
        <div class="route-status-head">
          <span class="status-beacon"></span>
          <strong>${i(e?"nav.routeReady":"nav.routeSetup")}</strong>
        </div>
        <p>${i(e?"nav.routeReadyDescription":"nav.routeSetupDescription")}</p>
        <div class="route-status-meta">
          <span>IPC v${t.nativeAudio.protocolVersion||"—"}</span>
          <span>${L()}</span>
        </div>
      </div>
      <div class="sidebar-version">MICDECK 0.1 · Windows</div>
    </aside>
  `}function mt(){return`
    <div class="app-toolbar">
      <div class="tray-presence" title="${i("settings.trayDescription")}">
        ${o("tray")}
        <span>${i("toolbar.tray")}</span>
        <i></i>
      </div>
      <div class="language-picker" role="group" aria-label="${i("language.label")}">
        ${o("globe")}
        <button class="${t.language==="pl"?"is-active":""}" data-language="pl" title="${i("language.polish")}" aria-pressed="${t.language==="pl"}">PL</button>
        <button class="${t.language==="en"?"is-active":""}" data-language="en" title="${i("language.english")}" aria-pressed="${t.language==="en"}">EN</button>
      </div>
    </div>
  `}function T(e,a,s,r=""){return`
    <header class="view-header">
      <div>
        <div class="kicker">${e}</div>
        <h1>${a}</h1>
        <p>${s}</p>
      </div>
      ${r?`<div class="view-actions">${r}</div>`:""}
    </header>
  `}function gt(){return`
    <div class="platform-selector" role="group" aria-label="${i("capture.source")}">
      ${["auto","youtube","shorts","tiktok"].map(e=>`
        <button class="platform-chip ${t.mediaPlatform===e?"is-active":""}" data-platform="${e}">
          ${W(e)}
        </button>
      `).join("")}
    </div>
  `}function vt(){const e=t.playback.isPlaying;return`
    <section class="now-playing ${e?"is-live":""}">
      <div class="now-art">
        <div class="art-disc"></div>
        <div class="art-center">${o(e?"studio":"play")}</div>
      </div>
      <div class="now-copy">
        <div class="panel-kicker">${e?`<span class="live-beacon"></span> ${i("player.nowPlaying")}`:i("player.label")}</div>
        <h2 class="now-title">${u(e?t.playback.soundName||i("player.untitled"):i("player.silence"))}</h2>
        <p class="now-meta">${e?`${B(t.playback.positionMs)} / ${B(t.playback.durationMs)}`:i("player.pickSound")}</p>
      </div>
      <div class="now-signal">
        <div class="metric-label">${i("player.signal")}</div>
        <strong class="signal-db">${k(t.playback.signalDbfs)}</strong>
        <div class="meter"><i class="signal-fill" style="width:${we(t.playback.signalDbfs)}%"></i></div>
      </div>
      <button class="icon-button now-stop" id="stop-btn" title="${i("common.stop")}" ${e?"":"disabled"}>
        ${o("stop")}
      </button>
      <div class="now-progress"><i class="progress-fill" style="width:${Math.round((t.playback.progress01||0)*100)}%"></i></div>
    </section>
  `}function ht(e,a){const s=String(e.name||"VX").replace(/\.[^/.]+$/,"").split(/\s+/).filter(Boolean).slice(0,2).map(n=>n[0]).join("").toUpperCase().slice(0,2),r=Array.from({length:14},(n,c)=>`<i style="height:${22+(a*17+c*29+String(e.name).length*7)%64}%"></i>`).join("");return`<div class="sound-art sound-art-${a%5}"><span>${u(s||"VX")}</span><div class="wave-bars">${r}</div></div>`}function yt(e,a){const s=t.playback.isPlaying&&t.playback.soundId===e.id,r=t.shortcutErrors.has(e.id);return`
    <article class="sound-card ${s?"is-live":""} ${z.has(e.id)?"is-new":""}">
      ${ht(e,a)}
      <div class="sound-card-body">
        <div class="sound-card-top">
          <span class="file-type">${u(e.extension.toUpperCase())}</span>
          ${s?'<span class="playing-tag"><i></i> LIVE</span>':`<span class="sound-duration">${u(e.durationText)}</span>`}
        </div>
        <h3 title="${u(e.name)}">${u(e.name.replace(/\.[^/.]+$/,""))}</h3>
        <div class="sound-details">
          <span>${u(e.fileSizeText)}</span>
          <i></i>
          <span>${e.sourceKind==="library"?i("sound.downloaded"):i("sound.local")}</span>
        </div>
        ${s?`
          <div class="card-progress"><i class="mini-fill" style="width:${Math.round((t.playback.progress01||0)*100)}%"></i></div>
        `:""}
        <button class="shortcut-control ${e.shortcut?"has-shortcut":""} ${r?"has-error":""}" data-shortcut-id="${u(e.id)}" title="${u(i(r?"shortcut.unavailable":"shortcut.clickToEdit"))}">
          <span class="shortcut-control-label">${i("shortcut.label")}</span>
          ${Ae(e.shortcut)}
          ${o(r?"alert":"keyboard")}
        </button>
        <div class="sound-actions">
          <button class="play-button play-btn" data-id="${u(e.id)}">
            ${o(s?"studio":"play")}
            <span>${i(s?"player.playing":"player.play")}</span>
          </button>
          <button class="icon-button remove-btn" data-id="${u(e.id)}" title="${i("common.remove")}">
            ${o("trash")}
          </button>
        </div>
      </div>
    </article>
  `}function bt(){const e=t.libraryWorker;if(!e)return"";const a={queued:6,validating:12,downloading:42,analyzing:58,finalizing:92,complete:100,failed:100},s=e.total>0?e.current/e.total*28:0,r=Math.min(100,Math.round((a[e.stage]||8)+s)),n=`worker.${e.stage}`;return`
    <section class="library-worker ${e.stage==="failed"?"has-error":""}" aria-live="polite">
      <div class="worker-orbit"><span></span>${o(e.kind==="url"?"download":"studio")}</div>
      <div class="worker-copy">
        <div class="worker-title-row">
          <strong>${i(e.kind==="url"?"worker.captureTitle":"worker.filesTitle")}</strong>
          <span>${r}%</span>
        </div>
        <p>${u(i(n))}${e.fileName?` · ${u(e.fileName)}`:""}</p>
        <div class="worker-track"><i style="width:${r}%"></i></div>
      </div>
      <span class="worker-thread">${o("bolt")} ${i("worker.thread")}</span>
    </section>
  `}function ft(){const e=t.shortcutRecorder;if(!e)return"";const a=Ue(),s=e.key?i("shortcut.ready"):e.modifiers.length>0?i("shortcut.pressTrigger"):i("shortcut.pressFirst"),r=t.sounds.find(n=>n.id===e.soundId);return`
    <div class="modal-backdrop" data-close-shortcut>
      <section class="shortcut-dialog" role="dialog" aria-modal="true" aria-labelledby="shortcut-title" tabindex="-1">
        <button class="dialog-close" data-cancel-shortcut aria-label="${i("common.cancel")}">${o("close")}</button>
        <div class="dialog-icon">${o("keyboard")}</div>
        <div class="panel-kicker">GLOBAL HOTKEY</div>
        <h2 id="shortcut-title">${i("shortcut.title")}</h2>
        <p class="dialog-sound-name">${u(e.soundName)}</p>
        <div class="shortcut-capture ${e.key?"is-ready":"is-listening"}">
          <span class="capture-pulse"></span>
          ${Ae(a,i("shortcut.waiting"))}
        </div>
        <p class="shortcut-instruction">${s}</p>
        <div class="shortcut-hints">
          <span><kbd>Esc</kbd> ${i("common.cancel")}</span>
          <span><kbd>Backspace</kbd> ${i("shortcut.undo")}</span>
        </div>
        <div class="dialog-actions">
          <button class="button button-subtle" data-clear-shortcut ${r?.shortcut?"":"disabled"}>${i("shortcut.clear")}</button>
          <button class="button button-subtle" data-cancel-shortcut>${i("common.cancel")}</button>
          <button class="button button-primary" data-save-shortcut ${e.key?"":"disabled"}>${i("common.save")}</button>
        </div>
      </section>
    </div>
  `}function wt(){const e=dt();return`
    ${T(i("library.kicker"),i("library.title"),i("library.description"),`<button class="button button-primary" id="add-btn" ${t.isAddingSounds?"disabled":""}>
        ${t.isAddingSounds?`<span class="spinner spinner-dark"></span> ${i("worker.analyzing")}`:`${o("plus")} ${i("library.addFiles")}`}
      </button>`)}

    ${bt()}

    <div class="library-lead">
      <section class="capture-card">
        <div class="capture-card-head">
          <div class="feature-icon">${o("download")}</div>
          <div>
            <div class="panel-kicker">QUICK CAPTURE</div>
            <h2>${i("library.captureTitle")}</h2>
          </div>
          <span class="support-label">YT-DLP</span>
        </div>
        <p>${i("library.captureDescription")}</p>
        ${gt()}
        <div class="url-field">
          ${o("link")}
          <input id="url-input" placeholder="https://youtube.com/shorts/…" value="${u(t.urlInput)}" />
          <span class="detected-platform">${u(W())}</span>
          <button id="url-btn" class="button button-accent" ${t.isImporting?"disabled":""}>
            ${t.isImporting?`<span class="spinner"></span> ${i("library.downloading")}`:`${o("download")} ${i("library.download")}`}
          </button>
        </div>
        <div class="capture-foot">
          <span>${o("check")} YouTube</span>
          <span>${o("check")} Shorts</span>
          <span>${o("check")} TikTok</span>
          <small>${i("library.requirements")}</small>
        </div>
        <div class="capture-rights">${o("alert")} ${i("library.rightsNotice")}</div>
      </section>
      ${vt()}
    </div>

    <section class="library-section">
      <div class="section-toolbar">
        <div>
          <h2>${i("library.sectionTitle")}</h2>
          <span>${t.sounds.length} ${i(t.sounds.length===1?"library.item.one":"library.item.many")}</span>
        </div>
        <label class="search-field">
          ${o("search")}
          <input id="search-input" placeholder="${i("library.search")}" value="${u(t.filter)}" />
        </label>
      </div>

      ${e.length===0?`
        <div class="empty-state">
          <div class="empty-symbol">${o("studio")}</div>
          <h3>${t.sounds.length?i("library.noResults"):i("library.empty")}</h3>
          <p>${t.sounds.length?i("library.changeSearch"):i("library.emptyDescription")}</p>
          ${t.sounds.length?"":`<button class="button button-primary" id="empty-add-btn">${o("plus")} ${i("library.addFirst")}</button>`}
        </div>
      `:`
        <div class="sound-grid">
          ${e.map(yt).join("")}
        </div>
      `}
    </section>
  `}function q(e,a,s,r){return`
    <div class="channel-meter-row">
      <div class="channel-meter-label">
        <span>${e}</span>
        <strong class="${s}-meter-value">${h(a)}%</strong>
      </div>
      <div class="channel-meter"><i class="${s}-meter-fill" style="width:${h(a)}%"></i></div>
      <small>${r}</small>
    </div>
  `}function f(e,a,s,r,n,c,m,b=x){return`
    <div class="gain-control">
      <div class="gain-head">
        <div>
          <strong>${a}</strong>
          <span>${s}</span>
        </div>
        <output class="gain-output ${m}">${b(r)}</output>
      </div>
      <input class="range" id="${e}" type="range" min="0" max="${n}" step="${c}" value="${r}" />
    </div>
  `}function Se(e){const a=Number(e);return!Number.isFinite(a)||a<3e3?i("studio.heardJustNow"):a<6e4?i("studio.heardSeconds",{count:Math.max(1,Math.round(a/1e3))}):i("studio.heardMinutes",{count:Math.max(1,Math.round(a/6e4))})}function Ee(){const e=t.audioSessions.slice(0,12);return`
    <div class="broadcast-source-rack">
      <div class="source-rack-head">
        <div>
          <div class="panel-kicker">${i("studio.sourceRackKicker")}</div>
          <h3>${i("studio.sourceRackTitle")}</h3>
          <p>${i("studio.sourceRackDescription")}</p>
        </div>
        <span class="source-count">${e.length} ${i("studio.apps")}</span>
      </div>
      ${e.length?`
        <div class="audio-app-list">
          ${e.map(a=>{const s=Math.max(0,Math.min(1,Number(a.volume||0))),r=(a.name||"?").trim().slice(0,1).toUpperCase();return`
              <div class="audio-app-row ${a.active?"is-playing":""}" data-session-row="${a.id}">
                <div class="audio-app-identity">
                  <span class="audio-app-icon">
                    ${a.iconDataUrl?`<img src="${u(a.iconDataUrl)}" alt="" />`:`<span>${u(r)}</span>`}
                  </span>
                  <div>
                    <strong>${u(a.name)}</strong>
                    <small data-session-activity="${a.id}">${a.active?i("studio.playingNow"):Se(a.lastActiveMs)}</small>
                  </div>
                </div>
                <div class="app-signal" aria-hidden="true">
                  <i data-session-meter="${a.id}" style="width:${h(a.peakLevel01)}%"></i>
                </div>
                <div class="app-volume">
                  <span>${i("studio.volume")}</span>
                  <input
                    class="range app-volume-range"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value="${s}"
                    data-session-volume="${a.id}"
                    aria-label="${u(`${a.name} — ${i("studio.volume")}`)}"
                  />
                  <output data-session-volume-output="${a.id}">${Math.round(s*100)}%</output>
                </div>
              </div>
            `}).join("")}
        </div>
      `:`
        <div class="audio-app-empty">
          <span>${o("monitor")}</span>
          <div><strong>${i("studio.noAudioApps")}</strong><p>${i("studio.noAudioAppsHelp")}</p></div>
        </div>
      `}
    </div>
  `}function w(e,a,s,r=""){const n=!!t.voiceProcessing[e];return`
    <div class="processing-toggle-row">
      <div class="processing-toggle-copy">
        <strong>${a}</strong>
        <p>${s}</p>
        ${r?`<span>${r}</span>`:""}
      </div>
      <button
        class="toggle-switch ${n?"is-on":""}"
        data-voice-toggle="${e}"
        role="switch"
        aria-checked="${n}"
        aria-label="${u(a)}"
      ><i></i></button>
    </div>
  `}function I(e,a,s){const r=ke(a),n=Number(t.voiceProcessing.targetMinDb),c=Number(t.voiceProcessing.targetMaxDb),m=D(n),b=Math.max(2,D(c)-m);return`
    <div class="advanced-db-meter">
      <div class="advanced-db-head">
        <span>${e}</span>
        <strong class="${s}-db-value">${k(r)}</strong>
      </div>
      <div class="advanced-db-track">
        <i class="target-db-band" style="left:${m}%;width:${b}%"></i>
        <b class="${s}-db-fill" style="width:${D(r)}%"></b>
        <span class="db-zero-marker"></span>
      </div>
      <div class="db-scale"><span>−60</span><span>−36</span><span>−18</span><span>0 dBFS</span></div>
    </div>
  `}function kt(){const e=Number(t.voiceProcessing.targetMinDb),a=Number(t.voiceProcessing.targetMaxDb),s=(e+a)/2,r=Math.max(1,(a-e)/2);return`
    <div class="target-range-control">
      <div class="target-range-summary">
        <div>
          <span>${i("streamer.targetCenter")}</span>
          <strong class="target-center-value">${s.toFixed(1)} dBFS</strong>
        </div>
        <div>
          <span>${i("streamer.tolerance")}</span>
          <strong class="target-tolerance-value">±${r.toFixed(1)} dB</strong>
        </div>
        <div>
          <span>${i("streamer.activeRange")}</span>
          <strong class="target-range-value">${e.toFixed(1)}…${a.toFixed(1)} dBFS</strong>
        </div>
      </div>
      <label class="calibration-range">
        <span>${i("streamer.targetCenter")}</span>
        <input class="range" id="target-center-range" type="range" min="-30" max="-6" step="0.5" value="${s}" />
      </label>
      <label class="calibration-range">
        <span>${i("streamer.tolerance")}</span>
        <input class="range" id="target-tolerance-range" type="range" min="1" max="8" step="0.5" value="${r}" />
      </label>
    </div>
  `}function $t(){return`
    <div class="filter-settings-layout">
      <section class="surface filter-settings-card">
        <div class="surface-head">
          <div><div class="panel-kicker">VOICE DSP</div><h2>${i("filters.voiceCleanup")}</h2></div>
          <span class="status-pill is-good">48 kHz · 10 ms</span>
        </div>
        <p class="section-lead">${i("filters.voiceCleanupDescription")}</p>
        <div class="processing-toggle-list">
          ${w("aecEnabled",i("filters.aec"),i("filters.aecDescription"),"WebRTC AEC3")}
          ${w("rnnoiseEnabled",i("filters.rnnoise"),i("filters.rnnoiseDescription"),"RNNoise · BSD-3-Clause")}
          ${w("noiseGateEnabled",i("filters.gate"),i("filters.gateDescription"),"Soft gate")}
        </div>
      </section>
      <section class="surface filter-settings-card">
        <div class="surface-head">
          <div><div class="panel-kicker">DYNAMICS</div><h2>${i("filters.dynamics")}</h2></div>
          <span class="status-pill">${i("common.adaptive")}</span>
        </div>
        <div class="filter-range-stack">
          <label class="gain-control">
            <div class="gain-head"><div><strong>${i("filters.gateThreshold")}</strong><span>${i("filters.gateThresholdHelp")}</span></div><output class="gate-threshold-value">${k(t.voiceProcessing.gateThresholdDb)}</output></div>
            <input class="range" id="gate-threshold-range" type="range" min="-75" max="-30" step="1" value="${t.voiceProcessing.gateThresholdDb}" />
          </label>
          <label class="gain-control">
            <div class="gain-head"><div><strong>${i("filters.compressor")}</strong><span>${i("filters.compressorHelp")}</span></div><output class="compressor-ratio-value">${Number(t.voiceProcessing.compressorRatio).toFixed(1)}:1</output></div>
            <input class="range" id="compressor-ratio-range" type="range" min="1" max="8" step="0.5" value="${t.voiceProcessing.compressorRatio}" />
          </label>
          <label class="gain-control">
            <div class="gain-head"><div><strong>${i("filters.limiter")}</strong><span>${i("filters.limiterHelp")}</span></div><output class="limiter-ceiling-value">${k(t.voiceProcessing.limiterCeilingDb)}</output></div>
            <input class="range" id="limiter-ceiling-range" type="range" min="-6" max="-0.5" step="0.5" value="${t.voiceProcessing.limiterCeilingDb}" />
          </label>
        </div>
      </section>
      <section class="surface filter-settings-card filter-signal-flow">
        <div class="surface-head"><div><div class="panel-kicker">SIGNAL FLOW</div><h2>${i("filters.order")}</h2></div></div>
        <div class="signal-flow">
          <span>MIC</span><i>→</i><strong>AEC3</strong><i>→</i><strong>RNNoise</strong><i>→</i><strong>Gate</strong><i>→</i><strong>Leveler</strong><i>→</i><strong>Limiter</strong><i>→</i><span>STREAM BUS</span>
        </div>
        <p>${i("filters.orderDescription")}</p>
      </section>
    </div>
  `}function ue(){return`
    <div class="settings-tabs" role="tablist" aria-label="${i("settings.sections")}">
      <button class="${t.settingsSection==="general"?"is-active":""}" data-settings-section="general" role="tab" aria-selected="${t.settingsSection==="general"}">${i("settings.general")}</button>
      <button class="${t.settingsSection==="filters"?"is-active":""}" data-settings-section="filters" role="tab" aria-selected="${t.settingsSection==="filters"}">${i("settings.filters")}</button>
    </div>
  `}function At(){const e=t.systemAudioEnabled;return`
    ${T(i("streamer.kicker"),i("streamer.title"),i("streamer.description"),`<div class="latency-chip">${o("bolt")} DSP <strong>${L()}</strong></div>`)}

    <section class="surface streamer-console ${e?"is-live":""}">
      <div class="streamer-console-head">
        <div class="streamer-live-state">
          <span class="streamer-status-orb">${o(e?"stop":"streamer")}</span>
          <div>
            <div class="panel-kicker">${e?`<span class="live-beacon"></span> ${i("streamer.live")}`:i("streamer.ready")}</div>
            <h2>${i(e?"streamer.liveTitle":"streamer.readyTitle")}</h2>
            <p>${i(e?"streamer.liveDescription":"streamer.readyDescription")}</p>
          </div>
        </div>
        <button class="button ${e?"button-stop":"button-accent"}" id="streamer-broadcast-toggle">
          ${e?`${o("stop")} ${i("studio.stopBroadcast")}`:`${o("streamer")} ${i("studio.startBroadcast")}`}
        </button>
      </div>

      <div class="streamer-meter-grid">
        <article class="streamer-channel-card">
          <div class="streamer-channel-head"><span class="round-icon">${o("mic")}</span><div><small>VOICE BUS</small><h3>${i("streamer.microphone")}</h3></div><output class="microphone-applied-gain">${j(t.nativeAudio.microphoneAppliedGain)}</output></div>
          ${I(i("streamer.beforeFilters"),t.nativeAudio.microphoneInputLevel01,"microphone-input")}
          ${I(i("streamer.toObs"),t.nativeAudio.microphoneOutputLevel01,"microphone-output")}
          <div class="voice-confidence"><span>${i("streamer.voiceDetection")}</span><div><i class="voice-probability-fill" style="width:${h(t.nativeAudio.voiceProbability01)}%"></i></div><strong class="voice-probability-value">${h(t.nativeAudio.voiceProbability01)}%</strong></div>
        </article>
        <article class="streamer-channel-card">
          <div class="streamer-channel-head"><span class="round-icon">${o("monitor")}</span><div><small>DESKTOP BUS</small><h3>${i("streamer.systemAudio")}</h3></div><output class="system-applied-gain">${j(t.nativeAudio.systemAppliedGain)}</output></div>
          ${I(i("streamer.capturedCopy"),t.nativeAudio.systemInputLevel01,"system-input")}
          ${I(i("streamer.toObs"),t.nativeAudio.systemOutputLevel01,"system-output")}
          <div class="stream-route-note">${o("route")}<span>${i("streamer.systemRouteNote")}</span></div>
        </article>
      </div>
    </section>

    <div class="streamer-control-grid">
      <section class="surface streamer-target-card">
        <div class="surface-head">
          <div><div class="panel-kicker">SMART LEVEL MATCH</div><h2>${i("streamer.levelMatch")}</h2></div>
          <button class="toggle-switch ${t.voiceProcessing.autoLevelEnabled?"is-on":""}" data-voice-toggle="autoLevelEnabled" role="switch" aria-checked="${t.voiceProcessing.autoLevelEnabled}" aria-label="${i("streamer.levelMatch")}"><i></i></button>
        </div>
        <p class="section-lead">${i("streamer.levelMatchDescription")}</p>
        ${kt()}
        <div class="leveler-safety-note">${o("alert")}<span>${i("streamer.silenceSafety")}</span></div>
      </section>

      <section class="surface streamer-monitor-card">
        <div class="surface-head">
          <div><div class="panel-kicker">LIVE CALIBRATION</div><h2>${i("streamer.calibration")}</h2></div>
          <button class="toggle-switch ${t.voiceProcessing.voiceMonitorEnabled?"is-on":""}" data-voice-toggle="voiceMonitorEnabled" role="switch" aria-checked="${t.voiceProcessing.voiceMonitorEnabled}" aria-label="${i("streamer.monitoring")}"><i></i></button>
        </div>
        <div class="calibration-prompt">${o("mic")}<div><strong>${i("streamer.saySomething")}</strong><p>${i("streamer.saySomethingHelp")}</p></div></div>
        ${f("voice-monitor-gain-range",i("streamer.monitorLevel"),i("streamer.headphonesOnly"),t.voiceProcessing.voiceMonitorGain,2,.01,"voice-monitor-gain-value")}
        <div class="monitor-warning">${o("alert")} ${i("streamer.headphoneWarning")}</div>
      </section>

      <section class="surface streamer-filters-card">
        <div class="surface-head"><div><div class="panel-kicker">MIC PRE-PROCESSING</div><h2>${i("streamer.filters")}</h2></div><button class="button button-subtle" data-open-filter-settings>${i("streamer.tuneFilters")}</button></div>
        <div class="processing-toggle-list compact">
          ${w("aecEnabled",i("filters.aec"),i("filters.aecShort"),"AEC3")}
          ${w("rnnoiseEnabled",i("filters.rnnoise"),i("filters.rnnoiseShort"),"RNNoise")}
          ${w("noiseGateEnabled",i("filters.gate"),i("filters.gateShort"),"Soft gate")}
        </div>
      </section>

      <section class="surface streamer-gains-card">
        <div class="surface-head"><div><div class="panel-kicker">STREAM BUS</div><h2>${i("streamer.outputGains")}</h2></div><span class="status-pill ${e?"is-good":""}">${i(e?"common.online":"common.ready")}</span></div>
        ${f("streamer-microphone-gain-range",i("studio.microphone"),i("streamer.cableOnly"),t.microphoneGain,3,.01,"streamer-microphone-gain-value")}
        ${f("streamer-system-gain-range",i("streamer.systemAudio"),i("streamer.cableOnly"),t.systemAudioGain,2,.01,"streamer-system-gain-value")}
        ${I(i("streamer.masterOutput"),t.nativeAudio.mixedLevel01,"streamer-master")}
      </section>
    </div>

    <section class="surface streamer-sources">
      ${Ee()}
    </section>
  `}function St(){const e=t.systemAudioEnabled;return`
    ${T(i("studio.kicker"),i("studio.title"),i("studio.description"),`<div class="latency-chip">${o("bolt")} LOW LATENCY <strong>${L()}</strong></div>`)}

    <section class="broadcast-hero ${e?"is-broadcasting is-expanded":""}">
      <div class="broadcast-visual">
        <div class="broadcast-orbit orbit-one"></div>
        <div class="broadcast-orbit orbit-two"></div>
        <button class="broadcast-button" id="system-audio-toggle" aria-pressed="${e}">
          <span class="broadcast-core">${o(e?"stop":"studio")}</span>
        </button>
      </div>
      <div class="broadcast-copy">
        <div class="panel-kicker">${e?`<span class="live-beacon"></span> ${i("studio.live")}`:i("studio.systemAudio")}</div>
        <h2>${i(e?"studio.broadcastingTitle":"studio.broadcastTitle")}</h2>
        <p>${i(e?"studio.broadcastingDescription":"studio.broadcastDescription")}</p>
        <button class="button ${e?"button-stop":"button-accent"} broadcast-cta" id="system-audio-cta">
          ${e?`${o("stop")} ${i("studio.stopBroadcast")}`:`${o("studio")} ${i("studio.startBroadcast")}`}
        </button>
        <div class="broadcast-note">${o("alert")} ${i("studio.echoNote")}</div>
      </div>
      <div class="broadcast-level">
        <div class="metric-label">SYSTEM IN</div>
        <strong class="system-meter-value">${h(t.nativeAudio.systemLevel01)}%</strong>
        <div class="vertical-meter"><i class="system-meter-fill" style="height:${h(t.nativeAudio.systemLevel01)}%"></i></div>
      </div>
      ${e?Ee():""}
    </section>

    <section class="signal-route">
      <div class="route-node">
        <span class="route-icon">${o("monitor")}</span>
        <div><small>${i("studio.sources")}</small><strong>${i("studio.sourceApps")}</strong></div>
      </div>
      <div class="route-line ${e?"is-flowing":""}"><i></i>${o("arrow")}</div>
      <div class="route-node">
        <span class="route-icon">${o("studio")}</span>
        <div><small>${i("studio.mixer")}</small><strong>MicDeck Engine</strong></div>
      </div>
      <div class="route-line ${t.nativeAudio.ready?"is-flowing":""}"><i></i>${o("arrow")}</div>
      <div class="route-node">
        <span class="route-icon">${o("mic")}</span>
        <div><small>${i("studio.output")}</small><strong>${u(t.virtualAudio.microphoneName||t.microphoneNameInput)}</strong></div>
      </div>
    </section>

    <div class="studio-grid">
      <section class="surface mixer-surface">
        <div class="surface-head">
          <div><div class="panel-kicker">LIVE MIX</div><h2>${i("studio.mixerTitle")}</h2></div>
          <span class="status-pill ${t.nativeAudio.ready?"is-good":"is-warn"}">${t.nativeAudio.ready?i("studio.engineOnline"):i("studio.engineOffline")}</span>
        </div>
        <div class="mixer-channels">
          <div class="mixer-channel">
            <div class="channel-icon">${o("mic")}</div>
            ${f("microphone-gain-range",i("studio.microphone"),i("studio.yourVoice"),t.microphoneGain,3,.01,"microphone-gain-value")}
            ${q("MIC",t.nativeAudio.microphoneLevel01,"microphone",i("studio.physicalInput"))}
            <div class="mixer-filter-toggles">
              ${w("aecEnabled",i("filters.aec"),i("filters.aecShort"),"AEC3")}
              ${w("rnnoiseEnabled",i("filters.rnnoise"),i("filters.rnnoiseShort"),"RNNoise")}
            </div>
          </div>
          <div class="mixer-channel">
            <div class="channel-icon">${o("library")}</div>
            ${f("volume-range","Soundboard",i("studio.bindsFiles"),t.volume,6,.01,"sound-gain-value")}
            ${f("overdrive-range","Drive",i("studio.extraSaturation"),t.soundOverdrive,4,.05,"overdrive-value",fe)}
          </div>
          <div class="mixer-channel ${e?"is-hot":""}">
            <div class="channel-icon">${o("monitor")}</div>
            ${f("system-gain-range","System audio",i(e?"studio.transmissionActive":"studio.transmissionOff"),t.systemAudioGain,2,.01,"system-gain-value")}
            ${q("SYSTEM",t.nativeAudio.systemLevel01,"system","Loopback WASAPI")}
          </div>
          <div class="mixer-channel master-channel">
            <div class="channel-icon">${o("route")}</div>
            ${f("monitor-range",i("studio.bindMonitoring"),i(e?"studio.mutedDuringBroadcast":"studio.yourHeadphones"),t.monitorGain,2,.01,"monitor-gain-value")}
            ${q("MASTER",t.nativeAudio.mixedLevel01,"mixed",i("studio.virtualMicrophone"))}
          </div>
        </div>
      </section>

      <section class="surface input-surface">
        <div class="surface-head">
          <div><div class="panel-kicker">INPUT</div><h2>${i("studio.voiceSource")}</h2></div>
          <span class="round-icon">${o("mic")}</span>
        </div>
        <label class="field-label" for="physical-microphone">${i("studio.physicalMicrophone")}</label>
        <select id="physical-microphone" class="input" ${t.inputDevices.length?"":"disabled"}>
          ${t.inputDevices.length?t.inputDevices.map(a=>`<option value="${u(a.id)}" ${a.id===t.selectedInputDevice?"selected":""}>${u(a.name)}</option>`).join(""):`<option>${i("studio.noMicrophone")}</option>`}
        </select>
        <div class="engine-stats">
          <div><span>${i("studio.latency")}</span><strong>${L()}</strong></div>
          <div><span>XRUN</span><strong>${t.nativeAudio.underruns||0}</strong></div>
          <div><span>${i("studio.process")}</span><strong>${t.nativeAudio.enginePid||"—"}</strong></div>
          <div><span>${i("studio.format")}</span><strong>48 kHz / F32</strong></div>
        </div>
        <div class="input-actions">
          <button class="button button-subtle" id="stop-btn">${o("stop")} ${i("studio.stopBind")}</button>
          <button class="icon-button" id="restart-engine-btn" title="${i("studio.restartEngine")}" ${t.isRestartingEngine?"disabled":""}>${o("refresh")}</button>
        </div>
      </section>
    </div>
  `}function Et(){const e=t.virtualAudio.microphoneName||t.microphoneNameInput,a=t.virtualAudio.backend==="micDeckVad",s=a&&!t.virtualAudio.customDriverPackageReady,r=t.isInstallingDriver||s,n=t.virtualAudio.error||(t.virtualAudio.restartRequired?i("settings.driverInstalledRestart"):i(s?"settings.customPackageMissing":a?"settings.installCustomDriverHelp":"settings.installDriverHelp"));return t.settingsSection==="filters"?`
      ${T(i("settings.kicker"),i("settings.title"),i("settings.description"))}
      ${ue()}
      ${$t()}
    `:`
    ${T(i("settings.kicker"),i("settings.title"),i("settings.description"))}
    ${ue()}

    <div class="settings-grid">
      <section class="surface settings-card driver-card">
        <div class="surface-head">
          <div>
            <div class="panel-kicker">VIRTUAL DEVICE</div>
            <h2>${i("settings.virtualMicrophone")}</h2>
          </div>
          <span class="status-pill ${t.virtualAudio.ready?"is-good":"is-warn"}">${t.virtualAudio.ready?i("common.ready"):i("common.setup")}</span>
        </div>

        <div class="audio-backend-switch" role="group" aria-label="${i("settings.audioBackend")}">
          <button class="audio-backend-option ${t.virtualAudio.backend==="vbCable"?"is-active":""}" data-audio-backend="vbCable" ${t.isSwitchingAudioBackend?"disabled":""}>
            <strong>VB-CABLE</strong>
            <small>${i("settings.backendCompatibility")}</small>
          </button>
          <button class="audio-backend-option ${a?"is-active":""}" data-audio-backend="micDeckVad" ${t.isSwitchingAudioBackend?"disabled":""}>
            <strong>MicDeck VAD</strong>
            <small>${i("settings.backendCustom")}</small>
          </button>
        </div>

        <p class="helper-text backend-description">${i(a?"settings.customBackendDescription":"settings.vbBackendDescription")}</p>

        ${t.virtualAudio.ready?`
          <div class="device-route-card">
            <span class="round-icon">${o("route")}</span>
            <div>
              <small>${i("settings.mixOutput")} · ${u(t.virtualAudio.backendLabel||"")}</small>
              <strong>${u(t.virtualAudio.renderDeviceName||"Managed cable")}</strong>
            </div>
            ${o("check","route-check")}
          </div>
          <label class="field-label" for="microphone-name">${i("settings.systemName")}</label>
          <div class="inline-field">
            <input id="microphone-name" class="input" maxlength="80" value="${u(t.microphoneNameInput)}" />
            <button class="button button-primary" id="rename-microphone-btn" ${t.isRenamingMicrophone?"disabled":""}>
              ${t.isRenamingMicrophone?'<span class="spinner"></span>':i("common.save")}
            </button>
          </div>
          <p class="helper-text">${i("settings.systemNameHelp")}</p>
        `:`
          <div class="setup-callout">
            ${o("alert")}
            <div>
              <strong>${i("settings.deviceInactive")}</strong>
              <p>${u(n)}</p>
            </div>
          </div>
          <button class="button button-accent full-button" id="install-driver-btn" ${r?"disabled":""}>
            ${t.isInstallingDriver?`<span class="spinner"></span> ${i("common.installing")}`:`${o("download")} ${i(a?"settings.installCustomDriver":"settings.installDriver")}`}
          </button>
        `}

        ${a?`
          <div class="driver-architecture-card">
            <div class="driver-architecture-head">
              <strong>${i("settings.driverArchitecture")}</strong>
              <span>WaveRT · PortCls · 48 kHz F32</span>
            </div>
            <div class="driver-route-flow">
              <span>MicDeck C++ mixer</span><i>→</i><span>Driver Input</span><i>→</i><span>MicDeckVad.sys</span><i>→</i><span>Virtual Microphone</span>
            </div>
            <p>${i("settings.driverArchitectureDescription")}</p>
          </div>
        `:""}

        <div class="vendor-note">
          ${i("settings.deviceLayer")}: ${u(t.virtualAudio.vendor)}
          ${t.virtualAudio.vendorUrl?` · <a href="${u(t.virtualAudio.vendorUrl)}" target="_blank" rel="noreferrer">${t.virtualAudio.thirdParty?i("settings.donationware"):i("settings.driverSource")}</a>`:` · ${i("settings.driverSource")}`}
        </div>
      </section>

      <section class="surface settings-card engine-settings">
        <div class="surface-head">
          <div>
            <div class="panel-kicker">AUDIO CORE</div>
            <h2>${i("settings.nativeEngine")}</h2>
          </div>
          <span class="status-pill ${t.nativeAudio.ready?"is-good":"is-warn"}">${t.nativeAudio.ready?"ONLINE":t.nativeAudio.state.toUpperCase()}</span>
        </div>
        <div class="diagnostic-list">
          <div><span>Runtime</span><strong>${u(t.nativeAudio.runtime)}</strong></div>
          <div><span>${i("settings.protocol")}</span><strong>IPC v${t.nativeAudio.protocolVersion||"—"}</strong></div>
          <div><span>${i("settings.bufferMode")}</span><strong>Adaptive low-latency</strong></div>
          <div><span>${i("settings.estimatedLatency")}</span><strong>${L()}</strong></div>
          <div><span>XRUN / underrun</span><strong>${t.nativeAudio.underruns||0}</strong></div>
          <div><span>Capture overrun</span><strong>${t.nativeAudio.captureOverruns||0}</strong></div>
          <div><span>Dropped IPC frames</span><strong>${t.nativeAudio.droppedAudioFrames||0}</strong></div>
        </div>
        ${t.nativeAudio.error?`<div class="setup-callout compact">${o("alert")}<div><strong>${i("settings.engineError")}</strong><p>${u(t.nativeAudio.error)}</p></div></div>`:""}
        <button class="button button-subtle full-button" id="restart-engine-btn" ${t.isRestartingEngine?"disabled":""}>
          ${t.isRestartingEngine?`<span class="spinner"></span> ${i("common.restarting")}`:`${o("refresh")} ${i("settings.restartEngine")}`}
        </button>
      </section>

      <section class="surface settings-card windows-settings">
        <div class="surface-head">
          <div>
            <div class="panel-kicker">DESKTOP</div>
            <h2>${i("settings.windowsIntegration")}</h2>
          </div>
          <span class="status-pill ${t.autostartEnabled?"is-good":""}">${i(t.autostartEnabled?"common.on":"common.off")}</span>
        </div>
        <div class="preference-list">
          <div class="preference-row">
            <span class="round-icon">${o("power")}</span>
            <div>
              <strong>${i("settings.autostart")}</strong>
              <p>${i("settings.autostartDescription")}</p>
            </div>
            <button class="toggle-switch ${t.autostartEnabled?"is-on":""}" id="autostart-toggle" role="switch" aria-checked="${t.autostartEnabled}" aria-label="${i("settings.autostart")}" ${t.isUpdatingAutostart?"disabled":""}>
              <i></i>
            </button>
          </div>
          <div class="preference-row">
            <span class="round-icon">${o("tray")}</span>
            <div>
              <strong>${i("settings.tray")}</strong>
              <p>${i("settings.trayDescription")}</p>
            </div>
            <span class="always-on">${i("common.alwaysOn")}</span>
          </div>
          <div class="preference-row">
            <span class="round-icon glow-setting-icon">${o("sparkle")}</span>
            <div>
              <strong>${i("settings.cursorGlow")}</strong>
              <p>${i("settings.cursorGlowDescription")}</p>
            </div>
            <button class="toggle-switch ${t.cursorGlowEnabled?"is-on":""}" id="cursor-glow-toggle" role="switch" aria-checked="${t.cursorGlowEnabled}" aria-label="${i("settings.cursorGlow")}">
              <i></i>
            </button>
          </div>
          <div class="preference-row microphone-repair-row">
            <span class="round-icon">${o("mic")}</span>
            <div>
              <strong>${i("settings.repairMicrophone")}</strong>
              <p>${i("settings.repairMicrophoneDescription")}</p>
            </div>
            <button class="button button-subtle repair-microphone-button" id="repair-microphone-btn" ${t.isRepairingDefaultMicrophone?"disabled":""}>
              ${t.isRepairingDefaultMicrophone?'<span class="spinner"></span>':o("refresh")}
              ${i(t.isRepairingDefaultMicrophone?"settings.repairingMicrophone":"settings.repairMicrophoneAction")}
            </button>
          </div>
        </div>
      </section>

      <section class="surface settings-card guide-card">
        <div class="surface-head">
          <div>
            <div class="panel-kicker">VOICE APPS</div>
            <h2>${i("settings.discordTitle")}</h2>
          </div>
          <span class="round-icon discord-mark">D</span>
        </div>
        <ol class="setup-steps">
          <li><span>01</span><div><strong>${i("settings.discordOpen")}</strong><p>${i("settings.discordOpenHelp")}</p></div></li>
          <li><span>02</span><div><strong>${i("settings.discordInput")}</strong><p>${u(i("settings.discordInputHelp",{microphone:e}))}</p></div></li>
          <li><span>03</span><div><strong>${i("settings.discordProcessing")}</strong><p>${i("settings.discordProcessingHelp")}</p></div></li>
        </ol>
        <div class="guide-tip">${o("bolt")} ${i("settings.discordTip")}</div>
      </section>

      <section class="surface settings-card about-card">
        <div class="about-mark">${Z()}</div>
        <div class="panel-kicker">MICDECK</div>
        <h2>Trigger. Route. Be heard.</h2>
        <p>${i("settings.about")}</p>
        <div class="tech-tags"><span>Rust</span><span>C++</span><span>WASAPI</span><span>Tauri</span></div>
      </section>
    </div>
  `}function l(){const e=ut(),a=t.activeView==="studio"?St():t.activeView==="streamer"?At():t.activeView==="settings"?Et():wt();document.querySelector("#app").innerHTML=`
    <div class="app-shell ${t.cursorGlowEnabled?"glow-enabled":""}">
      <div class="ambient-canvas" aria-hidden="true">
        <div class="ambient-grid"></div>
        <div class="cursor-glow"></div>
      </div>
      ${pt()}
      <main class="app-content">
        ${mt()}
        ${e?`<div class="top-alert">${o("alert")}<span>${u(e)}</span><button class="nav-to-settings">${i("common.openSettings")}</button></div>`:""}
        <div class="view-wrap">${a}</div>
      </main>
      <div id="toast-host" class="toast-host"></div>
      ${ft()}
    </div>
  `,zt(),Y(),be=t.playback.isPlaying?t.playback.soundId:null}function zt(){document.querySelectorAll("[data-language]").forEach(a=>{a.addEventListener("click",()=>ct(a.dataset.language))}),document.querySelectorAll("[data-view]").forEach(a=>{a.addEventListener("click",()=>{t.activeView=a.dataset.view,l()})}),document.querySelector(".nav-to-settings")?.addEventListener("click",()=>{t.activeView="settings",l()}),document.getElementById("add-btn")?.addEventListener("click",oe),document.getElementById("empty-add-btn")?.addEventListener("click",oe),document.getElementById("url-btn")?.addEventListener("click",ce),document.querySelectorAll("#stop-btn").forEach(a=>a.addEventListener("click",et)),document.querySelectorAll("[data-audio-backend]").forEach(a=>{a.addEventListener("click",()=>at(a.dataset.audioBackend))}),document.getElementById("install-driver-btn")?.addEventListener("click",st),document.getElementById("rename-microphone-btn")?.addEventListener("click",de),document.getElementById("restart-engine-btn")?.addEventListener("click",rt),document.getElementById("repair-microphone-btn")?.addEventListener("click",nt),document.getElementById("system-audio-toggle")?.addEventListener("click",F),document.getElementById("system-audio-cta")?.addEventListener("click",F),document.getElementById("streamer-broadcast-toggle")?.addEventListener("click",F),document.getElementById("autostart-toggle")?.addEventListener("click",lt),document.getElementById("cursor-glow-toggle")?.addEventListener("click",Ke),document.getElementById("physical-microphone")?.addEventListener("change",a=>tt(a.target.value)),document.querySelectorAll("[data-settings-section]").forEach(a=>{a.addEventListener("click",()=>{t.settingsSection=a.dataset.settingsSection,l()})}),document.querySelectorAll("[data-open-filter-settings]").forEach(a=>{a.addEventListener("click",()=>{t.activeView="settings",t.settingsSection="filters",l()})}),document.querySelectorAll("[data-voice-toggle]").forEach(a=>{a.addEventListener("click",()=>{const s=a.dataset.voiceToggle;E({[s]:!t.voiceProcessing[s]},{rerender:!0,immediate:!0})})}),document.getElementById("microphone-gain-range")?.addEventListener("input",a=>S("set_microphone_gain","microphoneGain",a.target.value,".microphone-gain-value")),document.getElementById("streamer-microphone-gain-range")?.addEventListener("input",a=>S("set_microphone_gain","microphoneGain",a.target.value,".streamer-microphone-gain-value")),document.getElementById("volume-range")?.addEventListener("input",a=>it(a.target.value)),document.getElementById("overdrive-range")?.addEventListener("input",a=>S("set_sound_overdrive","soundOverdrive",a.target.value,".overdrive-value",fe)),document.getElementById("monitor-range")?.addEventListener("input",a=>S("set_monitor_gain","monitorGain",a.target.value,".monitor-gain-value")),document.getElementById("system-gain-range")?.addEventListener("input",a=>S("set_system_audio_gain","systemAudioGain",a.target.value,".system-gain-value")),document.getElementById("streamer-system-gain-range")?.addEventListener("input",a=>S("set_system_audio_gain","systemAudioGain",a.target.value,".streamer-system-gain-value")),document.getElementById("voice-monitor-gain-range")?.addEventListener("input",a=>{const s=Number(a.target.value);t.voiceProcessing.voiceMonitorGain=s;const r=document.querySelector(".voice-monitor-gain-value");r&&(r.textContent=x(s)),E({voiceMonitorGain:s})});const e=()=>{const a=Number(document.getElementById("target-center-range")?.value),s=Number(document.getElementById("target-tolerance-range")?.value);if(!Number.isFinite(a)||!Number.isFinite(s))return;const r=Math.max(-36,a-s),n=Math.min(-3,a+s);t.voiceProcessing.targetMinDb=r,t.voiceProcessing.targetMaxDb=n;const c=document.querySelector(".target-center-value"),m=document.querySelector(".target-tolerance-value"),b=document.querySelector(".target-range-value");c&&(c.textContent=`${a.toFixed(1)} dBFS`),m&&(m.textContent=`±${s.toFixed(1)} dB`),b&&(b.textContent=`${r.toFixed(1)}…${n.toFixed(1)} dBFS`),document.querySelectorAll(".target-db-band").forEach(N=>{const R=D(r);N.style.left=`${R}%`,N.style.width=`${Math.max(2,D(n)-R)}%`}),E({targetMinDb:r,targetMaxDb:n})};document.getElementById("target-center-range")?.addEventListener("input",e),document.getElementById("target-tolerance-range")?.addEventListener("input",e),document.getElementById("gate-threshold-range")?.addEventListener("input",a=>{const s=Number(a.target.value),r=document.querySelector(".gate-threshold-value");r&&(r.textContent=k(s)),E({gateThresholdDb:s})}),document.getElementById("compressor-ratio-range")?.addEventListener("input",a=>{const s=Number(a.target.value),r=document.querySelector(".compressor-ratio-value");r&&(r.textContent=`${s.toFixed(1)}:1`),E({compressorRatio:s})}),document.getElementById("limiter-ceiling-range")?.addEventListener("input",a=>{const s=Number(a.target.value),r=document.querySelector(".limiter-ceiling-value");r&&(r.textContent=k(s)),E({limiterCeilingDb:s})}),document.querySelectorAll("[data-session-volume]").forEach(a=>{a.addEventListener("input",s=>ot(s.currentTarget.dataset.sessionVolume,s.currentTarget.value))}),document.querySelectorAll("[data-platform]").forEach(a=>{a.addEventListener("click",()=>{t.mediaPlatform=a.dataset.platform,l(),document.getElementById("url-input")?.focus()})}),document.getElementById("url-input")?.addEventListener("input",a=>{t.urlInput=a.target.value;const s=document.querySelector(".detected-platform");s&&(s.textContent=W())}),document.getElementById("url-input")?.addEventListener("keydown",a=>{a.key==="Enter"&&ce()}),document.getElementById("search-input")?.addEventListener("input",a=>{t.filter=a.target.value,l();const s=document.getElementById("search-input");s?.focus(),s?.setSelectionRange(t.filter.length,t.filter.length)}),document.getElementById("microphone-name")?.addEventListener("input",a=>{t.microphoneNameInput=a.target.value,t.microphoneNameDirty=!0}),document.getElementById("microphone-name")?.addEventListener("keydown",a=>{a.key==="Enter"&&de()}),document.querySelectorAll(".play-btn").forEach(a=>{a.addEventListener("click",()=>Qe(a.dataset.id))}),document.querySelectorAll(".remove-btn").forEach(a=>{a.addEventListener("click",()=>Xe(a.dataset.id))}),document.querySelectorAll("[data-shortcut-id]").forEach(a=>{a.addEventListener("click",()=>He(a.dataset.shortcutId))}),document.querySelectorAll("[data-cancel-shortcut]").forEach(a=>{a.addEventListener("click",K)}),document.querySelector("[data-save-shortcut]")?.addEventListener("click",()=>{const a=Ge();a&&ne(a)}),document.querySelector("[data-clear-shortcut]")?.addEventListener("click",()=>ne(null)),document.querySelector("[data-close-shortcut]")?.addEventListener("click",a=>{a.target===a.currentTarget&&K()})}function Dt(){[["microphone",t.nativeAudio.microphoneLevel01],["system",t.nativeAudio.systemLevel01],["mixed",t.nativeAudio.mixedLevel01]].forEach(([r,n])=>{document.querySelectorAll(`.${r}-meter-fill`).forEach(c=>{c.closest(".vertical-meter")?c.style.height=`${h(n)}%`:c.style.width=`${h(n)}%`}),document.querySelectorAll(`.${r}-meter-value`).forEach(c=>{c.textContent=`${h(n)}%`})}),[["microphone-input",t.nativeAudio.microphoneInputLevel01],["microphone-output",t.nativeAudio.microphoneOutputLevel01],["system-input",t.nativeAudio.systemInputLevel01],["system-output",t.nativeAudio.systemOutputLevel01],["streamer-master",t.nativeAudio.mixedLevel01]].forEach(([r,n])=>{const c=ke(n);document.querySelectorAll(`.${r}-db-fill`).forEach(m=>{m.style.width=`${D(c)}%`}),document.querySelectorAll(`.${r}-db-value`).forEach(m=>{m.textContent=k(c)})});const s=h(t.nativeAudio.voiceProbability01);document.querySelectorAll(".voice-probability-fill").forEach(r=>{r.style.width=`${s}%`}),document.querySelectorAll(".voice-probability-value").forEach(r=>{r.textContent=`${s}%`}),document.querySelectorAll(".microphone-applied-gain").forEach(r=>{r.textContent=j(t.nativeAudio.microphoneAppliedGain)}),document.querySelectorAll(".system-applied-gain").forEach(r=>{r.textContent=j(t.nativeAudio.systemAppliedGain)})}function pe(e){return e.map(a=>`${a.id}:${a.name}:${a.iconDataUrl?1:0}`).join("|")}function Mt(){if(!["studio","streamer"].includes(t.activeView)||!t.systemAudioEnabled)return;const e=new Map([...document.querySelectorAll("[data-session-row]")].map(a=>[a.dataset.sessionRow,a]));t.audioSessions.forEach(a=>{const s=e.get(a.id);if(!s)return;s.classList.toggle("is-playing",!!a.active);const r=s.querySelector("[data-session-meter]");r&&(r.style.width=`${h(a.peakLevel01)}%`);const n=s.querySelector("[data-session-activity]");n&&(n.textContent=a.active?i("studio.playingNow"):Se(a.lastActiveMs));const c=s.querySelector("[data-session-volume]");c&&document.activeElement!==c&&!C.has(a.id)&&(c.value=String(Math.max(0,Math.min(1,Number(a.volume||0)))));const m=s.querySelector("[data-session-volume-output]");m&&!C.has(a.id)&&(m.textContent=`${Math.round(Math.max(0,Math.min(1,Number(a.volume||0)))*100)}%`)})}async function It(){try{const e=await d("list_audio_sessions"),a=pe(t.audioSessions)!==pe(e);t.audioSessions=e,a&&["studio","streamer"].includes(t.activeView)&&t.systemAudioEnabled?l():Mt()}catch{}}function Ct(){if(t.activeView!=="library")return;if((t.playback.isPlaying?t.playback.soundId:null)!==be){l();return}const a=document.querySelector(".now-title"),s=document.querySelector(".now-meta"),r=document.querySelector(".signal-db"),n=document.querySelector(".signal-fill"),c=document.querySelector(".now-progress .progress-fill"),m=document.querySelector(".sound-card.is-live .mini-fill");a&&(a.textContent=t.playback.isPlaying?t.playback.soundName||i("player.untitled"):i("player.silence")),s&&(s.textContent=t.playback.isPlaying?`${B(t.playback.positionMs)} / ${B(t.playback.durationMs)}`:i("player.pickSound")),r&&(r.textContent=k(t.playback.signalDbfs)),n&&(n.style.width=`${we(t.playback.signalDbfs)}%`),c&&(c.style.width=`${Math.round((t.playback.progress01||0)*100)}%`),m&&(m.style.width=`${Math.round((t.playback.progress01||0)*100)}%`)}async function Lt(){try{const e=`${t.nativeAudio.ready}:${t.nativeAudio.state}:${t.nativeAudio.error||""}`;[t.playback,t.nativeAudio]=await Promise.all([d("get_playback_status"),d("get_native_audio_status")]);const a=`${t.nativeAudio.ready}:${t.nativeAudio.state}:${t.nativeAudio.error||""}`;if(e!==a){l();return}Ct(),Dt()}catch{clearInterval(_),_=null}}function J(){_||(_=setInterval(Lt,180),ie||(ie=setInterval(It,700)))}window.addEventListener("keydown",Ye,!0);Ze();Je().catch(()=>{});y().then(async()=>{(await V())?.size&&l(),J()}).catch(e=>{document.querySelector("#app").innerHTML=`
      <div class="boot-error">
        ${Z()}
        <h1>${i("boot.title")}</h1>
        <p>${u(e)}</p>
      </div>
    `});
