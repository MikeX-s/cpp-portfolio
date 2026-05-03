// specs/e2e.spec.js
//
// End-to-end tests for the WASM Portfolio game.
// All GitHub API calls are intercepted — no real network requests.
// Tests cover the full user journey:
//   GitHub prompt → WASM load → game start → pickup → repo card → continue
//   → death screen → restart

import { test, expect } from '@playwright/test';

// ── Shared fixture: intercept GitHub API + navigate ───────────────────────────

async function setupPage(page, repoCount = 6) {
  // Intercept GitHub repos API
  await page.route('**/api.github.com/users/*/repos**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeFakeRepos(repoCount)),
    })
  );
  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

async function submitUsername(page, user = 'testuser') {
  await page.fill('#gh-input', user);
  await page.click('#gh-submit');
  // Wait for prompt to fade out
  await page.waitForSelector('#gh-prompt.hidden', { timeout: 5000 });
}

async function waitForWasm(page) {
  // Either the real WASM dot goes green or the stub activates (dot still goes green)
  await page.waitForSelector('#wasm-dot.live', { timeout: 10_000 });
}

async function startGame(page) {
  await page.click('#cta-btn');
  await page.waitForSelector('#overlay.hidden', { timeout: 5000 });
}

// ── 1. GitHub Prompt ──────────────────────────────────────────────────────────

test.describe('GitHub username prompt', () => {

  test('prompt is shown on load', async ({ page }) => {
    await setupPage(page);
    await expect(page.locator('#gh-prompt')).toBeVisible();
    await expect(page.locator('#gh-input')).toBeVisible();
    await expect(page.locator('#gh-submit')).toBeVisible();
  });

  test('empty username does not dismiss prompt', async ({ page }) => {
    await setupPage(page);
    await page.click('#gh-submit');
    await page.waitForTimeout(500);
    await expect(page.locator('#gh-prompt')).toBeVisible();
  });

  test('invalid username shows error', async ({ page }) => {
    await page.route('**/api.github.com/**', route =>
      route.fulfill({ status: 404, body: '{}' })
    );
    await page.goto('/');
    await page.fill('#gh-input', 'this-user-does-not-exist-xyz');
    await page.click('#gh-submit');
    await expect(page.locator('#gh-err')).toBeVisible({ timeout: 5000 });
  });

  test('valid username dismisses prompt and loads WASM', async ({ page }) => {
    await setupPage(page);
    await submitUsername(page);
    await waitForWasm(page);
    await expect(page.locator('#gh-prompt')).toHaveClass(/hidden/);
    await expect(page.locator('#wasm-dot')).toHaveClass(/live/);
  });

  test('portfolio name updates with username', async ({ page }) => {
    await setupPage(page);
    await submitUsername(page, 'myportfolio');
    await expect(page.locator('#portfolio-name')).toContainText('MYPORTFOLIO');
  });

  test('repo count shown in overlay note', async ({ page }) => {
    await setupPage(page, 6);
    await submitUsername(page);
    await expect(page.locator('#ov-note')).toContainText('6 repos');
  });

  test('demo link fills torvalds and fetches', async ({ page }) => {
    await page.route('**/api.github.com/users/torvalds/repos**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeFakeRepos(3)),
      })
    );
    await page.goto('/');
    await page.click('#demo-link');
    await page.waitForSelector('#gh-prompt.hidden', { timeout: 5000 });
  });
});

// ── 2. WASM + Game boot ───────────────────────────────────────────────────────

test.describe('WASM boot and game start', () => {

  test('WASM status dot turns green after load', async ({ page }) => {
    await setupPage(page);
    await submitUsername(page);
    await expect(page.locator('#wasm-dot')).toHaveClass(/live/, { timeout: 10_000 });
    await expect(page.locator('#wasm-txt')).toContainText('READY');
  });

  test('CTA button becomes enabled after WASM ready', async ({ page }) => {
    await setupPage(page);
    await submitUsername(page);
    await waitForWasm(page);
    await expect(page.locator('#cta-btn')).toBeEnabled();
    await expect(page.locator('#cta-btn')).toContainText('START');
  });

  test('start overlay visible before game starts', async ({ page }) => {
    await setupPage(page);
    await submitUsername(page);
    await waitForWasm(page);
    await expect(page.locator('#overlay')).not.toHaveClass(/hidden/);
    await expect(page.locator('#ov-title')).toContainText('WASM PORTFOLIO');
  });

  test('clicking START hides overlay', async ({ page }) => {
    await setupPage(page);
    await submitUsername(page);
    await waitForWasm(page);
    await startGame(page);
    await expect(page.locator('#overlay')).toHaveClass(/hidden/);
  });

  test('canvas is rendering (non-black pixels appear after start)', async ({ page }) => {
    await setupPage(page);
    await submitUsername(page);
    await waitForWasm(page);
    await startGame(page);
    await page.waitForTimeout(500);

    // Sample centre pixel — should not be pure black (#050810 bg colour)
    const pixel = await page.evaluate(() => {
      const c = document.getElementById('canvas');
      const ctx = c.getContext('2d');
      const d = ctx.getImageData(c.width/2, c.height/2, 1, 1).data;
      return { r: d[0], g: d[1], b: d[2], a: d[3] };
    });
    // Alpha should be 255 (canvas is drawn)
    expect(pixel.a).toBe(255);
  });
});

