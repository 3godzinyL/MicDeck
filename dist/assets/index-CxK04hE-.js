(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))n(r);new MutationObserver(r=>{for(const u of r)if(u.type==="childList")for(const g of u.addedNodes)g.tagName==="LINK"&&g.rel==="modulepreload"&&n(g)}).observe(document,{childList:!0,subtree:!0});function s(r){const u={};return r.integrity&&(u.integrity=r.integrity),r.referrerPolicy&&(u.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?u.credentials="include":r.crossOrigin==="anonymous"?u.credentials="omit":u.credentials="same-origin",u}function n(r){if(r.ep)return;r.ep=!0;const u=s(r);fetch(r.href,u)}})();function mt(t,a=!1){return window.__TAURI_INTERNALS__.transformCallback(t,a)}async function l(t,a={},s){return window.__TAURI_INTERNALS__.invoke(t,a,s)}var x;(function(t){t.WINDOW_RESIZED="tauri://resize",t.WINDOW_MOVED="tauri://move",t.WINDOW_CLOSE_REQUESTED="tauri://close-requested",t.WINDOW_DESTROYED="tauri://destroyed",t.WINDOW_FOCUS="tauri://focus",t.WINDOW_BLUR="tauri://blur",t.WINDOW_SCALE_FACTOR_CHANGED="tauri://scale-change",t.WINDOW_THEME_CHANGED="tauri://theme-changed",t.WINDOW_CREATED="tauri://window-created",t.WEBVIEW_CREATED="tauri://webview-created",t.DRAG_ENTER="tauri://drag-enter",t.DRAG_OVER="tauri://drag-over",t.DRAG_DROP="tauri://drag-drop",t.DRAG_LEAVE="tauri://drag-leave"})(x||(x={}));async function gt(t,a){window.__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener(t,a),await l("plugin:event|unlisten",{event:t,eventId:a})}async function yt(t,a,s){var n;const r=(n=void 0)!==null&&n!==void 0?n:{kind:"Any"};return l("plugin:event|listen",{event:t,target:r,handler:mt(a)}).then(u=>async()=>gt(t,u))}async function X(){return await l("plugin:autostart|is_enabled")}async function vt(){await l("plugin:autostart|enable")}async function ht(){await l("plugin:autostart|disable")}async function bt(t={}){return typeof t=="object"&&Object.freeze(t),await l("plugin:dialog|open",{options:t})}function m(t,a,s,n){if(typeof a=="function"?t!==a||!n:!a.has(t))throw new TypeError("Cannot read private member from an object whose class did not declare it");return s==="m"?n:s==="a"?n.call(t):n?n.value:a.get(t)}function k(t,a,s,n,r){if(typeof a=="function"?t!==a||!0:!a.has(t))throw new TypeError("Cannot write private member to an object whose class did not declare it");return a.set(t,s),s}var h,y,f,A;const G="__TAURI_TO_IPC_KEY__";function ft(t,a=!1){return window.__TAURI_INTERNALS__.transformCallback(t,a)}class wt{constructor(a){h.set(this,void 0),y.set(this,0),f.set(this,[]),A.set(this,void 0),k(this,h,a||(()=>{})),this.id=ft(s=>{const n=s.index;if("end"in s){n==m(this,y,"f")?this.cleanupCallback():k(this,A,n);return}const r=s.message;if(n==m(this,y,"f")){for(m(this,h,"f").call(this,r),k(this,y,m(this,y,"f")+1);m(this,y,"f")in m(this,f,"f");){const u=m(this,f,"f")[m(this,y,"f")];m(this,h,"f").call(this,u),delete m(this,f,"f")[m(this,y,"f")],k(this,y,m(this,y,"f")+1)}m(this,y,"f")===m(this,A,"f")&&this.cleanupCallback()}else m(this,f,"f")[n]=r})}cleanupCallback(){window.__TAURI_INTERNALS__.unregisterCallback(this.id)}set onmessage(a){k(this,h,a)}get onmessage(){return m(this,h,"f")}[(h=new WeakMap,y=new WeakMap,f=new WeakMap,A=new WeakMap,G)](){return`__CHANNEL__:${this.id}`}toJSON(){return this[G]()}}async function Q(t,a={},s){return window.__TAURI_INTERNALS__.invoke(t,a,s)}async function kt(t,a){const s=new wt;return s.onmessage=a,await Q("plugin:global-shortcut|register",{shortcuts:Array.isArray(t)?t:[t],handler:s})}async function tt(){return await Q("plugin:global-shortcut|unregister_all",{})}const et="micdeck.language";function $t(){try{const t=localStorage.getItem(et);if(t==="pl"||t==="en")return t}catch{}return navigator.language.toLowerCase().startsWith("pl")?"pl":"en"}const U={pl:{"common.adaptive":"adaptacyjne","common.save":"Zapisz","common.installing":"Instalowanie…","common.restarting":"Restartowanie…","common.ready":"GOTOWY","common.setup":"KONFIGURACJA","common.online":"ONLINE","common.on":"WŁ.","common.off":"WYŁ.","common.alwaysOn":"ZAWSZE AKTYWNY","common.openSettings":"Otwórz ustawienia","common.stop":"Zatrzymaj","common.remove":"Usuń","common.cancel":"Anuluj","language.label":"Język aplikacji","language.polish":"Polski","language.english":"English","toolbar.tray":"Aktywna w zasobniku Windows","toast.soundsAdded.one":"Dodano {count} dźwięk.","toast.soundsAdded.many":"Dodano {count} dźwięki.","toast.imported":"Audio z {source} jest gotowe w bibliotece.","toast.removed":"Dźwięk usunięty.","toast.playFailed":"Nie udało się odtworzyć dźwięku: {error}","toast.inputChanged":"Mikrofon wejściowy został zmieniony.","toast.engineRequired":"Najpierw uruchom silnik audio i skonfiguruj wirtualny mikrofon.","toast.systemOn":"Transmisja dźwięku systemowego jest aktywna.","toast.systemOff":"Transmisja dźwięku systemowego została wyłączona.","toast.driverFailed":"Instalacja sterownika nie powiodła się: {error}","toast.micRenamed":"Nazwa wirtualnego mikrofonu została zmieniona.","toast.engineRestarted":"Silnik audio został uruchomiony ponownie.","toast.autostartOn":"MicDeck uruchomi się z Windows i pozostanie schowany w zasobniku.","toast.autostartOff":"Autostart MicDeck został wyłączony.","toast.languageChanged":"Język aplikacji został zmieniony.","toast.shortcutSaved":"Globalny bind został zapisany.","toast.shortcutCleared":"Globalny bind został usunięty.","toast.shortcutUnavailable":"Ten skrót jest zajęty przez Windows lub inną aplikację. Wybierz inną kombinację.","toast.glowOn":"Cursor glow został włączony.","toast.glowOff":"Cursor glow został wyłączony.","confirm.remove":"Usunąć ten dźwięk z biblioteki?","alert.restartWindows":"Sterownik jest zainstalowany. Uruchom Windows ponownie, aby aktywować wirtualny mikrofon.","alert.driver":"Sterownik audio: {error}","alert.engine":"Silnik audio nie wystartował. Otwórz Ustawienia i uruchom go ponownie.","nav.aria":"Główna nawigacja","nav.workspace":"Workspace","nav.library":"Biblioteka","nav.studio":"Studio live","nav.settings":"Ustawienia","nav.routeReady":"Trasa aktywna","nav.routeSetup":"Wymaga konfiguracji","nav.routeReadyDescription":"Miks trafia do wirtualnego mikrofonu.","nav.routeSetupDescription":"Sprawdź silnik i sterownik w Ustawieniach.","capture.source":"Źródło nagrania","player.nowPlaying":"TERAZ GRA","player.label":"ODTWARZACZ","player.untitled":"Bez nazwy","player.silence":"Cisza na decku","player.pickSound":"Wybierz dźwięk z biblioteki, aby rozpocząć.","player.signal":"Poziom sygnału","player.playing":"Odtwarzanie","player.play":"Odtwórz","sound.downloaded":"Pobrane","sound.local":"Plik lokalny","shortcut.label":"GLOBALNY BIND","shortcut.assign":"Ustaw bind","shortcut.clickToEdit":"Kliknij, aby ustawić lub zmienić globalny bind","shortcut.unavailable":"Bind jest obecnie zajęty przez Windows lub inną aplikację","shortcut.title":"Nagraj kombinację","shortcut.waiting":"Wciśnij klawisze","shortcut.pressFirst":"Wciśnij modyfikator, np. Alt, Ctrl lub Shift — albo od razu klawisz aktywacji.","shortcut.pressTrigger":"Modyfikator zapisany. Teraz wciśnij klawisz aktywacji, np. P.","shortcut.ready":"Kombinacja jest gotowa. Zapisz ją albo wciśnij inny klawisz, aby go podmienić.","shortcut.undo":"cofnij klawisz","shortcut.clear":"Usuń bind","shortcut.unsupported":"Ten klawisz nie może być użyty jako globalny bind.","worker.captureTitle":"Quick Capture pracuje w tle","worker.filesTitle":"Biblioteka pracuje w tle","worker.thread":"UI POZOSTAJE PŁYNNE","worker.queued":"Zadanie czeka na worker","worker.validating":"Sprawdzam link i źródło","worker.downloading":"Pobieram najlepszą ścieżkę audio","worker.analyzing":"Analizuję plik i przygotowuję waveform","worker.finalizing":"Odświeżam bibliotekę","worker.complete":"Gotowe","worker.failed":"Worker zatrzymał zadanie z błędem","library.kicker":"Sound library","library.title":"Twoje dźwięki","library.description":"Importuj, organizuj i odpalaj materiały bez wychodzenia z jednego widoku.","library.addFiles":"Dodaj pliki","library.captureTitle":"Pobierz audio z linku","library.captureDescription":"Wklej YouTube, Shorts lub TikTok. MicDeck pobierze najlepszą ścieżkę audio i doda ją do biblioteki.","library.downloading":"Pobieram","library.download":"Pobierz","library.requirements":"Wymaga yt-dlp + ffmpeg w PATH","library.rightsNotice":"Pobieraj i udostępniaj tylko materiały, do których masz prawa.","library.sectionTitle":"Biblioteka","library.item.one":"element","library.item.many":"elementów","library.search":"Szukaj dźwięku…","library.noResults":"Brak pasujących wyników","library.empty":"Twój deck czeka na pierwszy dźwięk","library.changeSearch":"Zmień wyszukiwaną frazę.","library.emptyDescription":"Dodaj plik lokalny albo pobierz audio z obsługiwanego linku.","library.addFirst":"Dodaj pierwszy plik","studio.kicker":"Live routing","studio.title":"Studio","studio.description":"Steruj miksem, poziomami i transmisją dźwięku systemowego w czasie rzeczywistym.","studio.live":"TRANSMISJA AKTYWNA","studio.systemAudio":"SYSTEM AUDIO","studio.broadcastingTitle":"Dźwięk pulpitu leci na Discorda","studio.broadcastTitle":"Udostępnij to, co słyszysz","studio.broadcastingDescription":"YouTube, Spotify, gry i pozostałe aplikacje są domieszane do wirtualnego mikrofonu.","studio.broadcastDescription":"Jednym przyciskiem przechwyć domyślne wyjście Windows i skieruj je do rozmowy głosowej.","studio.stopBroadcast":"Zatrzymaj transmisję","studio.startBroadcast":"Włącz transmisję","studio.echoNote":"Podsłuch bindów jest automatycznie wyciszany podczas transmisji, aby uniknąć echa.","studio.sources":"ŹRÓDŁA","studio.sourceApps":"Spotify / YouTube / gry","studio.mixer":"MIKSER","studio.output":"WYJŚCIE","studio.mixerTitle":"Mikser","studio.engineOnline":"ENGINE ONLINE","studio.engineOffline":"ENGINE OFFLINE","studio.microphone":"Mikrofon","studio.yourVoice":"Twój głos","studio.physicalInput":"Wejście fizyczne","studio.bindsFiles":"Bindy i pliki","studio.extraSaturation":"Dodatkowe nasycenie","studio.transmissionActive":"Transmisja aktywna","studio.transmissionOff":"Transmisja wyłączona","studio.bindMonitoring":"Podsłuch bindów","studio.mutedDuringBroadcast":"Wyciszony podczas transmisji","studio.yourHeadphones":"Twoje słuchawki","studio.virtualMicrophone":"Wirtualny mikrofon","studio.voiceSource":"Źródło głosu","studio.physicalMicrophone":"Fizyczny mikrofon","studio.noMicrophone":"Nie znaleziono mikrofonu","studio.latency":"Opóźnienie","studio.process":"Proces","studio.format":"Format","studio.stopBind":"Zatrzymaj bind","studio.restartEngine":"Restart silnika","settings.kicker":"Configuration","settings.title":"Ustawienia","settings.description":"Zarządzaj wirtualnym mikrofonem, silnikiem i integracją z aplikacjami głosowymi.","settings.virtualMicrophone":"Wirtualny mikrofon","settings.mixOutput":"WYJŚCIE MIKSU","settings.systemName":"Nazwa widoczna w systemie","settings.systemNameHelp":"Ta nazwa pojawi się w Discordzie, grach i OBS. Zmiana może wywołać monit UAC.","settings.deviceInactive":"Wirtualne urządzenie nie jest aktywne","settings.driverInstalledRestart":"Sterownik jest zainstalowany — uruchom Windows ponownie.","settings.installDriverHelp":"Zainstaluj podpisany sterownik VB-CABLE, aby uruchomić routing.","settings.installDriver":"Zainstaluj sterownik","settings.deviceLayer":"Warstwa urządzenia","settings.donationware":"licencja donationware","settings.nativeEngine":"Silnik natywny","settings.protocol":"Protokół","settings.bufferMode":"Tryb bufora","settings.estimatedLatency":"Szacowane opóźnienie","settings.engineError":"Błąd silnika","settings.restartEngine":"Uruchom ponownie silnik","settings.windowsIntegration":"Integracja z Windows","settings.autostart":"Uruchamiaj przy logowaniu","settings.autostartDescription":"MicDeck wystartuje w tle i od razu będzie dostępny w zasobniku systemowym.","settings.tray":"Zasobnik systemowy","settings.trayDescription":"Zamknięcie okna ukrywa aplikację. Aby ją wyłączyć, użyj menu ikony obok zegara.","settings.cursorGlow":"Cursor glow","settings.cursorGlowDescription":"Subtelny, organiczny rozbłysk podąża za kursorem i przenika przez półprzezroczyste panele. Domyślnie włączony.","settings.discordTitle":"Discord w 60 sekund","settings.discordOpen":"Otwórz Głos i wideo","settings.discordOpenHelp":"Discord → Ustawienia użytkownika → Głos i wideo.","settings.discordInput":"Wybierz wejście","settings.discordInputHelp":"Ustaw Default albo {microphone}.","settings.discordProcessing":"Wyłącz obróbkę głosu","settings.discordProcessingHelp":"Krisp, redukcja echa i automatyczna regulacja potrafią wycinać bindy.","settings.discordTip":"Fizyczny mikrofon wybierasz w MicDeck. Discord powinien słuchać wirtualnego miksu.","settings.about":"Natywny soundboard i mikser systemowy dla Windows, zbudowany na Rust, C++ i WASAPI.","boot.title":"MicDeck nie może wystartować"},en:{"common.adaptive":"adaptive","common.save":"Save","common.installing":"Installing…","common.restarting":"Restarting…","common.ready":"READY","common.setup":"SETUP","common.online":"ONLINE","common.on":"ON","common.off":"OFF","common.alwaysOn":"ALWAYS ON","common.openSettings":"Open Settings","common.stop":"Stop","common.remove":"Remove","common.cancel":"Cancel","language.label":"App language","language.polish":"Polski","language.english":"English","toolbar.tray":"Running in the Windows tray","toast.soundsAdded.one":"Added {count} sound.","toast.soundsAdded.many":"Added {count} sounds.","toast.imported":"{source} audio is ready in your library.","toast.removed":"Sound removed.","toast.playFailed":"Could not play the sound: {error}","toast.inputChanged":"Input microphone changed.","toast.engineRequired":"Start the audio engine and configure the virtual microphone first.","toast.systemOn":"System-audio broadcast is live.","toast.systemOff":"System-audio broadcast is off.","toast.driverFailed":"Driver installation failed: {error}","toast.micRenamed":"Virtual microphone renamed.","toast.engineRestarted":"Audio engine restarted.","toast.autostartOn":"MicDeck will start with Windows and stay in the system tray.","toast.autostartOff":"MicDeck autostart is disabled.","toast.languageChanged":"App language changed.","toast.shortcutSaved":"Global hotkey saved.","toast.shortcutCleared":"Global hotkey removed.","toast.shortcutUnavailable":"Windows or another app already owns this shortcut. Choose another combination.","toast.glowOn":"Cursor glow enabled.","toast.glowOff":"Cursor glow disabled.","confirm.remove":"Remove this sound from the library?","alert.restartWindows":"The driver is installed. Restart Windows to activate the virtual microphone.","alert.driver":"Audio driver: {error}","alert.engine":"The audio engine did not start. Open Settings and restart it.","nav.aria":"Main navigation","nav.workspace":"Workspace","nav.library":"Library","nav.studio":"Live Studio","nav.settings":"Settings","nav.routeReady":"Route active","nav.routeSetup":"Setup required","nav.routeReadyDescription":"The mix is reaching your virtual microphone.","nav.routeSetupDescription":"Check the engine and driver in Settings.","capture.source":"Capture source","player.nowPlaying":"NOW PLAYING","player.label":"PLAYER","player.untitled":"Untitled","player.silence":"Nothing on the deck","player.pickSound":"Pick a library sound to get started.","player.signal":"Signal level","player.playing":"Playing","player.play":"Play","sound.downloaded":"Downloaded","sound.local":"Local file","shortcut.label":"GLOBAL HOTKEY","shortcut.assign":"Set hotkey","shortcut.clickToEdit":"Click to set or edit the global hotkey","shortcut.unavailable":"Windows or another application currently owns this hotkey","shortcut.title":"Record a combination","shortcut.waiting":"Press your keys","shortcut.pressFirst":"Press a modifier such as Alt, Ctrl, or Shift — or press the trigger key directly.","shortcut.pressTrigger":"Modifier captured. Now press the trigger key, for example P.","shortcut.ready":"Your combination is ready. Save it or press another trigger key to replace it.","shortcut.undo":"undo key","shortcut.clear":"Clear hotkey","shortcut.unsupported":"That key cannot be used as a global hotkey.","worker.captureTitle":"Quick Capture is working","worker.filesTitle":"Library worker is active","worker.thread":"UI STAYS RESPONSIVE","worker.queued":"Waiting for the background worker","worker.validating":"Validating the link and source","worker.downloading":"Downloading the best audio track","worker.analyzing":"Analyzing audio and preparing the waveform","worker.finalizing":"Refreshing your library","worker.complete":"Complete","worker.failed":"The worker stopped with an error","library.kicker":"Sound library","library.title":"Your sounds","library.description":"Import, organize, and trigger everything from one focused workspace.","library.addFiles":"Add files","library.captureTitle":"Capture audio from a link","library.captureDescription":"Paste YouTube, Shorts, or TikTok. MicDeck grabs the best audio track and adds it to your library.","library.downloading":"Capturing","library.download":"Capture","library.requirements":"Requires yt-dlp + ffmpeg in PATH","library.rightsNotice":"Only download and broadcast media you are allowed to use.","library.sectionTitle":"Library","library.item.one":"item","library.item.many":"items","library.search":"Search sounds…","library.noResults":"No matching results","library.empty":"Your deck is ready for its first sound","library.changeSearch":"Try a different search.","library.emptyDescription":"Add a local file or capture audio from a supported link.","library.addFirst":"Add your first file","studio.kicker":"Live routing","studio.title":"Studio","studio.description":"Control your mix, levels, and system-audio broadcast in real time.","studio.live":"BROADCAST LIVE","studio.systemAudio":"SYSTEM AUDIO","studio.broadcastingTitle":"Your desktop audio is live","studio.broadcastTitle":"Share what you hear","studio.broadcastingDescription":"YouTube, Spotify, games, and other apps are mixed into the virtual microphone.","studio.broadcastDescription":"Capture the default Windows output and route it into voice chat with one button.","studio.stopBroadcast":"Stop broadcast","studio.startBroadcast":"Start broadcast","studio.echoNote":"Sound-pad monitoring is muted automatically during a broadcast to prevent echo.","studio.sources":"SOURCES","studio.sourceApps":"Spotify / YouTube / games","studio.mixer":"MIXER","studio.output":"OUTPUT","studio.mixerTitle":"Mixer","studio.engineOnline":"ENGINE ONLINE","studio.engineOffline":"ENGINE OFFLINE","studio.microphone":"Microphone","studio.yourVoice":"Your voice","studio.physicalInput":"Physical input","studio.bindsFiles":"Pads and files","studio.extraSaturation":"Extra saturation","studio.transmissionActive":"Broadcast live","studio.transmissionOff":"Broadcast off","studio.bindMonitoring":"Pad monitoring","studio.mutedDuringBroadcast":"Muted while broadcasting","studio.yourHeadphones":"Your headphones","studio.virtualMicrophone":"Virtual microphone","studio.voiceSource":"Voice source","studio.physicalMicrophone":"Physical microphone","studio.noMicrophone":"No microphone found","studio.latency":"Latency","studio.process":"Process","studio.format":"Format","studio.stopBind":"Stop sound","studio.restartEngine":"Restart engine","settings.kicker":"Configuration","settings.title":"Settings","settings.description":"Manage the virtual microphone, audio engine, and voice-app integration.","settings.virtualMicrophone":"Virtual microphone","settings.mixOutput":"MIX OUTPUT","settings.systemName":"System display name","settings.systemNameHelp":"This name appears in Discord, games, and OBS. Changing it may trigger a UAC prompt.","settings.deviceInactive":"The virtual device is not active","settings.driverInstalledRestart":"The driver is installed — restart Windows to finish.","settings.installDriverHelp":"Install the signed VB-CABLE driver to enable routing.","settings.installDriver":"Install driver","settings.deviceLayer":"Device layer","settings.donationware":"donationware license","settings.nativeEngine":"Native engine","settings.protocol":"Protocol","settings.bufferMode":"Buffer mode","settings.estimatedLatency":"Estimated latency","settings.engineError":"Engine error","settings.restartEngine":"Restart audio engine","settings.windowsIntegration":"Windows integration","settings.autostart":"Launch at sign-in","settings.autostartDescription":"MicDeck starts in the background and is immediately available from the system tray.","settings.tray":"System tray","settings.trayDescription":"Closing the window hides the app. Use the icon next to the clock when you want to quit.","settings.cursorGlow":"Cursor glow","settings.cursorGlowDescription":"A subtle organic glow follows the pointer beneath the translucent panels. Enabled by default.","settings.discordTitle":"Discord in 60 seconds","settings.discordOpen":"Open Voice & Video","settings.discordOpenHelp":"Discord → User Settings → Voice & Video.","settings.discordInput":"Choose the input","settings.discordInputHelp":"Select Default or {microphone}.","settings.discordProcessing":"Disable voice processing","settings.discordProcessingHelp":"Krisp, echo cancellation, and automatic gain control can cut out sound pads.","settings.discordTip":"Choose your physical microphone in MicDeck. Discord should listen to the virtual mix.","settings.about":"A native Windows soundboard and system mixer built with Rust, C++, and WASAPI.","boot.title":"MicDeck could not start"}};function At(t,a,s={}){let n=U[t]?.[a]??U.en[a]??a;return Object.entries(s).forEach(([r,u])=>{n=n.replaceAll(`{${r}}`,String(u))}),n}const it="micdeck.cursorGlow.v2";function Et(t,a=!1){try{const s=localStorage.getItem(t);return s===null?a:s==="true"}catch{return a}}const e={activeView:"library",language:$t(),autostartEnabled:!1,isUpdatingAutostart:!1,cursorGlowEnabled:Et(it,!0),sounds:[],inputDevices:[],selectedInputDevice:null,microphoneGain:1,volume:1,soundOverdrive:1,monitorGain:0,systemAudioEnabled:!1,systemAudioGain:.85,nativeAudio:{available:!1,ready:!1,state:"starting",protocolVersion:0,enginePid:0,microphoneLevel01:0,systemLevel01:0,mixedLevel01:0,estimatedLatencyMs:0,underruns:0,error:null,runtime:"C++ / WASAPI"},virtualAudio:{installed:!1,ready:!1,installerAttempted:!1,restartRequired:!1,error:null,vendor:"VB-Audio / VB-CABLE Pack45",renderDeviceName:null,microphoneName:null},microphoneNameInput:"MicDeck Virtual Mic",microphoneNameDirty:!1,isInstallingDriver:!1,isRenamingMicrophone:!1,isRestartingEngine:!1,filter:"",urlInput:"",mediaPlatform:"auto",isImporting:!1,isAddingSounds:!1,libraryWorker:null,shortcutRecorder:null,shortcutErrors:new Map,toast:null,playback:{isPlaying:!1,soundId:null,soundName:null,positionMs:0,durationMs:0,progress01:0,signalDbfs:-90,signalLevel01:0}};let S=null,V=null,at=null,w=new Set,N=null,q=window.innerWidth*.72,F=window.innerHeight*.22;const St={library:'<path d="M4 5.5h16M4 12h16M4 18.5h10"/><circle cx="18" cy="18.5" r="2.5"/>',studio:'<path d="M4 8v8M8 5v14M12 9v6M16 3v18M20 7v10"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',plus:'<path d="M12 5v14M5 12h14"/>',download:'<path d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',play:'<path d="m9 7 8 5-8 5Z"/>',stop:'<rect x="7" y="7" width="10" height="10" rx="1"/>',trash:'<path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6"/>',mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/>',monitor:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',route:'<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h4a4 4 0 0 1 4 4v4m-8 4h4"/>',link:'<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.15 1.15M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.15-1.15"/>',bolt:'<path d="m13 2-8 12h7l-1 8 8-12h-7Z"/>',check:'<path d="m5 12 4 4L19 6"/>',alert:'<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v4m0 3h.01"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',refresh:'<path d="M20 6v6h-6M4 18v-6h6"/><path d="M18.5 9A7 7 0 0 0 6 6.5L4 9m2 6.5A7 7 0 0 0 18 15l2-2"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',tray:'<path d="M5 5h14v10H5zM8 19h8M12 15v4"/><path d="M8 9h8"/>',power:'<path d="M12 3v9M6.2 6.2a8 8 0 1 0 11.6 0"/>',keyboard:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M10 10h.01M13 10h.01M16 10h.01M7 14h.01M10 14h7"/>',sparkle:'<path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3Z"/><path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>'};document.documentElement.lang=e.language;function i(t,a){return At(e.language,t,a)}function o(t,a=""){return`<svg class="icon ${a}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${St[t]||""}</svg>`}function O(){return`
    <svg class="brand-glyph" viewBox="0 0 44 44" aria-hidden="true">
      <path d="M7 35V9h7l8 12 8-12h7v26h-7V20l-8 12-8-12v15Z"/>
    </svg>
  `}function c(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function I(t){const a=Math.floor((Number(t)||0)/1e3);return`${String(Math.floor(a/60)).padStart(2,"0")}:${String(a%60).padStart(2,"0")}`}function P(t){return`${Math.round((Number(t)||0)*100)}%`}function st(t){return`×${(Number(t)||1).toFixed(1)}`}function nt(t){return!Number.isFinite(t)||t<=-90?"−∞ dB":`${t>0?"+":""}${t.toFixed(1)} dB`}function ot(t){return Math.round((Math.max(-60,Math.min(12,t))+60)/72*100)}function b(t){return Math.round(Math.max(0,Math.min(1,Number(t)||0))*100)}function z(){const t=Number(e.nativeAudio.estimatedLatencyMs);return t>0?`~${t.toFixed(1)} ms`:i("common.adaptive")}function It(){if(e.mediaPlatform!=="auto")return e.mediaPlatform;const t=e.urlInput.toLowerCase();return t.includes("tiktok.com")?"tiktok":t.includes("/shorts/")?"shorts":t.includes("youtube.com")||t.includes("youtu.be")?"youtube":"auto"}function M(t=It()){return{auto:"Auto",youtube:"YouTube",shorts:"Shorts",tiktok:"TikTok"}[t]||"Auto"}function p(t,a="info"){e.toast={message:String(t),kind:a},R(),clearTimeout(V),V=setTimeout(()=>{e.toast=null,R()},4200)}function R(){const t=document.getElementById("toast-host");t&&(t.innerHTML=e.toast?`<div class="toast toast-${c(e.toast.kind)}">${o(e.toast.kind==="error"?"alert":"check")}<span>${c(e.toast.message)}</span></div>`:"")}function rt(t){return String(t||"").split("+").map(a=>a.trim()).filter(Boolean)}function lt(t,a=i("shortcut.assign")){const s=rt(t);return s.length===0?`<span class="shortcut-empty">${o("keyboard")} ${a}</span>`:`<span class="shortcut-keys">${s.map(n=>`<kbd>${c(n)}</kbd>`).join("<i>+</i>")}</span>`}function zt(){return e.shortcutRecorder?.key?[...e.shortcutRecorder.modifiers,e.shortcutRecorder.key].join("+"):null}function Mt(){const t=e.shortcutRecorder;return t&&[...t.modifiers,...t.key?[t.key]:[]].join("+")||null}function Dt(t){return/^Key[A-Z]$/.test(t.code)?t.code.slice(3):/^Digit[0-9]$/.test(t.code)?t.code.slice(5):/^Numpad[0-9]$/.test(t.code)?`Numpad${t.code.slice(6)}`:/^F([1-9]|1[0-9]|2[0-4])$/.test(t.code)?t.code:{Space:"Space",Enter:"Enter",Tab:"Tab",Escape:"Escape",ArrowUp:"ArrowUp",ArrowDown:"ArrowDown",ArrowLeft:"ArrowLeft",ArrowRight:"ArrowRight",Home:"Home",End:"End",PageUp:"PageUp",PageDown:"PageDown",Insert:"Insert",Delete:"Delete",Backquote:"Backquote",Minus:"Minus",Equal:"Equal",BracketLeft:"BracketLeft",BracketRight:"BracketRight",Backslash:"Backslash",Semicolon:"Semicolon",Quote:"Quote",Comma:"Comma",Period:"Period",Slash:"Slash",NumpadAdd:"NumpadAdd",NumpadSubtract:"NumpadSubtract",NumpadMultiply:"NumpadMultiply",NumpadDivide:"NumpadDivide",NumpadDecimal:"NumpadDecimal"}[t.code]||null}function _t(t){return t.key==="Control"?"Ctrl":t.key==="Alt"||t.key==="AltGraph"?"Alt":t.key==="Shift"?"Shift":t.key==="Meta"?"Super":null}async function D(){if(e.shortcutRecorder)return;const t=new Map;await tt().catch(()=>{});for(const a of e.sounds.filter(s=>s.shortcut))try{await kt(a.shortcut,async s=>{if(s.state==="Pressed")try{await l("play_sound",{id:a.id}),W()}catch(n){p(i("toast.playFailed",{error:n}),"error")}})}catch(s){t.set(a.id,String(s))}return e.shortcutErrors=t,t}async function Nt(t){const a=e.sounds.find(r=>r.id===t);if(!a)return;await tt().catch(()=>{});const s=rt(a.shortcut),n=new Set(["Ctrl","Alt","Shift","Super"]);e.shortcutRecorder={soundId:t,soundName:a.name.replace(/\.[^/.]+$/,""),modifiers:s.filter(r=>n.has(r)),key:s.find(r=>!n.has(r))||null},d(),document.querySelector(".shortcut-dialog")?.focus()}async function C(){e.shortcutRecorder=null,d(),await D()}async function Y(t){const a=e.shortcutRecorder;if(a)try{e.sounds=await l("set_sound_shortcut",{id:a.soundId,shortcut:t}),e.shortcutRecorder=null,d();const s=await D();t&&s?.has(a.soundId)?p(i("toast.shortcutUnavailable"),"error"):p(i(t?"toast.shortcutSaved":"toast.shortcutCleared"),"success")}catch(s){p(s,"error")}}function Lt(t){const a=e.shortcutRecorder;if(!a||t.repeat)return;if(t.preventDefault(),t.stopPropagation(),t.key==="Escape"){C();return}if(t.key==="Backspace"){a.key?a.key=null:a.modifiers.pop(),d();return}const s=_t(t);if(s){a.modifiers.includes(s)||a.modifiers.push(s),d();return}const n=Dt(t);if(!n){p(i("shortcut.unsupported"),"error");return}a.key=n,d()}function Tt(){e.cursorGlowEnabled=!e.cursorGlowEnabled;try{localStorage.setItem(it,String(e.cursorGlowEnabled))}catch{}d(),p(i(e.cursorGlowEnabled?"toast.glowOn":"toast.glowOff"),"success")}function Rt(){window.addEventListener("pointermove",t=>{e.cursorGlowEnabled&&(q=t.clientX,F=t.clientY,!N&&(N=requestAnimationFrame(()=>{N=null,document.documentElement.style.setProperty("--cursor-x",`${q}px`),document.documentElement.style.setProperty("--cursor-y",`${F}px`)})))},{passive:!0})}async function Ct(){await yt("library-worker-progress",({payload:t})=>{e.libraryWorker=t,e.activeView==="library"&&d()})}async function v(){const[t,a,s,n,r,u,g,_,dt,ct,B,ut,pt]=await Promise.all([l("list_sounds"),l("list_input_devices"),l("get_selected_input_device"),l("get_microphone_gain"),l("get_volume"),l("get_sound_overdrive"),l("get_monitor_gain"),l("get_system_audio_enabled"),l("get_system_audio_gain"),l("get_playback_status"),l("get_virtual_audio_status"),l("get_native_audio_status"),X().catch(()=>!1)]);Object.assign(e,{sounds:t,inputDevices:a,selectedInputDevice:s,microphoneGain:Number(n??1),volume:Number(r??1),soundOverdrive:Number(u??1),monitorGain:Number(g??0),systemAudioEnabled:!!_,systemAudioGain:Number(dt??.85),playback:ct,virtualAudio:B,nativeAudio:ut,autostartEnabled:!!pt}),e.microphoneNameDirty||(e.microphoneNameInput=B.microphoneName||"MicDeck Virtual Mic"),d()}async function H(){if(e.isAddingSounds)return;const t=await bt({multiple:!0,filters:[{name:"Audio",extensions:["mp3","wav","flac","ogg","m4a","aac","wma"]}]});if(!t||Array.isArray(t)&&t.length===0)return;const a=Array.isArray(t)?t:[t],s=new Set(e.sounds.map(n=>n.id));e.isAddingSounds=!0,e.libraryWorker={kind:"files",stage:"queued",current:0,total:a.length,fileName:null},d();try{e.sounds=await l("add_sounds",{paths:a}),w=new Set(e.sounds.filter(r=>!s.has(r.id)).map(r=>r.id)),e.isAddingSounds=!1,e.libraryWorker=null,d();const n=w.size;p(i(n===1?"toast.soundsAdded.one":"toast.soundsAdded.many",{count:n}),"success"),setTimeout(()=>w.clear(),1400)}catch(n){e.isAddingSounds=!1,e.libraryWorker=null,d(),p(n,"error")}}async function Z(){const t=e.urlInput.trim();if(!t||e.isImporting)return;const a=new Set(e.sounds.map(s=>s.id));e.isImporting=!0,e.libraryWorker={kind:"url",stage:"validating",current:0,total:1,fileName:null},d();try{e.sounds=await l("import_from_url",{url:t}),w=new Set(e.sounds.filter(n=>!a.has(n.id)).map(n=>n.id));const s=M();e.urlInput="",e.mediaPlatform="auto",e.isImporting=!1,e.libraryWorker=null,d(),p(i("toast.imported",{source:s}),"success"),setTimeout(()=>w.clear(),1400)}catch(s){e.isImporting=!1,e.libraryWorker=null,d(),p(s,"error")}}async function Ot(t){if(confirm(i("confirm.remove")))try{await l("remove_sound",{id:t}),await v(),await D(),p(i("toast.removed"),"success")}catch(a){p(a,"error")}}async function Pt(t){try{await l("play_sound",{id:t}),await v(),W()}catch(a){p(i("toast.playFailed",{error:a}),"error")}}async function jt(){try{await l("stop_playback"),await v()}catch(t){p(t,"error")}}async function Wt(t){try{e.selectedInputDevice=t,await l("set_selected_input_device",{deviceId:t}),await v(),p(i("toast.inputChanged"),"success")}catch(a){p(a,"error"),await v()}}async function E(t,a,s,n,r=P){e[a]=Number(s);const u=document.querySelector(n);u&&(u.textContent=r(e[a]));try{await l(t,t==="set_sound_overdrive"?{overdrive:e[a]}:{gain:e[a]})}catch(g){p(g,"error")}}function Bt(t){e.volume=Number(t);const a=document.querySelector(".sound-gain-value");a&&(a.textContent=P(e.volume)),l("set_volume",{volume:e.volume}).catch(s=>p(s,"error"))}async function K(){if(!e.nativeAudio.ready){p(i("toast.engineRequired"),"error");return}const t=e.systemAudioEnabled;e.systemAudioEnabled=!t,d();try{await l("set_system_audio_enabled",{enabled:e.systemAudioEnabled}),p(e.systemAudioEnabled?i("toast.systemOn"):i("toast.systemOff"),"success")}catch(a){e.systemAudioEnabled=t,d(),p(a,"error")}}async function xt(){if(!e.isInstallingDriver){e.isInstallingDriver=!0,d();try{await l("install_virtual_audio_driver"),await v()}catch(t){e.isInstallingDriver=!1,d(),p(i("toast.driverFailed",{error:t}),"error")}}}async function J(){const t=e.microphoneNameInput.trim();if(!(!t||e.isRenamingMicrophone)){e.isRenamingMicrophone=!0,d();try{await l("rename_virtual_microphone",{name:t}),await new Promise(a=>setTimeout(a,500)),e.microphoneNameDirty=!1,e.isRenamingMicrophone=!1,await v(),p(i("toast.micRenamed"),"success")}catch(a){e.isRenamingMicrophone=!1,d(),p(a,"error")}}}async function Gt(){if(!e.isRestartingEngine){e.isRestartingEngine=!0,d();try{await l("restart_native_audio_engine"),await new Promise(t=>setTimeout(t,350)),e.isRestartingEngine=!1,await v(),p(i("toast.engineRestarted"),"success")}catch(t){e.isRestartingEngine=!1,d(),p(t,"error")}}}function Ut(t){if(!(!["pl","en"].includes(t)||e.language===t)){e.language=t,document.documentElement.lang=t;try{localStorage.setItem(et,t)}catch{}d(),p(i("toast.languageChanged"),"success")}}async function Vt(){if(e.isUpdatingAutostart)return;const t=!e.autostartEnabled;e.isUpdatingAutostart=!0,d();try{t?await vt():await ht(),e.autostartEnabled=await X(),p(i(e.autostartEnabled?"toast.autostartOn":"toast.autostartOff"),"success")}catch(a){p(a,"error")}finally{e.isUpdatingAutostart=!1,d()}}function qt(){const t=e.filter.trim().toLowerCase();return t?e.sounds.filter(a=>[a.name,a.path,a.extension,a.sourceKind].join(" ").toLowerCase().includes(t)):e.sounds}function Ft(){return e.virtualAudio.restartRequired?i("alert.restartWindows"):e.virtualAudio.error?i("alert.driver",{error:e.virtualAudio.error}):e.nativeAudio.state==="error"?e.nativeAudio.error||i("alert.engine"):null}function L(t,a,s){return`
    <button class="nav-item ${e.activeView===t?"is-active":""}" data-view="${t}">
      ${o(s)}
      <span>${a}</span>
      ${t==="studio"&&e.systemAudioEnabled?'<i class="nav-live-dot"></i>':""}
    </button>
  `}function Yt(){const t=e.nativeAudio.ready&&e.virtualAudio.ready;return`
    <aside class="app-sidebar">
      <div class="brand-lockup">
        <div class="brand-symbol">${O()}</div>
        <div class="brand-copy">
          <strong>MICDECK</strong>
          <span>Audio routing suite</span>
        </div>
      </div>

      <nav class="app-nav" aria-label="${i("nav.aria")}">
        <div class="nav-caption">${i("nav.workspace")}</div>
        ${L("library",i("nav.library"),"library")}
        ${L("studio",i("nav.studio"),"studio")}
        ${L("settings",i("nav.settings"),"settings")}
      </nav>

      <div class="sidebar-spacer"></div>
      <div class="route-status ${t?"is-ready":"is-waiting"}">
        <div class="route-status-head">
          <span class="status-beacon"></span>
          <strong>${i(t?"nav.routeReady":"nav.routeSetup")}</strong>
        </div>
        <p>${i(t?"nav.routeReadyDescription":"nav.routeSetupDescription")}</p>
        <div class="route-status-meta">
          <span>IPC v${e.nativeAudio.protocolVersion||"—"}</span>
          <span>${z()}</span>
        </div>
      </div>
      <div class="sidebar-version">MICDECK 0.1 · Windows</div>
    </aside>
  `}function Ht(){return`
    <div class="app-toolbar">
      <div class="tray-presence" title="${i("settings.trayDescription")}">
        ${o("tray")}
        <span>${i("toolbar.tray")}</span>
        <i></i>
      </div>
      <div class="language-picker" role="group" aria-label="${i("language.label")}">
        ${o("globe")}
        <button class="${e.language==="pl"?"is-active":""}" data-language="pl" title="${i("language.polish")}" aria-pressed="${e.language==="pl"}">PL</button>
        <button class="${e.language==="en"?"is-active":""}" data-language="en" title="${i("language.english")}" aria-pressed="${e.language==="en"}">EN</button>
      </div>
    </div>
  `}function j(t,a,s,n=""){return`
    <header class="view-header">
      <div>
        <div class="kicker">${t}</div>
        <h1>${a}</h1>
        <p>${s}</p>
      </div>
      ${n?`<div class="view-actions">${n}</div>`:""}
    </header>
  `}function Zt(){return`
    <div class="platform-selector" role="group" aria-label="${i("capture.source")}">
      ${["auto","youtube","shorts","tiktok"].map(t=>`
        <button class="platform-chip ${e.mediaPlatform===t?"is-active":""}" data-platform="${t}">
          ${M(t)}
        </button>
      `).join("")}
    </div>
  `}function Kt(){const t=e.playback.isPlaying;return`
    <section class="now-playing ${t?"is-live":""}">
      <div class="now-art">
        <div class="art-disc"></div>
        <div class="art-center">${o(t?"studio":"play")}</div>
      </div>
      <div class="now-copy">
        <div class="panel-kicker">${t?`<span class="live-beacon"></span> ${i("player.nowPlaying")}`:i("player.label")}</div>
        <h2 class="now-title">${c(t?e.playback.soundName||i("player.untitled"):i("player.silence"))}</h2>
        <p class="now-meta">${t?`${I(e.playback.positionMs)} / ${I(e.playback.durationMs)}`:i("player.pickSound")}</p>
      </div>
      <div class="now-signal">
        <div class="metric-label">${i("player.signal")}</div>
        <strong class="signal-db">${nt(e.playback.signalDbfs)}</strong>
        <div class="meter"><i class="signal-fill" style="width:${ot(e.playback.signalDbfs)}%"></i></div>
      </div>
      <button class="icon-button now-stop" id="stop-btn" title="${i("common.stop")}" ${t?"":"disabled"}>
        ${o("stop")}
      </button>
      <div class="now-progress"><i class="progress-fill" style="width:${Math.round((e.playback.progress01||0)*100)}%"></i></div>
    </section>
  `}function Jt(t,a){const s=String(t.name||"VX").replace(/\.[^/.]+$/,"").split(/\s+/).filter(Boolean).slice(0,2).map(r=>r[0]).join("").toUpperCase().slice(0,2),n=Array.from({length:14},(r,u)=>`<i style="height:${22+(a*17+u*29+String(t.name).length*7)%64}%"></i>`).join("");return`<div class="sound-art sound-art-${a%5}"><span>${c(s||"VX")}</span><div class="wave-bars">${n}</div></div>`}function Xt(t,a){const s=e.playback.isPlaying&&e.playback.soundId===t.id,n=e.shortcutErrors.has(t.id);return`
    <article class="sound-card ${s?"is-live":""} ${w.has(t.id)?"is-new":""}">
      ${Jt(t,a)}
      <div class="sound-card-body">
        <div class="sound-card-top">
          <span class="file-type">${c(t.extension.toUpperCase())}</span>
          ${s?'<span class="playing-tag"><i></i> LIVE</span>':`<span class="sound-duration">${c(t.durationText)}</span>`}
        </div>
        <h3 title="${c(t.name)}">${c(t.name.replace(/\.[^/.]+$/,""))}</h3>
        <div class="sound-details">
          <span>${c(t.fileSizeText)}</span>
          <i></i>
          <span>${t.sourceKind==="library"?i("sound.downloaded"):i("sound.local")}</span>
        </div>
        ${s?`
          <div class="card-progress"><i class="mini-fill" style="width:${Math.round((e.playback.progress01||0)*100)}%"></i></div>
        `:""}
        <button class="shortcut-control ${t.shortcut?"has-shortcut":""} ${n?"has-error":""}" data-shortcut-id="${c(t.id)}" title="${c(i(n?"shortcut.unavailable":"shortcut.clickToEdit"))}">
          <span class="shortcut-control-label">${i("shortcut.label")}</span>
          ${lt(t.shortcut)}
          ${o(n?"alert":"keyboard")}
        </button>
        <div class="sound-actions">
          <button class="play-button play-btn" data-id="${c(t.id)}">
            ${o(s?"studio":"play")}
            <span>${i(s?"player.playing":"player.play")}</span>
          </button>
          <button class="icon-button remove-btn" data-id="${c(t.id)}" title="${i("common.remove")}">
            ${o("trash")}
          </button>
        </div>
      </div>
    </article>
  `}function Qt(){const t=e.libraryWorker;if(!t)return"";const a={queued:6,validating:12,downloading:42,analyzing:58,finalizing:92,complete:100,failed:100},s=t.total>0?t.current/t.total*28:0,n=Math.min(100,Math.round((a[t.stage]||8)+s)),r=`worker.${t.stage}`;return`
    <section class="library-worker ${t.stage==="failed"?"has-error":""}" aria-live="polite">
      <div class="worker-orbit"><span></span>${o(t.kind==="url"?"download":"studio")}</div>
      <div class="worker-copy">
        <div class="worker-title-row">
          <strong>${i(t.kind==="url"?"worker.captureTitle":"worker.filesTitle")}</strong>
          <span>${n}%</span>
        </div>
        <p>${c(i(r))}${t.fileName?` · ${c(t.fileName)}`:""}</p>
        <div class="worker-track"><i style="width:${n}%"></i></div>
      </div>
      <span class="worker-thread">${o("bolt")} ${i("worker.thread")}</span>
    </section>
  `}function te(){const t=e.shortcutRecorder;if(!t)return"";const a=Mt(),s=t.key?i("shortcut.ready"):t.modifiers.length>0?i("shortcut.pressTrigger"):i("shortcut.pressFirst"),n=e.sounds.find(r=>r.id===t.soundId);return`
    <div class="modal-backdrop" data-close-shortcut>
      <section class="shortcut-dialog" role="dialog" aria-modal="true" aria-labelledby="shortcut-title" tabindex="-1">
        <button class="dialog-close" data-cancel-shortcut aria-label="${i("common.cancel")}">${o("close")}</button>
        <div class="dialog-icon">${o("keyboard")}</div>
        <div class="panel-kicker">GLOBAL HOTKEY</div>
        <h2 id="shortcut-title">${i("shortcut.title")}</h2>
        <p class="dialog-sound-name">${c(t.soundName)}</p>
        <div class="shortcut-capture ${t.key?"is-ready":"is-listening"}">
          <span class="capture-pulse"></span>
          ${lt(a,i("shortcut.waiting"))}
        </div>
        <p class="shortcut-instruction">${s}</p>
        <div class="shortcut-hints">
          <span><kbd>Esc</kbd> ${i("common.cancel")}</span>
          <span><kbd>Backspace</kbd> ${i("shortcut.undo")}</span>
        </div>
        <div class="dialog-actions">
          <button class="button button-subtle" data-clear-shortcut ${n?.shortcut?"":"disabled"}>${i("shortcut.clear")}</button>
          <button class="button button-subtle" data-cancel-shortcut>${i("common.cancel")}</button>
          <button class="button button-primary" data-save-shortcut ${t.key?"":"disabled"}>${i("common.save")}</button>
        </div>
      </section>
    </div>
  `}function ee(){const t=qt();return`
    ${j(i("library.kicker"),i("library.title"),i("library.description"),`<button class="button button-primary" id="add-btn" ${e.isAddingSounds?"disabled":""}>
        ${e.isAddingSounds?`<span class="spinner spinner-dark"></span> ${i("worker.analyzing")}`:`${o("plus")} ${i("library.addFiles")}`}
      </button>`)}

    ${Qt()}

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
        ${Zt()}
        <div class="url-field">
          ${o("link")}
          <input id="url-input" placeholder="https://youtube.com/shorts/…" value="${c(e.urlInput)}" />
          <span class="detected-platform">${c(M())}</span>
          <button id="url-btn" class="button button-accent" ${e.isImporting?"disabled":""}>
            ${e.isImporting?`<span class="spinner"></span> ${i("library.downloading")}`:`${o("download")} ${i("library.download")}`}
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
      ${Kt()}
    </div>

    <section class="library-section">
      <div class="section-toolbar">
        <div>
          <h2>${i("library.sectionTitle")}</h2>
          <span>${e.sounds.length} ${i(e.sounds.length===1?"library.item.one":"library.item.many")}</span>
        </div>
        <label class="search-field">
          ${o("search")}
          <input id="search-input" placeholder="${i("library.search")}" value="${c(e.filter)}" />
        </label>
      </div>

      ${t.length===0?`
        <div class="empty-state">
          <div class="empty-symbol">${o("studio")}</div>
          <h3>${e.sounds.length?i("library.noResults"):i("library.empty")}</h3>
          <p>${e.sounds.length?i("library.changeSearch"):i("library.emptyDescription")}</p>
          ${e.sounds.length?"":`<button class="button button-primary" id="empty-add-btn">${o("plus")} ${i("library.addFirst")}</button>`}
        </div>
      `:`
        <div class="sound-grid">
          ${t.map(Xt).join("")}
        </div>
      `}
    </section>
  `}function T(t,a,s,n){return`
    <div class="channel-meter-row">
      <div class="channel-meter-label">
        <span>${t}</span>
        <strong class="${s}-meter-value">${b(a)}%</strong>
      </div>
      <div class="channel-meter"><i class="${s}-meter-fill" style="width:${b(a)}%"></i></div>
      <small>${n}</small>
    </div>
  `}function $(t,a,s,n,r,u,g,_=P){return`
    <div class="gain-control">
      <div class="gain-head">
        <div>
          <strong>${a}</strong>
          <span>${s}</span>
        </div>
        <output class="gain-output ${g}">${_(n)}</output>
      </div>
      <input class="range" id="${t}" type="range" min="0" max="${r}" step="${u}" value="${n}" />
    </div>
  `}function ie(){const t=e.systemAudioEnabled;return`
    ${j(i("studio.kicker"),i("studio.title"),i("studio.description"),`<div class="latency-chip">${o("bolt")} LOW LATENCY <strong>${z()}</strong></div>`)}

    <section class="broadcast-hero ${t?"is-broadcasting":""}">
      <div class="broadcast-visual">
        <div class="broadcast-orbit orbit-one"></div>
        <div class="broadcast-orbit orbit-two"></div>
        <button class="broadcast-button" id="system-audio-toggle" aria-pressed="${t}">
          <span class="broadcast-core">${o(t?"stop":"studio")}</span>
        </button>
      </div>
      <div class="broadcast-copy">
        <div class="panel-kicker">${t?`<span class="live-beacon"></span> ${i("studio.live")}`:i("studio.systemAudio")}</div>
        <h2>${i(t?"studio.broadcastingTitle":"studio.broadcastTitle")}</h2>
        <p>${i(t?"studio.broadcastingDescription":"studio.broadcastDescription")}</p>
        <button class="button ${t?"button-stop":"button-accent"} broadcast-cta" id="system-audio-cta">
          ${t?`${o("stop")} ${i("studio.stopBroadcast")}`:`${o("studio")} ${i("studio.startBroadcast")}`}
        </button>
        <div class="broadcast-note">${o("alert")} ${i("studio.echoNote")}</div>
      </div>
      <div class="broadcast-level">
        <div class="metric-label">SYSTEM IN</div>
        <strong class="system-meter-value">${b(e.nativeAudio.systemLevel01)}%</strong>
        <div class="vertical-meter"><i class="system-meter-fill" style="height:${b(e.nativeAudio.systemLevel01)}%"></i></div>
      </div>
    </section>

    <section class="signal-route">
      <div class="route-node">
        <span class="route-icon">${o("monitor")}</span>
        <div><small>${i("studio.sources")}</small><strong>${i("studio.sourceApps")}</strong></div>
      </div>
      <div class="route-line ${t?"is-flowing":""}"><i></i>${o("arrow")}</div>
      <div class="route-node">
        <span class="route-icon">${o("studio")}</span>
        <div><small>${i("studio.mixer")}</small><strong>MicDeck Engine</strong></div>
      </div>
      <div class="route-line ${e.nativeAudio.ready?"is-flowing":""}"><i></i>${o("arrow")}</div>
      <div class="route-node">
        <span class="route-icon">${o("mic")}</span>
        <div><small>${i("studio.output")}</small><strong>${c(e.virtualAudio.microphoneName||e.microphoneNameInput)}</strong></div>
      </div>
    </section>

    <div class="studio-grid">
      <section class="surface mixer-surface">
        <div class="surface-head">
          <div><div class="panel-kicker">LIVE MIX</div><h2>${i("studio.mixerTitle")}</h2></div>
          <span class="status-pill ${e.nativeAudio.ready?"is-good":"is-warn"}">${e.nativeAudio.ready?i("studio.engineOnline"):i("studio.engineOffline")}</span>
        </div>
        <div class="mixer-channels">
          <div class="mixer-channel">
            <div class="channel-icon">${o("mic")}</div>
            ${$("microphone-gain-range",i("studio.microphone"),i("studio.yourVoice"),e.microphoneGain,3,.01,"microphone-gain-value")}
            ${T("MIC",e.nativeAudio.microphoneLevel01,"microphone",i("studio.physicalInput"))}
          </div>
          <div class="mixer-channel">
            <div class="channel-icon">${o("library")}</div>
            ${$("volume-range","Soundboard",i("studio.bindsFiles"),e.volume,6,.01,"sound-gain-value")}
            ${$("overdrive-range","Drive",i("studio.extraSaturation"),e.soundOverdrive,4,.05,"overdrive-value",st)}
          </div>
          <div class="mixer-channel ${t?"is-hot":""}">
            <div class="channel-icon">${o("monitor")}</div>
            ${$("system-gain-range","System audio",i(t?"studio.transmissionActive":"studio.transmissionOff"),e.systemAudioGain,2,.01,"system-gain-value")}
            ${T("SYSTEM",e.nativeAudio.systemLevel01,"system","Loopback WASAPI")}
          </div>
          <div class="mixer-channel master-channel">
            <div class="channel-icon">${o("route")}</div>
            ${$("monitor-range",i("studio.bindMonitoring"),i(t?"studio.mutedDuringBroadcast":"studio.yourHeadphones"),e.monitorGain,2,.01,"monitor-gain-value")}
            ${T("MASTER",e.nativeAudio.mixedLevel01,"mixed",i("studio.virtualMicrophone"))}
          </div>
        </div>
      </section>

      <section class="surface input-surface">
        <div class="surface-head">
          <div><div class="panel-kicker">INPUT</div><h2>${i("studio.voiceSource")}</h2></div>
          <span class="round-icon">${o("mic")}</span>
        </div>
        <label class="field-label" for="physical-microphone">${i("studio.physicalMicrophone")}</label>
        <select id="physical-microphone" class="input" ${e.inputDevices.length?"":"disabled"}>
          ${e.inputDevices.length?e.inputDevices.map(a=>`<option value="${c(a.id)}" ${a.id===e.selectedInputDevice?"selected":""}>${c(a.name)}</option>`).join(""):`<option>${i("studio.noMicrophone")}</option>`}
        </select>
        <div class="engine-stats">
          <div><span>${i("studio.latency")}</span><strong>${z()}</strong></div>
          <div><span>XRUN</span><strong>${e.nativeAudio.underruns||0}</strong></div>
          <div><span>${i("studio.process")}</span><strong>${e.nativeAudio.enginePid||"—"}</strong></div>
          <div><span>${i("studio.format")}</span><strong>48 kHz / F32</strong></div>
        </div>
        <div class="input-actions">
          <button class="button button-subtle" id="stop-btn">${o("stop")} ${i("studio.stopBind")}</button>
          <button class="icon-button" id="restart-engine-btn" title="${i("studio.restartEngine")}" ${e.isRestartingEngine?"disabled":""}>${o("refresh")}</button>
        </div>
      </section>
    </div>
  `}function ae(){const t=e.virtualAudio.microphoneName||e.microphoneNameInput;return`
    ${j(i("settings.kicker"),i("settings.title"),i("settings.description"))}

    <div class="settings-grid">
      <section class="surface settings-card driver-card">
        <div class="surface-head">
          <div>
            <div class="panel-kicker">VIRTUAL DEVICE</div>
            <h2>${i("settings.virtualMicrophone")}</h2>
          </div>
          <span class="status-pill ${e.virtualAudio.ready?"is-good":"is-warn"}">${e.virtualAudio.ready?i("common.ready"):i("common.setup")}</span>
        </div>
        ${e.virtualAudio.ready?`
          <div class="device-route-card">
            <span class="round-icon">${o("route")}</span>
            <div>
              <small>${i("settings.mixOutput")}</small>
              <strong>${c(e.virtualAudio.renderDeviceName||"Managed cable")}</strong>
            </div>
            ${o("check","route-check")}
          </div>
          <label class="field-label" for="microphone-name">${i("settings.systemName")}</label>
          <div class="inline-field">
            <input id="microphone-name" class="input" maxlength="80" value="${c(e.microphoneNameInput)}" />
            <button class="button button-primary" id="rename-microphone-btn" ${e.isRenamingMicrophone?"disabled":""}>
              ${e.isRenamingMicrophone?'<span class="spinner"></span>':i("common.save")}
            </button>
          </div>
          <p class="helper-text">${i("settings.systemNameHelp")}</p>
        `:`
          <div class="setup-callout">
            ${o("alert")}
            <div>
              <strong>${i("settings.deviceInactive")}</strong>
              <p>${c(e.virtualAudio.error||(e.virtualAudio.restartRequired?i("settings.driverInstalledRestart"):i("settings.installDriverHelp")))}</p>
            </div>
          </div>
          <button class="button button-accent full-button" id="install-driver-btn" ${e.isInstallingDriver?"disabled":""}>
            ${e.isInstallingDriver?`<span class="spinner"></span> ${i("common.installing")}`:`${o("download")} ${i("settings.installDriver")}`}
          </button>
        `}
        <div class="vendor-note">${i("settings.deviceLayer")}: ${c(e.virtualAudio.vendor)} · <a href="https://vb-audio.com/Cable/" target="_blank" rel="noreferrer">${i("settings.donationware")}</a></div>
      </section>

      <section class="surface settings-card engine-settings">
        <div class="surface-head">
          <div>
            <div class="panel-kicker">AUDIO CORE</div>
            <h2>${i("settings.nativeEngine")}</h2>
          </div>
          <span class="status-pill ${e.nativeAudio.ready?"is-good":"is-warn"}">${e.nativeAudio.ready?"ONLINE":e.nativeAudio.state.toUpperCase()}</span>
        </div>
        <div class="diagnostic-list">
          <div><span>Runtime</span><strong>${c(e.nativeAudio.runtime)}</strong></div>
          <div><span>${i("settings.protocol")}</span><strong>IPC v${e.nativeAudio.protocolVersion||"—"}</strong></div>
          <div><span>${i("settings.bufferMode")}</span><strong>Adaptive low-latency</strong></div>
          <div><span>${i("settings.estimatedLatency")}</span><strong>${z()}</strong></div>
          <div><span>XRUN / underrun</span><strong>${e.nativeAudio.underruns||0}</strong></div>
        </div>
        ${e.nativeAudio.error?`<div class="setup-callout compact">${o("alert")}<div><strong>${i("settings.engineError")}</strong><p>${c(e.nativeAudio.error)}</p></div></div>`:""}
        <button class="button button-subtle full-button" id="restart-engine-btn" ${e.isRestartingEngine?"disabled":""}>
          ${e.isRestartingEngine?`<span class="spinner"></span> ${i("common.restarting")}`:`${o("refresh")} ${i("settings.restartEngine")}`}
        </button>
      </section>

      <section class="surface settings-card windows-settings">
        <div class="surface-head">
          <div>
            <div class="panel-kicker">DESKTOP</div>
            <h2>${i("settings.windowsIntegration")}</h2>
          </div>
          <span class="status-pill ${e.autostartEnabled?"is-good":""}">${i(e.autostartEnabled?"common.on":"common.off")}</span>
        </div>
        <div class="preference-list">
          <div class="preference-row">
            <span class="round-icon">${o("power")}</span>
            <div>
              <strong>${i("settings.autostart")}</strong>
              <p>${i("settings.autostartDescription")}</p>
            </div>
            <button class="toggle-switch ${e.autostartEnabled?"is-on":""}" id="autostart-toggle" role="switch" aria-checked="${e.autostartEnabled}" aria-label="${i("settings.autostart")}" ${e.isUpdatingAutostart?"disabled":""}>
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
            <button class="toggle-switch ${e.cursorGlowEnabled?"is-on":""}" id="cursor-glow-toggle" role="switch" aria-checked="${e.cursorGlowEnabled}" aria-label="${i("settings.cursorGlow")}">
              <i></i>
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
          <li><span>02</span><div><strong>${i("settings.discordInput")}</strong><p>${c(i("settings.discordInputHelp",{microphone:t}))}</p></div></li>
          <li><span>03</span><div><strong>${i("settings.discordProcessing")}</strong><p>${i("settings.discordProcessingHelp")}</p></div></li>
        </ol>
        <div class="guide-tip">${o("bolt")} ${i("settings.discordTip")}</div>
      </section>

      <section class="surface settings-card about-card">
        <div class="about-mark">${O()}</div>
        <div class="panel-kicker">MICDECK</div>
        <h2>Trigger. Route. Be heard.</h2>
        <p>${i("settings.about")}</p>
        <div class="tech-tags"><span>Rust</span><span>C++</span><span>WASAPI</span><span>Tauri</span></div>
      </section>
    </div>
  `}function d(){const t=Ft(),a=e.activeView==="studio"?ie():e.activeView==="settings"?ae():ee();document.querySelector("#app").innerHTML=`
    <div class="app-shell ${e.cursorGlowEnabled?"glow-enabled":""}">
      <div class="ambient-canvas" aria-hidden="true">
        <div class="ambient-grid"></div>
        <div class="cursor-glow"></div>
      </div>
      ${Yt()}
      <main class="app-content">
        ${Ht()}
        ${t?`<div class="top-alert">${o("alert")}<span>${c(t)}</span><button class="nav-to-settings">${i("common.openSettings")}</button></div>`:""}
        <div class="view-wrap">${a}</div>
      </main>
      <div id="toast-host" class="toast-host"></div>
      ${te()}
    </div>
  `,se(),R(),at=e.playback.isPlaying?e.playback.soundId:null}function se(){document.querySelectorAll("[data-language]").forEach(t=>{t.addEventListener("click",()=>Ut(t.dataset.language))}),document.querySelectorAll("[data-view]").forEach(t=>{t.addEventListener("click",()=>{e.activeView=t.dataset.view,d()})}),document.querySelector(".nav-to-settings")?.addEventListener("click",()=>{e.activeView="settings",d()}),document.getElementById("add-btn")?.addEventListener("click",H),document.getElementById("empty-add-btn")?.addEventListener("click",H),document.getElementById("url-btn")?.addEventListener("click",Z),document.querySelectorAll("#stop-btn").forEach(t=>t.addEventListener("click",jt)),document.getElementById("install-driver-btn")?.addEventListener("click",xt),document.getElementById("rename-microphone-btn")?.addEventListener("click",J),document.getElementById("restart-engine-btn")?.addEventListener("click",Gt),document.getElementById("system-audio-toggle")?.addEventListener("click",K),document.getElementById("system-audio-cta")?.addEventListener("click",K),document.getElementById("autostart-toggle")?.addEventListener("click",Vt),document.getElementById("cursor-glow-toggle")?.addEventListener("click",Tt),document.getElementById("physical-microphone")?.addEventListener("change",t=>Wt(t.target.value)),document.getElementById("microphone-gain-range")?.addEventListener("input",t=>E("set_microphone_gain","microphoneGain",t.target.value,".microphone-gain-value")),document.getElementById("volume-range")?.addEventListener("input",t=>Bt(t.target.value)),document.getElementById("overdrive-range")?.addEventListener("input",t=>E("set_sound_overdrive","soundOverdrive",t.target.value,".overdrive-value",st)),document.getElementById("monitor-range")?.addEventListener("input",t=>E("set_monitor_gain","monitorGain",t.target.value,".monitor-gain-value")),document.getElementById("system-gain-range")?.addEventListener("input",t=>E("set_system_audio_gain","systemAudioGain",t.target.value,".system-gain-value")),document.querySelectorAll("[data-platform]").forEach(t=>{t.addEventListener("click",()=>{e.mediaPlatform=t.dataset.platform,d(),document.getElementById("url-input")?.focus()})}),document.getElementById("url-input")?.addEventListener("input",t=>{e.urlInput=t.target.value;const a=document.querySelector(".detected-platform");a&&(a.textContent=M())}),document.getElementById("url-input")?.addEventListener("keydown",t=>{t.key==="Enter"&&Z()}),document.getElementById("search-input")?.addEventListener("input",t=>{e.filter=t.target.value,d();const a=document.getElementById("search-input");a?.focus(),a?.setSelectionRange(e.filter.length,e.filter.length)}),document.getElementById("microphone-name")?.addEventListener("input",t=>{e.microphoneNameInput=t.target.value,e.microphoneNameDirty=!0}),document.getElementById("microphone-name")?.addEventListener("keydown",t=>{t.key==="Enter"&&J()}),document.querySelectorAll(".play-btn").forEach(t=>{t.addEventListener("click",()=>Pt(t.dataset.id))}),document.querySelectorAll(".remove-btn").forEach(t=>{t.addEventListener("click",()=>Ot(t.dataset.id))}),document.querySelectorAll("[data-shortcut-id]").forEach(t=>{t.addEventListener("click",()=>Nt(t.dataset.shortcutId))}),document.querySelectorAll("[data-cancel-shortcut]").forEach(t=>{t.addEventListener("click",C)}),document.querySelector("[data-save-shortcut]")?.addEventListener("click",()=>{const t=zt();t&&Y(t)}),document.querySelector("[data-clear-shortcut]")?.addEventListener("click",()=>Y(null)),document.querySelector("[data-close-shortcut]")?.addEventListener("click",t=>{t.target===t.currentTarget&&C()})}function ne(){[["microphone",e.nativeAudio.microphoneLevel01],["system",e.nativeAudio.systemLevel01],["mixed",e.nativeAudio.mixedLevel01]].forEach(([a,s])=>{document.querySelectorAll(`.${a}-meter-fill`).forEach(n=>{n.closest(".vertical-meter")?n.style.height=`${b(s)}%`:n.style.width=`${b(s)}%`}),document.querySelectorAll(`.${a}-meter-value`).forEach(n=>{n.textContent=`${b(s)}%`})})}function oe(){if(e.activeView!=="library")return;if((e.playback.isPlaying?e.playback.soundId:null)!==at){d();return}const a=document.querySelector(".now-title"),s=document.querySelector(".now-meta"),n=document.querySelector(".signal-db"),r=document.querySelector(".signal-fill"),u=document.querySelector(".now-progress .progress-fill"),g=document.querySelector(".sound-card.is-live .mini-fill");a&&(a.textContent=e.playback.isPlaying?e.playback.soundName||i("player.untitled"):i("player.silence")),s&&(s.textContent=e.playback.isPlaying?`${I(e.playback.positionMs)} / ${I(e.playback.durationMs)}`:i("player.pickSound")),n&&(n.textContent=nt(e.playback.signalDbfs)),r&&(r.style.width=`${ot(e.playback.signalDbfs)}%`),u&&(u.style.width=`${Math.round((e.playback.progress01||0)*100)}%`),g&&(g.style.width=`${Math.round((e.playback.progress01||0)*100)}%`)}async function re(){try{const t=`${e.nativeAudio.ready}:${e.nativeAudio.state}:${e.nativeAudio.error||""}`;[e.playback,e.nativeAudio]=await Promise.all([l("get_playback_status"),l("get_native_audio_status")]);const a=`${e.nativeAudio.ready}:${e.nativeAudio.state}:${e.nativeAudio.error||""}`;if(t!==a){d();return}oe(),ne()}catch{clearInterval(S),S=null}}function W(){S||(S=setInterval(re,140))}window.addEventListener("keydown",Lt,!0);Rt();Ct().catch(()=>{});v().then(async()=>{(await D())?.size&&d(),W()}).catch(t=>{document.querySelector("#app").innerHTML=`
      <div class="boot-error">
        ${O()}
        <h1>${i("boot.title")}</h1>
        <p>${c(t)}</p>
      </div>
    `});
