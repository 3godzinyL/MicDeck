import './styles.css';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart';
import { open } from '@tauri-apps/plugin-dialog';
import { register, unregisterAll } from '@tauri-apps/plugin-global-shortcut';
import { initialLanguage, LANGUAGE_STORAGE_KEY, translate } from './i18n.js';

const GLOW_STORAGE_KEY = 'micdeck.cursorGlow.v2';

function storedBoolean(key, fallback = false) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === 'true';
  } catch {
    return fallback;
  }
}

const state = {
  activeView: 'library',
  language: initialLanguage(),
  autostartEnabled: false,
  isUpdatingAutostart: false,
  cursorGlowEnabled: storedBoolean(GLOW_STORAGE_KEY, true),
  sounds: [],
  inputDevices: [],
  selectedInputDevice: null,
  microphoneGain: 1,
  volume: 1,
  soundOverdrive: 1,
  monitorGain: 0,
  systemAudioEnabled: false,
  systemAudioGain: 0.85,
  audioSessions: [],
  nativeAudio: {
    available: false,
    ready: false,
    state: 'starting',
    protocolVersion: 0,
    enginePid: 0,
    microphoneLevel01: 0,
    systemLevel01: 0,
    mixedLevel01: 0,
    estimatedLatencyMs: 0,
    underruns: 0,
    captureOverruns: 0,
    droppedAudioFrames: 0,
    error: null,
    runtime: 'C++ / WASAPI'
  },
  virtualAudio: {
    installed: false,
    ready: false,
    installerAttempted: false,
    restartRequired: false,
    error: null,
    vendor: 'VB-Audio / VB-CABLE Pack45',
    renderDeviceName: null,
    microphoneName: null
  },
  microphoneNameInput: 'MicDeck Virtual Mic',
  microphoneNameDirty: false,
  isInstallingDriver: false,
  isRenamingMicrophone: false,
  isRestartingEngine: false,
  isRepairingDefaultMicrophone: false,
  filter: '',
  urlInput: '',
  mediaPlatform: 'auto',
  isImporting: false,
  isAddingSounds: false,
  libraryWorker: null,
  shortcutRecorder: null,
  shortcutErrors: new Map(),
  toast: null,
  playback: {
    isPlaying: false,
    soundId: null,
    soundName: null,
    positionMs: 0,
    durationMs: 0,
    progress01: 0,
    signalDbfs: -90,
    signalLevel01: 0
  }
};

let playbackTimer = null;
let audioSessionTimer = null;
let toastTimer = null;
const sessionVolumeTimers = new Map();
let renderedLiveId = null;
let newestSoundIds = new Set();
let glowFrame = null;
let pointerX = window.innerWidth * 0.72;
let pointerY = window.innerHeight * 0.22;

const icons = {
  library: '<path d="M4 5.5h16M4 12h16M4 18.5h10"/><circle cx="18" cy="18.5" r="2.5"/>',
  studio: '<path d="M4 8v8M8 5v14M12 9v6M16 3v18M20 7v10"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  download: '<path d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  play: '<path d="m9 7 8 5-8 5Z"/>',
  stop: '<rect x="7" y="7" width="10" height="10" rx="1"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 4v6m4-6v6"/>',
  mic: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8"/>',
  monitor: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
  route: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h4a4 4 0 0 1 4 4v4m-8 4h4"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.15 1.15M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.15-1.15"/>',
  bolt: '<path d="m13 2-8 12h7l-1 8 8-12h-7Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  alert: '<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v4m0 3h.01"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  refresh: '<path d="M20 6v6h-6M4 18v-6h6"/><path d="M18.5 9A7 7 0 0 0 6 6.5L4 9m2 6.5A7 7 0 0 0 18 15l2-2"/>'
  ,
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>',
  tray: '<path d="M5 5h14v10H5zM8 19h8M12 15v4"/><path d="M8 9h8"/>',
  power: '<path d="M12 3v9M6.2 6.2a8 8 0 1 0 11.6 0"/>',
  keyboard: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M10 10h.01M13 10h.01M16 10h.01M7 14h.01M10 14h7"/>',
  sparkle: '<path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3Z"/><path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>'
};

document.documentElement.lang = state.language;

function t(key, variables) {
  return translate(state.language, key, variables);
}

function icon(name, className = '') {
  return `<svg class="icon ${className}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] || ''}</svg>`;
}

