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
// mobile viewport without horizontal overflow; no closed model names anywhere on the
// rendered page; no console errors. Color themes: dark by default on every device (even
// light-mode ones), the picker saves across reloads, and every
// theme keeps key text at WCAG AA contrast with no bright panels left in dark themes.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { closedModelNames } from './ire-closed-models.mjs';

const FEED_URL =
  'https://raw.githubusercontent.com/Pukujan/inference-recommendation-engine/data/ire-feed/feed/v2/today.json';
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
  const context = await browser.newContext({ reducedMotion: 'reduce', colorScheme: 'dark', ...(opts.context ?? { viewport: { width: 1366, height: 900 } }) });
  if (opts.theme) await context.addInitScript((t) => { try { localStorage.setItem('ire-theme', t); } catch { /* ignore */ } }, opts.theme);
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
  } else if (opts.feed === 'mock-closed') {
    const doc = JSON.parse(savedText);
    const intruder = { ...doc.tiers.cheap.entries[0], rank: 1, model_family: 'GPT 6 Astra', vendor: 'OpenAI', best_route: 'cb/gpt-6-astra', routes: ['cb/gpt-6-astra'], open_weight: false };
    doc.tiers.cheap.entries.unshift(intruder);
    doc.tiers.strongest_open.entries.unshift({ ...intruder, model_family: 'Claude Opus 5.5', vendor: 'Anthropic', best_route: 'cc/claude-opus-5-5', routes: ['cc/claude-opus-5-5'] });
    await page.route(FEED_URL, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(doc) }));
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

// Everything a reader can see: rendered text of both panels (hidden tab included), the
// title, meta descriptions, link text and image alt text.
async function pageText(page) {
  return page.evaluate(() => {
    const parts = [document.title, document.body.textContent];
    document.querySelectorAll('meta[content]').forEach((m) => parts.push(m.getAttribute('content')));
    document.querySelectorAll('[alt],[title],[aria-label]').forEach((n) => parts.push(n.getAttribute('alt') ?? '', n.getAttribute('title') ?? '', n.getAttribute('aria-label') ?? ''));
    return parts.join(' ');
  });
}

async function assertOpenWeightOnly(page) {
  const text = await pageText(page);
  // Inline <script> is part of body.textContent; the code holds no model names, but strip it anyway.
  const visible = text.replace(/\(function \(\) \{[\s\S]*\}\)\(\);/, ' ');
  assert.deepEqual(closedModelNames(visible), [], 'a closed model family or vendor appears on the page');
  assert.ok(!/%\s*off|\bdiscount|official price/i.test(visible), 'page reads like a price promo');
  const fams = await page.locator('.mname').allTextContents();
  assert.ok(fams.length > 0, 'model rows rendered');
  assert.deepEqual(closedModelNames(fams.join(' ')), [], 'a closed model row rendered');
  assert.equal(await page.locator('#table-cheap tbody tr .lic').count(), await rowCount(page, 'cheap'), 'every cheap row links its licence');
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
  assert.ok(!(await page.isVisible('#panel-strongest_open')), 'strongest panel starts hidden');
  const firstCheap = feed.tiers.cheap.entries[0];
  assert.equal((await page.locator('#table-cheap tbody tr').first().getAttribute('data-route')), firstCheap.best_route);
  assert.match(await page.textContent('#asof-cheap'), /^As of /);
  await shot(page, 'ire-desktop-cheap.png');
  await page.click('#tab-strongest_open');
  assert.ok(await page.isVisible('#panel-strongest_open'));
  assert.equal(await rowCount(page, 'strongest_open'), feed.tiers.strongest_open.entries.length, 'strongest rows match the feed');
  assert.match(await page.textContent('#asof-strongest_open'), /^As of /);
  // Keyboard: ArrowLeft goes back to the cheap tab.
  await page.focus('#tab-strongest_open');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.getAttribute('#tab-cheap', 'aria-selected'), 'true');
  await page.click('#tab-strongest_open');
  await toPicks(page);
  await shot(page, 'ire-desktop-strongest-tab.png', false);
  // The image and multimodal tab appears only when the feed carries the tier.
  const utility = feed.tiers.utility;
  if (utility) {
    assert.ok(await page.isVisible('#tab-utility'), 'utility tab should show when the feed has the tier');
    await page.click('#tab-utility');
    assert.ok(await page.isVisible('#panel-utility'));
    assert.equal(await rowCount(page, 'utility'), utility.entries.length, 'utility rows match the feed');
    assert.match(await page.textContent('#asof-utility'), /^As of /);
    const unverified = utility.entries.find((e) => e.open_weight === null);
    if (unverified) {
      const row = page.locator('#table-utility tbody tr', { hasText: unverified.model_family });
      assert.equal(await row.locator('.licnone').count(), 1, 'an unverified family says so instead of linking a licence');
      assert.match(await row.locator('.verdict').textContent(), /Held back:/, 'an unverified family is held back');
    }
    await toPicks(page);
    await shot(page, 'ire-desktop-utility-tab.png', false);
    await page.click('#tab-cheap');
  } else {
    assert.ok(!(await page.isVisible('#tab-utility')), 'utility tab stays hidden when the feed has no tier');
  }
  if (!live) assert.ok(!(await page.isVisible('#stale-banner')), 'no stale banner before stale_after');
  assert.ok(!(await page.isVisible('#saved-note')), 'no saved-copy note on a live load');
  const rec = feed.tiers.cheap.entries.find((e) => e.recommended);
  assert.equal(await page.locator('.js-route').first().textContent(), rec.best_route, 'snippets use today\'s route');
  assert.ok((await page.textContent('#provenance')).includes('Code commit'));
  await assertOpenWeightOnly(page);
});

