(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))r(o);new MutationObserver(o=>{for(const l of o)if(l.type==="childList")for(const m of l.addedNodes)m.tagName==="LINK"&&m.rel==="modulepreload"&&r(m)}).observe(document,{childList:!0,subtree:!0});function s(o){const l={};return o.integrity&&(l.integrity=o.integrity),o.referrerPolicy&&(l.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?l.credentials="include":o.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function r(o){if(o.ep)return;o.ep=!0;const l=s(o);fetch(o.href,l)}})();function Ne(e,i=!1){return window.__TAURI_INTERNALS__.transformCallback(e,i)}async function c(e,i={},s){return window.__TAURI_INTERNALS__.invoke(e,i,s)}var X;(function(e){e.WINDOW_RESIZED="tauri://resize",e.WINDOW_MOVED="tauri://move",e.WINDOW_CLOSE_REQUESTED="tauri://close-requested",e.WINDOW_DESTROYED="tauri://destroyed",e.WINDOW_FOCUS="tauri://focus",e.WINDOW_BLUR="tauri://blur",e.WINDOW_SCALE_FACTOR_CHANGED="tauri://scale-change",e.WINDOW_THEME_CHANGED="tauri://theme-changed",e.WINDOW_CREATED="tauri://window-created",e.WEBVIEW_CREATED="tauri://webview-created",e.DRAG_ENTER="tauri://drag-enter",e.DRAG_OVER="tauri://drag-over",e.DRAG_DROP="tauri://drag-drop",e.DRAG_LEAVE="tauri://drag-leave"})(X||(X={}));async function Te(e,i){window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener(e,i),await c("plugin:event|unlisten",{event:e,eventId:i})}async function Q(e,i,s){var r;const o=(r=void 0)!==null&&r!==void 0?r:{kind:"Any"};return c("plugin:event|listen",{event:e,target:o,handler:Ne(i)}).then(l=>async()=>Te(e,l))}async function me(){return await c("plugin:autostart|is_enabled")}async function Le(){await c("plugin:autostart|enable")}async function Re(){await c("plugin:autostart|disable")}async function Ce(e={}){return typeof e=="object"&&Object.freeze(e),await c("plugin:dialog|open",{options:e})}function g(e,i,s,r){if(typeof i=="function"?e!==i||!r:!i.has(e))throw new TypeError("Cannot read private member from an object whose class did not declare it");return s==="m"?r:s==="a"?r.call(e):r?r.value:i.get(e)}function D(e,i,s,r,o){if(typeof i=="function"?e!==i||!0:!i.has(e))throw new TypeError("Cannot write private member to an object whose class did not declare it");return i.set(e,s),s}var $,v,A,O;const ee="__TAURI_TO_IPC_KEY__";function Oe(e,i=!1){return window.__TAURI_INTERNALS__.transformCallback(e,i)}class Pe{constructor(i){$.set(this,void 0),v.set(this,0),A.set(this,[]),O.set(this,void 0),D(this,$,i||(()=>{})),this.id=Oe(s=>{const r=s.index;if("end"in s){r==g(this,v,"f")?this.cleanupCallback():D(this,O,r);return}const o=s.message;if(r==g(this,v,"f")){for(g(this,$,"f").call(this,o),D(this,v,g(this,v,"f")+1);g(this,v,"f")in g(this,A,"f");){const l=g(this,A,"f")[g(this,v,"f")];g(this,$,"f").call(this,l),delete g(this,A,"f")[g(this,v,"f")],D(this,v,g(this,v,"f")+1)}g(this,v,"f")===g(this,O,"f")&&this.cleanupCallback()}else g(this,A,"f")[r]=o})}cleanupCallback(){window.__TAURI_INTERNALS__.unregisterCallback(this.id)}set onmessage(i){D(this,$,i)}get onmessage(){return g(this,$,"f")}[($=new WeakMap,v=new WeakMap,A=new WeakMap,O=new WeakMap,ee)](){return`__CHANNEL__:${this.id}`}toJSON(){return this[ee]()}}async function ge(e,i={},s){return window.__TAURI_INTERNALS__.invoke(e,i,s)}async function _e(e,i){const s=new Pe;return s.onmessage=i,await ge("plugin:global-shortcut|register",{shortcuts:Array.isArray(e)?e:[e],handler:s})}async function ve(){return await ge("plugin:global-shortcut|unregister_all",{})}const he="micdeck.language";function je(){try{const e=localStorage.getItem(he);if(e==="pl"||e==="en")return e}catch{}return navigator.language.toLowerCase().startsWith("pl")?"pl":"en"}const te={pl:{"common.adaptive":"adaptacyjne","common.save":"Zapisz","common.installing":"Instalowanie…","common.restarting":"Restartowanie…","common.ready":"GOTOWY","common.setup":"KONFIGURACJA","common.online":"ONLINE","common.on":"WŁ.","common.off":"WYŁ.","common.alwaysOn":"ZAWSZE AKTYWNY","common.openSettings":"Otwórz ustawienia","common.stop":"Zatrzymaj","common.remove":"Usuń","common.cancel":"Anuluj","language.label":"Język aplikacji","language.polish":"Polski","language.english":"English","toolbar.tray":"Aktywna w zasobniku Windows","toast.soundsAdded.one":"Dodano {count} dźwięk.","toast.soundsAdded.many":"Dodano {count} dźwięki.","toast.imported":"Audio z {source} jest gotowe w bibliotece.","toast.removed":"Dźwięk usunięty.","toast.playFailed":"Nie udało się odtworzyć dźwięku: {error}","toast.inputChanged":"Mikrofon wejściowy został zmieniony.","toast.engineRequired":"Najpierw uruchom silnik audio i skonfiguruj wirtualny mikrofon.","toast.systemOn":"Transmisja dźwięku systemowego jest aktywna.","toast.systemOff":"Transmisja dźwięku systemowego została wyłączona.","toast.driverFailed":"Instalacja sterownika nie powiodła się: {error}","toast.micRenamed":"Nazwa wirtualnego mikrofonu została zmieniona.","toast.engineRestarted":"Silnik audio został uruchomiony ponownie.","toast.microphoneRepaired":"Domyślny mikrofon Windows został przywrócony: {name}.","toast.autostartOn":"MicDeck uruchomi się z Windows i pozostanie schowany w zasobniku.","toast.autostartOff":"Autostart MicDeck został wyłączony.","toast.languageChanged":"Język aplikacji został zmieniony.","toast.shortcutSaved":"Globalny bind został zapisany.","toast.shortcutCleared":"Globalny bind został usunięty.","toast.shortcutUnavailable":"Ten skrót jest zajęty przez Windows lub inną aplikację. Wybierz inną kombinację.","toast.glowOn":"Cursor glow został włączony.","toast.glowOff":"Cursor glow został wyłączony.","confirm.remove":"Usunąć ten dźwięk z biblioteki?","alert.restartWindows":"Sterownik jest zainstalowany. Uruchom Windows ponownie, aby aktywować wirtualny mikrofon.","alert.driver":"Sterownik audio: {error}","alert.engine":"Silnik audio nie wystartował. Otwórz Ustawienia i uruchom go ponownie.","nav.aria":"Główna nawigacja","nav.workspace":"Workspace","nav.library":"Biblioteka","nav.studio":"Studio live","nav.streamer":"Streamer","nav.settings":"Ustawienia","nav.routeReady":"Trasa aktywna","nav.routeSetup":"Wymaga konfiguracji","nav.routeReadyDescription":"Miks trafia do wirtualnego mikrofonu.","nav.routeSetupDescription":"Sprawdź silnik i sterownik w Ustawieniach.","capture.source":"Źródło nagrania","player.nowPlaying":"TERAZ GRA","player.label":"ODTWARZACZ","player.untitled":"Bez nazwy","player.silence":"Cisza na decku","player.pickSound":"Wybierz dźwięk z biblioteki, aby rozpocząć.","player.signal":"Poziom sygnału","player.playing":"Odtwarzanie","player.play":"Odtwórz","sound.downloaded":"Pobrane","sound.local":"Plik lokalny","shortcut.label":"GLOBALNY BIND","shortcut.assign":"Ustaw bind","shortcut.clickToEdit":"Kliknij, aby ustawić lub zmienić globalny bind","shortcut.unavailable":"Bind jest obecnie zajęty przez Windows lub inną aplikację","shortcut.title":"Nagraj kombinację","shortcut.waiting":"Wciśnij klawisze","shortcut.pressFirst":"Wciśnij modyfikator, np. Alt, Ctrl lub Shift — albo od razu klawisz aktywacji.","shortcut.pressTrigger":"Modyfikator zapisany. Teraz wciśnij klawisz aktywacji, np. P.","shortcut.ready":"Kombinacja jest gotowa. Zapisz ją albo wciśnij inny klawisz, aby go podmienić.","shortcut.undo":"cofnij klawisz","shortcut.clear":"Usuń bind","shortcut.unsupported":"Ten klawisz nie może być użyty jako globalny bind.","worker.captureTitle":"Quick Capture pracuje w tle","worker.filesTitle":"Biblioteka pracuje w tle","worker.thread":"UI POZOSTAJE PŁYNNE","worker.queued":"Zadanie czeka na worker","worker.validating":"Sprawdzam link i źródło","worker.downloading":"Pobieram najlepszą ścieżkę audio","worker.analyzing":"Analizuję plik i przygotowuję waveform","worker.finalizing":"Odświeżam bibliotekę","worker.complete":"Gotowe","worker.failed":"Worker zatrzymał zadanie z błędem","library.kicker":"Sound library","library.title":"Twoje dźwięki","library.description":"Importuj, organizuj i odpalaj materiały bez wychodzenia z jednego widoku.","library.addFiles":"Dodaj pliki","library.captureTitle":"Pobierz audio z linku","library.captureDescription":"Wklej YouTube, Shorts lub TikTok. MicDeck pobierze najlepszą ścieżkę audio i doda ją do biblioteki.","library.downloading":"Pobieram","library.download":"Pobierz","library.requirements":"Wymaga yt-dlp + ffmpeg w PATH","library.rightsNotice":"Pobieraj i udostępniaj tylko materiały, do których masz prawa.","library.sectionTitle":"Biblioteka","library.item.one":"element","library.item.many":"elementów","library.search":"Szukaj dźwięku…","library.noResults":"Brak pasujących wyników","library.empty":"Twój deck czeka na pierwszy dźwięk","library.changeSearch":"Zmień wyszukiwaną frazę.","library.emptyDescription":"Dodaj plik lokalny albo pobierz audio z obsługiwanego linku.","library.addFirst":"Dodaj pierwszy plik","studio.kicker":"Live routing","studio.title":"Studio","studio.description":"Steruj miksem, poziomami i transmisją dźwięku systemowego w czasie rzeczywistym.","studio.live":"TRANSMISJA AKTYWNA","studio.systemAudio":"SYSTEM AUDIO","studio.broadcastingTitle":"Dźwięk pulpitu leci na Discorda","studio.broadcastTitle":"Udostępnij to, co słyszysz","studio.broadcastingDescription":"YouTube, Spotify, gry i pozostałe aplikacje są domieszane do wirtualnego mikrofonu.","studio.broadcastDescription":"Jednym przyciskiem przechwyć domyślne wyjście Windows i skieruj je do rozmowy głosowej.","studio.stopBroadcast":"Zatrzymaj transmisję","studio.startBroadcast":"Włącz transmisję","studio.echoNote":"Podsłuch bindów jest automatycznie wyciszany podczas transmisji, aby uniknąć echa.","studio.sources":"ŹRÓDŁA","studio.sourceApps":"Spotify / YouTube / gry","studio.mixer":"MIKSER","studio.output":"WYJŚCIE","studio.mixerTitle":"Mikser","studio.engineOnline":"ENGINE ONLINE","studio.engineOffline":"ENGINE OFFLINE","studio.microphone":"Mikrofon","studio.yourVoice":"Twój głos","studio.physicalInput":"Wejście fizyczne","studio.bindsFiles":"Bindy i pliki","studio.extraSaturation":"Dodatkowe nasycenie","studio.transmissionActive":"Transmisja aktywna","studio.transmissionOff":"Transmisja wyłączona","studio.bindMonitoring":"Podsłuch bindów","studio.mutedDuringBroadcast":"Wyciszony podczas transmisji","studio.yourHeadphones":"Twoje słuchawki","studio.virtualMicrophone":"Wirtualny mikrofon","studio.voiceSource":"Źródło głosu","studio.physicalMicrophone":"Fizyczny mikrofon","studio.noMicrophone":"Nie znaleziono mikrofonu","studio.latency":"Opóźnienie","studio.process":"Proces","studio.format":"Format","studio.stopBind":"Zatrzymaj bind","studio.restartEngine":"Restart silnika","studio.sourceRackKicker":"APLIKACJE AUDIO","studio.sourceRackTitle":"Źródła transmisji","studio.sourceRackDescription":"Poziomy poniżej sterują wyłącznie kopią wysyłaną na wirtualny kabel. Nie zmieniają głośności aplikacji w Windows.","studio.apps":"aplikacji","studio.playingNow":"TERAZ ODTWARZA","studio.heardJustNow":"Słychać przed chwilą","studio.heardSeconds":"Słychać {count} s temu","studio.heardMinutes":"Słychać {count} min temu","studio.volume":"POZIOM NA KABLU","studio.noAudioApps":"Jeszcze nie wykryto dźwięku z aplikacji","studio.noAudioAppsHelp":"Uruchom muzykę, film lub grę. Źródło pojawi się automatycznie i pozostanie w historii.","streamer.kicker":"Broadcast control","streamer.title":"Konsola streamera","streamer.description":"Wyrównuj głos i dźwięk pulpitu do jednego bezpiecznego zakresu, zanim miks trafi do OBS.","streamer.live":"TRANSMISJA AKTYWNA","streamer.ready":"GOTOWY DO TRANSMISJI","streamer.liveTitle":"Inteligentny miks trafia do OBS","streamer.readyTitle":"Ustaw docelowy poziom i rozpocznij","streamer.liveDescription":"Głos oraz kopia dźwięku systemowego są obrabiane niezależnie i łączone dopiero na magistrali streamu.","streamer.readyDescription":"Silnik analizuje krótkie okna sygnału bez zatrzymywania interfejsu i zachowuje ustawienia między sesjami.","streamer.microphone":"Głos streamera","streamer.systemAudio":"Dźwięk systemowy","streamer.beforeFilters":"Wejście przed filtrami","streamer.toObs":"Po obróbce · do OBS","streamer.voiceDetection":"Pewność wykrycia mowy","streamer.capturedCopy":"Kopia z WASAPI","streamer.systemRouteNote":"Przetwarzana jest kopia na magistralę streamu — odsłuch i suwaki Windows pozostają bez zmian.","streamer.targetCenter":"Poziom docelowy","streamer.tolerance":"Tolerancja","streamer.activeRange":"Aktywny zakres","streamer.levelMatch":"Adaptacyjne wyrównanie poziomu","streamer.levelMatchDescription":"Ciche wypowiedzi i materiały są łagodnie wzmacniane, a krzyki oraz głośne filmy redukowane do ustawionego zakresu.","streamer.silenceSafety":"Bramka mowy i ograniczenie maksymalnego wzmocnienia zapobiegają podnoszeniu ciszy oraz szumu tła.","streamer.calibration":"Kalibracja na żywo","streamer.monitoring":"Podsłuch kalibracyjny","streamer.saySomething":"Powiedz kilka zdań normalnym głosem","streamer.saySomethingHelp":"Mów cicho, normalnie i głośno. Mierniki pokażą rzeczywisty poziom przed i po obróbce.","streamer.monitorLevel":"Głośność podsłuchu","streamer.headphonesOnly":"Tylko lokalne słuchawki","streamer.headphoneWarning":"Używaj słuchawek — odsłuch przez głośniki może pogorszyć redukcję echa.","streamer.filters":"Filtry mikrofonu","streamer.tuneFilters":"Dostrój","streamer.outputGains":"Wzmocnienia wyjściowe","streamer.cableOnly":"Tylko miks na wirtualny kabel","streamer.masterOutput":"Suma wysyłana do OBS","filters.voiceCleanup":"Oczyszczanie głosu","filters.voiceCleanupDescription":"Filtry pracują na mikrofonie przed automatycznym wyrównaniem poziomu. Zmiany są przełączane płynnie, bez restartu silnika.","filters.aec":"Redukcja echa","filters.aecDescription":"WebRTC AEC3 używa dźwięku systemowego jako sygnału referencyjnego i usuwa jego powrót z mikrofonu.","filters.aecShort":"Usuwa z mikrofonu echo materiału odtwarzanego na komputerze.","filters.rnnoise":"Redukcja szumu","filters.rnnoiseDescription":"RNNoise tłumi stały szum komputera, wentylatory i tło, zachowując naturalne brzmienie mowy.","filters.rnnoiseShort":"Tłumi wentylatory, szum elektryczny i stałe tło.","filters.gate":"Inteligentna bramka","filters.gateDescription":"Miękka bramka wycisza samo tło, ale nie odcina cichych końcówek słów.","filters.gateShort":"Chroni ciszę bez agresywnego obcinania słów.","filters.dynamics":"Dynamika i zabezpieczenia","filters.gateThreshold":"Próg bramki","filters.gateThresholdHelp":"Sygnał tła poniżej tego poziomu jest łagodnie ściszany.","filters.compressor":"Kompresor głosu","filters.compressorHelp":"Kontroluje różnicę między szeptem, zwykłą mową i krzykiem.","filters.limiter":"Sufit limitera","filters.limiterHelp":"Twarde zabezpieczenie ostatniego stopnia przed przesterowaniem.","filters.order":"Kolejność przetwarzania","filters.orderDescription":"Redukcja echa i szumu działa przed bramką, wyrównaniem głośności i limiterem, dlatego automatyka nie wzmacnia niepotrzebnego tła.","settings.kicker":"Configuration","settings.title":"Ustawienia","settings.description":"Zarządzaj wirtualnym mikrofonem, silnikiem i integracją z aplikacjami głosowymi.","settings.sections":"Sekcje ustawień","settings.general":"Ogólne","settings.filters":"Filtry audio","settings.virtualMicrophone":"Wirtualny mikrofon","settings.mixOutput":"WYJŚCIE MIKSU","settings.systemName":"Nazwa widoczna w systemie","settings.systemNameHelp":"Ta nazwa pojawi się w Discordzie, grach i OBS. Zmiana może wywołać monit UAC.","settings.deviceInactive":"Wirtualne urządzenie nie jest aktywne","settings.driverInstalledRestart":"Sterownik jest zainstalowany — uruchom Windows ponownie.","settings.installDriverHelp":"Zainstaluj podpisany sterownik VB-CABLE, aby uruchomić routing.","settings.installDriver":"Zainstaluj sterownik","settings.deviceLayer":"Warstwa urządzenia","settings.donationware":"licencja donationware","settings.nativeEngine":"Silnik natywny","settings.protocol":"Protokół","settings.bufferMode":"Tryb bufora","settings.estimatedLatency":"Szacowane opóźnienie","settings.engineError":"Błąd silnika","settings.restartEngine":"Uruchom ponownie silnik","settings.windowsIntegration":"Integracja z Windows","settings.autostart":"Uruchamiaj przy logowaniu","settings.autostartDescription":"MicDeck wystartuje w tle i od razu będzie dostępny w zasobniku systemowym.","settings.tray":"Zasobnik systemowy","settings.trayDescription":"Zamknięcie okna ukrywa aplikację. Aby ją wyłączyć, użyj menu ikony obok zegara.","settings.cursorGlow":"Cursor glow","settings.cursorGlowDescription":"Subtelny, organiczny rozbłysk podąża za kursorem i przenika przez półprzezroczyste panele. Domyślnie włączony.","settings.repairMicrophone":"Napraw domyślny mikrofon","settings.repairMicrophoneDescription":"Przywróć wybrany fizyczny mikrofon we wszystkich rolach Windows po awarii lub wymuszonym zamknięciu.","settings.repairMicrophoneAction":"Napraw","settings.repairingMicrophone":"Naprawianie…","settings.discordTitle":"Discord w 60 sekund","settings.discordOpen":"Otwórz Głos i wideo","settings.discordOpenHelp":"Discord → Ustawienia użytkownika → Głos i wideo.","settings.discordInput":"Wybierz wejście","settings.discordInputHelp":"Ustaw Default albo {microphone}.","settings.discordProcessing":"Wyłącz obróbkę głosu","settings.discordProcessingHelp":"Krisp, redukcja echa i automatyczna regulacja potrafią wycinać bindy.","settings.discordTip":"Fizyczny mikrofon wybierasz w MicDeck. Discord powinien słuchać wirtualnego miksu.","settings.about":"Natywny soundboard i mikser systemowy dla Windows, zbudowany na Rust, C++ i WASAPI.","boot.title":"MicDeck nie może wystartować"},en:{"common.adaptive":"adaptive","common.save":"Save","common.installing":"Installing…","common.restarting":"Restarting…","common.ready":"READY","common.setup":"SETUP","common.online":"ONLINE","common.on":"ON","common.off":"OFF","common.alwaysOn":"ALWAYS ON","common.openSettings":"Open Settings","common.stop":"Stop","common.remove":"Remove","common.cancel":"Cancel","language.label":"App language","language.polish":"Polski","language.english":"English","toolbar.tray":"Running in the Windows tray","toast.soundsAdded.one":"Added {count} sound.","toast.soundsAdded.many":"Added {count} sounds.","toast.imported":"{source} audio is ready in your library.","toast.removed":"Sound removed.","toast.playFailed":"Could not play the sound: {error}","toast.inputChanged":"Input microphone changed.","toast.engineRequired":"Start the audio engine and configure the virtual microphone first.","toast.systemOn":"System-audio broadcast is live.","toast.systemOff":"System-audio broadcast is off.","toast.driverFailed":"Driver installation failed: {error}","toast.micRenamed":"Virtual microphone renamed.","toast.engineRestarted":"Audio engine restarted.","toast.microphoneRepaired":"The Windows default microphone was restored: {name}.","toast.autostartOn":"MicDeck will start with Windows and stay in the system tray.","toast.autostartOff":"MicDeck autostart is disabled.","toast.languageChanged":"App language changed.","toast.shortcutSaved":"Global hotkey saved.","toast.shortcutCleared":"Global hotkey removed.","toast.shortcutUnavailable":"Windows or another app already owns this shortcut. Choose another combination.","toast.glowOn":"Cursor glow enabled.","toast.glowOff":"Cursor glow disabled.","confirm.remove":"Remove this sound from the library?","alert.restartWindows":"The driver is installed. Restart Windows to activate the virtual microphone.","alert.driver":"Audio driver: {error}","alert.engine":"The audio engine did not start. Open Settings and restart it.","nav.aria":"Main navigation","nav.workspace":"Workspace","nav.library":"Library","nav.studio":"Live Studio","nav.streamer":"Streamer","nav.settings":"Settings","nav.routeReady":"Route active","nav.routeSetup":"Setup required","nav.routeReadyDescription":"The mix is reaching your virtual microphone.","nav.routeSetupDescription":"Check the engine and driver in Settings.","capture.source":"Capture source","player.nowPlaying":"NOW PLAYING","player.label":"PLAYER","player.untitled":"Untitled","player.silence":"Nothing on the deck","player.pickSound":"Pick a library sound to get started.","player.signal":"Signal level","player.playing":"Playing","player.play":"Play","sound.downloaded":"Downloaded","sound.local":"Local file","shortcut.label":"GLOBAL HOTKEY","shortcut.assign":"Set hotkey","shortcut.clickToEdit":"Click to set or edit the global hotkey","shortcut.unavailable":"Windows or another application currently owns this hotkey","shortcut.title":"Record a combination","shortcut.waiting":"Press your keys","shortcut.pressFirst":"Press a modifier such as Alt, Ctrl, or Shift — or press the trigger key directly.","shortcut.pressTrigger":"Modifier captured. Now press the trigger key, for example P.","shortcut.ready":"Your combination is ready. Save it or press another trigger key to replace it.","shortcut.undo":"undo key","shortcut.clear":"Clear hotkey","shortcut.unsupported":"That key cannot be used as a global hotkey.","worker.captureTitle":"Quick Capture is working","worker.filesTitle":"Library worker is active","worker.thread":"UI STAYS RESPONSIVE","worker.queued":"Waiting for the background worker","worker.validating":"Validating the link and source","worker.downloading":"Downloading the best audio track","worker.analyzing":"Analyzing audio and preparing the waveform","worker.finalizing":"Refreshing your library","worker.complete":"Complete","worker.failed":"The worker stopped with an error","library.kicker":"Sound library","library.title":"Your sounds","library.description":"Import, organize, and trigger everything from one focused workspace.","library.addFiles":"Add files","library.captureTitle":"Capture audio from a link","library.captureDescription":"Paste YouTube, Shorts, or TikTok. MicDeck grabs the best audio track and adds it to your library.","library.downloading":"Capturing","library.download":"Capture","library.requirements":"Requires yt-dlp + ffmpeg in PATH","library.rightsNotice":"Only download and broadcast media you are allowed to use.","library.sectionTitle":"Library","library.item.one":"item","library.item.many":"items","library.search":"Search sounds…","library.noResults":"No matching results","library.empty":"Your deck is ready for its first sound","library.changeSearch":"Try a different search.","library.emptyDescription":"Add a local file or capture audio from a supported link.","library.addFirst":"Add your first file","studio.kicker":"Live routing","studio.title":"Studio","studio.description":"Control your mix, levels, and system-audio broadcast in real time.","studio.live":"BROADCAST LIVE","studio.systemAudio":"SYSTEM AUDIO","studio.broadcastingTitle":"Your desktop audio is live","studio.broadcastTitle":"Share what you hear","studio.broadcastingDescription":"YouTube, Spotify, games, and other apps are mixed into the virtual microphone.","studio.broadcastDescription":"Capture the default Windows output and route it into voice chat with one button.","studio.stopBroadcast":"Stop broadcast","studio.startBroadcast":"Start broadcast","studio.echoNote":"Sound-pad monitoring is muted automatically during a broadcast to prevent echo.","studio.sources":"SOURCES","studio.sourceApps":"Spotify / YouTube / games","studio.mixer":"MIXER","studio.output":"OUTPUT","studio.mixerTitle":"Mixer","studio.engineOnline":"ENGINE ONLINE","studio.engineOffline":"ENGINE OFFLINE","studio.microphone":"Microphone","studio.yourVoice":"Your voice","studio.physicalInput":"Physical input","studio.bindsFiles":"Pads and files","studio.extraSaturation":"Extra saturation","studio.transmissionActive":"Broadcast live","studio.transmissionOff":"Broadcast off","studio.bindMonitoring":"Pad monitoring","studio.mutedDuringBroadcast":"Muted while broadcasting","studio.yourHeadphones":"Your headphones","studio.virtualMicrophone":"Virtual microphone","studio.voiceSource":"Voice source","studio.physicalMicrophone":"Physical microphone","studio.noMicrophone":"No microphone found","studio.latency":"Latency","studio.process":"Process","studio.format":"Format","studio.stopBind":"Stop sound","studio.restartEngine":"Restart engine","studio.sourceRackKicker":"AUDIO APPLICATIONS","studio.sourceRackTitle":"Broadcast sources","studio.sourceRackDescription":"The levels below affect only the copy sent to the virtual cable. They never change app volume in Windows.","studio.apps":"apps","studio.playingNow":"PLAYING NOW","studio.heardJustNow":"Heard just now","studio.heardSeconds":"Heard {count}s ago","studio.heardMinutes":"Heard {count}m ago","studio.volume":"CABLE LEVEL","studio.noAudioApps":"No application audio detected yet","studio.noAudioAppsHelp":"Start music, a video, or a game. The source appears automatically and stays in history.","streamer.kicker":"Broadcast control","streamer.title":"Streamer console","streamer.description":"Match voice and desktop audio to one safe target range before the mix reaches OBS.","streamer.live":"BROADCAST LIVE","streamer.ready":"READY TO BROADCAST","streamer.liveTitle":"The smart mix is feeding OBS","streamer.readyTitle":"Set your target and go live","streamer.liveDescription":"Voice and captured desktop audio are processed independently, then combined only on the stream bus.","streamer.readyDescription":"The engine analyzes short signal windows without blocking the interface and persists settings between sessions.","streamer.microphone":"Streamer voice","streamer.systemAudio":"System audio","streamer.beforeFilters":"Input before filters","streamer.toObs":"Processed · to OBS","streamer.voiceDetection":"Voice detection confidence","streamer.capturedCopy":"WASAPI capture copy","streamer.systemRouteNote":"Only the stream-bus copy is processed — Windows listening levels and sliders remain unchanged.","streamer.targetCenter":"Target level","streamer.tolerance":"Tolerance","streamer.activeRange":"Active range","streamer.levelMatch":"Adaptive level matching","streamer.levelMatchDescription":"Quiet speech and media are raised smoothly, while shouts and loud videos are reduced into your selected range.","streamer.silenceSafety":"Voice gating and a maximum-gain guard prevent silence and room noise from being lifted.","streamer.calibration":"Live calibration","streamer.monitoring":"Calibration monitoring","streamer.saySomething":"Say a few sentences in your normal voice","streamer.saySomethingHelp":"Speak quietly, normally, and loudly. The meters show the real signal before and after processing.","streamer.monitorLevel":"Monitor volume","streamer.headphonesOnly":"Local headphones only","streamer.headphoneWarning":"Use headphones — loudspeaker monitoring can reduce echo-canceller performance.","streamer.filters":"Microphone filters","streamer.tuneFilters":"Tune","streamer.outputGains":"Output gains","streamer.cableOnly":"Virtual-cable mix only","streamer.masterOutput":"Master signal sent to OBS","filters.voiceCleanup":"Voice cleanup","filters.voiceCleanupDescription":"Filters run on the microphone before adaptive level matching. Changes crossfade smoothly without restarting the engine.","filters.aec":"Echo cancellation","filters.aecDescription":"WebRTC AEC3 uses desktop audio as its reference signal and removes that audio returning through the microphone.","filters.aecShort":"Removes echo from media playing on the computer.","filters.rnnoise":"Noise suppression","filters.rnnoiseDescription":"RNNoise suppresses computer hum, fans, and steady background noise while preserving natural speech.","filters.rnnoiseShort":"Suppresses fans, electrical noise, and steady room ambience.","filters.gate":"Smart noise gate","filters.gateDescription":"A soft gate lowers background-only sections without cutting quiet word endings.","filters.gateShort":"Protects silence without aggressively chopping words.","filters.dynamics":"Dynamics and safety","filters.gateThreshold":"Gate threshold","filters.gateThresholdHelp":"Background below this level is attenuated smoothly.","filters.compressor":"Voice compressor","filters.compressorHelp":"Controls the gap between whispers, regular speech, and shouts.","filters.limiter":"Limiter ceiling","filters.limiterHelp":"The final hard safety ceiling that prevents clipping.","filters.order":"Processing order","filters.orderDescription":"Echo and noise reduction run before gating, leveling, and limiting, so the adaptive stage does not amplify unwanted background.","settings.kicker":"Configuration","settings.title":"Settings","settings.description":"Manage the virtual microphone, audio engine, and voice-app integration.","settings.sections":"Settings sections","settings.general":"General","settings.filters":"Audio filters","settings.virtualMicrophone":"Virtual microphone","settings.mixOutput":"MIX OUTPUT","settings.systemName":"System display name","settings.systemNameHelp":"This name appears in Discord, games, and OBS. Changing it may trigger a UAC prompt.","settings.deviceInactive":"The virtual device is not active","settings.driverInstalledRestart":"The driver is installed — restart Windows to finish.","settings.installDriverHelp":"Install the signed VB-CABLE driver to enable routing.","settings.installDriver":"Install driver","settings.deviceLayer":"Device layer","settings.donationware":"donationware license","settings.nativeEngine":"Native engine","settings.protocol":"Protocol","settings.bufferMode":"Buffer mode","settings.estimatedLatency":"Estimated latency","settings.engineError":"Engine error","settings.restartEngine":"Restart audio engine","settings.windowsIntegration":"Windows integration","settings.autostart":"Launch at sign-in","settings.autostartDescription":"MicDeck starts in the background and is immediately available from the system tray.","settings.tray":"System tray","settings.trayDescription":"Closing the window hides the app. Use the icon next to the clock when you want to quit.","settings.cursorGlow":"Cursor glow","settings.cursorGlowDescription":"A subtle organic glow follows the pointer beneath the translucent panels. Enabled by default.","settings.repairMicrophone":"Repair default microphone","settings.repairMicrophoneDescription":"Restore the selected physical microphone for every Windows role after a crash or forced shutdown.","settings.repairMicrophoneAction":"Repair","settings.repairingMicrophone":"Repairing…","settings.discordTitle":"Discord in 60 seconds","settings.discordOpen":"Open Voice & Video","settings.discordOpenHelp":"Discord → User Settings → Voice & Video.","settings.discordInput":"Choose the input","settings.discordInputHelp":"Select Default or {microphone}.","settings.discordProcessing":"Disable voice processing","settings.discordProcessingHelp":"Krisp, echo cancellation, and automatic gain control can cut out sound pads.","settings.discordTip":"Choose your physical microphone in MicDeck. Discord should listen to the virtual mix.","settings.about":"A native Windows soundboard and system mixer built with Rust, C++, and WASAPI.","boot.title":"MicDeck could not start"}};function xe(e,i,s={}){let r=te[e]?.[i]??te.en[i]??i;return Object.entries(s).forEach(([o,l])=>{r=r.replaceAll(`{${o}}`,String(l))}),r}const ye="micdeck.cursorGlow.v2";function Be(e,i=!1){try{const s=localStorage.getItem(e);return s===null?i:s==="true"}catch{return i}}const t={activeView:"library",settingsSection:"general",language:je(),autostartEnabled:!1,isUpdatingAutostart:!1,cursorGlowEnabled:Be(ye,!0),sounds:[],inputDevices:[],selectedInputDevice:null,microphoneGain:1,volume:1,soundOverdrive:1,monitorGain:0,systemAudioEnabled:!1,systemAudioGain:.85,voiceProcessing:{aecEnabled:!1,rnnoiseEnabled:!1,autoLevelEnabled:!1,targetMinDb:-19,targetMaxDb:-13,voiceMonitorEnabled:!1,voiceMonitorGain:.25,noiseGateEnabled:!1,gateThresholdDb:-55,compressorRatio:3,limiterCeilingDb:-1},audioSessions:[],nativeAudio:{available:!1,ready:!1,state:"starting",protocolVersion:0,enginePid:0,microphoneLevel01:0,systemLevel01:0,mixedLevel01:0,microphoneInputLevel01:0,microphoneOutputLevel01:0,systemInputLevel01:0,systemOutputLevel01:0,voiceProbability01:0,microphoneAppliedGain:1,systemAppliedGain:1,estimatedLatencyMs:0,underruns:0,captureOverruns:0,droppedAudioFrames:0,error:null,runtime:"C++ / WASAPI"},virtualAudio:{installed:!1,ready:!1,installerAttempted:!1,restartRequired:!1,error:null,vendor:"VB-Audio / VB-CABLE Pack45",renderDeviceName:null,microphoneName:null},microphoneNameInput:"MicDeck Virtual Mic",microphoneNameDirty:!1,isInstallingDriver:!1,isRenamingMicrophone:!1,isRestartingEngine:!1,isRepairingDefaultMicrophone:!1,filter:"",urlInput:"",mediaPlatform:"auto",isImporting:!1,isAddingSounds:!1,libraryWorker:null,shortcutRecorder:null,shortcutErrors:new Map,toast:null,playback:{isPlaying:!1,soundId:null,soundName:null,positionMs:0,durationMs:0,progress01:0,signalDbfs:-90,signalLevel01:0}};let _=null,ie=null,ae=null,q=null;const N=new Map;let be=null,z=new Set,U=null,se=window.innerWidth*.72,re=window.innerHeight*.22;const We={library:'<path d="M4 5.5h16M4 12h16M4 18.5h10"/><circle cx="18" cy="18.5" r="2.5"/>',studio:'<path d="M4 8v8M8 5v14M12 9v6M16 3v18M20 7v10"/>',streamer:'<path d="M4 17a8 8 0 0 1 16 0M7 17a5 5 0 0 1 10 0M10 17a2 2 0 0 1 4 0"/><circle cx="12" cy="20" r="1"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',plus:'<path d="M12 5v14M5 12h14"/>',download:'<path d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',play:'<path d="m9 7 8 5-8 5Z"/>',stop:'<rect x="7" y="7" width="10" height="10" rx="1"/>',trash:'<path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6"/>',mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/>',monitor:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',route:'<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h4a4 4 0 0 1 4 4v4m-8 4h4"/>',link:'<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.15 1.15M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.15-1.15"/>',bolt:'<path d="m13 2-8 12h7l-1 8 8-12h-7Z"/>',check:'<path d="m5 12 4 4L19 6"/>',alert:'<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v4m0 3h.01"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',refresh:'<path d="M20 6v6h-6M4 18v-6h6"/><path d="M18.5 9A7 7 0 0 0 6 6.5L4 9m2 6.5A7 7 0 0 0 18 15l2-2"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',tray:'<path d="M5 5h14v10H5zM8 19h8M12 15v4"/><path d="M8 9h8"/>',power:'<path d="M12 3v9M6.2 6.2a8 8 0 1 0 11.6 0"/>',keyboard:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M10 10h.01M13 10h.01M16 10h.01M7 14h.01M10 14h7"/>',sparkle:'<path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3Z"/><path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>'};document.documentElement.lang=t.language;function a(e,i){return xe(t.language,e,i)}function n(e,i=""){return`<svg class="icon ${i}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${We[e]||""}</svg>`}function K(){return`
    <svg class="brand-glyph" viewBox="0 0 44 44" aria-hidden="true">
      <path d="M7 35V9h7l8 12 8-12h7v26h-7V20l-8 12-8-12v15Z"/>
    </svg>
  `}function u(e){return String(e??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function j(e){const i=Math.floor((Number(e)||0)/1e3);return`${String(Math.floor(i/60)).padStart(2,"0")}:${String(i%60).padStart(2,"0")}`}function B(e){return`${Math.round((Number(e)||0)*100)}%`}function fe(e){return`×${(Number(e)||1).toFixed(1)}`}function k(e){return!Number.isFinite(e)||e<=-90?"−∞ dB":`${e>0?"+":""}${e.toFixed(1)} dB`}function we(e){return Math.round((Math.max(-60,Math.min(12,e))+60)/72*100)}function M(e){return Math.round((Math.max(-60,Math.min(0,e))+60)/60*100)}function h(e){return Math.round(Math.max(0,Math.min(1,Number(e)||0))*100)}function ke(e){const i=Number(e);return i>3e-5?20*Math.log10(i):-90}function x(e){return`×${Math.max(0,Number(e)||0).toFixed(2)}`}function T(){const e=Number(t.nativeAudio.estimatedLatencyMs);return e>0?`~${e.toFixed(1)} ms`:a("common.adaptive")}function Ge(){if(t.mediaPlatform!=="auto")return t.mediaPlatform;const e=t.urlInput.toLowerCase();return e.includes("tiktok.com")?"tiktok":e.includes("/shorts/")?"shorts":e.includes("youtube.com")||e.includes("youtu.be")?"youtube":"auto"}function W(e=Ge()){return{auto:"Auto",youtube:"YouTube",shorts:"Shorts",tiktok:"TikTok"}[e]||"Auto"}function p(e,i="info"){t.toast={message:String(e),kind:i},H(),clearTimeout(ae),ae=setTimeout(()=>{t.toast=null,H()},4200)}function H(){const e=document.getElementById("toast-host");e&&(e.innerHTML=t.toast?`<div class="toast toast-${u(t.toast.kind)}">${n(t.toast.kind==="error"?"alert":"check")}<span>${u(t.toast.message)}</span></div>`:"")}function $e(e){return String(e||"").split("+").map(i=>i.trim()).filter(Boolean)}function Ae(e,i=a("shortcut.assign")){const s=$e(e);return s.length===0?`<span class="shortcut-empty">${n("keyboard")} ${i}</span>`:`<span class="shortcut-keys">${s.map(r=>`<kbd>${u(r)}</kbd>`).join("<i>+</i>")}</span>`}function Ue(){return t.shortcutRecorder?.key?[...t.shortcutRecorder.modifiers,t.shortcutRecorder.key].join("+"):null}function Fe(){const e=t.shortcutRecorder;return e&&[...e.modifiers,...e.key?[e.key]:[]].join("+")||null}function Ve(e){return/^Key[A-Z]$/.test(e.code)?e.code.slice(3):/^Digit[0-9]$/.test(e.code)?e.code.slice(5):/^Numpad[0-9]$/.test(e.code)?`Numpad${e.code.slice(6)}`:/^F([1-9]|1[0-9]|2[0-4])$/.test(e.code)?e.code:{Space:"Space",Enter:"Enter",Tab:"Tab",Escape:"Escape",ArrowUp:"ArrowUp",ArrowDown:"ArrowDown",ArrowLeft:"ArrowLeft",ArrowRight:"ArrowRight",Home:"Home",End:"End",PageUp:"PageUp",PageDown:"PageDown",Insert:"Insert",Delete:"Delete",Backquote:"Backquote",Minus:"Minus",Equal:"Equal",BracketLeft:"BracketLeft",BracketRight:"BracketRight",Backslash:"Backslash",Semicolon:"Semicolon",Quote:"Quote",Comma:"Comma",Period:"Period",Slash:"Slash",NumpadAdd:"NumpadAdd",NumpadSubtract:"NumpadSubtract",NumpadMultiply:"NumpadMultiply",NumpadDivide:"NumpadDivide",NumpadDecimal:"NumpadDecimal"}[e.code]||null}function qe(e){return e.key==="Control"?"Ctrl":e.key==="Alt"||e.key==="AltGraph"?"Alt":e.key==="Shift"?"Shift":e.key==="Meta"?"Super":null}async function G(){if(t.shortcutRecorder)return;const e=new Map;await ve().catch(()=>{});for(const i of t.sounds.filter(s=>s.shortcut))try{await _e(i.shortcut,async s=>{if(s.state==="Pressed")try{await c("play_sound",{id:i.id}),Z()}catch(r){p(a("toast.playFailed",{error:r}),"error")}})}catch(s){e.set(i.id,String(s))}return t.shortcutErrors=e,e}async function He(e){const i=t.sounds.find(o=>o.id===e);if(!i)return;await ve().catch(()=>{});const s=$e(i.shortcut),r=new Set(["Ctrl","Alt","Shift","Super"]);t.shortcutRecorder={soundId:e,soundName:i.name.replace(/\.[^/.]+$/,""),modifiers:s.filter(o=>r.has(o)),key:s.find(o=>!r.has(o))||null},d(),document.querySelector(".shortcut-dialog")?.focus()}async function Y(){t.shortcutRecorder=null,d(),await G()}async function oe(e){const i=t.shortcutRecorder;if(i)try{t.sounds=await c("set_sound_shortcut",{id:i.soundId,shortcut:e}),t.shortcutRecorder=null,d();const s=await G();e&&s?.has(i.soundId)?p(a("toast.shortcutUnavailable"),"error"):p(a(e?"toast.shortcutSaved":"toast.shortcutCleared"),"success")}catch(s){p(s,"error")}}function Ye(e){const i=t.shortcutRecorder;if(!i||e.repeat)return;if(e.preventDefault(),e.stopPropagation(),e.key==="Escape"){Y();return}if(e.key==="Backspace"){i.key?i.key=null:i.modifiers.pop(),d();return}const s=qe(e);if(s){i.modifiers.includes(s)||i.modifiers.push(s),d();return}const r=Ve(e);if(!r){p(a("shortcut.unsupported"),"error");return}i.key=r,d()}function Ke(){t.cursorGlowEnabled=!t.cursorGlowEnabled;try{localStorage.setItem(ye,String(t.cursorGlowEnabled))}catch{}d(),p(a(t.cursorGlowEnabled?"toast.glowOn":"toast.glowOff"),"success")}function Ze(){window.addEventListener("pointermove",e=>{t.cursorGlowEnabled&&(se=e.clientX,re=e.clientY,!U&&(U=requestAnimationFrame(()=>{U=null,document.documentElement.style.setProperty("--cursor-x",`${se}px`),document.documentElement.style.setProperty("--cursor-y",`${re}px`)})))},{passive:!0})}async function Je(){await Q("library-worker-progress",({payload:e})=>{t.libraryWorker=e,t.activeView==="library"&&d()}),await Q("native-runtime-ready",()=>{y().catch(()=>{})})}async function y(){const[e,i,s,r,o,l,m,b,R,C,ze,J,Me,De,Ie]=await Promise.all([c("list_sounds"),c("list_input_devices"),c("get_selected_input_device"),c("get_microphone_gain"),c("get_volume"),c("get_sound_overdrive"),c("get_monitor_gain"),c("get_system_audio_enabled"),c("get_system_audio_gain"),c("get_voice_processing_settings"),c("get_playback_status"),c("get_virtual_audio_status"),c("get_native_audio_status"),c("list_audio_sessions"),me().catch(()=>!1)]);Object.assign(t,{sounds:e,inputDevices:i,selectedInputDevice:s,microphoneGain:Number(r??1),volume:Number(o??1),soundOverdrive:Number(l??1),monitorGain:Number(m??0),systemAudioEnabled:!!b,systemAudioGain:Number(R??.85),voiceProcessing:C,playback:ze,virtualAudio:J,nativeAudio:Me,audioSessions:De,autostartEnabled:!!Ie}),t.microphoneNameDirty||(t.microphoneNameInput=J.microphoneName||"MicDeck Virtual Mic"),d()}async function ne(){if(t.isAddingSounds)return;const e=await Ce({multiple:!0,filters:[{name:"Audio",extensions:["mp3","wav","flac","ogg","m4a","aac","wma"]}]});if(!e||Array.isArray(e)&&e.length===0)return;const i=Array.isArray(e)?e:[e],s=new Set(t.sounds.map(r=>r.id));t.isAddingSounds=!0,t.libraryWorker={kind:"files",stage:"queued",current:0,total:i.length,fileName:null},d();try{t.sounds=await c("add_sounds",{paths:i}),z=new Set(t.sounds.filter(o=>!s.has(o.id)).map(o=>o.id)),t.isAddingSounds=!1,t.libraryWorker=null,d();const r=z.size;p(a(r===1?"toast.soundsAdded.one":"toast.soundsAdded.many",{count:r}),"success"),setTimeout(()=>z.clear(),1400)}catch(r){t.isAddingSounds=!1,t.libraryWorker=null,d(),p(r,"error")}}async function le(){const e=t.urlInput.trim();if(!e||t.isImporting)return;const i=new Set(t.sounds.map(s=>s.id));t.isImporting=!0,t.libraryWorker={kind:"url",stage:"validating",current:0,total:1,fileName:null},d();try{t.sounds=await c("import_from_url",{url:e}),z=new Set(t.sounds.filter(r=>!i.has(r.id)).map(r=>r.id));const s=W();t.urlInput="",t.mediaPlatform="auto",t.isImporting=!1,t.libraryWorker=null,d(),p(a("toast.imported",{source:s}),"success"),setTimeout(()=>z.clear(),1400)}catch(s){t.isImporting=!1,t.libraryWorker=null,d(),p(s,"error")}}async function Xe(e){if(confirm(a("confirm.remove")))try{await c("remove_sound",{id:e}),await y(),await G(),p(a("toast.removed"),"success")}catch(i){p(i,"error")}}async function Qe(e){try{await c("play_sound",{id:e}),await y(),Z()}catch(i){p(a("toast.playFailed",{error:i}),"error")}}async function et(){try{await c("stop_playback"),await y()}catch(e){p(e,"error")}}async function tt(e){try{t.selectedInputDevice=e,await c("set_selected_input_device",{deviceId:e}),await y(),p(a("toast.inputChanged"),"success")}catch(i){p(i,"error"),await y()}}async function S(e,i,s,r,o=B){t[i]=Number(s);const l=document.querySelector(r);l&&(l.textContent=o(t[i]));try{await c(e,e==="set_sound_overdrive"?{overdrive:t[i]}:{gain:t[i]})}catch(m){p(m,"error")}}async function ce(){clearTimeout(q);try{t.voiceProcessing=await c("set_voice_processing_settings",{settings:t.voiceProcessing})}catch(e){p(e,"error")}}function E(e,{rerender:i=!1,immediate:s=!1}={}){Object.assign(t.voiceProcessing,e),clearTimeout(q),s?ce():q=setTimeout(ce,90),i&&d()}function it(e){t.volume=Number(e);const i=document.querySelector(".sound-gain-value");i&&(i.textContent=B(t.volume)),c("set_volume",{volume:t.volume}).catch(s=>p(s,"error"))}async function F(){if(!t.nativeAudio.ready){p(a("toast.engineRequired"),"error");return}const e=t.systemAudioEnabled;t.systemAudioEnabled=!e,d();try{await c("set_system_audio_enabled",{enabled:t.systemAudioEnabled}),p(t.systemAudioEnabled?a("toast.systemOn"):a("toast.systemOff"),"success")}catch(i){t.systemAudioEnabled=e,d(),p(i,"error")}}async function at(){if(!t.isInstallingDriver){t.isInstallingDriver=!0,d();try{await c("install_virtual_audio_driver"),await y()}catch(e){t.isInstallingDriver=!1,d(),p(a("toast.driverFailed",{error:e}),"error")}}}async function de(){const e=t.microphoneNameInput.trim();if(!(!e||t.isRenamingMicrophone)){t.isRenamingMicrophone=!0,d();try{await c("rename_virtual_microphone",{name:e}),await new Promise(i=>setTimeout(i,500)),t.microphoneNameDirty=!1,t.isRenamingMicrophone=!1,await y(),p(a("toast.micRenamed"),"success")}catch(i){t.isRenamingMicrophone=!1,d(),p(i,"error")}}}async function st(){if(!t.isRestartingEngine){t.isRestartingEngine=!0,d();try{await c("restart_native_audio_engine"),await new Promise(e=>setTimeout(e,350)),t.isRestartingEngine=!1,await y(),p(a("toast.engineRestarted"),"success")}catch(e){t.isRestartingEngine=!1,d(),p(e,"error")}}}async function rt(){if(!t.isRepairingDefaultMicrophone){t.isRepairingDefaultMicrophone=!0,d();try{const e=await c("repair_default_microphone");t.isRepairingDefaultMicrophone=!1,d(),p(a("toast.microphoneRepaired",{name:e}),"success")}catch(e){t.isRepairingDefaultMicrophone=!1,d(),p(e,"error")}}}function ot(e,i){const s=Math.max(0,Math.min(1,Number(i))),r=t.audioSessions.find(l=>l.id===e);r&&(r.volume=s,r.muted=s<=.001);const o=document.querySelector(`[data-session-volume-output="${e}"]`);o&&(o.textContent=`${Math.round(s*100)}%`),clearTimeout(N.get(e)),N.set(e,setTimeout(async()=>{N.delete(e);try{await c("set_audio_session_volume",{id:e,volume:s})}catch(l){p(l,"error")}},60))}function nt(e){if(!(!["pl","en"].includes(e)||t.language===e)){t.language=e,document.documentElement.lang=e;try{localStorage.setItem(he,e)}catch{}d(),p(a("toast.languageChanged"),"success")}}async function lt(){if(t.isUpdatingAutostart)return;const e=!t.autostartEnabled;t.isUpdatingAutostart=!0,d();try{e?await Le():await Re(),t.autostartEnabled=await me(),p(a(t.autostartEnabled?"toast.autostartOn":"toast.autostartOff"),"success")}catch(i){p(i,"error")}finally{t.isUpdatingAutostart=!1,d()}}function ct(){const e=t.filter.trim().toLowerCase();return e?t.sounds.filter(i=>[i.name,i.path,i.extension,i.sourceKind].join(" ").toLowerCase().includes(e)):t.sounds}function dt(){return t.virtualAudio.restartRequired?a("alert.restartWindows"):t.virtualAudio.error?a("alert.driver",{error:t.virtualAudio.error}):t.nativeAudio.state==="error"?t.nativeAudio.error||a("alert.engine"):null}function P(e,i,s){return`
    <button class="nav-item ${t.activeView===e?"is-active":""}" data-view="${e}">
      ${n(s)}
      <span>${i}</span>
      ${(e==="studio"||e==="streamer")&&t.systemAudioEnabled?'<i class="nav-live-dot"></i>':""}
    </button>
  `}function ut(){const e=t.nativeAudio.ready&&t.virtualAudio.ready;return`
    <aside class="app-sidebar">
      <div class="brand-lockup">
        <div class="brand-symbol">${K()}</div>
        <div class="brand-copy">
          <strong>MICDECK</strong>
          <span>Audio routing suite</span>
        </div>
      </div>

      <nav class="app-nav" aria-label="${a("nav.aria")}">
        <div class="nav-caption">${a("nav.workspace")}</div>
        ${P("library",a("nav.library"),"library")}
        ${P("studio",a("nav.studio"),"studio")}
        ${P("streamer",a("nav.streamer"),"streamer")}
        ${P("settings",a("nav.settings"),"settings")}
      </nav>

      <div class="sidebar-spacer"></div>
      <div class="route-status ${e?"is-ready":"is-waiting"}">
        <div class="route-status-head">
          <span class="status-beacon"></span>
          <strong>${a(e?"nav.routeReady":"nav.routeSetup")}</strong>
        </div>
        <p>${a(e?"nav.routeReadyDescription":"nav.routeSetupDescription")}</p>
        <div class="route-status-meta">
          <span>IPC v${t.nativeAudio.protocolVersion||"—"}</span>
          <span>${T()}</span>
        </div>
      </div>
      <div class="sidebar-version">MICDECK 0.1 · Windows</div>
    </aside>
  `}function pt(){return`
    <div class="app-toolbar">
      <div class="tray-presence" title="${a("settings.trayDescription")}">
        ${n("tray")}
        <span>${a("toolbar.tray")}</span>
        <i></i>
      </div>
      <div class="language-picker" role="group" aria-label="${a("language.label")}">
        ${n("globe")}
        <button class="${t.language==="pl"?"is-active":""}" data-language="pl" title="${a("language.polish")}" aria-pressed="${t.language==="pl"}">PL</button>
        <button class="${t.language==="en"?"is-active":""}" data-language="en" title="${a("language.english")}" aria-pressed="${t.language==="en"}">EN</button>
      </div>
    </div>
  `}function L(e,i,s,r=""){return`
    <header class="view-header">
      <div>
        <div class="kicker">${e}</div>
        <h1>${i}</h1>
        <p>${s}</p>
      </div>
      ${r?`<div class="view-actions">${r}</div>`:""}
    </header>
  `}function mt(){return`
    <div class="platform-selector" role="group" aria-label="${a("capture.source")}">
      ${["auto","youtube","shorts","tiktok"].map(e=>`
        <button class="platform-chip ${t.mediaPlatform===e?"is-active":""}" data-platform="${e}">
          ${W(e)}
        </button>
      `).join("")}
    </div>
  `}function gt(){const e=t.playback.isPlaying;return`
    <section class="now-playing ${e?"is-live":""}">
      <div class="now-art">
        <div class="art-disc"></div>
        <div class="art-center">${n(e?"studio":"play")}</div>
      </div>
      <div class="now-copy">
        <div class="panel-kicker">${e?`<span class="live-beacon"></span> ${a("player.nowPlaying")}`:a("player.label")}</div>
        <h2 class="now-title">${u(e?t.playback.soundName||a("player.untitled"):a("player.silence"))}</h2>
        <p class="now-meta">${e?`${j(t.playback.positionMs)} / ${j(t.playback.durationMs)}`:a("player.pickSound")}</p>
      </div>
      <div class="now-signal">
        <div class="metric-label">${a("player.signal")}</div>
        <strong class="signal-db">${k(t.playback.signalDbfs)}</strong>
        <div class="meter"><i class="signal-fill" style="width:${we(t.playback.signalDbfs)}%"></i></div>
      </div>
      <button class="icon-button now-stop" id="stop-btn" title="${a("common.stop")}" ${e?"":"disabled"}>
        ${n("stop")}
      </button>
      <div class="now-progress"><i class="progress-fill" style="width:${Math.round((t.playback.progress01||0)*100)}%"></i></div>
    </section>
  `}function vt(e,i){const s=String(e.name||"VX").replace(/\.[^/.]+$/,"").split(/\s+/).filter(Boolean).slice(0,2).map(o=>o[0]).join("").toUpperCase().slice(0,2),r=Array.from({length:14},(o,l)=>`<i style="height:${22+(i*17+l*29+String(e.name).length*7)%64}%"></i>`).join("");return`<div class="sound-art sound-art-${i%5}"><span>${u(s||"VX")}</span><div class="wave-bars">${r}</div></div>`}function ht(e,i){const s=t.playback.isPlaying&&t.playback.soundId===e.id,r=t.shortcutErrors.has(e.id);return`
    <article class="sound-card ${s?"is-live":""} ${z.has(e.id)?"is-new":""}">
      ${vt(e,i)}
      <div class="sound-card-body">
        <div class="sound-card-top">
          <span class="file-type">${u(e.extension.toUpperCase())}</span>
          ${s?'<span class="playing-tag"><i></i> LIVE</span>':`<span class="sound-duration">${u(e.durationText)}</span>`}
        </div>
        <h3 title="${u(e.name)}">${u(e.name.replace(/\.[^/.]+$/,""))}</h3>
        <div class="sound-details">
          <span>${u(e.fileSizeText)}</span>
          <i></i>
          <span>${e.sourceKind==="library"?a("sound.downloaded"):a("sound.local")}</span>
        </div>
        ${s?`
          <div class="card-progress"><i class="mini-fill" style="width:${Math.round((t.playback.progress01||0)*100)}%"></i></div>
        `:""}
        <button class="shortcut-control ${e.shortcut?"has-shortcut":""} ${r?"has-error":""}" data-shortcut-id="${u(e.id)}" title="${u(a(r?"shortcut.unavailable":"shortcut.clickToEdit"))}">
          <span class="shortcut-control-label">${a("shortcut.label")}</span>
          ${Ae(e.shortcut)}
          ${n(r?"alert":"keyboard")}
        </button>
        <div class="sound-actions">
          <button class="play-button play-btn" data-id="${u(e.id)}">
            ${n(s?"studio":"play")}
            <span>${a(s?"player.playing":"player.play")}</span>
          </button>
          <button class="icon-button remove-btn" data-id="${u(e.id)}" title="${a("common.remove")}">
            ${n("trash")}
          </button>
        </div>
      </div>
    </article>
  `}function yt(){const e=t.libraryWorker;if(!e)return"";const i={queued:6,validating:12,downloading:42,analyzing:58,finalizing:92,complete:100,failed:100},s=e.total>0?e.current/e.total*28:0,r=Math.min(100,Math.round((i[e.stage]||8)+s)),o=`worker.${e.stage}`;return`
    <section class="library-worker ${e.stage==="failed"?"has-error":""}" aria-live="polite">
      <div class="worker-orbit"><span></span>${n(e.kind==="url"?"download":"studio")}</div>
      <div class="worker-copy">
        <div class="worker-title-row">
          <strong>${a(e.kind==="url"?"worker.captureTitle":"worker.filesTitle")}</strong>
          <span>${r}%</span>
        </div>
        <p>${u(a(o))}${e.fileName?` · ${u(e.fileName)}`:""}</p>
        <div class="worker-track"><i style="width:${r}%"></i></div>
      </div>
      <span class="worker-thread">${n("bolt")} ${a("worker.thread")}</span>
    </section>
  `}function bt(){const e=t.shortcutRecorder;if(!e)return"";const i=Fe(),s=e.key?a("shortcut.ready"):e.modifiers.length>0?a("shortcut.pressTrigger"):a("shortcut.pressFirst"),r=t.sounds.find(o=>o.id===e.soundId);return`
    <div class="modal-backdrop" data-close-shortcut>
      <section class="shortcut-dialog" role="dialog" aria-modal="true" aria-labelledby="shortcut-title" tabindex="-1">
        <button class="dialog-close" data-cancel-shortcut aria-label="${a("common.cancel")}">${n("close")}</button>
        <div class="dialog-icon">${n("keyboard")}</div>
        <div class="panel-kicker">GLOBAL HOTKEY</div>
        <h2 id="shortcut-title">${a("shortcut.title")}</h2>
        <p class="dialog-sound-name">${u(e.soundName)}</p>
        <div class="shortcut-capture ${e.key?"is-ready":"is-listening"}">
          <span class="capture-pulse"></span>
          ${Ae(i,a("shortcut.waiting"))}
        </div>
        <p class="shortcut-instruction">${s}</p>
        <div class="shortcut-hints">
          <span><kbd>Esc</kbd> ${a("common.cancel")}</span>
          <span><kbd>Backspace</kbd> ${a("shortcut.undo")}</span>
        </div>
        <div class="dialog-actions">
          <button class="button button-subtle" data-clear-shortcut ${r?.shortcut?"":"disabled"}>${a("shortcut.clear")}</button>
          <button class="button button-subtle" data-cancel-shortcut>${a("common.cancel")}</button>
          <button class="button button-primary" data-save-shortcut ${e.key?"":"disabled"}>${a("common.save")}</button>
        </div>
      </section>
    </div>
  `}function ft(){const e=ct();return`
    ${L(a("library.kicker"),a("library.title"),a("library.description"),`<button class="button button-primary" id="add-btn" ${t.isAddingSounds?"disabled":""}>
        ${t.isAddingSounds?`<span class="spinner spinner-dark"></span> ${a("worker.analyzing")}`:`${n("plus")} ${a("library.addFiles")}`}
      </button>`)}

    ${yt()}

    <div class="library-lead">
      <section class="capture-card">
        <div class="capture-card-head">
          <div class="feature-icon">${n("download")}</div>
          <div>
            <div class="panel-kicker">QUICK CAPTURE</div>
            <h2>${a("library.captureTitle")}</h2>
          </div>
          <span class="support-label">YT-DLP</span>
        </div>
        <p>${a("library.captureDescription")}</p>
        ${mt()}
        <div class="url-field">
          ${n("link")}
          <input id="url-input" placeholder="https://youtube.com/shorts/…" value="${u(t.urlInput)}" />
          <span class="detected-platform">${u(W())}</span>
          <button id="url-btn" class="button button-accent" ${t.isImporting?"disabled":""}>
            ${t.isImporting?`<span class="spinner"></span> ${a("library.downloading")}`:`${n("download")} ${a("library.download")}`}
          </button>
        </div>
        <div class="capture-foot">
          <span>${n("check")} YouTube</span>
          <span>${n("check")} Shorts</span>
          <span>${n("check")} TikTok</span>
          <small>${a("library.requirements")}</small>
        </div>
        <div class="capture-rights">${n("alert")} ${a("library.rightsNotice")}</div>
      </section>
      ${gt()}
    </div>

    <section class="library-section">
      <div class="section-toolbar">
        <div>
          <h2>${a("library.sectionTitle")}</h2>
          <span>${t.sounds.length} ${a(t.sounds.length===1?"library.item.one":"library.item.many")}</span>
        </div>
        <label class="search-field">
          ${n("search")}
          <input id="search-input" placeholder="${a("library.search")}" value="${u(t.filter)}" />
        </label>
      </div>

      ${e.length===0?`
        <div class="empty-state">
          <div class="empty-symbol">${n("studio")}</div>
          <h3>${t.sounds.length?a("library.noResults"):a("library.empty")}</h3>
          <p>${t.sounds.length?a("library.changeSearch"):a("library.emptyDescription")}</p>
          ${t.sounds.length?"":`<button class="button button-primary" id="empty-add-btn">${n("plus")} ${a("library.addFirst")}</button>`}
        </div>
      `:`
        <div class="sound-grid">
          ${e.map(ht).join("")}
        </div>
      `}
    </section>
  `}function V(e,i,s,r){return`
    <div class="channel-meter-row">
      <div class="channel-meter-label">
        <span>${e}</span>
        <strong class="${s}-meter-value">${h(i)}%</strong>
      </div>
      <div class="channel-meter"><i class="${s}-meter-fill" style="width:${h(i)}%"></i></div>
      <small>${r}</small>
    </div>
  `}function f(e,i,s,r,o,l,m,b=B){return`
    <div class="gain-control">
      <div class="gain-head">
        <div>
          <strong>${i}</strong>
          <span>${s}</span>
        </div>
        <output class="gain-output ${m}">${b(r)}</output>
      </div>
      <input class="range" id="${e}" type="range" min="0" max="${o}" step="${l}" value="${r}" />
    </div>
  `}function Se(e){const i=Number(e);return!Number.isFinite(i)||i<3e3?a("studio.heardJustNow"):i<6e4?a("studio.heardSeconds",{count:Math.max(1,Math.round(i/1e3))}):a("studio.heardMinutes",{count:Math.max(1,Math.round(i/6e4))})}function Ee(){const e=t.audioSessions.slice(0,12);return`
    <div class="broadcast-source-rack">
      <div class="source-rack-head">
        <div>
          <div class="panel-kicker">${a("studio.sourceRackKicker")}</div>
          <h3>${a("studio.sourceRackTitle")}</h3>
          <p>${a("studio.sourceRackDescription")}</p>
        </div>
        <span class="source-count">${e.length} ${a("studio.apps")}</span>
      </div>
      ${e.length?`
        <div class="audio-app-list">
          ${e.map(i=>{const s=Math.max(0,Math.min(1,Number(i.volume||0))),r=(i.name||"?").trim().slice(0,1).toUpperCase();return`
              <div class="audio-app-row ${i.active?"is-playing":""}" data-session-row="${i.id}">
                <div class="audio-app-identity">
                  <span class="audio-app-icon">
                    ${i.iconDataUrl?`<img src="${u(i.iconDataUrl)}" alt="" />`:`<span>${u(r)}</span>`}
                  </span>
                  <div>
                    <strong>${u(i.name)}</strong>
                    <small data-session-activity="${i.id}">${i.active?a("studio.playingNow"):Se(i.lastActiveMs)}</small>
                  </div>
                </div>
                <div class="app-signal" aria-hidden="true">
                  <i data-session-meter="${i.id}" style="width:${h(i.peakLevel01)}%"></i>
                </div>
                <div class="app-volume">
                  <span>${a("studio.volume")}</span>
                  <input
                    class="range app-volume-range"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value="${s}"
                    data-session-volume="${i.id}"
                    aria-label="${u(`${i.name} — ${a("studio.volume")}`)}"
                  />
                  <output data-session-volume-output="${i.id}">${Math.round(s*100)}%</output>
                </div>
              </div>
            `}).join("")}
        </div>
      `:`
        <div class="audio-app-empty">
          <span>${n("monitor")}</span>
          <div><strong>${a("studio.noAudioApps")}</strong><p>${a("studio.noAudioAppsHelp")}</p></div>
        </div>
      `}
    </div>
  `}function w(e,i,s,r=""){const o=!!t.voiceProcessing[e];return`
    <div class="processing-toggle-row">
      <div class="processing-toggle-copy">
        <strong>${i}</strong>
        <p>${s}</p>
        ${r?`<span>${r}</span>`:""}
      </div>
      <button
        class="toggle-switch ${o?"is-on":""}"
        data-voice-toggle="${e}"
        role="switch"
        aria-checked="${o}"
        aria-label="${u(i)}"
      ><i></i></button>
    </div>
  `}function I(e,i,s){const r=ke(i),o=Number(t.voiceProcessing.targetMinDb),l=Number(t.voiceProcessing.targetMaxDb),m=M(o),b=Math.max(2,M(l)-m);return`
    <div class="advanced-db-meter">
      <div class="advanced-db-head">
        <span>${e}</span>
        <strong class="${s}-db-value">${k(r)}</strong>
      </div>
      <div class="advanced-db-track">
        <i class="target-db-band" style="left:${m}%;width:${b}%"></i>
        <b class="${s}-db-fill" style="width:${M(r)}%"></b>
        <span class="db-zero-marker"></span>
      </div>
      <div class="db-scale"><span>−60</span><span>−36</span><span>−18</span><span>0 dBFS</span></div>
    </div>
  `}function wt(){const e=Number(t.voiceProcessing.targetMinDb),i=Number(t.voiceProcessing.targetMaxDb),s=(e+i)/2,r=Math.max(1,(i-e)/2);return`
    <div class="target-range-control">
      <div class="target-range-summary">
        <div>
          <span>${a("streamer.targetCenter")}</span>
          <strong class="target-center-value">${s.toFixed(1)} dBFS</strong>
        </div>
        <div>
          <span>${a("streamer.tolerance")}</span>
          <strong class="target-tolerance-value">±${r.toFixed(1)} dB</strong>
        </div>
        <div>
          <span>${a("streamer.activeRange")}</span>
          <strong class="target-range-value">${e.toFixed(1)}…${i.toFixed(1)} dBFS</strong>
        </div>
      </div>
      <label class="calibration-range">
        <span>${a("streamer.targetCenter")}</span>
        <input class="range" id="target-center-range" type="range" min="-30" max="-6" step="0.5" value="${s}" />
      </label>
      <label class="calibration-range">
        <span>${a("streamer.tolerance")}</span>
        <input class="range" id="target-tolerance-range" type="range" min="1" max="8" step="0.5" value="${r}" />
      </label>
    </div>
  `}function kt(){return`
    <div class="filter-settings-layout">
      <section class="surface filter-settings-card">
        <div class="surface-head">
          <div><div class="panel-kicker">VOICE DSP</div><h2>${a("filters.voiceCleanup")}</h2></div>
          <span class="status-pill is-good">48 kHz · 10 ms</span>
        </div>
        <p class="section-lead">${a("filters.voiceCleanupDescription")}</p>
        <div class="processing-toggle-list">
          ${w("aecEnabled",a("filters.aec"),a("filters.aecDescription"),"WebRTC AEC3")}
          ${w("rnnoiseEnabled",a("filters.rnnoise"),a("filters.rnnoiseDescription"),"RNNoise · BSD-3-Clause")}
          ${w("noiseGateEnabled",a("filters.gate"),a("filters.gateDescription"),"Soft gate")}
        </div>
      </section>
      <section class="surface filter-settings-card">
        <div class="surface-head">
          <div><div class="panel-kicker">DYNAMICS</div><h2>${a("filters.dynamics")}</h2></div>
          <span class="status-pill">${a("common.adaptive")}</span>
        </div>
        <div class="filter-range-stack">
          <label class="gain-control">
            <div class="gain-head"><div><strong>${a("filters.gateThreshold")}</strong><span>${a("filters.gateThresholdHelp")}</span></div><output class="gate-threshold-value">${k(t.voiceProcessing.gateThresholdDb)}</output></div>
            <input class="range" id="gate-threshold-range" type="range" min="-75" max="-30" step="1" value="${t.voiceProcessing.gateThresholdDb}" />
          </label>
          <label class="gain-control">
            <div class="gain-head"><div><strong>${a("filters.compressor")}</strong><span>${a("filters.compressorHelp")}</span></div><output class="compressor-ratio-value">${Number(t.voiceProcessing.compressorRatio).toFixed(1)}:1</output></div>
            <input class="range" id="compressor-ratio-range" type="range" min="1" max="8" step="0.5" value="${t.voiceProcessing.compressorRatio}" />
          </label>
          <label class="gain-control">
            <div class="gain-head"><div><strong>${a("filters.limiter")}</strong><span>${a("filters.limiterHelp")}</span></div><output class="limiter-ceiling-value">${k(t.voiceProcessing.limiterCeilingDb)}</output></div>
            <input class="range" id="limiter-ceiling-range" type="range" min="-6" max="-0.5" step="0.5" value="${t.voiceProcessing.limiterCeilingDb}" />
          </label>
        </div>
      </section>
      <section class="surface filter-settings-card filter-signal-flow">
        <div class="surface-head"><div><div class="panel-kicker">SIGNAL FLOW</div><h2>${a("filters.order")}</h2></div></div>
        <div class="signal-flow">
          <span>MIC</span><i>→</i><strong>AEC3</strong><i>→</i><strong>RNNoise</strong><i>→</i><strong>Gate</strong><i>→</i><strong>Leveler</strong><i>→</i><strong>Limiter</strong><i>→</i><span>STREAM BUS</span>
        </div>
        <p>${a("filters.orderDescription")}</p>
      </section>
    </div>
  `}function ue(){return`
    <div class="settings-tabs" role="tablist" aria-label="${a("settings.sections")}">
      <button class="${t.settingsSection==="general"?"is-active":""}" data-settings-section="general" role="tab" aria-selected="${t.settingsSection==="general"}">${a("settings.general")}</button>
      <button class="${t.settingsSection==="filters"?"is-active":""}" data-settings-section="filters" role="tab" aria-selected="${t.settingsSection==="filters"}">${a("settings.filters")}</button>
    </div>
  `}function $t(){const e=t.systemAudioEnabled;return`
    ${L(a("streamer.kicker"),a("streamer.title"),a("streamer.description"),`<div class="latency-chip">${n("bolt")} DSP <strong>${T()}</strong></div>`)}

    <section class="surface streamer-console ${e?"is-live":""}">
      <div class="streamer-console-head">
        <div class="streamer-live-state">
          <span class="streamer-status-orb">${n(e?"stop":"streamer")}</span>
          <div>
            <div class="panel-kicker">${e?`<span class="live-beacon"></span> ${a("streamer.live")}`:a("streamer.ready")}</div>
            <h2>${a(e?"streamer.liveTitle":"streamer.readyTitle")}</h2>
            <p>${a(e?"streamer.liveDescription":"streamer.readyDescription")}</p>
          </div>
        </div>
        <button class="button ${e?"button-stop":"button-accent"}" id="streamer-broadcast-toggle">
          ${e?`${n("stop")} ${a("studio.stopBroadcast")}`:`${n("streamer")} ${a("studio.startBroadcast")}`}
        </button>
      </div>

      <div class="streamer-meter-grid">
        <article class="streamer-channel-card">
          <div class="streamer-channel-head"><span class="round-icon">${n("mic")}</span><div><small>VOICE BUS</small><h3>${a("streamer.microphone")}</h3></div><output class="microphone-applied-gain">${x(t.nativeAudio.microphoneAppliedGain)}</output></div>
          ${I(a("streamer.beforeFilters"),t.nativeAudio.microphoneInputLevel01,"microphone-input")}
          ${I(a("streamer.toObs"),t.nativeAudio.microphoneOutputLevel01,"microphone-output")}
          <div class="voice-confidence"><span>${a("streamer.voiceDetection")}</span><div><i class="voice-probability-fill" style="width:${h(t.nativeAudio.voiceProbability01)}%"></i></div><strong class="voice-probability-value">${h(t.nativeAudio.voiceProbability01)}%</strong></div>
        </article>
        <article class="streamer-channel-card">
          <div class="streamer-channel-head"><span class="round-icon">${n("monitor")}</span><div><small>DESKTOP BUS</small><h3>${a("streamer.systemAudio")}</h3></div><output class="system-applied-gain">${x(t.nativeAudio.systemAppliedGain)}</output></div>
          ${I(a("streamer.capturedCopy"),t.nativeAudio.systemInputLevel01,"system-input")}
          ${I(a("streamer.toObs"),t.nativeAudio.systemOutputLevel01,"system-output")}
          <div class="stream-route-note">${n("route")}<span>${a("streamer.systemRouteNote")}</span></div>
        </article>
      </div>
    </section>

    <div class="streamer-control-grid">
      <section class="surface streamer-target-card">
        <div class="surface-head">
          <div><div class="panel-kicker">SMART LEVEL MATCH</div><h2>${a("streamer.levelMatch")}</h2></div>
          <button class="toggle-switch ${t.voiceProcessing.autoLevelEnabled?"is-on":""}" data-voice-toggle="autoLevelEnabled" role="switch" aria-checked="${t.voiceProcessing.autoLevelEnabled}" aria-label="${a("streamer.levelMatch")}"><i></i></button>
        </div>
        <p class="section-lead">${a("streamer.levelMatchDescription")}</p>
        ${wt()}
        <div class="leveler-safety-note">${n("alert")}<span>${a("streamer.silenceSafety")}</span></div>
      </section>

      <section class="surface streamer-monitor-card">
        <div class="surface-head">
          <div><div class="panel-kicker">LIVE CALIBRATION</div><h2>${a("streamer.calibration")}</h2></div>
          <button class="toggle-switch ${t.voiceProcessing.voiceMonitorEnabled?"is-on":""}" data-voice-toggle="voiceMonitorEnabled" role="switch" aria-checked="${t.voiceProcessing.voiceMonitorEnabled}" aria-label="${a("streamer.monitoring")}"><i></i></button>
        </div>
        <div class="calibration-prompt">${n("mic")}<div><strong>${a("streamer.saySomething")}</strong><p>${a("streamer.saySomethingHelp")}</p></div></div>
        ${f("voice-monitor-gain-range",a("streamer.monitorLevel"),a("streamer.headphonesOnly"),t.voiceProcessing.voiceMonitorGain,2,.01,"voice-monitor-gain-value")}
        <div class="monitor-warning">${n("alert")} ${a("streamer.headphoneWarning")}</div>
      </section>

      <section class="surface streamer-filters-card">
        <div class="surface-head"><div><div class="panel-kicker">MIC PRE-PROCESSING</div><h2>${a("streamer.filters")}</h2></div><button class="button button-subtle" data-open-filter-settings>${a("streamer.tuneFilters")}</button></div>
        <div class="processing-toggle-list compact">
          ${w("aecEnabled",a("filters.aec"),a("filters.aecShort"),"AEC3")}
          ${w("rnnoiseEnabled",a("filters.rnnoise"),a("filters.rnnoiseShort"),"RNNoise")}
          ${w("noiseGateEnabled",a("filters.gate"),a("filters.gateShort"),"Soft gate")}
        </div>
      </section>

      <section class="surface streamer-gains-card">
        <div class="surface-head"><div><div class="panel-kicker">STREAM BUS</div><h2>${a("streamer.outputGains")}</h2></div><span class="status-pill ${e?"is-good":""}">${a(e?"common.online":"common.ready")}</span></div>
        ${f("streamer-microphone-gain-range",a("studio.microphone"),a("streamer.cableOnly"),t.microphoneGain,3,.01,"streamer-microphone-gain-value")}
        ${f("streamer-system-gain-range",a("streamer.systemAudio"),a("streamer.cableOnly"),t.systemAudioGain,2,.01,"streamer-system-gain-value")}
        ${I(a("streamer.masterOutput"),t.nativeAudio.mixedLevel01,"streamer-master")}
      </section>
    </div>

    <section class="surface streamer-sources">
      ${Ee()}
    </section>
  `}function At(){const e=t.systemAudioEnabled;return`
    ${L(a("studio.kicker"),a("studio.title"),a("studio.description"),`<div class="latency-chip">${n("bolt")} LOW LATENCY <strong>${T()}</strong></div>`)}

    <section class="broadcast-hero ${e?"is-broadcasting is-expanded":""}">
      <div class="broadcast-visual">
        <div class="broadcast-orbit orbit-one"></div>
        <div class="broadcast-orbit orbit-two"></div>
        <button class="broadcast-button" id="system-audio-toggle" aria-pressed="${e}">
          <span class="broadcast-core">${n(e?"stop":"studio")}</span>
        </button>
      </div>
      <div class="broadcast-copy">
        <div class="panel-kicker">${e?`<span class="live-beacon"></span> ${a("studio.live")}`:a("studio.systemAudio")}</div>
        <h2>${a(e?"studio.broadcastingTitle":"studio.broadcastTitle")}</h2>
        <p>${a(e?"studio.broadcastingDescription":"studio.broadcastDescription")}</p>
        <button class="button ${e?"button-stop":"button-accent"} broadcast-cta" id="system-audio-cta">
          ${e?`${n("stop")} ${a("studio.stopBroadcast")}`:`${n("studio")} ${a("studio.startBroadcast")}`}
        </button>
        <div class="broadcast-note">${n("alert")} ${a("studio.echoNote")}</div>
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
        <span class="route-icon">${n("monitor")}</span>
        <div><small>${a("studio.sources")}</small><strong>${a("studio.sourceApps")}</strong></div>
      </div>
      <div class="route-line ${e?"is-flowing":""}"><i></i>${n("arrow")}</div>
      <div class="route-node">
        <span class="route-icon">${n("studio")}</span>
        <div><small>${a("studio.mixer")}</small><strong>MicDeck Engine</strong></div>
      </div>
      <div class="route-line ${t.nativeAudio.ready?"is-flowing":""}"><i></i>${n("arrow")}</div>
      <div class="route-node">
        <span class="route-icon">${n("mic")}</span>
        <div><small>${a("studio.output")}</small><strong>${u(t.virtualAudio.microphoneName||t.microphoneNameInput)}</strong></div>
      </div>
    </section>

    <div class="studio-grid">
      <section class="surface mixer-surface">
        <div class="surface-head">
          <div><div class="panel-kicker">LIVE MIX</div><h2>${a("studio.mixerTitle")}</h2></div>
          <span class="status-pill ${t.nativeAudio.ready?"is-good":"is-warn"}">${t.nativeAudio.ready?a("studio.engineOnline"):a("studio.engineOffline")}</span>
        </div>
        <div class="mixer-channels">
          <div class="mixer-channel">
            <div class="channel-icon">${n("mic")}</div>
            ${f("microphone-gain-range",a("studio.microphone"),a("studio.yourVoice"),t.microphoneGain,3,.01,"microphone-gain-value")}
            ${V("MIC",t.nativeAudio.microphoneLevel01,"microphone",a("studio.physicalInput"))}
            <div class="mixer-filter-toggles">
              ${w("aecEnabled",a("filters.aec"),a("filters.aecShort"),"AEC3")}
              ${w("rnnoiseEnabled",a("filters.rnnoise"),a("filters.rnnoiseShort"),"RNNoise")}
            </div>
          </div>
          <div class="mixer-channel">
            <div class="channel-icon">${n("library")}</div>
            ${f("volume-range","Soundboard",a("studio.bindsFiles"),t.volume,6,.01,"sound-gain-value")}
            ${f("overdrive-range","Drive",a("studio.extraSaturation"),t.soundOverdrive,4,.05,"overdrive-value",fe)}
          </div>
          <div class="mixer-channel ${e?"is-hot":""}">
            <div class="channel-icon">${n("monitor")}</div>
            ${f("system-gain-range","System audio",a(e?"studio.transmissionActive":"studio.transmissionOff"),t.systemAudioGain,2,.01,"system-gain-value")}
            ${V("SYSTEM",t.nativeAudio.systemLevel01,"system","Loopback WASAPI")}
          </div>
          <div class="mixer-channel master-channel">
            <div class="channel-icon">${n("route")}</div>
            ${f("monitor-range",a("studio.bindMonitoring"),a(e?"studio.mutedDuringBroadcast":"studio.yourHeadphones"),t.monitorGain,2,.01,"monitor-gain-value")}
            ${V("MASTER",t.nativeAudio.mixedLevel01,"mixed",a("studio.virtualMicrophone"))}
          </div>
        </div>
      </section>

      <section class="surface input-surface">
        <div class="surface-head">
          <div><div class="panel-kicker">INPUT</div><h2>${a("studio.voiceSource")}</h2></div>
          <span class="round-icon">${n("mic")}</span>
        </div>
        <label class="field-label" for="physical-microphone">${a("studio.physicalMicrophone")}</label>
        <select id="physical-microphone" class="input" ${t.inputDevices.length?"":"disabled"}>
          ${t.inputDevices.length?t.inputDevices.map(i=>`<option value="${u(i.id)}" ${i.id===t.selectedInputDevice?"selected":""}>${u(i.name)}</option>`).join(""):`<option>${a("studio.noMicrophone")}</option>`}
        </select>
        <div class="engine-stats">
          <div><span>${a("studio.latency")}</span><strong>${T()}</strong></div>
          <div><span>XRUN</span><strong>${t.nativeAudio.underruns||0}</strong></div>
          <div><span>${a("studio.process")}</span><strong>${t.nativeAudio.enginePid||"—"}</strong></div>
          <div><span>${a("studio.format")}</span><strong>48 kHz / F32</strong></div>
        </div>
        <div class="input-actions">
          <button class="button button-subtle" id="stop-btn">${n("stop")} ${a("studio.stopBind")}</button>
          <button class="icon-button" id="restart-engine-btn" title="${a("studio.restartEngine")}" ${t.isRestartingEngine?"disabled":""}>${n("refresh")}</button>
        </div>
      </section>
    </div>
  `}function St(){const e=t.virtualAudio.microphoneName||t.microphoneNameInput;return t.settingsSection==="filters"?`
      ${L(a("settings.kicker"),a("settings.title"),a("settings.description"))}
      ${ue()}
      ${kt()}
    `:`
    ${L(a("settings.kicker"),a("settings.title"),a("settings.description"))}
    ${ue()}

    <div class="settings-grid">
      <section class="surface settings-card driver-card">
        <div class="surface-head">
          <div>
            <div class="panel-kicker">VIRTUAL DEVICE</div>
            <h2>${a("settings.virtualMicrophone")}</h2>
          </div>
          <span class="status-pill ${t.virtualAudio.ready?"is-good":"is-warn"}">${t.virtualAudio.ready?a("common.ready"):a("common.setup")}</span>
        </div>
        ${t.virtualAudio.ready?`
          <div class="device-route-card">
            <span class="round-icon">${n("route")}</span>
            <div>
              <small>${a("settings.mixOutput")}</small>
              <strong>${u(t.virtualAudio.renderDeviceName||"Managed cable")}</strong>
            </div>
            ${n("check","route-check")}
          </div>
          <label class="field-label" for="microphone-name">${a("settings.systemName")}</label>
          <div class="inline-field">
            <input id="microphone-name" class="input" maxlength="80" value="${u(t.microphoneNameInput)}" />
            <button class="button button-primary" id="rename-microphone-btn" ${t.isRenamingMicrophone?"disabled":""}>
              ${t.isRenamingMicrophone?'<span class="spinner"></span>':a("common.save")}
            </button>
          </div>
          <p class="helper-text">${a("settings.systemNameHelp")}</p>
        `:`
          <div class="setup-callout">
            ${n("alert")}
            <div>
              <strong>${a("settings.deviceInactive")}</strong>
              <p>${u(t.virtualAudio.error||(t.virtualAudio.restartRequired?a("settings.driverInstalledRestart"):a("settings.installDriverHelp")))}</p>
            </div>
          </div>
          <button class="button button-accent full-button" id="install-driver-btn" ${t.isInstallingDriver?"disabled":""}>
            ${t.isInstallingDriver?`<span class="spinner"></span> ${a("common.installing")}`:`${n("download")} ${a("settings.installDriver")}`}
          </button>
        `}
        <div class="vendor-note">${a("settings.deviceLayer")}: ${u(t.virtualAudio.vendor)} · <a href="https://vb-audio.com/Cable/" target="_blank" rel="noreferrer">${a("settings.donationware")}</a></div>
      </section>

      <section class="surface settings-card engine-settings">
        <div class="surface-head">
          <div>
            <div class="panel-kicker">AUDIO CORE</div>
            <h2>${a("settings.nativeEngine")}</h2>
          </div>
          <span class="status-pill ${t.nativeAudio.ready?"is-good":"is-warn"}">${t.nativeAudio.ready?"ONLINE":t.nativeAudio.state.toUpperCase()}</span>
        </div>
        <div class="diagnostic-list">
          <div><span>Runtime</span><strong>${u(t.nativeAudio.runtime)}</strong></div>
          <div><span>${a("settings.protocol")}</span><strong>IPC v${t.nativeAudio.protocolVersion||"—"}</strong></div>
          <div><span>${a("settings.bufferMode")}</span><strong>Adaptive low-latency</strong></div>
          <div><span>${a("settings.estimatedLatency")}</span><strong>${T()}</strong></div>
          <div><span>XRUN / underrun</span><strong>${t.nativeAudio.underruns||0}</strong></div>
          <div><span>Capture overrun</span><strong>${t.nativeAudio.captureOverruns||0}</strong></div>
          <div><span>Dropped IPC frames</span><strong>${t.nativeAudio.droppedAudioFrames||0}</strong></div>
        </div>
        ${t.nativeAudio.error?`<div class="setup-callout compact">${n("alert")}<div><strong>${a("settings.engineError")}</strong><p>${u(t.nativeAudio.error)}</p></div></div>`:""}
        <button class="button button-subtle full-button" id="restart-engine-btn" ${t.isRestartingEngine?"disabled":""}>
          ${t.isRestartingEngine?`<span class="spinner"></span> ${a("common.restarting")}`:`${n("refresh")} ${a("settings.restartEngine")}`}
        </button>
      </section>

      <section class="surface settings-card windows-settings">
        <div class="surface-head">
          <div>
            <div class="panel-kicker">DESKTOP</div>
            <h2>${a("settings.windowsIntegration")}</h2>
          </div>
          <span class="status-pill ${t.autostartEnabled?"is-good":""}">${a(t.autostartEnabled?"common.on":"common.off")}</span>
        </div>
        <div class="preference-list">
          <div class="preference-row">
            <span class="round-icon">${n("power")}</span>
            <div>
              <strong>${a("settings.autostart")}</strong>
              <p>${a("settings.autostartDescription")}</p>
            </div>
            <button class="toggle-switch ${t.autostartEnabled?"is-on":""}" id="autostart-toggle" role="switch" aria-checked="${t.autostartEnabled}" aria-label="${a("settings.autostart")}" ${t.isUpdatingAutostart?"disabled":""}>
              <i></i>
            </button>
          </div>
          <div class="preference-row">
            <span class="round-icon">${n("tray")}</span>
            <div>
              <strong>${a("settings.tray")}</strong>
              <p>${a("settings.trayDescription")}</p>
            </div>
            <span class="always-on">${a("common.alwaysOn")}</span>
          </div>
          <div class="preference-row">
            <span class="round-icon glow-setting-icon">${n("sparkle")}</span>
            <div>
              <strong>${a("settings.cursorGlow")}</strong>
              <p>${a("settings.cursorGlowDescription")}</p>
            </div>
            <button class="toggle-switch ${t.cursorGlowEnabled?"is-on":""}" id="cursor-glow-toggle" role="switch" aria-checked="${t.cursorGlowEnabled}" aria-label="${a("settings.cursorGlow")}">
              <i></i>
            </button>
          </div>
          <div class="preference-row microphone-repair-row">
            <span class="round-icon">${n("mic")}</span>
            <div>
              <strong>${a("settings.repairMicrophone")}</strong>
              <p>${a("settings.repairMicrophoneDescription")}</p>
            </div>
            <button class="button button-subtle repair-microphone-button" id="repair-microphone-btn" ${t.isRepairingDefaultMicrophone?"disabled":""}>
              ${t.isRepairingDefaultMicrophone?'<span class="spinner"></span>':n("refresh")}
              ${a(t.isRepairingDefaultMicrophone?"settings.repairingMicrophone":"settings.repairMicrophoneAction")}
            </button>
          </div>
        </div>
      </section>

      <section class="surface settings-card guide-card">
        <div class="surface-head">
          <div>
            <div class="panel-kicker">VOICE APPS</div>
            <h2>${a("settings.discordTitle")}</h2>
          </div>
          <span class="round-icon discord-mark">D</span>
        </div>
        <ol class="setup-steps">
          <li><span>01</span><div><strong>${a("settings.discordOpen")}</strong><p>${a("settings.discordOpenHelp")}</p></div></li>
          <li><span>02</span><div><strong>${a("settings.discordInput")}</strong><p>${u(a("settings.discordInputHelp",{microphone:e}))}</p></div></li>
          <li><span>03</span><div><strong>${a("settings.discordProcessing")}</strong><p>${a("settings.discordProcessingHelp")}</p></div></li>
        </ol>
        <div class="guide-tip">${n("bolt")} ${a("settings.discordTip")}</div>
      </section>

      <section class="surface settings-card about-card">
        <div class="about-mark">${K()}</div>
        <div class="panel-kicker">MICDECK</div>
        <h2>Trigger. Route. Be heard.</h2>
        <p>${a("settings.about")}</p>
        <div class="tech-tags"><span>Rust</span><span>C++</span><span>WASAPI</span><span>Tauri</span></div>
      </section>
    </div>
  `}function d(){const e=dt(),i=t.activeView==="studio"?At():t.activeView==="streamer"?$t():t.activeView==="settings"?St():ft();document.querySelector("#app").innerHTML=`
    <div class="app-shell ${t.cursorGlowEnabled?"glow-enabled":""}">
      <div class="ambient-canvas" aria-hidden="true">
        <div class="ambient-grid"></div>
        <div class="cursor-glow"></div>
      </div>
      ${ut()}
      <main class="app-content">
        ${pt()}
        ${e?`<div class="top-alert">${n("alert")}<span>${u(e)}</span><button class="nav-to-settings">${a("common.openSettings")}</button></div>`:""}
        <div class="view-wrap">${i}</div>
      </main>
      <div id="toast-host" class="toast-host"></div>
      ${bt()}
    </div>
  `,Et(),H(),be=t.playback.isPlaying?t.playback.soundId:null}function Et(){document.querySelectorAll("[data-language]").forEach(i=>{i.addEventListener("click",()=>nt(i.dataset.language))}),document.querySelectorAll("[data-view]").forEach(i=>{i.addEventListener("click",()=>{t.activeView=i.dataset.view,d()})}),document.querySelector(".nav-to-settings")?.addEventListener("click",()=>{t.activeView="settings",d()}),document.getElementById("add-btn")?.addEventListener("click",ne),document.getElementById("empty-add-btn")?.addEventListener("click",ne),document.getElementById("url-btn")?.addEventListener("click",le),document.querySelectorAll("#stop-btn").forEach(i=>i.addEventListener("click",et)),document.getElementById("install-driver-btn")?.addEventListener("click",at),document.getElementById("rename-microphone-btn")?.addEventListener("click",de),document.getElementById("restart-engine-btn")?.addEventListener("click",st),document.getElementById("repair-microphone-btn")?.addEventListener("click",rt),document.getElementById("system-audio-toggle")?.addEventListener("click",F),document.getElementById("system-audio-cta")?.addEventListener("click",F),document.getElementById("streamer-broadcast-toggle")?.addEventListener("click",F),document.getElementById("autostart-toggle")?.addEventListener("click",lt),document.getElementById("cursor-glow-toggle")?.addEventListener("click",Ke),document.getElementById("physical-microphone")?.addEventListener("change",i=>tt(i.target.value)),document.querySelectorAll("[data-settings-section]").forEach(i=>{i.addEventListener("click",()=>{t.settingsSection=i.dataset.settingsSection,d()})}),document.querySelectorAll("[data-open-filter-settings]").forEach(i=>{i.addEventListener("click",()=>{t.activeView="settings",t.settingsSection="filters",d()})}),document.querySelectorAll("[data-voice-toggle]").forEach(i=>{i.addEventListener("click",()=>{const s=i.dataset.voiceToggle;E({[s]:!t.voiceProcessing[s]},{rerender:!0,immediate:!0})})}),document.getElementById("microphone-gain-range")?.addEventListener("input",i=>S("set_microphone_gain","microphoneGain",i.target.value,".microphone-gain-value")),document.getElementById("streamer-microphone-gain-range")?.addEventListener("input",i=>S("set_microphone_gain","microphoneGain",i.target.value,".streamer-microphone-gain-value")),document.getElementById("volume-range")?.addEventListener("input",i=>it(i.target.value)),document.getElementById("overdrive-range")?.addEventListener("input",i=>S("set_sound_overdrive","soundOverdrive",i.target.value,".overdrive-value",fe)),document.getElementById("monitor-range")?.addEventListener("input",i=>S("set_monitor_gain","monitorGain",i.target.value,".monitor-gain-value")),document.getElementById("system-gain-range")?.addEventListener("input",i=>S("set_system_audio_gain","systemAudioGain",i.target.value,".system-gain-value")),document.getElementById("streamer-system-gain-range")?.addEventListener("input",i=>S("set_system_audio_gain","systemAudioGain",i.target.value,".streamer-system-gain-value")),document.getElementById("voice-monitor-gain-range")?.addEventListener("input",i=>{const s=Number(i.target.value);t.voiceProcessing.voiceMonitorGain=s;const r=document.querySelector(".voice-monitor-gain-value");r&&(r.textContent=B(s)),E({voiceMonitorGain:s})});const e=()=>{const i=Number(document.getElementById("target-center-range")?.value),s=Number(document.getElementById("target-tolerance-range")?.value);if(!Number.isFinite(i)||!Number.isFinite(s))return;const r=Math.max(-36,i-s),o=Math.min(-3,i+s);t.voiceProcessing.targetMinDb=r,t.voiceProcessing.targetMaxDb=o;const l=document.querySelector(".target-center-value"),m=document.querySelector(".target-tolerance-value"),b=document.querySelector(".target-range-value");l&&(l.textContent=`${i.toFixed(1)} dBFS`),m&&(m.textContent=`±${s.toFixed(1)} dB`),b&&(b.textContent=`${r.toFixed(1)}…${o.toFixed(1)} dBFS`),document.querySelectorAll(".target-db-band").forEach(R=>{const C=M(r);R.style.left=`${C}%`,R.style.width=`${Math.max(2,M(o)-C)}%`}),E({targetMinDb:r,targetMaxDb:o})};document.getElementById("target-center-range")?.addEventListener("input",e),document.getElementById("target-tolerance-range")?.addEventListener("input",e),document.getElementById("gate-threshold-range")?.addEventListener("input",i=>{const s=Number(i.target.value),r=document.querySelector(".gate-threshold-value");r&&(r.textContent=k(s)),E({gateThresholdDb:s})}),document.getElementById("compressor-ratio-range")?.addEventListener("input",i=>{const s=Number(i.target.value),r=document.querySelector(".compressor-ratio-value");r&&(r.textContent=`${s.toFixed(1)}:1`),E({compressorRatio:s})}),document.getElementById("limiter-ceiling-range")?.addEventListener("input",i=>{const s=Number(i.target.value),r=document.querySelector(".limiter-ceiling-value");r&&(r.textContent=k(s)),E({limiterCeilingDb:s})}),document.querySelectorAll("[data-session-volume]").forEach(i=>{i.addEventListener("input",s=>ot(s.currentTarget.dataset.sessionVolume,s.currentTarget.value))}),document.querySelectorAll("[data-platform]").forEach(i=>{i.addEventListener("click",()=>{t.mediaPlatform=i.dataset.platform,d(),document.getElementById("url-input")?.focus()})}),document.getElementById("url-input")?.addEventListener("input",i=>{t.urlInput=i.target.value;const s=document.querySelector(".detected-platform");s&&(s.textContent=W())}),document.getElementById("url-input")?.addEventListener("keydown",i=>{i.key==="Enter"&&le()}),document.getElementById("search-input")?.addEventListener("input",i=>{t.filter=i.target.value,d();const s=document.getElementById("search-input");s?.focus(),s?.setSelectionRange(t.filter.length,t.filter.length)}),document.getElementById("microphone-name")?.addEventListener("input",i=>{t.microphoneNameInput=i.target.value,t.microphoneNameDirty=!0}),document.getElementById("microphone-name")?.addEventListener("keydown",i=>{i.key==="Enter"&&de()}),document.querySelectorAll(".play-btn").forEach(i=>{i.addEventListener("click",()=>Qe(i.dataset.id))}),document.querySelectorAll(".remove-btn").forEach(i=>{i.addEventListener("click",()=>Xe(i.dataset.id))}),document.querySelectorAll("[data-shortcut-id]").forEach(i=>{i.addEventListener("click",()=>He(i.dataset.shortcutId))}),document.querySelectorAll("[data-cancel-shortcut]").forEach(i=>{i.addEventListener("click",Y)}),document.querySelector("[data-save-shortcut]")?.addEventListener("click",()=>{const i=Ue();i&&oe(i)}),document.querySelector("[data-clear-shortcut]")?.addEventListener("click",()=>oe(null)),document.querySelector("[data-close-shortcut]")?.addEventListener("click",i=>{i.target===i.currentTarget&&Y()})}function zt(){[["microphone",t.nativeAudio.microphoneLevel01],["system",t.nativeAudio.systemLevel01],["mixed",t.nativeAudio.mixedLevel01]].forEach(([r,o])=>{document.querySelectorAll(`.${r}-meter-fill`).forEach(l=>{l.closest(".vertical-meter")?l.style.height=`${h(o)}%`:l.style.width=`${h(o)}%`}),document.querySelectorAll(`.${r}-meter-value`).forEach(l=>{l.textContent=`${h(o)}%`})}),[["microphone-input",t.nativeAudio.microphoneInputLevel01],["microphone-output",t.nativeAudio.microphoneOutputLevel01],["system-input",t.nativeAudio.systemInputLevel01],["system-output",t.nativeAudio.systemOutputLevel01],["streamer-master",t.nativeAudio.mixedLevel01]].forEach(([r,o])=>{const l=ke(o);document.querySelectorAll(`.${r}-db-fill`).forEach(m=>{m.style.width=`${M(l)}%`}),document.querySelectorAll(`.${r}-db-value`).forEach(m=>{m.textContent=k(l)})});const s=h(t.nativeAudio.voiceProbability01);document.querySelectorAll(".voice-probability-fill").forEach(r=>{r.style.width=`${s}%`}),document.querySelectorAll(".voice-probability-value").forEach(r=>{r.textContent=`${s}%`}),document.querySelectorAll(".microphone-applied-gain").forEach(r=>{r.textContent=x(t.nativeAudio.microphoneAppliedGain)}),document.querySelectorAll(".system-applied-gain").forEach(r=>{r.textContent=x(t.nativeAudio.systemAppliedGain)})}function pe(e){return e.map(i=>`${i.id}:${i.name}:${i.iconDataUrl?1:0}`).join("|")}function Mt(){if(!["studio","streamer"].includes(t.activeView)||!t.systemAudioEnabled)return;const e=new Map([...document.querySelectorAll("[data-session-row]")].map(i=>[i.dataset.sessionRow,i]));t.audioSessions.forEach(i=>{const s=e.get(i.id);if(!s)return;s.classList.toggle("is-playing",!!i.active);const r=s.querySelector("[data-session-meter]");r&&(r.style.width=`${h(i.peakLevel01)}%`);const o=s.querySelector("[data-session-activity]");o&&(o.textContent=i.active?a("studio.playingNow"):Se(i.lastActiveMs));const l=s.querySelector("[data-session-volume]");l&&document.activeElement!==l&&!N.has(i.id)&&(l.value=String(Math.max(0,Math.min(1,Number(i.volume||0)))));const m=s.querySelector("[data-session-volume-output]");m&&!N.has(i.id)&&(m.textContent=`${Math.round(Math.max(0,Math.min(1,Number(i.volume||0)))*100)}%`)})}async function Dt(){try{const e=await c("list_audio_sessions"),i=pe(t.audioSessions)!==pe(e);t.audioSessions=e,i&&["studio","streamer"].includes(t.activeView)&&t.systemAudioEnabled?d():Mt()}catch{}}function It(){if(t.activeView!=="library")return;if((t.playback.isPlaying?t.playback.soundId:null)!==be){d();return}const i=document.querySelector(".now-title"),s=document.querySelector(".now-meta"),r=document.querySelector(".signal-db"),o=document.querySelector(".signal-fill"),l=document.querySelector(".now-progress .progress-fill"),m=document.querySelector(".sound-card.is-live .mini-fill");i&&(i.textContent=t.playback.isPlaying?t.playback.soundName||a("player.untitled"):a("player.silence")),s&&(s.textContent=t.playback.isPlaying?`${j(t.playback.positionMs)} / ${j(t.playback.durationMs)}`:a("player.pickSound")),r&&(r.textContent=k(t.playback.signalDbfs)),o&&(o.style.width=`${we(t.playback.signalDbfs)}%`),l&&(l.style.width=`${Math.round((t.playback.progress01||0)*100)}%`),m&&(m.style.width=`${Math.round((t.playback.progress01||0)*100)}%`)}async function Nt(){try{const e=`${t.nativeAudio.ready}:${t.nativeAudio.state}:${t.nativeAudio.error||""}`;[t.playback,t.nativeAudio]=await Promise.all([c("get_playback_status"),c("get_native_audio_status")]);const i=`${t.nativeAudio.ready}:${t.nativeAudio.state}:${t.nativeAudio.error||""}`;if(e!==i){d();return}It(),zt()}catch{clearInterval(_),_=null}}function Z(){_||(_=setInterval(Nt,180),ie||(ie=setInterval(Dt,700)))}window.addEventListener("keydown",Ye,!0);Ze();Je().catch(()=>{});y().then(async()=>{(await G())?.size&&d(),Z()}).catch(e=>{document.querySelector("#app").innerHTML=`
      <div class="boot-error">
        ${K()}
        <h1>${a("boot.title")}</h1>
        <p>${u(e)}</p>
      </div>
    `});
