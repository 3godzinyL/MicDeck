#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cmake -S "$ROOT/tests" -B "$ROOT/out/tests" -DCMAKE_BUILD_TYPE=Release
cmake --build "$ROOT/out/tests" --config Release --parallel
ctest --test-dir "$ROOT/out/tests" -C Release --output-on-failure
