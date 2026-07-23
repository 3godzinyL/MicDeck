(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const d of document.querySelectorAll('link[rel="modulepreload"]'))r(d);new MutationObserver(d=>{for(const c of d)if(c.type==="childList")for(const m of c.addedNodes)m.tagName==="LINK"&&m.rel==="modulepreload"&&r(m)}).observe(document,{childList:!0,subtree:!0});function n(d){const c={};return d.integrity&&(c.integrity=d.integrity),d.referrerPolicy&&(c.referrerPolicy=d.referrerPolicy),d.crossOrigin==="use-credentials"?c.credentials="include":d.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function r(d){if(d.ep)return;d.ep=!0;const c=n(d);fetch(d.href,c)}})();async function o(t,a={},n){return window.__TAURI_INTERNALS__.invoke(t,a,n)}async function R(){return await o("plugin:autostart|is_enabled")}async function Y(){await o("plugin:autostart|enable")}async function H(){await o("plugin:autostart|disable")}async function Z(t={}){return typeof t=="object"&&Object.freeze(t),await o("plugin:dialog|open",{options:t})}const _="micdeck.language";function K(){try{const t=localStorage.getItem(_);if(t==="pl"||t==="en")return t}catch{}return navigator.language.toLowerCase().startsWith("pl")?"pl":"en"}const L={pl:{"common.adaptive":"adaptacyjne","common.save":"Zapisz","common.installing":"Instalowanie…","common.restarting":"Restartowanie…","common.ready":"GOTOWY","common.setup":"KONFIGURACJA","common.online":"ONLINE","common.on":"WŁ.","common.off":"WYŁ.","common.alwaysOn":"ZAWSZE AKTYWNY","common.openSettings":"Otwórz ustawienia","common.stop":"Zatrzymaj","common.remove":"Usuń","language.label":"Język aplikacji","language.polish":"Polski","language.english":"English","toolbar.tray":"Aktywna w zasobniku Windows","toast.soundsAdded.one":"Dodano {count} dźwięk.","toast.soundsAdded.many":"Dodano {count} dźwięki.","toast.imported":"Audio z {source} jest gotowe w bibliotece.","toast.removed":"Dźwięk usunięty.","toast.playFailed":"Nie udało się odtworzyć dźwięku: {error}","toast.inputChanged":"Mikrofon wejściowy został zmieniony.","toast.engineRequired":"Najpierw uruchom silnik audio i skonfiguruj wirtualny mikrofon.","toast.systemOn":"Transmisja dźwięku systemowego jest aktywna.","toast.systemOff":"Transmisja dźwięku systemowego została wyłączona.","toast.driverFailed":"Instalacja sterownika nie powiodła się: {error}","toast.micRenamed":"Nazwa wirtualnego mikrofonu została zmieniona.","toast.engineRestarted":"Silnik audio został uruchomiony ponownie.","toast.autostartOn":"MicDeck uruchomi się z Windows i pozostanie schowany w zasobniku.","toast.autostartOff":"Autostart MicDeck został wyłączony.","toast.languageChanged":"Język aplikacji został zmieniony.","confirm.remove":"Usunąć ten dźwięk z biblioteki?","alert.restartWindows":"Sterownik jest zainstalowany. Uruchom Windows ponownie, aby aktywować wirtualny mikrofon.","alert.driver":"Sterownik audio: {error}","alert.engine":"Silnik audio nie wystartował. Otwórz Ustawienia i uruchom go ponownie.","nav.aria":"Główna nawigacja","nav.workspace":"Workspace","nav.library":"Biblioteka","nav.studio":"Studio live","nav.settings":"Ustawienia","nav.routeReady":"Trasa aktywna","nav.routeSetup":"Wymaga konfiguracji","nav.routeReadyDescription":"Miks trafia do wirtualnego mikrofonu.","nav.routeSetupDescription":"Sprawdź silnik i sterownik w Ustawieniach.","capture.source":"Źródło nagrania","player.nowPlaying":"TERAZ GRA","player.label":"ODTWARZACZ","player.untitled":"Bez nazwy","player.silence":"Cisza na decku","player.pickSound":"Wybierz dźwięk z biblioteki, aby rozpocząć.","player.signal":"Poziom sygnału","player.playing":"Odtwarzanie","player.play":"Odtwórz","sound.downloaded":"Pobrane","sound.local":"Plik lokalny","library.kicker":"Sound library","library.title":"Twoje dźwięki","library.description":"Importuj, organizuj i odpalaj materiały bez wychodzenia z jednego widoku.","library.addFiles":"Dodaj pliki","library.captureTitle":"Pobierz audio z linku","library.captureDescription":"Wklej YouTube, Shorts lub TikTok. MicDeck pobierze najlepszą ścieżkę audio i doda ją do biblioteki.","library.downloading":"Pobieram","library.download":"Pobierz","library.requirements":"Wymaga yt-dlp + ffmpeg w PATH","library.sectionTitle":"Biblioteka","library.item.one":"element","library.item.many":"elementów","library.search":"Szukaj dźwięku…","library.noResults":"Brak pasujących wyników","library.empty":"Twój deck czeka na pierwszy dźwięk","library.changeSearch":"Zmień wyszukiwaną frazę.","library.emptyDescription":"Dodaj plik lokalny albo pobierz audio z obsługiwanego linku.","library.addFirst":"Dodaj pierwszy plik","studio.kicker":"Live routing","studio.title":"Studio","studio.description":"Steruj miksem, poziomami i transmisją dźwięku systemowego w czasie rzeczywistym.","studio.live":"TRANSMISJA AKTYWNA","studio.systemAudio":"SYSTEM AUDIO","studio.broadcastingTitle":"Dźwięk pulpitu leci na Discorda","studio.broadcastTitle":"Udostępnij to, co słyszysz","studio.broadcastingDescription":"YouTube, Spotify, gry i pozostałe aplikacje są domieszane do wirtualnego mikrofonu.","studio.broadcastDescription":"Jednym przyciskiem przechwyć domyślne wyjście Windows i skieruj je do rozmowy głosowej.","studio.stopBroadcast":"Zatrzymaj transmisję","studio.startBroadcast":"Włącz transmisję","studio.echoNote":"Podsłuch bindów jest automatycznie wyciszany podczas transmisji, aby uniknąć echa.","studio.sources":"ŹRÓDŁA","studio.sourceApps":"Spotify / YouTube / gry","studio.mixer":"MIKSER","studio.output":"WYJŚCIE","studio.mixerTitle":"Mikser","studio.engineOnline":"ENGINE ONLINE","studio.engineOffline":"ENGINE OFFLINE","studio.microphone":"Mikrofon","studio.yourVoice":"Twój głos","studio.physicalInput":"Wejście fizyczne","studio.bindsFiles":"Bindy i pliki","studio.extraSaturation":"Dodatkowe nasycenie","studio.transmissionActive":"Transmisja aktywna","studio.transmissionOff":"Transmisja wyłączona","studio.bindMonitoring":"Podsłuch bindów","studio.mutedDuringBroadcast":"Wyciszony podczas transmisji","studio.yourHeadphones":"Twoje słuchawki","studio.virtualMicrophone":"Wirtualny mikrofon","studio.voiceSource":"Źródło głosu","studio.physicalMicrophone":"Fizyczny mikrofon","studio.noMicrophone":"Nie znaleziono mikrofonu","studio.latency":"Opóźnienie","studio.process":"Proces","studio.format":"Format","studio.stopBind":"Zatrzymaj bind","studio.restartEngine":"Restart silnika","settings.kicker":"Configuration","settings.title":"Ustawienia","settings.description":"Zarządzaj wirtualnym mikrofonem, silnikiem i integracją z aplikacjami głosowymi.","settings.virtualMicrophone":"Wirtualny mikrofon","settings.mixOutput":"WYJŚCIE MIKSU","settings.systemName":"Nazwa widoczna w systemie","settings.systemNameHelp":"Ta nazwa pojawi się w Discordzie, grach i OBS. Zmiana może wywołać monit UAC.","settings.deviceInactive":"Wirtualne urządzenie nie jest aktywne","settings.driverInstalledRestart":"Sterownik jest zainstalowany — uruchom Windows ponownie.","settings.installDriverHelp":"Zainstaluj podpisany sterownik VB-CABLE, aby uruchomić routing.","settings.installDriver":"Zainstaluj sterownik","settings.deviceLayer":"Warstwa urządzenia","settings.donationware":"licencja donationware","settings.nativeEngine":"Silnik natywny","settings.protocol":"Protokół","settings.bufferMode":"Tryb bufora","settings.estimatedLatency":"Szacowane opóźnienie","settings.engineError":"Błąd silnika","settings.restartEngine":"Uruchom ponownie silnik","settings.windowsIntegration":"Integracja z Windows","settings.autostart":"Uruchamiaj przy logowaniu","settings.autostartDescription":"MicDeck wystartuje w tle i od razu będzie dostępny w zasobniku systemowym.","settings.tray":"Zasobnik systemowy","settings.trayDescription":"Zamknięcie okna ukrywa aplikację. Aby ją wyłączyć, użyj menu ikony obok zegara.","settings.discordTitle":"Discord w 60 sekund","settings.discordOpen":"Otwórz Głos i wideo","settings.discordOpenHelp":"Discord → Ustawienia użytkownika → Głos i wideo.","settings.discordInput":"Wybierz wejście","settings.discordInputHelp":"Ustaw Default albo {microphone}.","settings.discordProcessing":"Wyłącz obróbkę głosu","settings.discordProcessingHelp":"Krisp, redukcja echa i automatyczna regulacja potrafią wycinać bindy.","settings.discordTip":"Fizyczny mikrofon wybierasz w MicDeck. Discord powinien słuchać wirtualnego miksu.","settings.about":"Natywny soundboard i mikser systemowy dla Windows, zbudowany na Rust, C++ i WASAPI.","boot.title":"MicDeck nie może wystartować"},en:{"common.adaptive":"adaptive","common.save":"Save","common.installing":"Installing…","common.restarting":"Restarting…","common.ready":"READY","common.setup":"SETUP","common.online":"ONLINE","common.on":"ON","common.off":"OFF","common.alwaysOn":"ALWAYS ON","common.openSettings":"Open Settings","common.stop":"Stop","common.remove":"Remove","language.label":"App language","language.polish":"Polski","language.english":"English","toolbar.tray":"Running in the Windows tray","toast.soundsAdded.one":"Added {count} sound.","toast.soundsAdded.many":"Added {count} sounds.","toast.imported":"{source} audio is ready in your library.","toast.removed":"Sound removed.","toast.playFailed":"Could not play the sound: {error}","toast.inputChanged":"Input microphone changed.","toast.engineRequired":"Start the audio engine and configure the virtual microphone first.","toast.systemOn":"System-audio broadcast is live.","toast.systemOff":"System-audio broadcast is off.","toast.driverFailed":"Driver installation failed: {error}","toast.micRenamed":"Virtual microphone renamed.","toast.engineRestarted":"Audio engine restarted.","toast.autostartOn":"MicDeck will start with Windows and stay in the system tray.","toast.autostartOff":"MicDeck autostart is disabled.","toast.languageChanged":"App language changed.","confirm.remove":"Remove this sound from the library?","alert.restartWindows":"The driver is installed. Restart Windows to activate the virtual microphone.","alert.driver":"Audio driver: {error}","alert.engine":"The audio engine did not start. Open Settings and restart it.","nav.aria":"Main navigation","nav.workspace":"Workspace","nav.library":"Library","nav.studio":"Live Studio","nav.settings":"Settings","nav.routeReady":"Route active","nav.routeSetup":"Setup required","nav.routeReadyDescription":"The mix is reaching your virtual microphone.","nav.routeSetupDescription":"Check the engine and driver in Settings.","capture.source":"Capture source","player.nowPlaying":"NOW PLAYING","player.label":"PLAYER","player.untitled":"Untitled","player.silence":"Nothing on the deck","player.pickSound":"Pick a library sound to get started.","player.signal":"Signal level","player.playing":"Playing","player.play":"Play","sound.downloaded":"Downloaded","sound.local":"Local file","library.kicker":"Sound library","library.title":"Your sounds","library.description":"Import, organize, and trigger everything from one focused workspace.","library.addFiles":"Add files","library.captureTitle":"Capture audio from a link","library.captureDescription":"Paste YouTube, Shorts, or TikTok. MicDeck grabs the best audio track and adds it to your library.","library.downloading":"Capturing","library.download":"Capture","library.requirements":"Requires yt-dlp + ffmpeg in PATH","library.sectionTitle":"Library","library.item.one":"item","library.item.many":"items","library.search":"Search sounds…","library.noResults":"No matching results","library.empty":"Your deck is ready for its first sound","library.changeSearch":"Try a different search.","library.emptyDescription":"Add a local file or capture audio from a supported link.","library.addFirst":"Add your first file","studio.kicker":"Live routing","studio.title":"Studio","studio.description":"Control your mix, levels, and system-audio broadcast in real time.","studio.live":"BROADCAST LIVE","studio.systemAudio":"SYSTEM AUDIO","studio.broadcastingTitle":"Your desktop audio is live","studio.broadcastTitle":"Share what you hear","studio.broadcastingDescription":"YouTube, Spotify, games, and other apps are mixed into the virtual microphone.","studio.broadcastDescription":"Capture the default Windows output and route it into voice chat with one button.","studio.stopBroadcast":"Stop broadcast","studio.startBroadcast":"Start broadcast","studio.echoNote":"Sound-pad monitoring is muted automatically during a broadcast to prevent echo.","studio.sources":"SOURCES","studio.sourceApps":"Spotify / YouTube / games","studio.mixer":"MIXER","studio.output":"OUTPUT","studio.mixerTitle":"Mixer","studio.engineOnline":"ENGINE ONLINE","studio.engineOffline":"ENGINE OFFLINE","studio.microphone":"Microphone","studio.yourVoice":"Your voice","studio.physicalInput":"Physical input","studio.bindsFiles":"Pads and files","studio.extraSaturation":"Extra saturation","studio.transmissionActive":"Broadcast live","studio.transmissionOff":"Broadcast off","studio.bindMonitoring":"Pad monitoring","studio.mutedDuringBroadcast":"Muted while broadcasting","studio.yourHeadphones":"Your headphones","studio.virtualMicrophone":"Virtual microphone","studio.voiceSource":"Voice source","studio.physicalMicrophone":"Physical microphone","studio.noMicrophone":"No microphone found","studio.latency":"Latency","studio.process":"Process","studio.format":"Format","studio.stopBind":"Stop sound","studio.restartEngine":"Restart engine","settings.kicker":"Configuration","settings.title":"Settings","settings.description":"Manage the virtual microphone, audio engine, and voice-app integration.","settings.virtualMicrophone":"Virtual microphone","settings.mixOutput":"MIX OUTPUT","settings.systemName":"System display name","settings.systemNameHelp":"This name appears in Discord, games, and OBS. Changing it may trigger a UAC prompt.","settings.deviceInactive":"The virtual device is not active","settings.driverInstalledRestart":"The driver is installed — restart Windows to finish.","settings.installDriverHelp":"Install the signed VB-CABLE driver to enable routing.","settings.installDriver":"Install driver","settings.deviceLayer":"Device layer","settings.donationware":"donationware license","settings.nativeEngine":"Native engine","settings.protocol":"Protocol","settings.bufferMode":"Buffer mode","settings.estimatedLatency":"Estimated latency","settings.engineError":"Engine error","settings.restartEngine":"Restart audio engine","settings.windowsIntegration":"Windows integration","settings.autostart":"Launch at sign-in","settings.autostartDescription":"MicDeck starts in the background and is immediately available from the system tray.","settings.tray":"System tray","settings.trayDescription":"Closing the window hides the app. Use the icon next to the clock when you want to quit.","settings.discordTitle":"Discord in 60 seconds","settings.discordOpen":"Open Voice & Video","settings.discordOpenHelp":"Discord → User Settings → Voice & Video.","settings.discordInput":"Choose the input","settings.discordInputHelp":"Select Default or {microphone}.","settings.discordProcessing":"Disable voice processing","settings.discordProcessingHelp":"Krisp, echo cancellation, and automatic gain control can cut out sound pads.","settings.discordTip":"Choose your physical microphone in MicDeck. Discord should listen to the virtual mix.","settings.about":"A native Windows soundboard and system mixer built with Rust, C++, and WASAPI.","boot.title":"MicDeck could not start"}};function J(t,a,n={}){let r=L[t]?.[a]??L.en[a]??a;return Object.entries(n).forEach(([d,c])=>{r=r.replaceAll(`{${d}}`,String(c))}),r}const e={activeView:"library",language:K(),autostartEnabled:!1,isUpdatingAutostart:!1,sounds:[],inputDevices:[],selectedInputDevice:null,microphoneGain:1,volume:1,soundOverdrive:1,monitorGain:0,systemAudioEnabled:!1,systemAudioGain:.85,nativeAudio:{available:!1,ready:!1,state:"starting",protocolVersion:0,enginePid:0,microphoneLevel01:0,systemLevel01:0,mixedLevel01:0,estimatedLatencyMs:0,underruns:0,error:null,runtime:"C++ / WASAPI"},virtualAudio:{installed:!1,ready:!1,installerAttempted:!1,restartRequired:!1,error:null,vendor:"VB-Audio / VB-CABLE Pack45",renderDeviceName:null,microphoneName:null},microphoneNameInput:"MicDeck Virtual Mic",microphoneNameDirty:!1,isInstallingDriver:!1,isRenamingMicrophone:!1,isRestartingEngine:!1,filter:"",urlInput:"",mediaPlatform:"auto",isImporting:!1,toast:null,playback:{isPlaying:!1,soundId:null,soundName:null,positionMs:0,durationMs:0,progress01:0,signalDbfs:-90,signalLevel01:0}};let b=null,T=null,C=null;const X={library:'<path d="M4 5.5h16M4 12h16M4 18.5h10"/><circle cx="18" cy="18.5" r="2.5"/>',studio:'<path d="M4 8v8M8 5v14M12 9v6M16 3v18M20 7v10"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',plus:'<path d="M12 5v14M5 12h14"/>',download:'<path d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',play:'<path d="m9 7 8 5-8 5Z"/>',stop:'<rect x="7" y="7" width="10" height="10" rx="1"/>',trash:'<path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6"/>',mic:'<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/>',monitor:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',route:'<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h4a4 4 0 0 1 4 4v4m-8 4h4"/>',link:'<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.15 1.15M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.15-1.15"/>',bolt:'<path d="m13 2-8 12h7l-1 8 8-12h-7Z"/>',check:'<path d="m5 12 4 4L19 6"/>',alert:'<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v4m0 3h.01"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',refresh:'<path d="M20 6v6h-6M4 18v-6h6"/><path d="M18.5 9A7 7 0 0 0 6 6.5L4 9m2 6.5A7 7 0 0 0 18 15l2-2"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',tray:'<path d="M5 5h14v10H5zM8 19h8M12 15v4"/><path d="M8 9h8"/>',power:'<path d="M12 3v9M6.2 6.2a8 8 0 1 0 11.6 0"/>'};document.documentElement.lang=e.language;function i(t,a){return J(e.language,t,a)}function s(t,a=""){return`<svg class="icon ${a}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${X[t]||""}</svg>`}function I(){return`
    <svg class="brand-glyph" viewBox="0 0 44 44" aria-hidden="true">
      <path d="M7 35V9h7l8 12 8-12h7v26h-7V20l-8 12-8-12v15Z"/>
    </svg>
  `}function l(t){return String(t??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}function f(t){const a=Math.floor((Number(t)||0)/1e3);return`${String(Math.floor(a/60)).padStart(2,"0")}:${String(a%60).padStart(2,"0")}`}function M(t){return`${Math.round((Number(t)||0)*100)}%`}function x(t){return`×${(Number(t)||1).toFixed(1)}`}function B(t){return!Number.isFinite(t)||t<=-90?"−∞ dB":`${t>0?"+":""}${t.toFixed(1)} dB`}function W(t){return Math.round((Math.max(-60,Math.min(12,t))+60)/72*100)}function v(t){return Math.round(Math.max(0,Math.min(1,Number(t)||0))*100)}function w(){const t=Number(e.nativeAudio.estimatedLatencyMs);return t>0?`~${t.toFixed(1)} ms`:i("common.adaptive")}function Q(){if(e.mediaPlatform!=="auto")return e.mediaPlatform;const t=e.urlInput.toLowerCase();return t.includes("tiktok.com")?"tiktok":t.includes("/shorts/")?"shorts":t.includes("youtube.com")||t.includes("youtu.be")?"youtube":"auto"}function $(t=Q()){return{auto:"Auto",youtube:"YouTube",shorts:"Shorts",tiktok:"TikTok"}[t]||"Auto"}function u(t,a="info"){e.toast={message:String(t),kind:a},S(),clearTimeout(T),T=setTimeout(()=>{e.toast=null,S()},4200)}function S(){const t=document.getElementById("toast-host");t&&(t.innerHTML=e.toast?`<div class="toast toast-${l(e.toast.kind)}">${s(e.toast.kind==="error"?"alert":"check")}<span>${l(e.toast.message)}</span></div>`:"")}async function g(){const[t,a,n,r,d,c,m,k,U,q,z,F,G]=await Promise.all([o("list_sounds"),o("list_input_devices"),o("get_selected_input_device"),o("get_microphone_gain"),o("get_volume"),o("get_sound_overdrive"),o("get_monitor_gain"),o("get_system_audio_enabled"),o("get_system_audio_gain"),o("get_playback_status"),o("get_virtual_audio_status"),o("get_native_audio_status"),R().catch(()=>!1)]);Object.assign(e,{sounds:t,inputDevices:a,selectedInputDevice:n,microphoneGain:Number(r??1),volume:Number(d??1),soundOverdrive:Number(c??1),monitorGain:Number(m??0),systemAudioEnabled:!!k,systemAudioGain:Number(U??.85),playback:q,virtualAudio:z,nativeAudio:F,autostartEnabled:!!G}),e.microphoneNameDirty||(e.microphoneNameInput=z.microphoneName||"MicDeck Virtual Mic"),p()}async function N(){const t=await Z({multiple:!0,filters:[{name:"Audio",extensions:["mp3","wav","flac","ogg","m4a","aac","wma"]}]});if(!t||Array.isArray(t)&&t.length===0)return;const a=Array.isArray(t)?t:[t];try{e.sounds=await o("add_sounds",{paths:a}),p(),u(i(a.length===1?"toast.soundsAdded.one":"toast.soundsAdded.many",{count:a.length}),"success")}catch(n){u(n,"error")}}async function P(){const t=e.urlInput.trim();if(!(!t||e.isImporting)){e.isImporting=!0,p();try{e.sounds=await o("import_from_url",{url:t});const a=$();e.urlInput="",e.mediaPlatform="auto",e.isImporting=!1,p(),u(i("toast.imported",{source:a}),"success")}catch(a){e.isImporting=!1,p(),u(a,"error")}}}async function tt(t){if(confirm(i("confirm.remove")))try{await o("remove_sound",{id:t}),await g(),u(i("toast.removed"),"success")}catch(a){u(a,"error")}}async function et(t){try{await o("play_sound",{id:t}),await g(),V()}catch(a){u(i("toast.playFailed",{error:a}),"error")}}async function it(){try{await o("stop_playback"),await g()}catch(t){u(t,"error")}}async function at(t){try{e.selectedInputDevice=t,await o("set_selected_input_device",{deviceId:t}),await g(),u(i("toast.inputChanged"),"success")}catch(a){u(a,"error"),await g()}}async function h(t,a,n,r,d=M){e[a]=Number(n);const c=document.querySelector(r);c&&(c.textContent=d(e[a]));try{await o(t,t==="set_sound_overdrive"?{overdrive:e[a]}:{gain:e[a]})}catch(m){u(m,"error")}}function st(t){e.volume=Number(t);const a=document.querySelector(".sound-gain-value");a&&(a.textContent=M(e.volume)),o("set_volume",{volume:e.volume}).catch(n=>u(n,"error"))}async function O(){if(!e.nativeAudio.ready){u(i("toast.engineRequired"),"error");return}const t=e.systemAudioEnabled;e.systemAudioEnabled=!t,p();try{await o("set_system_audio_enabled",{enabled:e.systemAudioEnabled}),u(e.systemAudioEnabled?i("toast.systemOn"):i("toast.systemOff"),"success")}catch(a){e.systemAudioEnabled=t,p(),u(a,"error")}}async function nt(){if(!e.isInstallingDriver){e.isInstallingDriver=!0,p();try{await o("install_virtual_audio_driver"),await g()}catch(t){e.isInstallingDriver=!1,p(),u(i("toast.driverFailed",{error:t}),"error")}}}async function j(){const t=e.microphoneNameInput.trim();if(!(!t||e.isRenamingMicrophone)){e.isRenamingMicrophone=!0,p();try{await o("rename_virtual_microphone",{name:t}),await new Promise(a=>setTimeout(a,500)),e.microphoneNameDirty=!1,e.isRenamingMicrophone=!1,await g(),u(i("toast.micRenamed"),"success")}catch(a){e.isRenamingMicrophone=!1,p(),u(a,"error")}}}async function ot(){if(!e.isRestartingEngine){e.isRestartingEngine=!0,p();try{await o("restart_native_audio_engine"),await new Promise(t=>setTimeout(t,350)),e.isRestartingEngine=!1,await g(),u(i("toast.engineRestarted"),"success")}catch(t){e.isRestartingEngine=!1,p(),u(t,"error")}}}function rt(t){if(!(!["pl","en"].includes(t)||e.language===t)){e.language=t,document.documentElement.lang=t;try{localStorage.setItem(_,t)}catch{}p(),u(i("toast.languageChanged"),"success")}}async function dt(){if(e.isUpdatingAutostart)return;const t=!e.autostartEnabled;e.isUpdatingAutostart=!0,p();try{t?await Y():await H(),e.autostartEnabled=await R(),u(i(e.autostartEnabled?"toast.autostartOn":"toast.autostartOff"),"success")}catch(a){u(a,"error")}finally{e.isUpdatingAutostart=!1,p()}}function lt(){const t=e.filter.trim().toLowerCase();return t?e.sounds.filter(a=>[a.name,a.path,a.extension,a.sourceKind].join(" ").toLowerCase().includes(t)):e.sounds}function ct(){return e.virtualAudio.restartRequired?i("alert.restartWindows"):e.virtualAudio.error?i("alert.driver",{error:e.virtualAudio.error}):e.nativeAudio.state==="error"?e.nativeAudio.error||i("alert.engine"):null}function A(t,a,n){return`
    <button class="nav-item ${e.activeView===t?"is-active":""}" data-view="${t}">
      ${s(n)}
      <span>${a}</span>
      ${t==="studio"&&e.systemAudioEnabled?'<i class="nav-live-dot"></i>':""}
    </button>
  `}function ut(){const t=e.nativeAudio.ready&&e.virtualAudio.ready;return`
    <aside class="app-sidebar">
      <div class="brand-lockup">
        <div class="brand-symbol">${I()}</div>
        <div class="brand-copy">
          <strong>MICDECK</strong>
          <span>Audio routing suite</span>
        </div>
      </div>

      <nav class="app-nav" aria-label="${i("nav.aria")}">
        <div class="nav-caption">${i("nav.workspace")}</div>
        ${A("library",i("nav.library"),"library")}
        ${A("studio",i("nav.studio"),"studio")}
        ${A("settings",i("nav.settings"),"settings")}
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
          <span>${w()}</span>
        </div>
      </div>
      <div class="sidebar-version">MICDECK 0.1 · Windows</div>
    </aside>
  `}function pt(){return`
    <div class="app-toolbar">
      <div class="tray-presence" title="${i("settings.trayDescription")}">
        ${s("tray")}
        <span>${i("toolbar.tray")}</span>
        <i></i>
      </div>
      <div class="language-picker" role="group" aria-label="${i("language.label")}">
        ${s("globe")}
        <button class="${e.language==="pl"?"is-active":""}" data-language="pl" title="${i("language.polish")}" aria-pressed="${e.language==="pl"}">PL</button>
        <button class="${e.language==="en"?"is-active":""}" data-language="en" title="${i("language.english")}" aria-pressed="${e.language==="en"}">EN</button>
      </div>
    </div>
  `}function D(t,a,n,r=""){return`
    <header class="view-header">
      <div>
        <div class="kicker">${t}</div>
        <h1>${a}</h1>
        <p>${n}</p>
      </div>
      ${r?`<div class="view-actions">${r}</div>`:""}
    </header>
  `}function mt(){return`
    <div class="platform-selector" role="group" aria-label="${i("capture.source")}">
      ${["auto","youtube","shorts","tiktok"].map(t=>`
        <button class="platform-chip ${e.mediaPlatform===t?"is-active":""}" data-platform="${t}">
          ${$(t)}
        </button>
      `).join("")}
    </div>
  `}function gt(){const t=e.playback.isPlaying;return`
    <section class="now-playing ${t?"is-live":""}">
      <div class="now-art">
        <div class="art-disc"></div>
        <div class="art-center">${s(t?"studio":"play")}</div>
      </div>
      <div class="now-copy">
        <div class="panel-kicker">${t?`<span class="live-beacon"></span> ${i("player.nowPlaying")}`:i("player.label")}</div>
        <h2 class="now-title">${l(t?e.playback.soundName||i("player.untitled"):i("player.silence"))}</h2>
        <p class="now-meta">${t?`${f(e.playback.positionMs)} / ${f(e.playback.durationMs)}`:i("player.pickSound")}</p>
      </div>
      <div class="now-signal">
        <div class="metric-label">${i("player.signal")}</div>
        <strong class="signal-db">${B(e.playback.signalDbfs)}</strong>
        <div class="meter"><i class="signal-fill" style="width:${W(e.playback.signalDbfs)}%"></i></div>
      </div>
      <button class="icon-button now-stop" id="stop-btn" title="${i("common.stop")}" ${t?"":"disabled"}>
        ${s("stop")}
      </button>
      <div class="now-progress"><i class="progress-fill" style="width:${Math.round((e.playback.progress01||0)*100)}%"></i></div>
    </section>
  `}function vt(t,a){const n=String(t.name||"VX").replace(/\.[^/.]+$/,"").split(/\s+/).filter(Boolean).slice(0,2).map(d=>d[0]).join("").toUpperCase().slice(0,2),r=Array.from({length:14},(d,c)=>`<i style="height:${22+(a*17+c*29+String(t.name).length*7)%64}%"></i>`).join("");return`<div class="sound-art sound-art-${a%5}"><span>${l(n||"VX")}</span><div class="wave-bars">${r}</div></div>`}function yt(t,a){const n=e.playback.isPlaying&&e.playback.soundId===t.id;return`
    <article class="sound-card ${n?"is-live":""}">
      ${vt(t,a)}
      <div class="sound-card-body">
        <div class="sound-card-top">
          <span class="file-type">${l(t.extension.toUpperCase())}</span>
          ${n?'<span class="playing-tag"><i></i> LIVE</span>':`<span class="sound-duration">${l(t.durationText)}</span>`}
        </div>
        <h3 title="${l(t.name)}">${l(t.name.replace(/\.[^/.]+$/,""))}</h3>
        <div class="sound-details">
          <span>${l(t.fileSizeText)}</span>
          <i></i>
          <span>${t.sourceKind==="library"?i("sound.downloaded"):i("sound.local")}</span>
        </div>
        ${n?`
          <div class="card-progress"><i class="mini-fill" style="width:${Math.round((e.playback.progress01||0)*100)}%"></i></div>
        `:""}
        <div class="sound-actions">
          <button class="play-button play-btn" data-id="${l(t.id)}">
            ${s(n?"studio":"play")}
            <span>${i(n?"player.playing":"player.play")}</span>
          </button>
          <button class="icon-button remove-btn" data-id="${l(t.id)}" title="${i("common.remove")}">
            ${s("trash")}
          </button>
        </div>
      </div>
    </article>
  `}function ht(){const t=lt();return`
    ${D(i("library.kicker"),i("library.title"),i("library.description"),`<button class="button button-primary" id="add-btn">${s("plus")} ${i("library.addFiles")}</button>`)}

    <div class="library-lead">
      <section class="capture-card">
        <div class="capture-card-head">
          <div class="feature-icon">${s("download")}</div>
          <div>
            <div class="panel-kicker">QUICK CAPTURE</div>
            <h2>${i("library.captureTitle")}</h2>
          </div>
          <span class="support-label">YT-DLP</span>
        </div>
        <p>${i("library.captureDescription")}</p>
        ${mt()}
        <div class="url-field">
          ${s("link")}
          <input id="url-input" placeholder="https://youtube.com/shorts/…" value="${l(e.urlInput)}" />
          <span class="detected-platform">${l($())}</span>
          <button id="url-btn" class="button button-accent" ${e.isImporting?"disabled":""}>
            ${e.isImporting?`<span class="spinner"></span> ${i("library.downloading")}`:`${s("download")} ${i("library.download")}`}
          </button>
        </div>
        <div class="capture-foot">
          <span>${s("check")} YouTube</span>
          <span>${s("check")} Shorts</span>
          <span>${s("check")} TikTok</span>
          <small>${i("library.requirements")}</small>
        </div>
      </section>
      ${gt()}
    </div>

    <section class="library-section">
      <div class="section-toolbar">
        <div>
          <h2>${i("library.sectionTitle")}</h2>
          <span>${e.sounds.length} ${i(e.sounds.length===1?"library.item.one":"library.item.many")}</span>
        </div>
        <label class="search-field">
          ${s("search")}
          <input id="search-input" placeholder="${i("library.search")}" value="${l(e.filter)}" />
        </label>
      </div>

      ${t.length===0?`
        <div class="empty-state">
          <div class="empty-symbol">${s("studio")}</div>
          <h3>${e.sounds.length?i("library.noResults"):i("library.empty")}</h3>
          <p>${e.sounds.length?i("library.changeSearch"):i("library.emptyDescription")}</p>
          ${e.sounds.length?"":`<button class="button button-primary" id="empty-add-btn">${s("plus")} ${i("library.addFirst")}</button>`}
        </div>
      `:`
        <div class="sound-grid">
          ${t.map(yt).join("")}
        </div>
      `}
    </section>
  `}function E(t,a,n,r){return`
    <div class="channel-meter-row">
      <div class="channel-meter-label">
        <span>${t}</span>
        <strong class="${n}-meter-value">${v(a)}%</strong>
      </div>
      <div class="channel-meter"><i class="${n}-meter-fill" style="width:${v(a)}%"></i></div>
      <small>${r}</small>
    </div>
  `}function y(t,a,n,r,d,c,m,k=M){return`
    <div class="gain-control">
      <div class="gain-head">
        <div>
          <strong>${a}</strong>
          <span>${n}</span>
        </div>
        <output class="gain-output ${m}">${k(r)}</output>
      </div>
      <input class="range" id="${t}" type="range" min="0" max="${d}" step="${c}" value="${r}" />
    </div>
  `}function bt(){const t=e.systemAudioEnabled;return`
    ${D(i("studio.kicker"),i("studio.title"),i("studio.description"),`<div class="latency-chip">${s("bolt")} LOW LATENCY <strong>${w()}</strong></div>`)}

    <section class="broadcast-hero ${t?"is-broadcasting":""}">
      <div class="broadcast-visual">
        <div class="broadcast-orbit orbit-one"></div>
        <div class="broadcast-orbit orbit-two"></div>
        <button class="broadcast-button" id="system-audio-toggle" aria-pressed="${t}">
          <span class="broadcast-core">${s(t?"stop":"studio")}</span>
        </button>
      </div>
      <div class="broadcast-copy">
        <div class="panel-kicker">${t?`<span class="live-beacon"></span> ${i("studio.live")}`:i("studio.systemAudio")}</div>
        <h2>${i(t?"studio.broadcastingTitle":"studio.broadcastTitle")}</h2>
        <p>${i(t?"studio.broadcastingDescription":"studio.broadcastDescription")}</p>
        <button class="button ${t?"button-stop":"button-accent"} broadcast-cta" id="system-audio-cta">
          ${t?`${s("stop")} ${i("studio.stopBroadcast")}`:`${s("studio")} ${i("studio.startBroadcast")}`}
        </button>
        <div class="broadcast-note">${s("alert")} ${i("studio.echoNote")}</div>
      </div>
      <div class="broadcast-level">
        <div class="metric-label">SYSTEM IN</div>
        <strong class="system-meter-value">${v(e.nativeAudio.systemLevel01)}%</strong>
        <div class="vertical-meter"><i class="system-meter-fill" style="height:${v(e.nativeAudio.systemLevel01)}%"></i></div>
      </div>
    </section>

    <section class="signal-route">
      <div class="route-node">
        <span class="route-icon">${s("monitor")}</span>
        <div><small>${i("studio.sources")}</small><strong>${i("studio.sourceApps")}</strong></div>
      </div>
      <div class="route-line ${t?"is-flowing":""}"><i></i>${s("arrow")}</div>
      <div class="route-node">
        <span class="route-icon">${s("studio")}</span>
        <div><small>${i("studio.mixer")}</small><strong>MicDeck Engine</strong></div>
      </div>
      <div class="route-line ${e.nativeAudio.ready?"is-flowing":""}"><i></i>${s("arrow")}</div>
      <div class="route-node">
        <span class="route-icon">${s("mic")}</span>
        <div><small>${i("studio.output")}</small><strong>${l(e.virtualAudio.microphoneName||e.microphoneNameInput)}</strong></div>
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
            <div class="channel-icon">${s("mic")}</div>
            ${y("microphone-gain-range",i("studio.microphone"),i("studio.yourVoice"),e.microphoneGain,3,.01,"microphone-gain-value")}
            ${E("MIC",e.nativeAudio.microphoneLevel01,"microphone",i("studio.physicalInput"))}
          </div>
          <div class="mixer-channel">
            <div class="channel-icon">${s("library")}</div>
            ${y("volume-range","Soundboard",i("studio.bindsFiles"),e.volume,6,.01,"sound-gain-value")}
            ${y("overdrive-range","Drive",i("studio.extraSaturation"),e.soundOverdrive,4,.05,"overdrive-value",x)}
          </div>
          <div class="mixer-channel ${t?"is-hot":""}">
            <div class="channel-icon">${s("monitor")}</div>
            ${y("system-gain-range","System audio",i(t?"studio.transmissionActive":"studio.transmissionOff"),e.systemAudioGain,2,.01,"system-gain-value")}
            ${E("SYSTEM",e.nativeAudio.systemLevel01,"system","Loopback WASAPI")}
          </div>
          <div class="mixer-channel master-channel">
            <div class="channel-icon">${s("route")}</div>
            ${y("monitor-range",i("studio.bindMonitoring"),i(t?"studio.mutedDuringBroadcast":"studio.yourHeadphones"),e.monitorGain,2,.01,"monitor-gain-value")}
            ${E("MASTER",e.nativeAudio.mixedLevel01,"mixed",i("studio.virtualMicrophone"))}
          </div>
        </div>
      </section>

      <section class="surface input-surface">
        <div class="surface-head">
          <div><div class="panel-kicker">INPUT</div><h2>${i("studio.voiceSource")}</h2></div>
          <span class="round-icon">${s("mic")}</span>
        </div>
        <label class="field-label" for="physical-microphone">${i("studio.physicalMicrophone")}</label>
        <select id="physical-microphone" class="input" ${e.inputDevices.length?"":"disabled"}>
          ${e.inputDevices.length?e.inputDevices.map(a=>`<option value="${l(a.id)}" ${a.id===e.selectedInputDevice?"selected":""}>${l(a.name)}</option>`).join(""):`<option>${i("studio.noMicrophone")}</option>`}
        </select>
        <div class="engine-stats">
          <div><span>${i("studio.latency")}</span><strong>${w()}</strong></div>
          <div><span>XRUN</span><strong>${e.nativeAudio.underruns||0}</strong></div>
          <div><span>${i("studio.process")}</span><strong>${e.nativeAudio.enginePid||"—"}</strong></div>
          <div><span>${i("studio.format")}</span><strong>48 kHz / F32</strong></div>
        </div>
        <div class="input-actions">
          <button class="button button-subtle" id="stop-btn">${s("stop")} ${i("studio.stopBind")}</button>
          <button class="icon-button" id="restart-engine-btn" title="${i("studio.restartEngine")}" ${e.isRestartingEngine?"disabled":""}>${s("refresh")}</button>
        </div>
      </section>
    </div>
  `}function ft(){const t=e.virtualAudio.microphoneName||e.microphoneNameInput;return`
    ${D(i("settings.kicker"),i("settings.title"),i("settings.description"))}

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
            <span class="round-icon">${s("route")}</span>
            <div>
              <small>${i("settings.mixOutput")}</small>
              <strong>${l(e.virtualAudio.renderDeviceName||"Managed cable")}</strong>
            </div>
            ${s("check","route-check")}
          </div>
          <label class="field-label" for="microphone-name">${i("settings.systemName")}</label>
          <div class="inline-field">
            <input id="microphone-name" class="input" maxlength="80" value="${l(e.microphoneNameInput)}" />
            <button class="button button-primary" id="rename-microphone-btn" ${e.isRenamingMicrophone?"disabled":""}>
              ${e.isRenamingMicrophone?'<span class="spinner"></span>':i("common.save")}
            </button>
          </div>
          <p class="helper-text">${i("settings.systemNameHelp")}</p>
        `:`
          <div class="setup-callout">
            ${s("alert")}
            <div>
              <strong>${i("settings.deviceInactive")}</strong>
              <p>${l(e.virtualAudio.error||(e.virtualAudio.restartRequired?i("settings.driverInstalledRestart"):i("settings.installDriverHelp")))}</p>
            </div>
          </div>
          <button class="button button-accent full-button" id="install-driver-btn" ${e.isInstallingDriver?"disabled":""}>
            ${e.isInstallingDriver?`<span class="spinner"></span> ${i("common.installing")}`:`${s("download")} ${i("settings.installDriver")}`}
          </button>
        `}
        <div class="vendor-note">${i("settings.deviceLayer")}: ${l(e.virtualAudio.vendor)} · <a href="https://vb-audio.com/Cable/" target="_blank" rel="noreferrer">${i("settings.donationware")}</a></div>
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
          <div><span>Runtime</span><strong>${l(e.nativeAudio.runtime)}</strong></div>
          <div><span>${i("settings.protocol")}</span><strong>IPC v${e.nativeAudio.protocolVersion||"—"}</strong></div>
          <div><span>${i("settings.bufferMode")}</span><strong>Adaptive low-latency</strong></div>
          <div><span>${i("settings.estimatedLatency")}</span><strong>${w()}</strong></div>
          <div><span>XRUN / underrun</span><strong>${e.nativeAudio.underruns||0}</strong></div>
        </div>
        ${e.nativeAudio.error?`<div class="setup-callout compact">${s("alert")}<div><strong>${i("settings.engineError")}</strong><p>${l(e.nativeAudio.error)}</p></div></div>`:""}
        <button class="button button-subtle full-button" id="restart-engine-btn" ${e.isRestartingEngine?"disabled":""}>
          ${e.isRestartingEngine?`<span class="spinner"></span> ${i("common.restarting")}`:`${s("refresh")} ${i("settings.restartEngine")}`}
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
            <span class="round-icon">${s("power")}</span>
            <div>
              <strong>${i("settings.autostart")}</strong>
              <p>${i("settings.autostartDescription")}</p>
            </div>
            <button class="toggle-switch ${e.autostartEnabled?"is-on":""}" id="autostart-toggle" role="switch" aria-checked="${e.autostartEnabled}" aria-label="${i("settings.autostart")}" ${e.isUpdatingAutostart?"disabled":""}>
              <i></i>
            </button>
          </div>
          <div class="preference-row">
            <span class="round-icon">${s("tray")}</span>
            <div>
              <strong>${i("settings.tray")}</strong>
              <p>${i("settings.trayDescription")}</p>
            </div>
            <span class="always-on">${i("common.alwaysOn")}</span>
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
          <li><span>02</span><div><strong>${i("settings.discordInput")}</strong><p>${l(i("settings.discordInputHelp",{microphone:t}))}</p></div></li>
          <li><span>03</span><div><strong>${i("settings.discordProcessing")}</strong><p>${i("settings.discordProcessingHelp")}</p></div></li>
        </ol>
        <div class="guide-tip">${s("bolt")} ${i("settings.discordTip")}</div>
      </section>

      <section class="surface settings-card about-card">
        <div class="about-mark">${I()}</div>
        <div class="panel-kicker">MICDECK</div>
        <h2>Trigger. Route. Be heard.</h2>
        <p>${i("settings.about")}</p>
        <div class="tech-tags"><span>Rust</span><span>C++</span><span>WASAPI</span><span>Tauri</span></div>
      </section>
    </div>
  `}function p(){const t=ct(),a=e.activeView==="studio"?bt():e.activeView==="settings"?ft():ht();document.querySelector("#app").innerHTML=`
    <div class="app-shell">
      ${ut()}
      <main class="app-content">
        ${pt()}
        ${t?`<div class="top-alert">${s("alert")}<span>${l(t)}</span><button class="nav-to-settings">${i("common.openSettings")}</button></div>`:""}
        <div class="view-wrap">${a}</div>
      </main>
      <div id="toast-host" class="toast-host"></div>
    </div>
  `,wt(),S(),C=e.playback.isPlaying?e.playback.soundId:null}function wt(){document.querySelectorAll("[data-language]").forEach(t=>{t.addEventListener("click",()=>rt(t.dataset.language))}),document.querySelectorAll("[data-view]").forEach(t=>{t.addEventListener("click",()=>{e.activeView=t.dataset.view,p()})}),document.querySelector(".nav-to-settings")?.addEventListener("click",()=>{e.activeView="settings",p()}),document.getElementById("add-btn")?.addEventListener("click",N),document.getElementById("empty-add-btn")?.addEventListener("click",N),document.getElementById("url-btn")?.addEventListener("click",P),document.querySelectorAll("#stop-btn").forEach(t=>t.addEventListener("click",it)),document.getElementById("install-driver-btn")?.addEventListener("click",nt),document.getElementById("rename-microphone-btn")?.addEventListener("click",j),document.getElementById("restart-engine-btn")?.addEventListener("click",ot),document.getElementById("system-audio-toggle")?.addEventListener("click",O),document.getElementById("system-audio-cta")?.addEventListener("click",O),document.getElementById("autostart-toggle")?.addEventListener("click",dt),document.getElementById("physical-microphone")?.addEventListener("change",t=>at(t.target.value)),document.getElementById("microphone-gain-range")?.addEventListener("input",t=>h("set_microphone_gain","microphoneGain",t.target.value,".microphone-gain-value")),document.getElementById("volume-range")?.addEventListener("input",t=>st(t.target.value)),document.getElementById("overdrive-range")?.addEventListener("input",t=>h("set_sound_overdrive","soundOverdrive",t.target.value,".overdrive-value",x)),document.getElementById("monitor-range")?.addEventListener("input",t=>h("set_monitor_gain","monitorGain",t.target.value,".monitor-gain-value")),document.getElementById("system-gain-range")?.addEventListener("input",t=>h("set_system_audio_gain","systemAudioGain",t.target.value,".system-gain-value")),document.querySelectorAll("[data-platform]").forEach(t=>{t.addEventListener("click",()=>{e.mediaPlatform=t.dataset.platform,p(),document.getElementById("url-input")?.focus()})}),document.getElementById("url-input")?.addEventListener("input",t=>{e.urlInput=t.target.value;const a=document.querySelector(".detected-platform");a&&(a.textContent=$())}),document.getElementById("url-input")?.addEventListener("keydown",t=>{t.key==="Enter"&&P()}),document.getElementById("search-input")?.addEventListener("input",t=>{e.filter=t.target.value,p();const a=document.getElementById("search-input");a?.focus(),a?.setSelectionRange(e.filter.length,e.filter.length)}),document.getElementById("microphone-name")?.addEventListener("input",t=>{e.microphoneNameInput=t.target.value,e.microphoneNameDirty=!0}),document.getElementById("microphone-name")?.addEventListener("keydown",t=>{t.key==="Enter"&&j()}),document.querySelectorAll(".play-btn").forEach(t=>{t.addEventListener("click",()=>et(t.dataset.id))}),document.querySelectorAll(".remove-btn").forEach(t=>{t.addEventListener("click",()=>tt(t.dataset.id))})}function $t(){[["microphone",e.nativeAudio.microphoneLevel01],["system",e.nativeAudio.systemLevel01],["mixed",e.nativeAudio.mixedLevel01]].forEach(([a,n])=>{document.querySelectorAll(`.${a}-meter-fill`).forEach(r=>{r.closest(".vertical-meter")?r.style.height=`${v(n)}%`:r.style.width=`${v(n)}%`}),document.querySelectorAll(`.${a}-meter-value`).forEach(r=>{r.textContent=`${v(n)}%`})})}function kt(){if(e.activeView!=="library")return;if((e.playback.isPlaying?e.playback.soundId:null)!==C){p();return}const a=document.querySelector(".now-title"),n=document.querySelector(".now-meta"),r=document.querySelector(".signal-db"),d=document.querySelector(".signal-fill"),c=document.querySelector(".now-progress .progress-fill"),m=document.querySelector(".sound-card.is-live .mini-fill");a&&(a.textContent=e.playback.isPlaying?e.playback.soundName||i("player.untitled"):i("player.silence")),n&&(n.textContent=e.playback.isPlaying?`${f(e.playback.positionMs)} / ${f(e.playback.durationMs)}`:i("player.pickSound")),r&&(r.textContent=B(e.playback.signalDbfs)),d&&(d.style.width=`${W(e.playback.signalDbfs)}%`),c&&(c.style.width=`${Math.round((e.playback.progress01||0)*100)}%`),m&&(m.style.width=`${Math.round((e.playback.progress01||0)*100)}%`)}async function At(){try{const t=`${e.nativeAudio.ready}:${e.nativeAudio.state}:${e.nativeAudio.error||""}`;[e.playback,e.nativeAudio]=await Promise.all([o("get_playback_status"),o("get_native_audio_status")]);const a=`${e.nativeAudio.ready}:${e.nativeAudio.state}:${e.nativeAudio.error||""}`;if(t!==a){p();return}kt(),$t()}catch{clearInterval(b),b=null}}function V(){b||(b=setInterval(At,140))}g().then(V).catch(t=>{document.querySelector("#app").innerHTML=`
      <div class="boot-error">
        ${I()}
        <h1>${i("boot.title")}</h1>
        <p>${l(t)}</p>
      </div>
    `});