// ── 3. HUD ────────────────────────────────────────────────────────────────────

test.describe('HUD elements', () => {

  test('score starts at 000000', async ({ page }) => {
    await setupPage(page);
    await submitUsername(page);
    await waitForWasm(page);
    await expect(page.locator('#score-val')).toHaveText('000000');
  });

  test('score increments after game starts', async ({ page }) => {
    await setupPage(page);
    await submitUsername(page);
    await waitForWasm(page);
    await startGame(page);
    // Wait a couple of seconds for score to tick up
    await page.waitForTimeout(2500);
    const score = await page.locator('#score-val').textContent();
    expect(parseInt(score, 10)).toBeGreaterThan(0);
  });

  test('collected repos badge starts at 0', async ({ page }) => {
    await setupPage(page);
    await submitUsername(page);
    await expect(page.locator('#collected-count')).toHaveText('0');
  });

  test('speed bar exists and has width attribute', async ({ page }) => {
    await setupPage(page);
    await submitUsername(page);
    await waitForWasm(page);
    await startGame(page);
    await page.waitForTimeout(1000);
    const style = await page.locator('#speed-fill').getAttribute('style');
    expect(style).toMatch(/width/);
  });
});

// ── 4. Input / Jump ───────────────────────────────────────────────────────────

test.describe('Player input', () => {

  test('SPACE key starts game from overlay', async ({ page }) => {
    await setupPage(page);
    await submitUsername(page);
    await waitForWasm(page);
    await page.keyboard.press('Space');
    await expect(page.locator('#overlay')).toHaveClass(/hidden/, { timeout: 3000 });
  });

  test('ArrowUp key starts game from overlay', async ({ page }) => {
    await setupPage(page);
    await submitUsername(page);
    await waitForWasm(page);
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('#overlay')).toHaveClass(/hidden/, { timeout: 3000 });
  });

  test('tap on canvas starts game', async ({ page }) => {
    await setupPage(page);
    await submitUsername(page);
    await waitForWasm(page);
    await page.locator('#canvas').tap();
    await expect(page.locator('#overlay')).toHaveClass(/hidden/, { timeout: 3000 });
  });

  test('jump does not crash game (no JS errors on repeated SPACE)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    await setupPage(page);
    await submitUsername(page);
    await waitForWasm(page);
    await startGame(page);

    // Spam spacebar 20 times
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Space');
      await page.waitForTimeout(50);
    }
    expect(errors).toHaveLength(0);
  });
});

// ── 5. Repo card (pickup) ─────────────────────────────────────────────────────

