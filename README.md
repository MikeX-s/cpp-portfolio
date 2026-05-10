### ```https://mikex-s.github.io/cpp-portfolio/```

## Gameplay

- **SPACE / ↑ / W / tap** — Jump (double-jump supported)
- Avoid obstacles. Speed increases over time.
- Three obstacle types: tall blocks, low floaters (duck under), high floaters (jump over)

## Files

| Folder | Purpose |
|--------|---------|
| `game` | All game logic: physics, collision, scoring, particles |
| `docs/index.html` | Canvas renderer, JS game loop, input handling |
| `build.sh` | Emscripten compile script (release + debug modes) |

## Architecture

The JS/WASM boundary is intentionally minimal and clean:

**JS → C++ (commands)**
```js
gm.startGame()   // start / restart
gm.update()    // advance one frame (called from rAF)
gm.jump()        // player jump input
```

**C++ → JS (state reads, called every frame)**
```js
gm.getPlayerY(), gm.getObstacleCount(), gm.getParticleX(i), …
```

All game state, physics, and collision detection live in C++.
All rendering, input, and DOM manipulation live in JS.

## Build & Run

### 1. Install Emscripten
```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh   # add to your shell profile
```

### 2. Compile
```bash
chmod +x build.sh
./build.sh          # optimised release
./build.sh --debug  # debug build with source maps + assertions
```

This produces `game.js` and `game.wasm` alongside `index.html`.

### 3. Serve locally
Browsers block WASM loads over `file://`. Use any local server:
```bash
python3 -m http.server 8080
# open http://localhost:8080
```
