#!/usr/bin/env node
// Renders scripts/ire-og-image/og-image.html to frontend/ire-app/public/og-image.png
// (1200x630, the /ire social preview). Vite copies that public/ into the dashboard
// build, so it ships as /ire/og-image.png. Same input and fonts give the same image.
// Usage: pnpm ire:og-image
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { stat } from 'node:fs/promises';

const src = new URL('./ire-og-image/og-image.html', import.meta.url);
const out = fileURLToPath(new URL('../frontend/ire-app/public/og-image.png', import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(src.href, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log(`wrote ${out} (${(await stat(out)).size} bytes)`);