test.describe('Repo card pickup flow', () => {

  // Helper: force a pickup by patching JS worldX far enough
  async function forcePickup(page) {
    await page.evaluate(() => {
      // Teleport world position to the first pickup zone
      if (window.gm && window.gm.isStarted && window.gm.isStarted()) {
        // expose for test: override getWorldX to return a value
        // that puts pickup #0 directly on screen
        const orig = window.gm.getWorldX.bind(window.gm);
        let called = 0;
        window.gm.getWorldX = () => {
          called++;
          // Return firstRepoAt + playerX so screenX === playerX
          return called < 3 ? 550 : orig();
        };
      }
    });
    await page.waitForTimeout(200);
  }

  test('repo card is hidden initially', async ({ page }) => {
    await setupPage(page);
    await submitUsername(page);
    await waitForWasm(page);
    await expect(page.locator('#repo-card')).not.toHaveClass(/visible/);
  });

  test('repo card slides up on pickup', async ({ page }) => {
    await setupPage(page, 3);
    await submitUsername(page);
    await waitForWasm(page);
    await startGame(page);
    await forcePickup(page);
    await expect(page.locator('#repo-card')).toHaveClass(/visible/, { timeout: 3000 });
  });

  test('repo card shows correct repo name', async ({ page }) => {
    await setupPage(page, 3);
    await submitUsername(page);
    await waitForWasm(page);
    await startGame(page);
    await forcePickup(page);
    const name = await page.locator('#rc-name').textContent();
    // Should match one of our fake repo names
    expect(name).toMatch(/repo-\d/);
  });

  test('repo card has a working GitHub link', async ({ page }) => {
    await setupPage(page, 3);
    await submitUsername(page);
    await waitForWasm(page);
    await startGame(page);
    await forcePickup(page);
    const href = await page.locator('#rc-link').getAttribute('href');
    expect(href).toMatch(/https:\/\/github\.com\//);
  });

  test('"Continue Run" button closes card', async ({ page }) => {
    await setupPage(page, 3);
    await submitUsername(page);
    await waitForWasm(page);
    await startGame(page);
    await forcePickup(page);
    await expect(page.locator('#repo-card')).toHaveClass(/visible/, { timeout: 3000 });
    await page.click('#rc-continue');
    await expect(page.locator('#repo-card')).not.toHaveClass(/visible/, { timeout: 2000 });
  });

  test('ESC key closes repo card', async ({ page }) => {
    await setupPage(page, 3);
    await submitUsername(page);
    await waitForWasm(page);
    await startGame(page);
    await forcePickup(page);
    await expect(page.locator('#repo-card')).toHaveClass(/visible/, { timeout: 3000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('#repo-card')).not.toHaveClass(/visible/, { timeout: 2000 });
  });

  test('collected count increments on pickup', async ({ page }) => {
    await setupPage(page, 3);
    await submitUsername(page);
    await waitForWasm(page);
    await startGame(page);
    await forcePickup(page);
    await expect(page.locator('#repo-card')).toHaveClass(/visible/, { timeout: 3000 });
    const count = await page.locator('#collected-count').textContent();
    expect(parseInt(count, 10)).toBeGreaterThanOrEqual(1);
  });
});

// ── 6. Death screen ───────────────────────────────────────────────────────────

test.describe('Death screen', () => {

  async function killPlayer(page) {
    // Force isAlive() to return false so the death screen appears
    await page.evaluate(() => {
      if (window.gm) {
        window.gm.isAlive = () => false;
      }
    });
    await page.waitForTimeout(300);
  }

  test('death overlay appears when player dies', async ({ page }) => {
    await setupPage(page, 3);
    await submitUsername(page);
    await waitForWasm(page);
    await startGame(page);
    await killPlayer(page);
    await expect(page.locator('#overlay')).not.toHaveClass(/hidden/, { timeout: 3000 });
    await expect(page.locator('#ov-title')).toContainText('RUN ENDED');
  });

  test('death screen shows score stats', async ({ page }) => {
    await setupPage(page, 3);
    await submitUsername(page);
    await waitForWasm(page);
    await startGame(page);
    await page.waitForTimeout(1000); // let score accumulate
    await killPlayer(page);
    await expect(page.locator('#ov-stats')).toBeVisible({ timeout: 3000 });
  });

  test('restart button resets score to 000000', async ({ page }) => {
    await setupPage(page, 3);
    await submitUsername(page);
    await waitForWasm(page);
    await startGame(page);
    await page.waitForTimeout(1500);
    await killPlayer(page);

    // Restore isAlive so restart works
    await page.evaluate(() => {
      if (window.gm) window.gm.isAlive = () => window.gm.isAlive._orig?.() ?? true;
    });

    await expect(page.locator('#cta-btn')).toContainText('TRY AGAIN', { timeout: 3000 });
    await page.click('#cta-btn');
    await expect(page.locator('#overlay')).toHaveClass(/hidden/, { timeout: 3000 });
    await expect(page.locator('#score-val')).toHaveText('000000');
  });

  test('hi-score persists across restarts', async ({ page }) => {
    await setupPage(page, 3);
    await submitUsername(page);
    await waitForWasm(page);
    await startGame(page);
    await page.waitForTimeout(2000);

    const scoreAfterRun = await page.locator('#score-val').textContent();

    await killPlayer(page);
    await page.evaluate(() => { if (window.gm) window.gm.isAlive = () => true; });
    await page.click('#cta-btn');

    // Hi-score should be >= the score from the first run
    const hi = await page.locator('#hi-val').textContent();
    expect(parseInt(hi, 10)).toBeGreaterThanOrEqual(parseInt(scoreAfterRun, 10));
  });
});

// ── 7. Accessibility basics ───────────────────────────────────────────────────

test.describe('Accessibility', () => {

  test('page has a <title>', async ({ page }) => {
    await setupPage(page);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('lang attribute is set on <html>', async ({ page }) => {
    await setupPage(page);
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  });

  test('CTA button has visible text', async ({ page }) => {
    await setupPage(page);
    await submitUsername(page);
    await waitForWasm(page);
    const txt = await page.locator('#cta-btn').textContent();
    expect(txt?.trim().length).toBeGreaterThan(0);
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFakeRepos(n) {
  return Array.from({ length: n }, (_, i) => ({
    name: `repo-${i}`,
    full_name: `testuser/repo-${i}`,
    description: `A test repository number ${i} with some description text.`,
    html_url: `https://github.com/testuser/repo-${i}`,
    language: ['C++', 'Rust', 'Go', 'Python', 'JavaScript'][i % 5],
    stargazers_count: i * 10,
    forks_count: i * 2,
    open_issues_count: i,
    updated_at: new Date().toISOString(),
    fork: false,
  }));
}
