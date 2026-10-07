#!/usr/bin/env node
// Browser checks for the IRE React dashboard (frontend/ire-app), served from
// frontend/dist/ire/app. Run `pnpm --dir frontend run build` first — this reads the
// built output, not the source.
//
// The live feed is intercepted and answered with the committed saved copy, so the run
// is deterministic and needs no network. Set IRE_SHOTS_DIR to save screenshots.
//
// Scenarios: all eight required data-testid hooks render; the tier switch changes the
// table; the utility section shows the unverified row without a licence link; no closed
// model vendor name or price-promo wording reaches the rendered text; 375px has no
// horizontal overflow; no console errors.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { closedModelNames } from './ire-closed-models.mjs';

const FEED_URL =
  'https://raw.githubusercontent.com/Pukujan/inference-recommendation-engine/data/ire-feed/feed/v2/today.json';
const dist = fileURLToPath(new URL('../frontend/dist', import.meta.url));
const shotsDir = process.env.IRE_SHOTS_DIR;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// Minimal static server with the same directory-index behaviour as Vercel/Caddy.
async function resolveFile(urlPath) {
  const clean = normalize(decodeURIComponent(urlPath.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
  for (const c of [join(dist, clean), join(dist, clean, 'index.html')]) {
    try {
      if ((await stat(c)).isFile()) return c;
    } catch {
      /* try next */
    }
  }
  return null;
}

const server = createServer(async (req, res) => {
  const file = await resolveFile(req.url ?? '/');
  if (!file || !file.startsWith(dist)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(await readFile(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const savedText = await readFile(join(dist, 'ire', 'today.saved.json'), 'utf8');
const saved = JSON.parse(savedText);
const hasUtility = Boolean(saved.tiers?.utility);
if (shotsDir) await mkdir(shotsDir, { recursive: true });

const HOOKS = [
  'picks-hero',
  'tier-tabs',
  'price-chart',
  'capability-chart',
  'health-summary',
  'picks-table',
  'provenance',
];
if (hasUtility) HOOKS.push('utility-section');

const browser = await chromium.launch();

async function openPage(opts = {}) {
  const context = await browser.newContext({
    viewport: opts.viewport ?? { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
  await page.route(FEED_URL, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: savedText }),
  );
  await page.goto(`${origin}/ire/app/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="picks-table"]', { timeout: 20000 });
  return { context, page, consoleErrors };
}

// 1. Every required hook renders, and the copy stays inside the open-weight rules.
{
  const { context, page, consoleErrors } = await openPage();
  for (const hook of HOOKS) {
    assert.ok(
      (await page.locator(`[data-testid="${hook}"]`).count()) > 0,
      `missing data-testid="${hook}"`,
    );
  }

  const text = await page.locator('body').innerText();
  assert.deepEqual(closedModelNames(text), [], 'rendered text names a closed model');
  assert.ok(!/%\s*off|\bdiscount|official price|list price/i.test(text), 'price-promo wording');
  assert.ok(!/frontier list/i.test(text), 'must not call it a frontier list');

  // 2. The tier switch actually re-scopes the table.
  const before = await page.locator('[data-testid="picks-table"]').innerText();
  await page.locator('[data-testid="tier-tabs"]').getByRole('tab', { name: /strongest/i }).click();
  await page.waitForTimeout(400);
  const after = await page.locator('[data-testid="picks-table"]').innerText();
  assert.notEqual(before, after, 'the tier switch should change the table');

  // 3. An unverified utility row shows the verdict and links no licence.
  if (hasUtility) {
    await page.locator('[data-testid="tier-tabs"]').getByRole('tab', { name: /image/i }).click();
    await page.waitForTimeout(400);
    const section = page.locator('[data-testid="utility-section"]');
    const sectionText = await section.innerText();
    if (/not verified/i.test(sectionText)) {
      assert.ok(
        !(await section.locator('a[href*="licen"], a[href*="license"], a[href*="weights"]').count()),
        'an unverified row must not link a licence',
      );
    }
  }

  if (shotsDir) {
    await page.locator('[data-testid="tier-tabs"]').getByRole('tab', { name: /cheap/i }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(shotsDir, 'ire-app-desktop.png'), fullPage: true });
  }

  assert.deepEqual(consoleErrors, [], `console errors: ${consoleErrors.join(' | ')}`);
  await context.close();
}

// 4. Mobile: usable at 375px with no horizontal page scroll.
{
  const { context, page, consoleErrors } = await openPage({ viewport: { width: 375, height: 900 } });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  assert.ok(!overflow, '375px viewport should not scroll horizontally');
  if (shotsDir) await page.screenshot({ path: join(shotsDir, 'ire-app-mobile.png'), fullPage: true });
  assert.deepEqual(consoleErrors, [], `console errors: ${consoleErrors.join(' | ')}`);
  await context.close();
}

await browser.close();
server.close();
console.log('IRE React dashboard browser checks passed.');
