#!/usr/bin/env node
// Browser checks for the IRE market page (IRE #77), run against the built site in
// frontend/dist (run `pnpm run build` first). Uses Playwright's Chromium.
//
// The live feed is intercepted and answered with the saved copy, so the run is
// deterministic and needs no network. Pass --live to let the page hit the real feed
// for the "live" scenario instead. Set IRE_SHOTS_DIR to save screenshots.
//
// Scenarios: live feed renders both tabs; fallback when the feed is blocked; stale
// banner when the clock is past stale_after; error state when both sources fail;
// mobile viewport without horizontal overflow; no console errors.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const FEED_URL =
  'https://raw.githubusercontent.com/Pukujan/inference-recommendation-engine/data/ire-feed/feed/v1/today.json';
const dist = fileURLToPath(new URL('../frontend/dist', import.meta.url));
const live = process.argv.includes('--live');
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
  const candidates = [join(dist, clean), join(dist, clean, 'index.html')];
  for (const c of candidates) {
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
const hourMs = 3_600_000;
const freshTime = new Date(Date.parse(saved.generated_at) + hourMs);
const staleTime = new Date(Date.parse(saved.stale_after) + hourMs);

const browser = await chromium.launch();
const results = [];

async function scenario(name, opts, fn) {
  // reducedMotion turns off the page's smooth scrolling, which otherwise races Playwright's clicks.
  const context = await browser.newContext({ reducedMotion: 'reduce', ...(opts.context ?? { viewport: { width: 1366, height: 900 } }) });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
  if (opts.clock) await page.clock.install({ time: opts.clock });
  if (opts.feed === 'mock') {
    await page.route(FEED_URL, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: savedText }),
    );
  } else if (opts.feed === 'block') {
    await page.route(FEED_URL, (route) => route.abort('blockedbyclient'));
  }
  if (opts.blockSaved) await page.route('**/ire/today.saved.json', (route) => route.abort('blockedbyclient'));
  try {
    await page.goto(`${origin}/ire/`, { waitUntil: 'load' });
    await page.waitForSelector('body[data-feed]', { timeout: 15_000 });
    await fn(page);
    // Blocked requests log a "Failed to load resource" line by design; anything else fails.
    const unexpected = consoleErrors.filter((t) => !(opts.allowFailedLoad && /Failed to load resource/.test(t)));
    assert.deepEqual(unexpected, [], `console errors: ${unexpected.join(' | ')}`);
    results.push({ name, ok: true });
    console.log(`ok   ${name}`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.log(`FAIL ${name}\n     ${err.message}`);
  } finally {
    await context.close();
  }
}

async function toPicks(page) {
  await page.evaluate(() => document.getElementById('picks').scrollIntoView({ block: 'start' }));
}

async function rowCount(page, tier) {
  return page.locator(`#table-${tier} tbody tr`).count();
}

async function shot(page, file, fullPage = true) {
  if (!shotsDir) return;
  await mkdir(shotsDir, { recursive: true });
  await page.screenshot({ path: join(shotsDir, file), fullPage });
}

await scenario('live feed renders both tabs', { feed: live ? 'live' : 'mock', clock: live ? undefined : freshTime }, async (page) => {
  assert.equal(await page.getAttribute('body', 'data-feed'), 'live');
  const feed = live ? await (await fetch(FEED_URL)).json() : saved;
  assert.equal(await rowCount(page, 'cheap'), feed.tiers.cheap.entries.length, 'cheap rows match the feed');
  assert.ok(await page.isVisible('#panel-cheap'));
  assert.ok(!(await page.isVisible('#panel-frontier')), 'frontier panel starts hidden');
  const firstCheap = feed.tiers.cheap.entries[0];
  assert.equal((await page.locator('#table-cheap tbody tr').first().getAttribute('data-route')), firstCheap.best_route);
  assert.match(await page.textContent('#asof-cheap'), /^As of /);
  await shot(page, 'ire-desktop-cheap.png');
  await page.click('#tab-frontier');
  assert.ok(await page.isVisible('#panel-frontier'));
  assert.equal(await rowCount(page, 'frontier'), feed.tiers.frontier.entries.length, 'frontier rows match the feed');
  assert.match(await page.textContent('#asof-frontier'), /^As of /);
  // Keyboard: ArrowLeft goes back to the cheap tab.
  await page.focus('#tab-frontier');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.getAttribute('#tab-cheap', 'aria-selected'), 'true');
  await page.click('#tab-frontier');
  await toPicks(page);
  await shot(page, 'ire-desktop-frontier-tab.png', false);
  if (!live) assert.ok(!(await page.isVisible('#stale-banner')), 'no stale banner before stale_after');
  assert.ok(!(await page.isVisible('#saved-note')), 'no saved-copy note on a live load');
  const rec = feed.tiers.cheap.entries.find((e) => e.recommended);
  assert.equal(await page.locator('.js-route').first().textContent(), rec.best_route, 'snippets use today\'s route');
  assert.ok((await page.textContent('#provenance')).includes('Code commit'));
});

await scenario('fallback when the feed is blocked', { feed: 'block', clock: freshTime, allowFailedLoad: true }, async (page) => {
  assert.equal(await page.getAttribute('body', 'data-feed'), 'saved');
  assert.ok(await page.isVisible('#saved-note'));
  assert.match(await page.textContent('#saved-note'), /saved copy from/);
  assert.equal(await rowCount(page, 'cheap'), saved.tiers.cheap.entries.length);
  await toPicks(page);
  await shot(page, 'ire-fallback-saved-copy.png', false);
});

await scenario('stale banner after stale_after', { feed: 'mock', clock: staleTime }, async (page) => {
  assert.equal(await page.getAttribute('body', 'data-stale'), 'true');
  assert.ok(await page.isVisible('#stale-banner'));
  assert.match(await page.textContent('#stale-banner'), /older than it should be/);
  await toPicks(page);
  await shot(page, 'ire-stale-banner.png', false);
});

await scenario('error state when feed and saved copy both fail', { feed: 'block', blockSaved: true, clock: freshTime, allowFailedLoad: true }, async (page) => {
  assert.equal(await page.getAttribute('body', 'data-feed'), 'error');
  assert.ok(await page.isVisible('#error-note'));
  assert.equal(await rowCount(page, 'cheap'), 0);
});

await scenario('mobile viewport', {
  feed: live ? 'live' : 'mock',
  clock: live ? undefined : freshTime,
  context: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
}, async (page) => {
  assert.equal(await page.getAttribute('body', 'data-feed'), 'live');
  assert.ok((await rowCount(page, 'cheap')) > 0);
  // Compare with the device width itself: on a mobile viewport, wide content widens the
  // layout viewport (and window.innerWidth) instead of adding a scrollbar.
  const width = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, inner: window.innerWidth }));
  assert.ok(width.doc <= 391 && width.inner <= 391, `page is wider than the 390px screen: ${JSON.stringify(width)}`);
  await page.click('#tab-frontier');
  assert.ok((await rowCount(page, 'frontier')) > 0);
  await toPicks(page);
  await shot(page, 'ire-mobile-frontier-tab.png', false);
  await page.click('#tab-cheap');
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, 'ire-mobile-top.png', false);
  await shot(page, 'ire-mobile.png');
});

await browser.close();
server.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} IRE browser checks passed${live ? ' (live feed)' : ''}.`);
process.exit(failed.length ? 1 : 0);