function brandGlyph() {
  return `
    <svg class="brand-glyph" viewBox="0 0 44 44" aria-hidden="true">
      <path d="M7 35V9h7l8 12 8-12h7v26h-7V20l-8 12-8-12v15Z"/>
    </svg>
  `;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatMs(ms) {
  const totalSeconds = Math.floor((Number(ms) || 0) / 1000);
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function formatVolume(value) {
  return `${Math.round((Number(value) || 0) * 100)}%`;
}

function formatMultiplier(value) {
  return `×${(Number(value) || 1).toFixed(1)}`;
}

function formatDb(value) {
  if (!Number.isFinite(value) || value <= -90) return '−∞ dB';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)} dB`;
}

function dbMeterPercent(db) {
  return Math.round(((Math.max(-60, Math.min(12, db)) + 60) / 72) * 100);
}

function levelPercent(level) {
  return Math.round(Math.max(0, Math.min(1, Number(level) || 0)) * 100);
}

function latencyLabel() {
  const latency = Number(state.nativeAudio.estimatedLatencyMs);
  return latency > 0 ? `~${latency.toFixed(1)} ms` : t('common.adaptive');
}

function detectedPlatform() {
  if (state.mediaPlatform !== 'auto') return state.mediaPlatform;
  const value = state.urlInput.toLowerCase();
  if (value.includes('tiktok.com')) return 'tiktok';
  if (value.includes('/shorts/')) return 'shorts';
  if (value.includes('youtube.com') || value.includes('youtu.be')) return 'youtube';
  return 'auto';
}

function platformLabel(platform = detectedPlatform()) {
  return {
    auto: 'Auto',
    youtube: 'YouTube',
    shorts: 'Shorts',
    tiktok: 'TikTok'
  }[platform] || 'Auto';
}

function showToast(message, kind = 'info') {
  state.toast = { message: String(message), kind };
  paintToast();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    state.toast = null;
    paintToast();
  }, 4200);
}

function paintToast() {
  const host = document.getElementById('toast-host');
  if (!host) return;
  host.innerHTML = state.toast
    ? `<div class="toast toast-${escapeHtml(state.toast.kind)}">${icon(state.toast.kind === 'error' ? 'alert' : 'check')}<span>${escapeHtml(state.toast.message)}</span></div>`
    : '';
}

function shortcutParts(shortcut) {
  return String(shortcut || '')
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);
}

function shortcutMarkup(shortcut, emptyLabel = t('shortcut.assign')) {
  const parts = shortcutParts(shortcut);
  if (parts.length === 0) {
    return `<span class="shortcut-empty">${icon('keyboard')} ${emptyLabel}</span>`;
  }
  return `<span class="shortcut-keys">${parts.map((part) => `<kbd>${escapeHtml(part)}</kbd>`).join('<i>+</i>')}</span>`;
}

function shortcutFromRecorder() {
  if (!state.shortcutRecorder?.key) return null;
  return [...state.shortcutRecorder.modifiers, state.shortcutRecorder.key].join('+');
}

function shortcutPreviewFromRecorder() {
  const recorder = state.shortcutRecorder;
  if (!recorder) return null;
  return [...recorder.modifiers, ...(recorder.key ? [recorder.key] : [])].join('+') || null;
}

function keyFromKeyboardEvent(event) {
  if (/^Key[A-Z]$/.test(event.code)) return event.code.slice(3);
  if (/^Digit[0-9]$/.test(event.code)) return event.code.slice(5);
  if (/^Numpad[0-9]$/.test(event.code)) return `Numpad${event.code.slice(6)}`;
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(event.code)) return event.code;

  const keys = {
    Space: 'Space',
    Enter: 'Enter',
    Tab: 'Tab',
    Escape: 'Escape',
    ArrowUp: 'ArrowUp',
    ArrowDown: 'ArrowDown',
    ArrowLeft: 'ArrowLeft',
    ArrowRight: 'ArrowRight',
    Home: 'Home',
    End: 'End',
    PageUp: 'PageUp',
    PageDown: 'PageDown',
    Insert: 'Insert',
    Delete: 'Delete',
    Backquote: 'Backquote',
    Minus: 'Minus',
    Equal: 'Equal',
    BracketLeft: 'BracketLeft',
    BracketRight: 'BracketRight',
    Backslash: 'Backslash',
    Semicolon: 'Semicolon',
    Quote: 'Quote',
    Comma: 'Comma',
    Period: 'Period',
    Slash: 'Slash',
    NumpadAdd: 'NumpadAdd',
    NumpadSubtract: 'NumpadSubtract',
    NumpadMultiply: 'NumpadMultiply',
    NumpadDivide: 'NumpadDivide',
    NumpadDecimal: 'NumpadDecimal'
  };
  return keys[event.code] || null;
}

function modifierFromKeyboardEvent(event) {
  if (event.key === 'Control') return 'Ctrl';
  if (event.key === 'Alt' || event.key === 'AltGraph') return 'Alt';
  if (event.key === 'Shift') return 'Shift';
  if (event.key === 'Meta') return 'Super';
  return null;
}

async function syncGlobalShortcuts() {
  if (state.shortcutRecorder) return;
  const errors = new Map();
  await unregisterAll().catch(() => {});

  for (const sound of state.sounds.filter((item) => item.shortcut)) {
    try {
      await register(sound.shortcut, async (event) => {
        if (event.state !== 'Pressed') return;
        try {
          await invoke('play_sound', { id: sound.id });
          startPlaybackPolling();
        } catch (error) {
          showToast(t('toast.playFailed', { error }), 'error');
        }
      });
    } catch (error) {
      errors.set(sound.id, String(error));
    }
  }

  state.shortcutErrors = errors;
  return errors;
}

async function openShortcutRecorder(soundId) {
  const sound = state.sounds.find((item) => item.id === soundId);
  if (!sound) return;

  await unregisterAll().catch(() => {});
  const parts = shortcutParts(sound.shortcut);
  const knownModifiers = new Set(['Ctrl', 'Alt', 'Shift', 'Super']);
  state.shortcutRecorder = {
    soundId,
    soundName: sound.name.replace(/\.[^/.]+$/, ''),
    modifiers: parts.filter((part) => knownModifiers.has(part)),
    key: parts.find((part) => !knownModifiers.has(part)) || null
  };
  render();
  document.querySelector('.shortcut-dialog')?.focus();
}

async function closeShortcutRecorder() {
  state.shortcutRecorder = null;
  render();
  await syncGlobalShortcuts();
}

async function saveShortcut(shortcut) {
  const recorder = state.shortcutRecorder;
  if (!recorder) return;

  try {
    state.sounds = await invoke('set_sound_shortcut', {
      id: recorder.soundId,
      shortcut
    });
    state.shortcutRecorder = null;
    render();
    const errors = await syncGlobalShortcuts();
    if (shortcut && errors?.has(recorder.soundId)) {
      showToast(t('toast.shortcutUnavailable'), 'error');
    } else {
      showToast(t(shortcut ? 'toast.shortcutSaved' : 'toast.shortcutCleared'), 'success');
    }
  } catch (error) {
    showToast(error, 'error');
  }
}

function captureShortcutKey(event) {
  const recorder = state.shortcutRecorder;
  if (!recorder || event.repeat) return;

  event.preventDefault();
  event.stopPropagation();

  if (event.key === 'Escape') {
    closeShortcutRecorder();
    return;
  }
  if (event.key === 'Backspace') {
    if (recorder.key) recorder.key = null;
    else recorder.modifiers.pop();
    render();
    return;
  }

  const modifier = modifierFromKeyboardEvent(event);
  if (modifier) {
    if (!recorder.modifiers.includes(modifier)) recorder.modifiers.push(modifier);
    render();
    return;
  }

  const key = keyFromKeyboardEvent(event);
  if (!key) {
    showToast(t('shortcut.unsupported'), 'error');
    return;
  }
  recorder.key = key;
  render();
}

function toggleCursorGlow() {
  state.cursorGlowEnabled = !state.cursorGlowEnabled;
  try {
    localStorage.setItem(GLOW_STORAGE_KEY, String(state.cursorGlowEnabled));
  } catch {
    // The visual preference remains active for the current session.
  }
  render();
  showToast(t(state.cursorGlowEnabled ? 'toast.glowOn' : 'toast.glowOff'), 'success');
}

function setupCursorGlowTracking() {
  window.addEventListener('pointermove', (event) => {
    if (!state.cursorGlowEnabled) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (glowFrame) return;
    glowFrame = requestAnimationFrame(() => {
      glowFrame = null;
      document.documentElement.style.setProperty('--cursor-x', `${pointerX}px`);
      document.documentElement.style.setProperty('--cursor-y', `${pointerY}px`);
    });
  }, { passive: true });
}

async function setupLibraryWorkerEvents() {
  await listen('library-worker-progress', ({ payload }) => {
    state.libraryWorker = payload;
    if (state.activeView === 'library') render();
  });
  await listen('native-runtime-ready', () => {
    refreshState().catch(() => {});
  });
}

async function refreshState() {
  const [
    sounds,
    inputDevices,
    selectedInputDevice,
    microphoneGain,
    volume,
    soundOverdrive,
    monitorGain,
    systemAudioEnabled,
    systemAudioGain,
    playback,
    virtualAudio,
    nativeAudio,
    audioSessions,
    autostartEnabled
  ] = await Promise.all([
    invoke('list_sounds'),
    invoke('list_input_devices'),
    invoke('get_selected_input_device'),
    invoke('get_microphone_gain'),
    invoke('get_volume'),
    invoke('get_sound_overdrive'),
    invoke('get_monitor_gain'),
    invoke('get_system_audio_enabled'),
    invoke('get_system_audio_gain'),
    invoke('get_playback_status'),
    invoke('get_virtual_audio_status'),
    invoke('get_native_audio_status'),
    invoke('list_audio_sessions'),
    isEnabled().catch(() => false)
  ]);

  Object.assign(state, {
    sounds,
    inputDevices,
    selectedInputDevice,
    microphoneGain: Number(microphoneGain ?? 1),
    volume: Number(volume ?? 1),
    soundOverdrive: Number(soundOverdrive ?? 1),
    monitorGain: Number(monitorGain ?? 0),
    systemAudioEnabled: Boolean(systemAudioEnabled),
    systemAudioGain: Number(systemAudioGain ?? 0.85),
    playback,
    virtualAudio,
    nativeAudio,
    audioSessions,
    autostartEnabled: Boolean(autostartEnabled)
  });
  if (!state.microphoneNameDirty) {
    state.microphoneNameInput = virtualAudio.microphoneName || 'MicDeck Virtual Mic';
  }
  render();
}

async function addSounds() {
  if (state.isAddingSounds) return;
  const selected = await open({
    multiple: true,
    filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'wma'] }]
  });
  if (!selected || (Array.isArray(selected) && selected.length === 0)) return;
  const paths = Array.isArray(selected) ? selected : [selected];
  const previousIds = new Set(state.sounds.map((sound) => sound.id));
  state.isAddingSounds = true;
  state.libraryWorker = { kind: 'files', stage: 'queued', current: 0, total: paths.length, fileName: null };
  render();
  try {
    state.sounds = await invoke('add_sounds', { paths });
    newestSoundIds = new Set(state.sounds.filter((sound) => !previousIds.has(sound.id)).map((sound) => sound.id));
    state.isAddingSounds = false;
    state.libraryWorker = null;
    render();
    const addedCount = newestSoundIds.size;
    showToast(t(addedCount === 1 ? 'toast.soundsAdded.one' : 'toast.soundsAdded.many', { count: addedCount }), 'success');
    setTimeout(() => newestSoundIds.clear(), 1400);
  } catch (error) {
    state.isAddingSounds = false;
    state.libraryWorker = null;
    render();
    showToast(error, 'error');
  }
}

async function importFromUrl() {
  const url = state.urlInput.trim();
  if (!url || state.isImporting) return;
  const previousIds = new Set(state.sounds.map((sound) => sound.id));
  state.isImporting = true;
  state.libraryWorker = { kind: 'url', stage: 'validating', current: 0, total: 1, fileName: null };
  render();
  try {
    state.sounds = await invoke('import_from_url', { url });
    newestSoundIds = new Set(state.sounds.filter((sound) => !previousIds.has(sound.id)).map((sound) => sound.id));
    const source = platformLabel();
    state.urlInput = '';
    state.mediaPlatform = 'auto';
    state.isImporting = false;
    state.libraryWorker = null;
    render();
    showToast(t('toast.imported', { source }), 'success');
    setTimeout(() => newestSoundIds.clear(), 1400);
  } catch (error) {
    state.isImporting = false;
    state.libraryWorker = null;
    render();
    showToast(error, 'error');
  }
}

async function removeSound(id) {
  if (!confirm(t('confirm.remove'))) return;
  try {
    await invoke('remove_sound', { id });
    await refreshState();
    await syncGlobalShortcuts();
    showToast(t('toast.removed'), 'success');
  } catch (error) {
    showToast(error, 'error');
  }
}

async function playSound(id) {
  try {
    await invoke('play_sound', { id });
    await refreshState();
    startPlaybackPolling();
  } catch (error) {
    showToast(t('toast.playFailed', { error }), 'error');
  }
}

async function stopPlayback() {
  try {
    await invoke('stop_playback');
    await refreshState();
  } catch (error) {
    showToast(error, 'error');
  }
}

async function onInputDeviceChange(deviceId) {
  try {
    state.selectedInputDevice = deviceId;
    await invoke('set_selected_input_device', { deviceId });
    await refreshState();
    showToast(t('toast.inputChanged'), 'success');
  } catch (error) {
    showToast(error, 'error');
    await refreshState();
  }
}

async function updateGain(command, stateKey, value, selector, formatter = formatVolume) {
  state[stateKey] = Number(value);
  const output = document.querySelector(selector);
  if (output) output.textContent = formatter(state[stateKey]);
  try {
    await invoke(command, command === 'set_sound_overdrive'
      ? { overdrive: state[stateKey] }
      : { gain: state[stateKey] });
  } catch (error) {
    showToast(error, 'error');
  }
}

function onVolumeChange(value) {
  state.volume = Number(value);
  const output = document.querySelector('.sound-gain-value');
  if (output) output.textContent = formatVolume(state.volume);
  invoke('set_volume', { volume: state.volume }).catch((error) => showToast(error, 'error'));
}

async function toggleSystemAudio() {
  if (!state.nativeAudio.ready) {
    showToast(t('toast.engineRequired'), 'error');
    return;
  }
  const previous = state.systemAudioEnabled;
  state.systemAudioEnabled = !previous;
  render();
  try {
    await invoke('set_system_audio_enabled', { enabled: state.systemAudioEnabled });
    showToast(
      state.systemAudioEnabled
        ? t('toast.systemOn')
        : t('toast.systemOff'),
      'success'
    );
  } catch (error) {
    state.systemAudioEnabled = previous;
    render();
    showToast(error, 'error');
  }
}

async function installVirtualAudioDriver() {
  if (state.isInstallingDriver) return;
  state.isInstallingDriver = true;
  render();
  try {
    await invoke('install_virtual_audio_driver');
    await refreshState();
  } catch (error) {
    state.isInstallingDriver = false;
    render();
    showToast(t('toast.driverFailed', { error }), 'error');
  }
}

async function renameVirtualMicrophone() {
  const name = state.microphoneNameInput.trim();
  if (!name || state.isRenamingMicrophone) return;
  state.isRenamingMicrophone = true;
  render();
  try {
    await invoke('rename_virtual_microphone', { name });
    await new Promise((resolve) => setTimeout(resolve, 500));
    state.microphoneNameDirty = false;
    state.isRenamingMicrophone = false;
    await refreshState();
    showToast(t('toast.micRenamed'), 'success');
  } catch (error) {
    state.isRenamingMicrophone = false;
    render();
    showToast(error, 'error');
  }
}

async function restartNativeAudioEngine() {
  if (state.isRestartingEngine) return;
  state.isRestartingEngine = true;
  render();
  try {
    await invoke('restart_native_audio_engine');
    await new Promise((resolve) => setTimeout(resolve, 350));
    state.isRestartingEngine = false;
    await refreshState();
    showToast(t('toast.engineRestarted'), 'success');
  } catch (error) {
    state.isRestartingEngine = false;
    render();
    showToast(error, 'error');
  }
}

async function repairDefaultMicrophone() {
  if (state.isRepairingDefaultMicrophone) return;
  state.isRepairingDefaultMicrophone = true;
  render();
  try {
    const name = await invoke('repair_default_microphone');
    state.isRepairingDefaultMicrophone = false;
    render();
    showToast(t('toast.microphoneRepaired', { name }), 'success');
  } catch (error) {
    state.isRepairingDefaultMicrophone = false;
    render();
    showToast(error, 'error');
  }
}

function setAudioSessionVolume(id, rawVolume) {
  const volume = Math.max(0, Math.min(1, Number(rawVolume)));
  const session = state.audioSessions.find((item) => item.id === id);
  if (session) {
    session.volume = volume;
    session.muted = volume <= 0.001;
  }
  const output = document.querySelector(`[data-session-volume-output="${id}"]`);
  if (output) output.textContent = `${Math.round(volume * 100)}%`;

  clearTimeout(sessionVolumeTimers.get(id));
  sessionVolumeTimers.set(id, setTimeout(async () => {
    sessionVolumeTimers.delete(id);
    try {
      await invoke('set_audio_session_volume', { id, volume });
    } catch (error) {
      showToast(error, 'error');
    }
  }, 60));
}

function setLanguage(language) {
  if (!['pl', 'en'].includes(language) || state.language === language) return;
  state.language = language;
  document.documentElement.lang = language;
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // The selected language still applies for the current session.
  }
  render();
  showToast(t('toast.languageChanged'), 'success');
}

async function toggleAutostart() {
  if (state.isUpdatingAutostart) return;
  const nextValue = !state.autostartEnabled;
  state.isUpdatingAutostart = true;
  render();
  try {
    if (nextValue) await enable();
    else await disable();
    state.autostartEnabled = await isEnabled();
    showToast(t(state.autostartEnabled ? 'toast.autostartOn' : 'toast.autostartOff'), 'success');
  } catch (error) {
    showToast(error, 'error');
  } finally {
    state.isUpdatingAutostart = false;
    render();
  }
}

function filteredSounds() {
  const query = state.filter.trim().toLowerCase();
  if (!query) return state.sounds;
  return state.sounds.filter((sound) =>
    [sound.name, sound.path, sound.extension, sound.sourceKind].join(' ').toLowerCase().includes(query)
  );
}

function criticalAlert() {
  if (state.virtualAudio.restartRequired) {
    return t('alert.restartWindows');
  }
  if (state.virtualAudio.error) return t('alert.driver', { error: state.virtualAudio.error });
  if (state.nativeAudio.state === 'error') {
    return state.nativeAudio.error || t('alert.engine');
  }
  return null;
}

function navButton(view, label, iconName) {
  return `
    <button class="nav-item ${state.activeView === view ? 'is-active' : ''}" data-view="${view}">
      ${icon(iconName)}
      <span>${label}</span>
      ${view === 'studio' && state.systemAudioEnabled ? '<i class="nav-live-dot"></i>' : ''}
    </button>
  `;
}

function appSidebar() {
  const ready = state.nativeAudio.ready && state.virtualAudio.ready;
  return `
    <aside class="app-sidebar">
      <div class="brand-lockup">
        <div class="brand-symbol">${brandGlyph()}</div>
        <div class="brand-copy">
          <strong>MICDECK</strong>
          <span>Audio routing suite</span>
        </div>
      </div>

      <nav class="app-nav" aria-label="${t('nav.aria')}">
        <div class="nav-caption">${t('nav.workspace')}</div>
        ${navButton('library', t('nav.library'), 'library')}
        ${navButton('studio', t('nav.studio'), 'studio')}
        ${navButton('settings', t('nav.settings'), 'settings')}
      </nav>

      <div class="sidebar-spacer"></div>
      <div class="route-status ${ready ? 'is-ready' : 'is-waiting'}">
        <div class="route-status-head">
          <span class="status-beacon"></span>
          <strong>${ready ? t('nav.routeReady') : t('nav.routeSetup')}</strong>
        </div>
        <p>${ready ? t('nav.routeReadyDescription') : t('nav.routeSetupDescription')}</p>
        <div class="route-status-meta">
          <span>IPC v${state.nativeAudio.protocolVersion || '—'}</span>
          <span>${latencyLabel()}</span>
        </div>
      </div>
      <div class="sidebar-version">MICDECK 0.1 · Windows</div>
    </aside>
  `;
}

function appToolbar() {
  return `
    <div class="app-toolbar">
      <div class="tray-presence" title="${t('settings.trayDescription')}">
        ${icon('tray')}
        <span>${t('toolbar.tray')}</span>
        <i></i>
      </div>
      <div class="language-picker" role="group" aria-label="${t('language.label')}">
        ${icon('globe')}
        <button class="${state.language === 'pl' ? 'is-active' : ''}" data-language="pl" title="${t('language.polish')}" aria-pressed="${state.language === 'pl'}">PL</button>
        <button class="${state.language === 'en' ? 'is-active' : ''}" data-language="en" title="${t('language.english')}" aria-pressed="${state.language === 'en'}">EN</button>
      </div>
    </div>
  `;
}

function viewHeader(kicker, title, description, actions = '') {
  return `
    <header class="view-header">
      <div>
        <div class="kicker">${kicker}</div>
        <h1>${title}</h1>
        <p>${description}</p>
      </div>
      ${actions ? `<div class="view-actions">${actions}</div>` : ''}
    </header>
  `;
}

function platformSelector() {
  return `
    <div class="platform-selector" role="group" aria-label="${t('capture.source')}">
      ${['auto', 'youtube', 'shorts', 'tiktok'].map((platform) => `
        <button class="platform-chip ${state.mediaPlatform === platform ? 'is-active' : ''}" data-platform="${platform}">
          ${platformLabel(platform)}
        </button>
      `).join('')}
    </div>
  `;
}

function nowPlayingPanel() {
  const playing = state.playback.isPlaying;
  return `
    <section class="now-playing ${playing ? 'is-live' : ''}">
      <div class="now-art">
        <div class="art-disc"></div>
        <div class="art-center">${playing ? icon('studio') : icon('play')}</div>
      </div>
      <div class="now-copy">
        <div class="panel-kicker">${playing ? `<span class="live-beacon"></span> ${t('player.nowPlaying')}` : t('player.label')}</div>
        <h2 class="now-title">${escapeHtml(playing ? state.playback.soundName || t('player.untitled') : t('player.silence'))}</h2>
        <p class="now-meta">${playing ? `${formatMs(state.playback.positionMs)} / ${formatMs(state.playback.durationMs)}` : t('player.pickSound')}</p>
      </div>
      <div class="now-signal">
        <div class="metric-label">${t('player.signal')}</div>
        <strong class="signal-db">${formatDb(state.playback.signalDbfs)}</strong>
        <div class="meter"><i class="signal-fill" style="width:${dbMeterPercent(state.playback.signalDbfs)}%"></i></div>
      </div>
      <button class="icon-button now-stop" id="stop-btn" title="${t('common.stop')}" ${playing ? '' : 'disabled'}>
        ${icon('stop')}
      </button>
      <div class="now-progress"><i class="progress-fill" style="width:${Math.round((state.playback.progress01 || 0) * 100)}%"></i></div>
    </section>
  `;
}

function soundArtwork(sound, index) {
  const label = String(sound.name || 'VX')
    .replace(/\.[^/.]+$/, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const bars = Array.from({ length: 14 }, (_, bar) => {
    const height = 22 + ((index * 17 + bar * 29 + String(sound.name).length * 7) % 64);
    return `<i style="height:${height}%"></i>`;
  }).join('');
  return `<div class="sound-art sound-art-${index % 5}"><span>${escapeHtml(label || 'VX')}</span><div class="wave-bars">${bars}</div></div>`;
}

function soundCard(sound, index) {
  const isLive = state.playback.isPlaying && state.playback.soundId === sound.id;
  const shortcutError = state.shortcutErrors.has(sound.id);
  return `
    <article class="sound-card ${isLive ? 'is-live' : ''} ${newestSoundIds.has(sound.id) ? 'is-new' : ''}">
      ${soundArtwork(sound, index)}
      <div class="sound-card-body">
        <div class="sound-card-top">
          <span class="file-type">${escapeHtml(sound.extension.toUpperCase())}</span>
          ${isLive ? '<span class="playing-tag"><i></i> LIVE</span>' : `<span class="sound-duration">${escapeHtml(sound.durationText)}</span>`}
        </div>
        <h3 title="${escapeHtml(sound.name)}">${escapeHtml(sound.name.replace(/\.[^/.]+$/, ''))}</h3>
        <div class="sound-details">
          <span>${escapeHtml(sound.fileSizeText)}</span>
          <i></i>
          <span>${sound.sourceKind === 'library' ? t('sound.downloaded') : t('sound.local')}</span>
        </div>
        ${isLive ? `
          <div class="card-progress"><i class="mini-fill" style="width:${Math.round((state.playback.progress01 || 0) * 100)}%"></i></div>
        ` : ''}
        <button class="shortcut-control ${sound.shortcut ? 'has-shortcut' : ''} ${shortcutError ? 'has-error' : ''}" data-shortcut-id="${escapeHtml(sound.id)}" title="${escapeHtml(shortcutError ? t('shortcut.unavailable') : t('shortcut.clickToEdit'))}">
          <span class="shortcut-control-label">${t('shortcut.label')}</span>
          ${shortcutMarkup(sound.shortcut)}
          ${shortcutError ? icon('alert') : icon('keyboard')}
        </button>
        <div class="sound-actions">
          <button class="play-button play-btn" data-id="${escapeHtml(sound.id)}">
            ${icon(isLive ? 'studio' : 'play')}
            <span>${isLive ? t('player.playing') : t('player.play')}</span>
          </button>
          <button class="icon-button remove-btn" data-id="${escapeHtml(sound.id)}" title="${t('common.remove')}">
            ${icon('trash')}
          </button>
        </div>
      </div>
    </article>
  `;
}

function libraryWorkerStatus() {
  const worker = state.libraryWorker;
  if (!worker) return '';

  const stageProgress = {
    queued: 6,
    validating: 12,
    downloading: 42,
    analyzing: 58,
    finalizing: 92,
    complete: 100,
    failed: 100
  };
  const itemProgress = worker.total > 0 ? (worker.current / worker.total) * 28 : 0;
  const progress = Math.min(100, Math.round((stageProgress[worker.stage] || 8) + itemProgress));
  const stageKey = `worker.${worker.stage}`;

  return `
    <section class="library-worker ${worker.stage === 'failed' ? 'has-error' : ''}" aria-live="polite">
      <div class="worker-orbit"><span></span>${icon(worker.kind === 'url' ? 'download' : 'studio')}</div>
      <div class="worker-copy">
        <div class="worker-title-row">
          <strong>${t(worker.kind === 'url' ? 'worker.captureTitle' : 'worker.filesTitle')}</strong>
          <span>${progress}%</span>
        </div>
        <p>${escapeHtml(t(stageKey))}${worker.fileName ? ` · ${escapeHtml(worker.fileName)}` : ''}</p>
        <div class="worker-track"><i style="width:${progress}%"></i></div>
      </div>
      <span class="worker-thread">${icon('bolt')} ${t('worker.thread')}</span>
    </section>
  `;
}

function shortcutDialog() {
  const recorder = state.shortcutRecorder;
  if (!recorder) return '';
  const shortcut = shortcutPreviewFromRecorder();
  const instruction = recorder.key
    ? t('shortcut.ready')
    : recorder.modifiers.length > 0
      ? t('shortcut.pressTrigger')
      : t('shortcut.pressFirst');
  const savedSound = state.sounds.find((sound) => sound.id === recorder.soundId);

  return `
    <div class="modal-backdrop" data-close-shortcut>
      <section class="shortcut-dialog" role="dialog" aria-modal="true" aria-labelledby="shortcut-title" tabindex="-1">
        <button class="dialog-close" data-cancel-shortcut aria-label="${t('common.cancel')}">${icon('close')}</button>
        <div class="dialog-icon">${icon('keyboard')}</div>
        <div class="panel-kicker">GLOBAL HOTKEY</div>
        <h2 id="shortcut-title">${t('shortcut.title')}</h2>
        <p class="dialog-sound-name">${escapeHtml(recorder.soundName)}</p>
        <div class="shortcut-capture ${recorder.key ? 'is-ready' : 'is-listening'}">
          <span class="capture-pulse"></span>
          ${shortcutMarkup(shortcut, t('shortcut.waiting'))}
        </div>
        <p class="shortcut-instruction">${instruction}</p>
        <div class="shortcut-hints">
          <span><kbd>Esc</kbd> ${t('common.cancel')}</span>
          <span><kbd>Backspace</kbd> ${t('shortcut.undo')}</span>
        </div>
        <div class="dialog-actions">
          <button class="button button-subtle" data-clear-shortcut ${savedSound?.shortcut ? '' : 'disabled'}>${t('shortcut.clear')}</button>
          <button class="button button-subtle" data-cancel-shortcut>${t('common.cancel')}</button>
          <button class="button button-primary" data-save-shortcut ${recorder.key ? '' : 'disabled'}>${t('common.save')}</button>
        </div>
      </section>
    </div>
  `;
}

function libraryView() {
  const sounds = filteredSounds();
  return `
    ${viewHeader(
      t('library.kicker'),
      t('library.title'),
      t('library.description'),
      `<button class="button button-primary" id="add-btn" ${state.isAddingSounds ? 'disabled' : ''}>
        ${state.isAddingSounds ? `<span class="spinner spinner-dark"></span> ${t('worker.analyzing')}` : `${icon('plus')} ${t('library.addFiles')}`}
      </button>`
    )}

    ${libraryWorkerStatus()}

    <div class="library-lead">
      <section class="capture-card">
        <div class="capture-card-head">
          <div class="feature-icon">${icon('download')}</div>
          <div>
            <div class="panel-kicker">QUICK CAPTURE</div>
            <h2>${t('library.captureTitle')}</h2>
          </div>
          <span class="support-label">YT-DLP</span>
        </div>
        <p>${t('library.captureDescription')}</p>
        ${platformSelector()}
        <div class="url-field">
          ${icon('link')}
          <input id="url-input" placeholder="https://youtube.com/shorts/…" value="${escapeHtml(state.urlInput)}" />
          <span class="detected-platform">${escapeHtml(platformLabel())}</span>
          <button id="url-btn" class="button button-accent" ${state.isImporting ? 'disabled' : ''}>
            ${state.isImporting ? `<span class="spinner"></span> ${t('library.downloading')}` : `${icon('download')} ${t('library.download')}`}
          </button>
        </div>
        <div class="capture-foot">
          <span>${icon('check')} YouTube</span>
          <span>${icon('check')} Shorts</span>
          <span>${icon('check')} TikTok</span>
          <small>${t('library.requirements')}</small>
        </div>
        <div class="capture-rights">${icon('alert')} ${t('library.rightsNotice')}</div>
      </section>
      ${nowPlayingPanel()}
    </div>

    <section class="library-section">
      <div class="section-toolbar">
        <div>
          <h2>${t('library.sectionTitle')}</h2>
          <span>${state.sounds.length} ${t(state.sounds.length === 1 ? 'library.item.one' : 'library.item.many')}</span>
        </div>
        <label class="search-field">
          ${icon('search')}
          <input id="search-input" placeholder="${t('library.search')}" value="${escapeHtml(state.filter)}" />
        </label>
      </div>

      ${sounds.length === 0 ? `
        <div class="empty-state">
          <div class="empty-symbol">${icon('studio')}</div>
          <h3>${state.sounds.length ? t('library.noResults') : t('library.empty')}</h3>
          <p>${state.sounds.length ? t('library.changeSearch') : t('library.emptyDescription')}</p>
          ${state.sounds.length ? '' : `<button class="button button-primary" id="empty-add-btn">${icon('plus')} ${t('library.addFirst')}</button>`}
        </div>
      ` : `
        <div class="sound-grid">
          ${sounds.map(soundCard).join('')}
        </div>
      `}
    </section>
  `;
}

function meterRow(label, value, className, detail) {
  return `
    <div class="channel-meter-row">
      <div class="channel-meter-label">
        <span>${label}</span>
        <strong class="${className}-meter-value">${levelPercent(value)}%</strong>
      </div>
      <div class="channel-meter"><i class="${className}-meter-fill" style="width:${levelPercent(value)}%"></i></div>
      <small>${detail}</small>
    </div>
  `;
}

function gainControl(id, title, caption, value, max, step, valueClass, formatter = formatVolume) {
  return `
    <div class="gain-control">
      <div class="gain-head">
        <div>
          <strong>${title}</strong>
          <span>${caption}</span>
        </div>
        <output class="gain-output ${valueClass}">${formatter(value)}</output>
      </div>
      <input class="range" id="${id}" type="range" min="0" max="${max}" step="${step}" value="${value}" />
    </div>
  `;
}

function audioSessionAgeLabel(milliseconds) {
  const age = Number(milliseconds);
  if (!Number.isFinite(age) || age < 3000) return t('studio.heardJustNow');
  if (age < 60000) return t('studio.heardSeconds', { count: Math.max(1, Math.round(age / 1000)) });
  return t('studio.heardMinutes', { count: Math.max(1, Math.round(age / 60000)) });
}

function audioSessionRack() {
  const sessions = state.audioSessions.slice(0, 12);
  return `
    <div class="broadcast-source-rack">
      <div class="source-rack-head">
        <div>
          <div class="panel-kicker">${t('studio.sourceRackKicker')}</div>
          <h3>${t('studio.sourceRackTitle')}</h3>
          <p>${t('studio.sourceRackDescription')}</p>
        </div>
        <span class="source-count">${sessions.length} ${t('studio.apps')}</span>
      </div>
      ${sessions.length ? `
        <div class="audio-app-list">
          ${sessions.map((session) => {
            const volume = Math.max(0, Math.min(1, Number(session.volume || 0)));
            const initial = (session.name || '?').trim().slice(0, 1).toUpperCase();
            return `
              <div class="audio-app-row ${session.active ? 'is-playing' : ''}" data-session-row="${session.id}">
                <div class="audio-app-identity">
                  <span class="audio-app-icon">
                    ${session.iconDataUrl
                      ? `<img src="${escapeHtml(session.iconDataUrl)}" alt="" />`
                      : `<span>${escapeHtml(initial)}</span>`}
                  </span>
                  <div>
                    <strong>${escapeHtml(session.name)}</strong>
                    <small data-session-activity="${session.id}">${session.active ? t('studio.playingNow') : audioSessionAgeLabel(session.lastActiveMs)}</small>
                  </div>
                </div>
                <div class="app-signal" aria-hidden="true">
                  <i data-session-meter="${session.id}" style="width:${levelPercent(session.peakLevel01)}%"></i>
                </div>
                <div class="app-volume">
                  <span>${t('studio.volume')}</span>
                  <input
                    class="range app-volume-range"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value="${volume}"
                    data-session-volume="${session.id}"
                    aria-label="${escapeHtml(`${session.name} — ${t('studio.volume')}`)}"
                  />
                  <output data-session-volume-output="${session.id}">${Math.round(volume * 100)}%</output>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div class="audio-app-empty">
          <span>${icon('monitor')}</span>
          <div><strong>${t('studio.noAudioApps')}</strong><p>${t('studio.noAudioAppsHelp')}</p></div>
        </div>
      `}
    </div>
  `;
}

function studioView() {
  const live = state.systemAudioEnabled;
  return `
    ${viewHeader(
      t('studio.kicker'),
      t('studio.title'),
      t('studio.description'),
      `<div class="latency-chip">${icon('bolt')} LOW LATENCY <strong>${latencyLabel()}</strong></div>`
    )}

    <section class="broadcast-hero ${live ? 'is-broadcasting is-expanded' : ''}">
      <div class="broadcast-visual">
        <div class="broadcast-orbit orbit-one"></div>
        <div class="broadcast-orbit orbit-two"></div>
        <button class="broadcast-button" id="system-audio-toggle" aria-pressed="${live}">
          <span class="broadcast-core">${live ? icon('stop') : icon('studio')}</span>
        </button>
      </div>
      <div class="broadcast-copy">
        <div class="panel-kicker">${live ? `<span class="live-beacon"></span> ${t('studio.live')}` : t('studio.systemAudio')}</div>
        <h2>${live ? t('studio.broadcastingTitle') : t('studio.broadcastTitle')}</h2>
        <p>${live
          ? t('studio.broadcastingDescription')
          : t('studio.broadcastDescription')}</p>
        <button class="button ${live ? 'button-stop' : 'button-accent'} broadcast-cta" id="system-audio-cta">
          ${live ? `${icon('stop')} ${t('studio.stopBroadcast')}` : `${icon('studio')} ${t('studio.startBroadcast')}`}
        </button>
        <div class="broadcast-note">${icon('alert')} ${t('studio.echoNote')}</div>
      </div>
      <div class="broadcast-level">
        <div class="metric-label">SYSTEM IN</div>
        <strong class="system-meter-value">${levelPercent(state.nativeAudio.systemLevel01)}%</strong>
        <div class="vertical-meter"><i class="system-meter-fill" style="height:${levelPercent(state.nativeAudio.systemLevel01)}%"></i></div>
      </div>
      ${live ? audioSessionRack() : ''}
    </section>

    <section class="signal-route">
      <div class="route-node">
        <span class="route-icon">${icon('monitor')}</span>
        <div><small>${t('studio.sources')}</small><strong>${t('studio.sourceApps')}</strong></div>
      </div>
      <div class="route-line ${live ? 'is-flowing' : ''}"><i></i>${icon('arrow')}</div>
      <div class="route-node">
        <span class="route-icon">${icon('studio')}</span>
        <div><small>${t('studio.mixer')}</small><strong>MicDeck Engine</strong></div>
      </div>
      <div class="route-line ${state.nativeAudio.ready ? 'is-flowing' : ''}"><i></i>${icon('arrow')}</div>
      <div class="route-node">
        <span class="route-icon">${icon('mic')}</span>
        <div><small>${t('studio.output')}</small><strong>${escapeHtml(state.virtualAudio.microphoneName || state.microphoneNameInput)}</strong></div>
      </div>
    </section>

    <div class="studio-grid">
      <section class="surface mixer-surface">
        <div class="surface-head">
          <div><div class="panel-kicker">LIVE MIX</div><h2>${t('studio.mixerTitle')}</h2></div>
          <span class="status-pill ${state.nativeAudio.ready ? 'is-good' : 'is-warn'}">${state.nativeAudio.ready ? t('studio.engineOnline') : t('studio.engineOffline')}</span>
        </div>
        <div class="mixer-channels">
          <div class="mixer-channel">
            <div class="channel-icon">${icon('mic')}</div>
            ${gainControl('microphone-gain-range', t('studio.microphone'), t('studio.yourVoice'), state.microphoneGain, 3, 0.01, 'microphone-gain-value')}
            ${meterRow('MIC', state.nativeAudio.microphoneLevel01, 'microphone', t('studio.physicalInput'))}
          </div>
          <div class="mixer-channel">
            <div class="channel-icon">${icon('library')}</div>
            ${gainControl('volume-range', 'Soundboard', t('studio.bindsFiles'), state.volume, 6, 0.01, 'sound-gain-value')}
            ${gainControl('overdrive-range', 'Drive', t('studio.extraSaturation'), state.soundOverdrive, 4, 0.05, 'overdrive-value', formatMultiplier)}
          </div>
          <div class="mixer-channel ${live ? 'is-hot' : ''}">
            <div class="channel-icon">${icon('monitor')}</div>
            ${gainControl('system-gain-range', 'System audio', live ? t('studio.transmissionActive') : t('studio.transmissionOff'), state.systemAudioGain, 2, 0.01, 'system-gain-value')}
            ${meterRow('SYSTEM', state.nativeAudio.systemLevel01, 'system', 'Loopback WASAPI')}
          </div>
          <div class="mixer-channel master-channel">
            <div class="channel-icon">${icon('route')}</div>
            ${gainControl('monitor-range', t('studio.bindMonitoring'), live ? t('studio.mutedDuringBroadcast') : t('studio.yourHeadphones'), state.monitorGain, 2, 0.01, 'monitor-gain-value')}
            ${meterRow('MASTER', state.nativeAudio.mixedLevel01, 'mixed', t('studio.virtualMicrophone'))}
          </div>
        </div>
      </section>

      <section class="surface input-surface">
        <div class="surface-head">
          <div><div class="panel-kicker">INPUT</div><h2>${t('studio.voiceSource')}</h2></div>
          <span class="round-icon">${icon('mic')}</span>
        </div>
        <label class="field-label" for="physical-microphone">${t('studio.physicalMicrophone')}</label>
        <select id="physical-microphone" class="input" ${state.inputDevices.length ? '' : 'disabled'}>
          ${state.inputDevices.length
            ? state.inputDevices.map((device) => `<option value="${escapeHtml(device.id)}" ${device.id === state.selectedInputDevice ? 'selected' : ''}>${escapeHtml(device.name)}</option>`).join('')
            : `<option>${t('studio.noMicrophone')}</option>`}
        </select>
        <div class="engine-stats">
          <div><span>${t('studio.latency')}</span><strong>${latencyLabel()}</strong></div>
          <div><span>XRUN</span><strong>${state.nativeAudio.underruns || 0}</strong></div>
          <div><span>${t('studio.process')}</span><strong>${state.nativeAudio.enginePid || '—'}</strong></div>
          <div><span>${t('studio.format')}</span><strong>48 kHz / F32</strong></div>
        </div>
        <div class="input-actions">
          <button class="button button-subtle" id="stop-btn">${icon('stop')} ${t('studio.stopBind')}</button>
          <button class="icon-button" id="restart-engine-btn" title="${t('studio.restartEngine')}" ${state.isRestartingEngine ? 'disabled' : ''}>${icon('refresh')}</button>
        </div>
      </section>
    </div>
  `;
}

function settingsView() {
  const microphoneName = state.virtualAudio.microphoneName || state.microphoneNameInput;
  return `
    ${viewHeader(
      t('settings.kicker'),
      t('settings.title'),
      t('settings.description')
    )}

    <div class="settings-grid">
      <section class="surface settings-card driver-card">
        <div class="surface-head">
          <div>
            <div class="panel-kicker">VIRTUAL DEVICE</div>
            <h2>${t('settings.virtualMicrophone')}</h2>
          </div>
          <span class="status-pill ${state.virtualAudio.ready ? 'is-good' : 'is-warn'}">${state.virtualAudio.ready ? t('common.ready') : t('common.setup')}</span>
        </div>
        ${state.virtualAudio.ready ? `
          <div class="device-route-card">
            <span class="round-icon">${icon('route')}</span>
            <div>
              <small>${t('settings.mixOutput')}</small>
              <strong>${escapeHtml(state.virtualAudio.renderDeviceName || 'Managed cable')}</strong>
            </div>
            ${icon('check', 'route-check')}
          </div>
          <label class="field-label" for="microphone-name">${t('settings.systemName')}</label>
          <div class="inline-field">
            <input id="microphone-name" class="input" maxlength="80" value="${escapeHtml(state.microphoneNameInput)}" />
            <button class="button button-primary" id="rename-microphone-btn" ${state.isRenamingMicrophone ? 'disabled' : ''}>
              ${state.isRenamingMicrophone ? '<span class="spinner"></span>' : t('common.save')}
            </button>
          </div>
          <p class="helper-text">${t('settings.systemNameHelp')}</p>
        ` : `
          <div class="setup-callout">
            ${icon('alert')}
            <div>
              <strong>${t('settings.deviceInactive')}</strong>
              <p>${escapeHtml(state.virtualAudio.error || (state.virtualAudio.restartRequired
                ? t('settings.driverInstalledRestart')
                : t('settings.installDriverHelp')))}</p>
            </div>
          </div>
          <button class="button button-accent full-button" id="install-driver-btn" ${state.isInstallingDriver ? 'disabled' : ''}>
            ${state.isInstallingDriver ? `<span class="spinner"></span> ${t('common.installing')}` : `${icon('download')} ${t('settings.installDriver')}`}
          </button>
        `}
        <div class="vendor-note">${t('settings.deviceLayer')}: ${escapeHtml(state.virtualAudio.vendor)} · <a href="https://vb-audio.com/Cable/" target="_blank" rel="noreferrer">${t('settings.donationware')}</a></div>
      </section>

      <section class="surface settings-card engine-settings">
        <div class="surface-head">
          <div>
            <div class="panel-kicker">AUDIO CORE</div>
            <h2>${t('settings.nativeEngine')}</h2>
          </div>
          <span class="status-pill ${state.nativeAudio.ready ? 'is-good' : 'is-warn'}">${state.nativeAudio.ready ? 'ONLINE' : state.nativeAudio.state.toUpperCase()}</span>
        </div>
        <div class="diagnostic-list">
          <div><span>Runtime</span><strong>${escapeHtml(state.nativeAudio.runtime)}</strong></div>
          <div><span>${t('settings.protocol')}</span><strong>IPC v${state.nativeAudio.protocolVersion || '—'}</strong></div>
          <div><span>${t('settings.bufferMode')}</span><strong>Adaptive low-latency</strong></div>
          <div><span>${t('settings.estimatedLatency')}</span><strong>${latencyLabel()}</strong></div>
          <div><span>XRUN / underrun</span><strong>${state.nativeAudio.underruns || 0}</strong></div>
          <div><span>Capture overrun</span><strong>${state.nativeAudio.captureOverruns || 0}</strong></div>
          <div><span>Dropped IPC frames</span><strong>${state.nativeAudio.droppedAudioFrames || 0}</strong></div>
        </div>
        ${state.nativeAudio.error ? `<div class="setup-callout compact">${icon('alert')}<div><strong>${t('settings.engineError')}</strong><p>${escapeHtml(state.nativeAudio.error)}</p></div></div>` : ''}
        <button class="button button-subtle full-button" id="restart-engine-btn" ${state.isRestartingEngine ? 'disabled' : ''}>
          ${state.isRestartingEngine ? `<span class="spinner"></span> ${t('common.restarting')}` : `${icon('refresh')} ${t('settings.restartEngine')}`}
        </button>
      </section>

      <section class="surface settings-card windows-settings">
        <div class="surface-head">
          <div>
            <div class="panel-kicker">DESKTOP</div>
            <h2>${t('settings.windowsIntegration')}</h2>
          </div>
          <span class="status-pill ${state.autostartEnabled ? 'is-good' : ''}">${t(state.autostartEnabled ? 'common.on' : 'common.off')}</span>
        </div>
        <div class="preference-list">
          <div class="preference-row">
            <span class="round-icon">${icon('power')}</span>
            <div>
              <strong>${t('settings.autostart')}</strong>
              <p>${t('settings.autostartDescription')}</p>
            </div>
            <button class="toggle-switch ${state.autostartEnabled ? 'is-on' : ''}" id="autostart-toggle" role="switch" aria-checked="${state.autostartEnabled}" aria-label="${t('settings.autostart')}" ${state.isUpdatingAutostart ? 'disabled' : ''}>
              <i></i>
            </button>
          </div>
          <div class="preference-row">
            <span class="round-icon">${icon('tray')}</span>
            <div>
              <strong>${t('settings.tray')}</strong>
              <p>${t('settings.trayDescription')}</p>
            </div>
            <span class="always-on">${t('common.alwaysOn')}</span>
          </div>
          <div class="preference-row">
            <span class="round-icon glow-setting-icon">${icon('sparkle')}</span>
            <div>
              <strong>${t('settings.cursorGlow')}</strong>
              <p>${t('settings.cursorGlowDescription')}</p>
            </div>
            <button class="toggle-switch ${state.cursorGlowEnabled ? 'is-on' : ''}" id="cursor-glow-toggle" role="switch" aria-checked="${state.cursorGlowEnabled}" aria-label="${t('settings.cursorGlow')}">
              <i></i>
            </button>
          </div>
          <div class="preference-row microphone-repair-row">
            <span class="round-icon">${icon('mic')}</span>
            <div>
              <strong>${t('settings.repairMicrophone')}</strong>
              <p>${t('settings.repairMicrophoneDescription')}</p>
            </div>
            <button class="button button-subtle repair-microphone-button" id="repair-microphone-btn" ${state.isRepairingDefaultMicrophone ? 'disabled' : ''}>
              ${state.isRepairingDefaultMicrophone ? '<span class="spinner"></span>' : icon('refresh')}
              ${t(state.isRepairingDefaultMicrophone ? 'settings.repairingMicrophone' : 'settings.repairMicrophoneAction')}
            </button>
          </div>
        </div>
      </section>

      <section class="surface settings-card guide-card">
        <div class="surface-head">
          <div>
            <div class="panel-kicker">VOICE APPS</div>
            <h2>${t('settings.discordTitle')}</h2>
          </div>
          <span class="round-icon discord-mark">D</span>
        </div>
        <ol class="setup-steps">
          <li><span>01</span><div><strong>${t('settings.discordOpen')}</strong><p>${t('settings.discordOpenHelp')}</p></div></li>
          <li><span>02</span><div><strong>${t('settings.discordInput')}</strong><p>${escapeHtml(t('settings.discordInputHelp', { microphone: microphoneName }))}</p></div></li>
          <li><span>03</span><div><strong>${t('settings.discordProcessing')}</strong><p>${t('settings.discordProcessingHelp')}</p></div></li>
        </ol>
        <div class="guide-tip">${icon('bolt')} ${t('settings.discordTip')}</div>
      </section>

      <section class="surface settings-card about-card">
        <div class="about-mark">${brandGlyph()}</div>
        <div class="panel-kicker">MICDECK</div>
        <h2>Trigger. Route. Be heard.</h2>
        <p>${t('settings.about')}</p>
        <div class="tech-tags"><span>Rust</span><span>C++</span><span>WASAPI</span><span>Tauri</span></div>
      </section>
    </div>
  `;
}

function render() {
  const alert = criticalAlert();
  const view = state.activeView === 'studio'
    ? studioView()
    : state.activeView === 'settings'
      ? settingsView()
      : libraryView();

  document.querySelector('#app').innerHTML = `
    <div class="app-shell ${state.cursorGlowEnabled ? 'glow-enabled' : ''}">
      <div class="ambient-canvas" aria-hidden="true">
        <div class="ambient-grid"></div>
        <div class="cursor-glow"></div>
      </div>
      ${appSidebar()}
      <main class="app-content">
        ${appToolbar()}
        ${alert ? `<div class="top-alert">${icon('alert')}<span>${escapeHtml(alert)}</span><button class="nav-to-settings">${t('common.openSettings')}</button></div>` : ''}
        <div class="view-wrap">${view}</div>
      </main>
      <div id="toast-host" class="toast-host"></div>
      ${shortcutDialog()}
    </div>
  `;

  bindEvents();
  paintToast();
  renderedLiveId = state.playback.isPlaying ? state.playback.soundId : null;
}

function bindEvents() {
  document.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.language));
  });
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeView = button.dataset.view;
      render();
    });
  });
  document.querySelector('.nav-to-settings')?.addEventListener('click', () => {
    state.activeView = 'settings';
    render();
  });
  document.getElementById('add-btn')?.addEventListener('click', addSounds);
  document.getElementById('empty-add-btn')?.addEventListener('click', addSounds);
  document.getElementById('url-btn')?.addEventListener('click', importFromUrl);
  document.querySelectorAll('#stop-btn').forEach((button) => button.addEventListener('click', stopPlayback));
  document.getElementById('install-driver-btn')?.addEventListener('click', installVirtualAudioDriver);
  document.getElementById('rename-microphone-btn')?.addEventListener('click', renameVirtualMicrophone);
  document.getElementById('restart-engine-btn')?.addEventListener('click', restartNativeAudioEngine);
  document.getElementById('repair-microphone-btn')?.addEventListener('click', repairDefaultMicrophone);
  document.getElementById('system-audio-toggle')?.addEventListener('click', toggleSystemAudio);
  document.getElementById('system-audio-cta')?.addEventListener('click', toggleSystemAudio);
  document.getElementById('autostart-toggle')?.addEventListener('click', toggleAutostart);
  document.getElementById('cursor-glow-toggle')?.addEventListener('click', toggleCursorGlow);
  document.getElementById('physical-microphone')?.addEventListener('change', (event) => onInputDeviceChange(event.target.value));

  document.getElementById('microphone-gain-range')?.addEventListener('input', (event) =>
    updateGain('set_microphone_gain', 'microphoneGain', event.target.value, '.microphone-gain-value'));
  document.getElementById('volume-range')?.addEventListener('input', (event) => onVolumeChange(event.target.value));
  document.getElementById('overdrive-range')?.addEventListener('input', (event) =>
    updateGain('set_sound_overdrive', 'soundOverdrive', event.target.value, '.overdrive-value', formatMultiplier));
  document.getElementById('monitor-range')?.addEventListener('input', (event) =>
    updateGain('set_monitor_gain', 'monitorGain', event.target.value, '.monitor-gain-value'));
  document.getElementById('system-gain-range')?.addEventListener('input', (event) =>
    updateGain('set_system_audio_gain', 'systemAudioGain', event.target.value, '.system-gain-value'));
  document.querySelectorAll('[data-session-volume]').forEach((range) => {
    range.addEventListener('input', (event) =>
      setAudioSessionVolume(event.currentTarget.dataset.sessionVolume, event.currentTarget.value));
  });

  document.querySelectorAll('[data-platform]').forEach((button) => {
    button.addEventListener('click', () => {
      state.mediaPlatform = button.dataset.platform;
      render();
      document.getElementById('url-input')?.focus();
    });
  });
  document.getElementById('url-input')?.addEventListener('input', (event) => {
    state.urlInput = event.target.value;
    const platform = document.querySelector('.detected-platform');
    if (platform) platform.textContent = platformLabel();
  });
  document.getElementById('url-input')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') importFromUrl();
  });
  document.getElementById('search-input')?.addEventListener('input', (event) => {
    state.filter = event.target.value;
    render();
    const search = document.getElementById('search-input');
    search?.focus();
    search?.setSelectionRange(state.filter.length, state.filter.length);
  });
  document.getElementById('microphone-name')?.addEventListener('input', (event) => {
    state.microphoneNameInput = event.target.value;
    state.microphoneNameDirty = true;
  });
  document.getElementById('microphone-name')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') renameVirtualMicrophone();
  });
  document.querySelectorAll('.play-btn').forEach((button) => {
    button.addEventListener('click', () => playSound(button.dataset.id));
  });
  document.querySelectorAll('.remove-btn').forEach((button) => {
    button.addEventListener('click', () => removeSound(button.dataset.id));
  });
  document.querySelectorAll('[data-shortcut-id]').forEach((button) => {
    button.addEventListener('click', () => openShortcutRecorder(button.dataset.shortcutId));
  });
  document.querySelectorAll('[data-cancel-shortcut]').forEach((button) => {
    button.addEventListener('click', closeShortcutRecorder);
  });
  document.querySelector('[data-save-shortcut]')?.addEventListener('click', () => {
    const shortcut = shortcutFromRecorder();
    if (shortcut) saveShortcut(shortcut);
  });
  document.querySelector('[data-clear-shortcut]')?.addEventListener('click', () => saveShortcut(null));
  document.querySelector('[data-close-shortcut]')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeShortcutRecorder();
  });
}