await scenario('a closed model slipped into the feed is not rendered', { feed: 'mock-closed', clock: freshTime }, async (page) => {
  // The page itself drops any entry without open_weight: true, as a second line of defence.
  assert.equal(await page.getAttribute('body', 'data-feed'), 'live');
  assert.equal(await rowCount(page, 'cheap'), saved.tiers.cheap.entries.length);
  await assertOpenWeightOnly(page);
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
  await assertOpenWeightOnly(page);
  await page.click('#tab-strongest_open');
  assert.ok((await rowCount(page, 'strongest_open')) > 0);
  await toPicks(page);
  await shot(page, 'ire-mobile-strongest-tab.png', false);
  await page.click('#tab-cheap');
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot(page, 'ire-mobile-top.png', false);
  await shot(page, 'ire-mobile.png');
});

// ---------------------------------------------------------------- color themes
const THEMES = ['dark', 'light', 'midnight', 'contrast'];
const themeCss = await readFile(join(dist, 'ire', 'theme.css'), 'utf8');
// The --background value each theme declares, resolved through var(--theme-*) where needed.
function themeBackground(name) {
  const rules = themeCss.replace(/\/\*[\s\S]*?\*\//g, '');
  const block = rules.match(new RegExp(`\\[data-theme="${name}"\\]\\s*\\{([^}]*)\\}`))[1];
  let v = block.match(/--background:\s*([^;]+);/)[1].trim();
  const ref = v.match(/^var\((--[a-z-]+)\)$/);
  if (ref) v = rules.match(new RegExp(`${ref[1]}:\\s*([^;]+);`))[1].trim();
  const hex = v.replace('#', '');
  return `rgb(${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)})`;
}
const bodyBg = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const htmlTheme = (page) => page.getAttribute('html', 'data-theme');

// Dark is the default on every device until the visitor picks a theme (the next scenario covers a
// light-mode device); with JS off the page is dark from <html data-theme="dark"> (static check).
await scenario('dark is the default theme', { feed: 'mock', clock: freshTime, context: { viewport: { width: 1280, height: 900 }, colorScheme: 'dark' } }, async (page) => {
  assert.equal(await htmlTheme(page), 'dark');
  assert.equal(await page.inputValue('#theme-select'), 'dark');
  assert.equal(await bodyBg(page), themeBackground('dark'));
  assert.equal(await page.evaluate(() => localStorage.getItem('ire-theme')), null, 'nothing saved until the visitor picks');
});

await scenario('a light-mode device still starts dark when nothing is saved', { feed: 'mock', clock: freshTime, context: { viewport: { width: 1280, height: 900 }, colorScheme: 'light' } }, async (page) => {
  assert.equal(await htmlTheme(page), 'dark');
  assert.equal(await page.inputValue('#theme-select'), 'dark');
  assert.equal(await bodyBg(page), themeBackground('dark'));
});

await scenario('theme picker switches, saves, and survives a reload', { feed: 'mock', clock: freshTime, context: { viewport: { width: 1280, height: 900 }, colorScheme: 'light' } }, async (page) => {
  const before = await bodyBg(page);
  await page.selectOption('#theme-select', 'midnight');
  assert.equal(await htmlTheme(page), 'midnight');
  assert.equal(await bodyBg(page), themeBackground('midnight'));
  assert.notEqual(await bodyBg(page), before, 'background should change');
  assert.equal(await page.evaluate(() => localStorage.getItem('ire-theme')), 'midnight');
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('body[data-feed]');
  assert.equal(await htmlTheme(page), 'midnight', 'saved theme should survive a reload');
  assert.equal(await page.inputValue('#theme-select'), 'midnight');
  // A saved choice beats the device preference (this context prefers light).
  await page.selectOption('#theme-select', 'dark');
  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('body[data-feed]');
  assert.equal(await htmlTheme(page), 'dark');
  assert.equal(await bodyBg(page), themeBackground('dark'));
});

// Contrast of key text against what's actually behind it (WCAG 2 formula).
async function contrastReport(page) {
  return page.evaluate(() => {
    const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
    const over = (top, bot) => [0, 1, 2].map((i) => top[i] * top[3] + bot[i] * (1 - top[3])).concat(1);
    const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
    function bgOf(el) {
      const chain = []; for (let n = el; n && n.nodeType === 1; n = n.parentElement) chain.push(n);
      let bg = [255, 255, 255, 1];
      for (const n of chain.reverse()) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c[3] > 0) bg = over(c, bg); }
      return bg;
    }
    const checks = {
      'main text': ['h2', '.pickcard .model', '#table-cheap tr.rec .mname', '.step b', '.limit h3', '.listcard li', '.panelhead .asof'],
      'muted text': ['.sub', '.lead', '#table-cheap th', '.vendor', '.panelhead p', '#table-cheap tr.held .verdict', '#table-cheap tr.held .mname', '.tablefoot', '.limit p', '.prov dt', '.foot', '.codecard p', '.pickcard .lbl', '.rung small', '.listhead', '.receipt'],
      'links and accents': ['.kicker', '#table-cheap .lic', '#table-cheap .rcode', '.receipt a', '.prov a', '.policy a', '.foot a', '.callout strong', '.realquote strong'],
      'badges and controls': ['.h-healthy', '.h-degraded', '.verdict.ok', '.chip', '.pill.live', '.pill:not(.live)', '.pickcard .route', '.dot', '.tab[aria-selected="true"]', '.tab[aria-selected="false"]', '.btn.primary', '.btn.sun', '.btn:not(.primary):not(.sun)', '.nav .gh', '#theme-select', '.copy', '.rung.thin .p', '.rung.deep .p', '.out', '.in'],
      'notices and panels': ['.notice.stale', '.notice.saved', '.notice.error', '.caveat p', '.boundary', '.policy p', '.policy b', '.codecard pre', '.keyline code'],
      'agents section': ['.agent h2', '.agent .sub', '.agent .kicker', '.agentnote', '.agentnote a', '.soon', '.urlbox code', '.agentgrid pre', '.agent .codehead.bare'],
    };
    const out = {};
    for (const [group, sels] of Object.entries(checks)) {
      out[group] = sels.map((sel) => {
        const el = document.querySelector(sel);
        if (!el) return { sel, missing: true };
        const bg = bgOf(el); const fg = over(parse(getComputedStyle(el).color), bg);
        const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
        return { sel, ratio: Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100 };
      });
    }
    // Big bright boxes left over from the light design (dark themes only).
    const bright = [];
    for (const el of document.querySelectorAll('body *')) {
      const c = parse(getComputedStyle(el).backgroundColor); if (!c || c[3] < 0.5) continue;
      const r = el.getBoundingClientRect(); if (r.width * r.height < 40000) continue;
      if (lum(c) > 0.35) bright.push(`${el.tagName.toLowerCase()}.${el.className}`);
    }
    return { groups: out, bright };
  });
}

