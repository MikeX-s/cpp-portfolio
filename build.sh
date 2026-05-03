#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# build.sh — Compile game.cpp → game.wasm + game.js (Emscripten glue)
#
# Prerequisites:
#   Install Emscripten SDK:  https://emscripten.org/docs/getting_started/
#     git clone https://github.com/emscripten-core/emsdk.git
#     cd emsdk && ./emsdk install latest && ./emsdk activate latest
#     source ./emsdk_env.sh
#
# Usage:
#   chmod +x build.sh
#   ./build.sh            # Release build (optimised)
#   ./build.sh --debug    # Debug build (assertions, source maps)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SRC="game.cpp"
OUT_JS="game.js"    # Emscripten also writes game.wasm alongside this

# Detect debug flag
DEBUG=0
if [[ "${1:-}" == "--debug" ]]; then DEBUG=1; fi

echo "▶  Building WASM Runner…"
echo "   Source : $SRC"
echo "   Output : $OUT_JS + game.wasm"
echo "   Mode   : $([ $DEBUG -eq 1 ] && echo 'DEBUG' || echo 'RELEASE')"
echo ""

# ── Shared flags ──────────────────────────────────────────────────────────────
COMMON=(
  "$SRC"
  -o "$OUT_JS"
  --bind                        # Emscripten Bindings (embind)
  -s MODULARIZE=1               # Wrap in a factory function: GameModule()
  -s EXPORT_NAME="GameModule"   # Must match the call in index.html
  -s ALLOW_MEMORY_GROWTH=1      # Let the heap grow as needed
  -s NO_EXIT_RUNTIME=1          # Keep the runtime alive after main() returns
  -s ENVIRONMENT='web'          # Web-only build (smaller output)
  -s SINGLE_FILE=0              # Keep .wasm separate (better caching)
)

# ── Release flags ─────────────────────────────────────────────────────────────
RELEASE_FLAGS=(
  -O2
  --closure 1                   # Minify the JS glue
  -s ASSERTIONS=0
)

# ── Debug flags ───────────────────────────────────────────────────────────────
DEBUG_FLAGS=(
  -O0
  -g4                           # Full debug info + source maps
  -s ASSERTIONS=2               # Runtime checks
  -s SAFE_HEAP=1
  --source-map-base ./
)

if [[ $DEBUG -eq 1 ]]; then
  em++ "${COMMON[@]}" "${DEBUG_FLAGS[@]}"
else
  em++ "${COMMON[@]}" "${RELEASE_FLAGS[@]}"
fi

echo ""
echo "✔  Build complete!"
echo "   game.js   — $(du -sh game.js  | cut -f1)  (Emscripten glue + module loader)"
echo "   game.wasm — $(du -sh game.wasm | cut -f1)  (compiled C++ logic)"
echo ""
echo "─────────────────────────────────────────────────────────────────────────"
echo "  SERVE LOCALLY (required — browsers block file:// WASM loads):"
echo "    python3 -m http.server 8080"
echo "    open http://localhost:8080"
echo ""
echo "  GITHUB PAGES DEPLOYMENT:"
echo "    1. Push index.html, game.js, game.wasm to your repo root (or /docs)."
echo "    2. In repo Settings → Pages → Source, pick the branch/folder."
echo "    3. GitHub Pages serves with correct MIME types for .wasm by default."
echo "─────────────────────────────────────────────────────────────────────────"