function updateNativeAudioUi() {
  const meters = [
    ['microphone', state.nativeAudio.microphoneLevel01],
    ['system', state.nativeAudio.systemLevel01],
    ['mixed', state.nativeAudio.mixedLevel01]
  ];
  meters.forEach(([name, value]) => {
    document.querySelectorAll(`.${name}-meter-fill`).forEach((fill) => {
      if (fill.closest('.vertical-meter')) fill.style.height = `${levelPercent(value)}%`;
      else fill.style.width = `${levelPercent(value)}%`;
    });
    document.querySelectorAll(`.${name}-meter-value`).forEach((label) => {
      label.textContent = `${levelPercent(value)}%`;
    });
  });
}

function audioSessionSignature(sessions) {
  return sessions
    .map((session) => `${session.id}:${session.name}:${session.iconDataUrl ? 1 : 0}`)
    .join('|');
}

function updateAudioSessionsUi() {
  if (state.activeView !== 'studio' || !state.systemAudioEnabled) return;
  const rows = new Map(
    [...document.querySelectorAll('[data-session-row]')]
      .map((row) => [row.dataset.sessionRow, row])
  );
  state.audioSessions.forEach((session) => {
    const row = rows.get(session.id);
    if (!row) return;
    row.classList.toggle('is-playing', Boolean(session.active));
    const meter = row.querySelector('[data-session-meter]');
    if (meter) meter.style.width = `${levelPercent(session.peakLevel01)}%`;
    const activity = row.querySelector('[data-session-activity]');
    if (activity) {
      activity.textContent = session.active
        ? t('studio.playingNow')
        : audioSessionAgeLabel(session.lastActiveMs);
    }
    const range = row.querySelector('[data-session-volume]');
    if (range && document.activeElement !== range && !sessionVolumeTimers.has(session.id)) {
      range.value = String(Math.max(0, Math.min(1, Number(session.volume || 0))));
    }
    const output = row.querySelector('[data-session-volume-output]');
    if (output && !sessionVolumeTimers.has(session.id)) {
      output.textContent = `${Math.round(Math.max(0, Math.min(1, Number(session.volume || 0))) * 100)}%`;
    }
  });
}

