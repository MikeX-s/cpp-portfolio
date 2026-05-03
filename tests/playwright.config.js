// playwright.config.js
// Run from the tests/ directory:
//   npm install
//   npm test
//
// The config spins up a local static server on port 8081 pointing at the
// parent directory (where index.html, game.js, game.wasm live), so the
// tests never hit the internet and WASM is served with correct MIME types.

import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');   // one level up = game files

export default defineConfig({
  testDir: './specs',
  timeout: 30_000,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'report' }]],

  use: {
    baseURL: 'http://localhost:8081',
    headless: true,
    viewport: { width: 1280, height: 800 },
    // Capture screenshot + trace on first retry so you can inspect failures
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  // Start a static file server before the tests run
  webServer: {
    command: `npx serve ${ROOT} --listen 8081 --no-clipboard`,
    url: 'http://localhost:8081',
    reuseExistingServer: false,
    timeout: 15_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
  ],
});
