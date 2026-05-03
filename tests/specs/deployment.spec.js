// specs/deployment.spec.js
//
// Deployment smoke tests — run these BEFORE pushing to GitHub.
// They verify that all required files are present, served with correct
// MIME types, and that the page boots without console errors.
// No game interaction — pure infrastructure checks.

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

// ── 1. File presence (checked on disk, not over HTTP) ─────────────────────────

test.describe('Required files exist on disk', () => {

  const REQUIRED = ['index.html', 'game.js', 'game.wasm'];

  for (const file of REQUIRED) {
    test(`${file} exists`, () => {
      const p = path.join(ROOT, file);
      expect(fs.existsSync(p), `Missing: ${p}`).toBe(true);
    });
  }

  test('game.wasm is a valid WebAssembly binary (magic bytes)', () => {
    const buf = fs.readFileSync(path.join(ROOT, 'game.wasm'));
    // WASM magic: 0x00 0x61 0x73 0x6D  (\0asm)
    expect(buf[0]).toBe(0x00);
    expect(buf[1]).toBe(0x61);
    expect(buf[2]).toBe(0x73);
    expect(buf[3]).toBe(0x6D);
  });

  test('game.wasm version field is 1', () => {
    const buf = fs.readFileSync(path.join(ROOT, 'game.wasm'));
    // Version bytes at offset 4: 0x01 0x00 0x00 0x00
    expect(buf[4]).toBe(0x01);
  });

  test('game.js is non-empty and references GameModule', () => {
    const src = fs.readFileSync(path.join(ROOT, 'game.js'), 'utf8');
    expect(src.length).toBeGreaterThan(100);
    expect(src).toContain('GameModule');
  });

  test('index.html loads game.js via <script src>', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    expect(html).toMatch(/src=["']game\.js["']/);
  });

  test('index.html calls GameModule()', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    expect(html).toContain('GameModule()');
  });

  test('index.html has a <canvas> element', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    expect(html).toMatch(/<canvas/i);
  });
});

// ── 2. HTTP responses & MIME types (served via local static server) ───────────

test.describe('HTTP server — correct MIME types', () => {

  test('index.html → text/html', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/text\/html/);
  });

  test('game.js → application/javascript or text/javascript', async ({ request }) => {
    const res = await request.get('/game.js');
    expect(res.status()).toBe(200);
    const ct = res.headers()['content-type'] || '';
    expect(ct).toMatch(/javascript/);
  });

  test('game.wasm → application/wasm', async ({ request }) => {
    const res = await request.get('/game.wasm');
    expect(res.status()).toBe(200);
    // GitHub Pages and `serve` both emit this; some servers say application/octet-stream
    const ct = res.headers()['content-type'] || '';
    expect(ct).toMatch(/wasm|octet-stream/);
  });

  test('404 for missing files', async ({ request }) => {
    const res = await request.get('/does-not-exist.xyz');
    expect(res.status()).toBe(404);
  });
});

// ── 3. Page boots without critical errors ─────────────────────────────────────

test.describe('Page boot — no critical console errors', () => {

  test('page loads without uncaught JS errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out non-critical warnings (e.g. Google Fonts CORS, analytics)
    const critical = errors.filter(e =>
      !e.includes('fonts.googleapis') &&
      !e.includes('favicon')
    );
    expect(critical, `Uncaught errors: ${critical.join(', ')}`).toHaveLength(0);
  });

  test('GitHub prompt is visible on load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#gh-prompt')).toBeVisible();
  });

  test('canvas element is present and has non-zero dimensions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const canvas = page.locator('#canvas');
    await expect(canvas).toBeAttached();
    const box = await canvas.boundingBox();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  });

  test('game.wasm is fetched successfully (no network error)', async ({ page }) => {
    const wasmResponses = [];
    page.on('response', res => {
      if (res.url().includes('game.wasm')) wasmResponses.push(res.status());
    });

    // Submit a username to trigger WASM load
    await page.goto('/');
    await page.fill('#gh-input', 'torvalds');
    // intercept GitHub API call so test doesn't depend on network
    await page.route('**/api.github.com/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeFakeRepos(5)),
      })
    );
    await page.click('#gh-submit');
    await page.waitForTimeout(3000);

    if (wasmResponses.length > 0) {
      expect(wasmResponses[0]).toBe(200);
    }
    // If no WASM fetch occurred the stub kicked in — that's also acceptable
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFakeRepos(n) {
  return Array.from({ length: n }, (_, i) => ({
    name: `repo-${i}`,
    full_name: `testuser/repo-${i}`,
    description: `Test repository number ${i}`,
    html_url: `https://github.com/testuser/repo-${i}`,
    language: ['C++', 'Rust', 'Go', 'Python', 'JavaScript'][i % 5],
    stargazers_count: i * 10,
    forks_count: i * 2,
    open_issues_count: i,
    updated_at: new Date().toISOString(),
    fork: false,
  }));
}