async function pollAudioSessions() {
  try {
    const sessions = await invoke('list_audio_sessions');
    const changed = audioSessionSignature(state.audioSessions) !== audioSessionSignature(sessions);
    state.audioSessions = sessions;
    if (changed && state.activeView === 'studio' && state.systemAudioEnabled) {
      render();
    } else {
      updateAudioSessionsUi();
    }
  } catch {
    // The engine can be unavailable briefly during a restart.
  }
}

function updatePlaybackUi() {
  if (state.activeView !== 'library') return;
  const shouldLiveId = state.playback.isPlaying ? state.playback.soundId : null;
  if (shouldLiveId !== renderedLiveId) {
    render();
    return;
  }
  const title = document.querySelector('.now-title');
  const meta = document.querySelector('.now-meta');
  const db = document.querySelector('.signal-db');
  const signal = document.querySelector('.signal-fill');
  const progress = document.querySelector('.now-progress .progress-fill');
  const mini = document.querySelector('.sound-card.is-live .mini-fill');
  if (title) title.textContent = state.playback.isPlaying ? state.playback.soundName || t('player.untitled') : t('player.silence');
  if (meta) meta.textContent = state.playback.isPlaying
    ? `${formatMs(state.playback.positionMs)} / ${formatMs(state.playback.durationMs)}`
    : t('player.pickSound');
  if (db) db.textContent = formatDb(state.playback.signalDbfs);
  if (signal) signal.style.width = `${dbMeterPercent(state.playback.signalDbfs)}%`;
  if (progress) progress.style.width = `${Math.round((state.playback.progress01 || 0) * 100)}%`;
  if (mini) mini.style.width = `${Math.round((state.playback.progress01 || 0) * 100)}%`;
}

