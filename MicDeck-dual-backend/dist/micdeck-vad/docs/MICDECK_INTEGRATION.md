# MicDeck integration plan

## What changes in MicDeck

The existing native engine already renders the final mix to a selected WASAPI
output endpoint. Do not replace the engine-to-driver path with IOCTL audio
writes. Keep WASAPI.

Replace only the endpoint provider:

```
old: final mixer -> VB-CABLE render endpoint
new: final mixer -> MicDeck Driver Input
```

Discord/OBS selects `MicDeck Virtual Microphone`.

## Rust/Tauri changes

Add a driver service module with:

* `driver_status()`
* `install_driver()`
* `repair_driver()`
* `uninstall_driver()`
* `find_render_endpoint()`
* `find_capture_endpoint()`
* `driver_version()`
* `driver_diagnostics()`

Installation and removal must happen through a small elevated helper. The Tauri
webview must never receive arbitrary command execution.

Suggested status state machine:

```
NotInstalled
Installing
DriverPresentEndpointsStarting
Ready
UpdateRequired
RepairRequired
RestartRequired
Error
```

## Native bridge changes

The existing Windows endpoint enumeration should identify MicDeck by PnP
properties, not only by friendly name.

Preferred checks:

1. endpoint is active;
2. parent device instance ID starts with `ROOT\MICDECKVAD`;
3. endpoint data flow matches the expected role;
4. supported mix format includes 48 kHz stereo float or PCM;
5. endpoint can initialize an event-driven shared-mode stream.

The engine's existing render callback and mixer do not need to know that the
output is a custom driver.

## Engine recovery

When the driver is installed, upgraded or restarted:

1. stop the render client;
2. release `IAudioClient` and `IMMDevice`;
3. re-enumerate endpoint IDs;
4. reopen the MicDeck render endpoint;
5. clear user-mode audio rings;
6. wait for the first successful render callback;
7. expose driver reconnect counters in diagnostics.

Never cache an endpoint ID forever across driver package upgrades.

## Migration

For one or two preview releases:

1. prefer MicDeck VAD;
2. retain VB-CABLE as a manual legacy backend;
3. never uninstall VB-CABLE automatically;
4. collect local diagnostics, not telemetry;
5. remove VB-CABLE bundling only after sleep/resume and long-run testing passes.

## Installer layout

```
MicDeck-Setup.exe
  app/
  native/
  driver/
    MicDeckVad.sys
    MicDeckVad.inf
    MicDeckVad.cat
  helper/
    micdeck-driver-helper.exe
```

The helper performs only fixed, allow-listed driver package operations and
returns structured status to Rust.
