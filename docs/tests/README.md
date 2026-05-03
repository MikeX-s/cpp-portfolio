# WASM Portfolio — Test Suite

Playwright E2E + deployment smoke tests. Run everything locally before pushing.

## Structure

```
tests/
├── playwright.config.js      # Spins up local server on :8081
├── package.json
└── specs/
    ├── deployment.spec.js    # File presence, MIME types, page boot
    └── e2e.spec.js           # Full user journey: prompt → game → pickup → death
```

## Prerequisites

- Node.js 18+
- The game files built: `../game.js` and `../game.wasm` must exist
  (run `../build.sh` first if you haven't compiled yet)

## Setup

```bash
cd tests/
npm install
npx playwright install chromium firefox   # first time only
```

## Running tests

```bash
# All tests (both specs, both browsers)
npm test

# Just E2E tests in Chromium
npm run test:e2e

# Just deployment checks
npm run test:deploy

# Headed mode — watch the browser
npm run test:headed

# Open HTML report after a run
npm run report
```

## What's tested

### `deployment.spec.js`
| Check | What it verifies |
|-------|-----------------|
| File presence | `index.html`, `game.js`, `game.wasm` exist on disk |
| WASM magic bytes | First 4 bytes are `\0asm` — valid WebAssembly binary |
| WASM version | Version field = 1 |
| game.js content | Non-empty, references `GameModule` |
| index.html wiring | `<script src="game.js">` present, `GameModule()` called |
| MIME types (HTTP) | `text/html`, `application/javascript`, `application/wasm` |
| 404 handling | Server returns 404 for missing files |
| Page boot | No uncaught JS errors on load |
| Canvas dimensions | Canvas is rendered with non-zero size |
| WASM network fetch | `game.wasm` returns HTTP 200 |

### `e2e.spec.js`
| Area | Tests |
|------|-------|
| GitHub prompt | Shows on load, validates empty input, shows error for 404, dismisses on success, updates portfolio name, demo link |
| WASM boot | Status dot turns green, CTA button enables, start overlay shows |
| Game start | Overlay hides, canvas renders non-black pixels |
| HUD | Score starts at 0, increments after start, collected badge, speed bar |
| Input | SPACE / ArrowUp / tap start game, spam jump doesn't crash |
| Repo card | Hidden initially, slides up on pickup, correct name/link, closes on button/ESC, counter increments |
| Death screen | Appears on death, shows stats, restart resets score, hi-score persists |
| Accessibility | `<title>`, `lang` attribute, CTA has visible text |

## Notes

- All GitHub API calls are **intercepted** — tests never hit the real API
- Screenshots and traces are saved to `tests/report/` on failure
