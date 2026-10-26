#!/usr/bin/env node
// Theme preference checks for the site shell. Run `pnpm --dir frontend run build`
// first — this reads the built output, not the source.
//
// The rule: an explicit visitor choice wins, and with no choice the page follows
// the OS colour scheme. The starting theme is applied before first paint, so a
// dark-mode visitor never sees a light flash.
//
// Scenarios: all six scheme/storage combinations; a live OS change is followed
// while no choice is stored; a click wins over the OS and survives a reload; the
// class is present before the app script runs; native UI follows via color-scheme.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const dist = fileURLToPath(new URL('../frontend/dist', import.meta.url));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

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

const browser = await chromium.launch();

async function readState(page) {
  return page.evaluate(() => {
    let stored = null;
    try {
      stored = localStorage.getItem('mode');
    } catch {
      /* storage blocked: scenario 5 asserts the theme, not storage */
    }
    return {
      dark: document.documentElement.classList.contains('dark'),
      colorScheme: getComputedStyle(document.documentElement).colorScheme,
      label: document.querySelector('button[aria-label^="Switch to"]')?.getAttribute('aria-label') ?? null,
      stored,
    };
  });
}

async function open({ scheme, stored }) {
  const context = await browser.newContext({ colorScheme: scheme });
  if (stored) {
    await context.addInitScript((value) => {
      try {
        localStorage.setItem('mode', value);
      } catch {
        /* ignore */
      }
    }, stored);
  }
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (m) => {
    // Third-party images in the page content 403 without notice; this checks the app.
    const from = m.location().url;
    if (m.type() === 'error' && (!from || from.startsWith(origin))) consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
  await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('button[aria-label^="Switch to"]', { timeout: 20000 });
  return { context, page, consoleErrors };
}

// 1. Every scheme/storage combination resolves to the documented theme.
const CASES = [
  { scheme: 'dark', stored: null, dark: true, why: 'no choice follows a dark OS' },
  { scheme: 'light', stored: null, dark: false, why: 'no choice follows a light OS' },
  { scheme: 'dark', stored: 'dark', dark: true, why: 'stored dark on a dark OS' },
  { scheme: 'light', stored: 'dark', dark: true, why: 'stored dark wins over a light OS' },
  { scheme: 'dark', stored: 'light', dark: false, why: 'stored light wins over a dark OS' },
  { scheme: 'light', stored: 'light', dark: false, why: 'stored light on a light OS' },
];

for (const c of CASES) {
  const { context, page, consoleErrors } = await open(c);
  const state = await readState(page);
  const where = `os=${c.scheme} mode=${c.stored ?? 'unset'}`;
  assert.equal(state.dark, c.dark, `${where}: wrong theme — ${c.why}`);
  assert.equal(state.colorScheme, c.dark ? 'dark' : 'light', `${where}: color-scheme must follow the theme`);
  assert.equal(
    state.label,
    c.dark ? 'Switch to light theme' : 'Switch to dark theme',
    `${where}: the toggle must offer the opposite of the current theme`,
  );
  assert.equal(state.stored, c.stored, `${where}: the page must not write a preference on its own`);
  assert.deepEqual(consoleErrors, [], `${where}: console errors: ${consoleErrors.join(' | ')}`);
  await context.close();
}

// 2. With no stored choice, a live OS change is followed.
{
  const { context, page } = await open({ scheme: 'light', stored: null });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForTimeout(300);
  const state = await readState(page);
  assert.equal(state.dark, true, 'a live OS change must be followed while no choice is stored');
  assert.equal(state.stored, null, 'following the OS must not persist a preference');
  await context.close();
}

// 3. A click wins over the OS and survives a reload.
{
  const { context, page } = await open({ scheme: 'light', stored: null });
  await page.getByRole('button', { name: /Switch to dark theme/ }).click();
  await page.waitForTimeout(200);
  const clicked = await readState(page);
  assert.equal(clicked.dark, true, 'the click must switch the theme');
  assert.equal(clicked.stored, 'dark', 'the click must record an explicit choice');

  await page.emulateMedia({ colorScheme: 'light' });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('button[aria-label^="Switch to"]');
  const reloaded = await readState(page);
  assert.equal(reloaded.dark, true, 'the explicit choice must survive a reload under a light OS');
  assert.equal(reloaded.stored, 'dark', 'the explicit choice must stay stored');
  await context.close();
}

// 4. No flash: the theme is on <html> before the app bundle runs.
{
  const context = await browser.newContext({ colorScheme: 'dark' });
  const page = await context.newPage();
  await page.route('**/assets/*.js', async (route) => {
    await new Promise((r) => setTimeout(r, 800));
    await route.continue();
  });
  await page.goto(`${origin}/`, { waitUntil: 'commit' });
  const early = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  assert.equal(early, true, 'the theme must be applied before first paint, not in a React effect');
  await context.close();
}

// 5. Blocked storage fails open to the OS preference rather than throwing.
{
  const context = await browser.newContext({ colorScheme: 'dark' });
  await context.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('blocked', 'SecurityError');
      },
    });
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('button[aria-label^="Switch to"]');
  const state = await readState(page);
  assert.equal(state.dark, true, 'blocked storage must fall back to the OS preference');
  assert.deepEqual(consoleErrors, [], `blocked storage must not throw: ${consoleErrors.join(' | ')}`);
  await context.close();
}

await browser.close();
server.close();
console.log('theme preference checks passed — stored choice wins, otherwise the OS scheme, applied before first paint.');