const contrast = {};
for (const theme of THEMES) {
  for (const vp of [{ w: 1280, h: 900 }, { w: 390, h: 844 }]) {
    const mobile = vp.w < 500;
    await scenario(`theme ${theme} at ${vp.w}px: colors, contrast, layout`, {
      feed: 'mock', clock: freshTime, theme,
      context: { viewport: { width: vp.w, height: vp.h }, ...(mobile ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true } : {}) },
    }, async (page) => {
      assert.equal(await htmlTheme(page), theme);
      assert.equal(await bodyBg(page), themeBackground(theme));
      const report = await contrastReport(page);
      const low = [];
      for (const [group, rows] of Object.entries(report.groups)) {
        for (const r of rows) {
          assert.ok(!r.missing, `${r.sel} not found`);
          if (r.ratio < 4.5) low.push(`${group}: ${r.sel} ${r.ratio}`);
        }
      }
      assert.deepEqual(low, [], `text below WCAG AA 4.5:1 in ${theme}`);
      if (theme !== 'light') assert.deepEqual(report.bright, [], `bright panels left in the ${theme} theme`);
      if (mobile) {
        const width = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, inner: window.innerWidth }));
        assert.ok(width.doc <= vp.w + 1 && width.inner <= vp.w + 1, `page is wider than the screen: ${JSON.stringify(width)}`);
        const top = await page.evaluate(() => { const r = document.querySelector('.topin').getBoundingClientRect(); const s = document.getElementById('theme-select').getBoundingClientRect(); const g = document.querySelector('.nav .gh').getBoundingClientRect(); return { right: Math.max(s.right, g.right), w: r.width, overlap: s.right > g.left }; });
        assert.ok(!top.overlap && top.right <= vp.w, `top bar controls overflow: ${JSON.stringify(top)}`);
      } else {
        contrast[theme] = report.groups;
      }
      await shot(page, `theme-${theme}-${vp.w}.png`);
    });
  }
}
if (shotsDir) {
  await mkdir(shotsDir, { recursive: true });
  await writeFile(join(shotsDir, 'contrast-report.json'), JSON.stringify(contrast, null, 2));
}

await browser.close();
server.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} IRE browser checks passed${live ? ' (live feed)' : ''}.`);
process.exit(failed.length ? 1 : 0);
