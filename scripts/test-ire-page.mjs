#!/usr/bin/env node
// Static checks for the IRE market page (IRE #77). No network, no browser; runs in CI.
// The browser checks (live feed, fallback, stale banner, mobile) live in
// scripts/test-ire-page-browser.mjs.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');
const FEED_URL =
  'https://raw.githubusercontent.com/Pukujan/inference-recommendation-engine/data/ire-feed/feed/v1/today.json';

// 1. The page and its saved feed copy.
const html = await read('./frontend/public/ire/index.html');
assert.ok(html.includes(FEED_URL), 'page should fetch the live IRE feed');
assert.ok(html.includes("'/ire/today.saved.json'"), 'page should fall back to the saved copy');
for (const id of ['picks', 'real-story', 'how', 'use-it', 'agents', 'limits', 'receipts']) {
  assert.ok(html.includes(`id="${id}"`), `page should have a #${id} section`);
}
for (const id of ['tab-cheap', 'tab-frontier', 'panel-cheap', 'panel-frontier', 'stale-banner', 'saved-note', 'error-note', 'feed-url']) {
  assert.ok(html.includes(`id="${id}"`), `page should have #${id}`);
}
assert.ok(html.includes('schema.json'), 'agents section should link the schema');
assert.ok(html.includes('AGENT-QUICKSTART.md') && html.includes('START-HERE.md'), 'page should link both IRE guides');
assert.ok(/MCP server is planned/.test(html), 'MCP should be described as planned, not shipped');
assert.ok(/we never see your key/i.test(html), 'Use-it section should say the key stays with the user');
assert.ok(!/innerHTML\s*=/.test(html), 'feed data must be rendered with textContent, not innerHTML');

const saved = JSON.parse(await read('./frontend/public/ire/today.saved.json'));
for (const key of ['schema_version', 'generated_at', 'day_et', 'stale_after', 'source_repo', 'sources', 'notice', 'tiers']) {
  assert.ok(key in saved, `saved feed is missing ${key}`);
}
assert.equal(saved.schema_version, 'ire-feed/v1');
for (const tier of ['cheap', 'frontier']) {
  const t = saved.tiers[tier];
  assert.ok(t && typeof t.as_of === 'string', `saved ${tier} tier needs as_of`);
  assert.ok(Array.isArray(t.entries) && t.entries.length > 0, `saved ${tier} tier needs entries`);
  for (const e of t.entries) {
    for (const k of ['rank', 'model_family', 'recommended', 'gate_reasons', 'best_route', 'price_usd_per_mtok', 'health', 'routes']) {
      assert.ok(k in e, `saved ${tier} entry ${e.model_family ?? '?'} is missing ${k}`);
    }
  }
}

// 2. Nothing that looks like a credential ships with the page.
const keyLike = /(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{20,}|ihub[_-][A-Za-z0-9]{16,})/;
assert.ok(!keyLike.test(html), 'page contains something that looks like a key');
assert.ok(!keyLike.test(JSON.stringify(saved)), 'saved feed contains something that looks like a key');

// 3. Routing: Vercel rewrite, matching Caddy rule, SPA hand-off route, sitemap.
const vercel = JSON.parse(await read('./vercel.json'));
const rewrites = vercel.rewrites.map((r) => r.source);
const catchAll = rewrites.indexOf('/((?!.*\\.html$).*)');
for (const source of ['/ire', '/ire/']) {
  const i = rewrites.indexOf(source);
  assert.ok(i >= 0, `vercel.json should rewrite ${source}`);
  assert.equal(vercel.rewrites[i].destination, '/ire/index.html');
  assert.ok(i < catchAll, `${source} rewrite must come before the SPA catch-all`);
}
const caddy = await read('./deploy/gravebuster/Caddyfile');
assert.match(caddy, /@ire path \/ire \/ire\/\n\s*handle @ire \{\n\s*rewrite \* \/ire\/index\.html/, 'Caddyfile should mirror the /ire rewrite');
assert.ok(caddy.indexOf('handle @ire') < caddy.indexOf('rewrite * /index.html'), 'Caddy /ire rule must come before the SPA fallback');
const app = await read('./frontend/src/app/App.tsx');
assert.ok(app.includes('path="/ire" element={<IrePageRedirect />}'), 'App.tsx should hand /ire off to the static page');
const sitemap = await read('./scripts/generate-sitemap.mjs');
assert.ok(sitemap.includes("'/ire',"), 'sitemap should list /ire');

// 4. The homepage card links to the page and to GitHub.
const projects = JSON.parse(await read('./frontend/src/app/portfolios/endtoend-engineer/engineering/projects.json'));
const ire = projects.find((p) => p.id === 11);
assert.equal(ire?.title, 'Inference Recommendation Engine');
assert.ok(ire.links.some((l) => l.url === '/ire'), 'IRE card should link to /ire');
assert.ok(ire.links.some((l) => l.url === 'https://github.com/Pukujan/inference-recommendation-engine'), 'IRE card should keep its GitHub link');

console.log('IRE page static checks passed.');
