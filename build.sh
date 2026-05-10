#!/usr/bin/env bash
set -euo pipefail

DEBUG=0
CLEAN=0
for arg in "$@"; do
    case "$arg" in
        --debug) DEBUG=1 ;;
        --clean) CLEAN=1 ;;
        *) echo "✖ Unknown argument: $arg"; exit 1 ;;
    esac
done

BUILD_TYPE="Release"
BUILD_DIR="build_wasm"
[[ $DEBUG -eq 1 ]] && BUILD_TYPE="Debug" && BUILD_DIR="build_debug"

# 1. Emscripten check
if ! command -v emcmake &> /dev/null; then
    EMSDK_ENV="${EMSDK_PATH:-$HOME/emsdk}/emsdk_env.sh"
    if [[ ! -f "$EMSDK_ENV" ]]; then
        echo "✖ emsdk not found at $EMSDK_ENV. Set EMSDK_PATH or install emsdk."
        exit 1
    fi
    echo "▶ Activating Emscripten..."
    source "$EMSDK_ENV"
fi

# 2. Clean
if [[ $CLEAN -eq 1 && -d "$BUILD_DIR" ]]; then
    echo "▶ Cleaning $BUILD_DIR..."
    rm -rf "$BUILD_DIR"
fi

# 3. Configure
echo "▶ Configuring ($BUILD_TYPE)..."
emcmake cmake -B "$BUILD_DIR" \
    -DCMAKE_BUILD_TYPE="$BUILD_TYPE"

# 4. Build
echo "▶ Building..."
cmake --build "$BUILD_DIR" --target game

# 5. Copy
cp -f "$BUILD_DIR/game/game.js"   ./docs/game.js
cp -f "$BUILD_DIR/game/game.wasm" ./docs/game.wasm
echo "✔ Build complete."

# 6. SRI
echo "▶ Generating SRI hashes..."
JS_HASH=$(openssl dgst -sha384 -binary ./docs/game.js   | openssl base64 -A)
WASM_HASH=$(openssl dgst -sha384 -binary ./docs/game.wasm | openssl base64 -A)

SRI_FILE="$BUILD_DIR/sri-hashes.txt"
{
    echo ""
    echo "  ┌─ game.js   sha384-$JS_HASH"
    echo "  └─ game.wasm sha384-$WASM_HASH"
    echo ""
    echo "  ⚠  Only game.wasm changes with logic edits."
    echo "     game.js is Emscripten glue — stable across builds."
    echo ""
} | tee "$SRI_FILE"
echo "▶ Hashes saved to $SRI_FILE"

HTML_FILE="docs/index.html"
if [[ -f "$HTML_FILE" ]]; then
    sed -i.bak -E \
        "s|(<script src=\"game\.js\" integrity=\")sha384-[A-Za-z0-9+/=]+|\1sha384-${JS_HASH}|" \
        "$HTML_FILE"
    sed -i.bak -E \
        "s|(wasmHash: ')sha384-[A-Za-z0-9+/=]+|\1sha384-${WASM_HASH}|" \
        "$HTML_FILE"
    rm -f "$HTML_FILE.bak"
    echo "✔ SRI hashes patched into $HTML_FILE"
else
    echo "⚠ $HTML_FILE not found — skipping SRI patch"
fi

echo ""
echo "  game.js   sha384-$JS_HASH"
echo "  game.wasm sha384-$WASM_HASH"
echo ""