async function pollPlayback() {
  try {
    const previousEngineState = `${state.nativeAudio.ready}:${state.nativeAudio.state}:${state.nativeAudio.error || ''}`;
    [state.playback, state.nativeAudio] = await Promise.all([
      invoke('get_playback_status'),
      invoke('get_native_audio_status')
    ]);
    const nextEngineState = `${state.nativeAudio.ready}:${state.nativeAudio.state}:${state.nativeAudio.error || ''}`;
    if (previousEngineState !== nextEngineState) {
      render();
      return;
    }
    updatePlaybackUi();
    updateNativeAudioUi();
  } catch {
    clearInterval(playbackTimer);
    playbackTimer = null;
  }
}

function startPlaybackPolling() {
  if (playbackTimer) return;
  playbackTimer = setInterval(pollPlayback, 180);
  if (!audioSessionTimer) {
    audioSessionTimer = setInterval(pollAudioSessions, 700);
  }
}

window.addEventListener('keydown', captureShortcutKey, true);
setupCursorGlowTracking();
setupLibraryWorkerEvents().catch(() => {});

refreshState()
  .then(async () => {
    const errors = await syncGlobalShortcuts();
    if (errors?.size) render();
    startPlaybackPolling();
  })
  .catch((error) => {
    document.querySelector('#app').innerHTML = `
      <div class="boot-error">
        ${brandGlyph()}
        <h1>${t('boot.title')}</h1>
        <p>${escapeHtml(error)}</p>
      </div>
    `;
  });
