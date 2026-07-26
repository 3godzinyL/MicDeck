#!/usr/bin/env bash
# ============================================================================
#  MicDeck — advanced health check (Shell)
#
#  Verifies that the whole pipeline is wired correctly and communicates:
#    toolchain → runtime tools → C bridge / C++ engine build → audio core
#    self-test (simulates that a bind is actually audible) → Rust tests →
#    live IPC/engine probe → shipped artifacts.
#
#  Prints a PASS/WARN/FAIL report. Exit code 0 only when nothing hard-failed.
#  Run from anywhere:  bash scripts/diagnose.sh
# ============================================================================
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 2

PASS=0; WARN=0; FAIL=0
ok()   { printf '  \033[32m[ OK ]\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
warn() { printf '  \033[33m[WARN]\033[0m %s\n' "$1"; WARN=$((WARN+1)); }
bad()  { printf '  \033[31m[FAIL]\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }
section() { printf '\n\033[1m== %s ==\033[0m\n' "$1"; }

have() { command -v "$1" >/dev/null 2>&1; }

printf '\033[1m╔══════════════════════════════════════════════╗\n'
printf '║        MicDeck — health check / raport         ║\n'
printf '╚══════════════════════════════════════════════╝\033[0m\n'
printf 'root: %s\n' "$ROOT"

# ---------------------------------------------------------------------------
section "Toolchain"
for tool in node npm cargo rustc; do
  if have "$tool"; then ok "$tool — $("$tool" --version 2>&1 | head -1)"; else bad "$tool nie znaleziony w PATH"; fi
done

VSWHERE="/c/Program Files (x86)/Microsoft Visual Studio/Installer/vswhere.exe"
VSPATH=""
if [ -f "$VSWHERE" ]; then
  VSPATH="$("$VSWHERE" -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath 2>/dev/null)"
fi
if [ -n "$VSPATH" ] && [ -f "$VSPATH/VC/Auxiliary/Build/vcvars64.bat" ]; then
  ok "MSVC C++ (Build Tools) — $VSPATH"
else
  bad "MSVC C++ (workload 'Desktop development with C++') nie wykryty przez vswhere"
fi

# ---------------------------------------------------------------------------
section "Runtime tools (import z URL — opcjonalne)"
if have yt-dlp; then ok "yt-dlp — $(yt-dlp --version 2>&1 | head -1)"; else warn "yt-dlp brak (import z URL nie zadziała) — uruchom scripts/install-tools.bat"; fi
if have ffmpeg; then ok "ffmpeg — $(ffmpeg -version 2>&1 | head -1)"; else warn "ffmpeg brak (import z URL nie zadziała) — uruchom scripts/install-tools.bat"; fi

# ---------------------------------------------------------------------------
section "Audio core — self-test C++ (symulacja: czy bind jest słyszalny)"
if [ -z "$VSPATH" ]; then
  bad "pomijam self-test — brak MSVC"
else
  SELF="$ROOT/native-audio/selftest"
  VCVARS_WIN="$(cygpath -w "$VSPATH/VC/Auxiliary/Build/vcvars64.bat")"
  SELF_WIN="$(cygpath -w "$SELF")"
  CMD_WIN="$(cygpath -w "$SELF/_diag_build.cmd")"
  printf '@echo off\r\ncd /d "%s"\r\ncall "%s"\r\nif errorlevel 1 exit /b 1\r\ncl /nologo /O2 /EHsc /std:c++20 /W4 selftest.cpp /Fe:_selftest.exe\r\n' \
    "$SELF_WIN" "$VCVARS_WIN" > "$SELF/_diag_build.cmd"
  if cmd.exe //d //c "$CMD_WIN" > "$SELF/_diag_build.log" 2>&1 && [ -f "$SELF/_selftest.exe" ]; then
    if "$SELF/_selftest.exe" | sed 's/^/    /'; then
      ok "self-test C++ przeszedł (rdzeń audio poprawny, sygnał słyszalny)"
    else
      bad "self-test C++ zgłosił błędy"
    fi
  else
    bad "self-test C++ nie skompilował się"; tail -5 "$SELF/_diag_build.log" | sed 's/^/    /'
  fi
  rm -f "$SELF/_diag_build.cmd" "$SELF/_diag_build.log" "$SELF/_selftest.exe" "$SELF/selftest.obj"
fi

# ---------------------------------------------------------------------------
section "Rust — testy jednostkowe (native runtime + sterownik)"
if have cargo; then
  if (cd src-tauri && cargo test --quiet 2>&1 | tail -15 | sed 's/^/    /'; exit "${PIPESTATUS[0]}"); then
    ok "cargo test przeszedł"
  else
    bad "cargo test nie przeszedł"
  fi
else
  bad "pomijam cargo test — brak cargo"
fi

# ---------------------------------------------------------------------------
section "Bridge / engine — żywy probe IPC (wymaga audio)"
if have cargo; then
  if (cd src-tauri && set -o pipefail && timeout 40 cargo run --quiet --example native_probe 2>&1 | tail -20 | sed 's/^/    /'); then
    ok "native_probe wystartował (most C ABI + shared memory odpowiadają)"
  else
    warn "native_probe nie dokończył — zależne od urządzeń audio / sterownika (na maszynie docelowej sprawdź w aplikacji)"
  fi
else
  warn "pomijam native_probe — brak cargo"
fi

# ---------------------------------------------------------------------------
section "Artefakty"
if [ -f "$ROOT/release/MicDeck-portable.exe" ]; then
  ok "release/MicDeck-portable.exe ($(du -h "$ROOT/release/MicDeck-portable.exe" | cut -f1))"
else
  warn "brak release/MicDeck-portable.exe — zbuduj przez scripts/build.bat"
fi

# ---------------------------------------------------------------------------
printf '\n\033[1m── RAPORT ──\033[0m\n'
printf '  OK:   %d\n  WARN: %d\n  FAIL: %d\n' "$PASS" "$WARN" "$FAIL"
if [ "$FAIL" -eq 0 ]; then
  printf '\033[32m\033[1mWYNIK: OK — wszystko krytyczne działa.\033[0m\n'
  exit 0
fi
printf '\033[31m\033[1mWYNIK: BŁĄD — %d krytycznych problemów, patrz wyżej.\033[0m\n' "$FAIL"
exit 1
