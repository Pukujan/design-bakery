#!/usr/bin/env node
// Static checks for the IRE dashboard (frontend/ire-app): the page shell's SEO head,
// the social preview, the feed fixture the browser checks replay, and the /ire routing
// in vercel.json and the Caddyfile. No network, no browser; runs in CI.
//
// The rendered behaviour (test hooks, tier switch, open-weight copy, mobile) lives in
// scripts/test-ire-app-browser.mjs, which runs against the built output.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { closedModelNames, visibleText } from './ire-closed-models.mjs';

const root = new URL('..', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');
const FEED_URL =
  'https://raw.githubusercontent.com/Pukujan/inference-recommendation-engine/data/ire-feed/feed/v2/today.json';
const PAGE_URL = 'https://www.design-bakery.com/ire';
const IMAGE_URL = 'https://www.design-bakery.com/ire/og-image.png';

// 1. The dashboard is served from /ire, and the Vite base, the router basename and the
//    fetch target all agree with that.
const viteConfig = await read('./frontend/ire-app/vite.config.ts');
assert.ok(viteConfig.includes('base: "/ire/"'), 'the app should build with base /ire/');
const dashboardApp = await read('./frontend/ire-app/src/App.tsx');
assert.ok(dashboardApp.includes('basename="/ire"'), 'the router basename should be /ire');
const feed = await read('./frontend/ire-app/src/lib/feed.ts');
assert.ok(feed.includes(FEED_URL), 'the dashboard should fetch the live IRE feed');

// 1a. The static /ire page and its test-only scaffolding are gone. A stale copy would
//     still be served by the host's directory index and shadow the dashboard.
for (const gone of [
  './frontend/public/ire/index.html',
  './frontend/public/ire/theme.css',
  './frontend/public/ire/today.saved.json',
  './scripts/refresh-ire-saved-feed.mjs',
  './scripts/test-ire-page.mjs',
  './scripts/test-ire-page-browser.mjs',
]) {
  assert.ok(!existsSync(fileURLToPath(new URL(gone, root))), `${gone} should be gone`);
}

// 2. SEO and the social preview. Crawlers and link unfurlers read these from the served
//    shell, so they have to be literal in the source index.html — the app renders none.
const html = await read('./frontend/ire-app/index.html');
const headHtml = html.slice(0, html.indexOf('</head>'));
const meta = (attr, name) => {
  const esc = name.replace(/[:.]/g, '\\$&');
  const m = headHtml.match(new RegExp(`<meta\\s+${attr}="${esc}"\\s+content="([^"]*)"\\s*/?>`));
  return m ? m[1] : null;
};
const titleText = (headHtml.match(/<title>([^<]+)<\/title>/) ?? [])[1];
assert.ok(
  titleText && titleText.length >= 30 && titleText.length <= 60,
  `title should be 30-60 characters: ${titleText}`,
);
const description = meta('name', 'description');
assert.ok(
  description && description.length >= 140 && description.length <= 160,
  `meta description should be 140-160 characters, is ${description?.length}`,
);
assert.ok(headHtml.includes(`rel="canonical" href="${PAGE_URL}"`), 'canonical URL');
const required = {
  'og:type': 'website',
  'og:site_name': 'Design Baker',
  'og:url': PAGE_URL,
  'og:image': IMAGE_URL,
  'og:image:type': 'image/png',
  'og:image:width': '1200',
  'og:image:height': '630',
};
for (const [k, v] of Object.entries(required)) assert.equal(meta('property', k), v, `${k}`);
for (const k of ['og:title', 'og:description', 'og:image:alt']) {
  assert.ok(meta('property', k)?.length > 20, `${k} should be set`);
}
assert.equal(meta('name', 'twitter:card'), 'summary_large_image');
assert.equal(meta('name', 'twitter:image'), IMAGE_URL);
for (const k of ['twitter:title', 'twitter:description', 'twitter:image:alt']) {
  assert.ok(meta('name', k)?.length > 20, `${k} should be set`);
}
assert.equal(meta('name', 'robots'), 'index, follow');
// JSON-LD: a WebPage about a Dataset whose download is the live feed.
const ldText = (headHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) ?? [])[1];
assert.ok(ldText, 'JSON-LD block');
const ld = JSON.parse(ldText);
assert.equal(ld['@context'], 'https://schema.org');
const webpage = ld['@graph'].find((n) => n['@type'] === 'WebPage');
const dataset = ld['@graph'].find((n) => n['@type'] === 'Dataset');
assert.equal(webpage?.url, PAGE_URL);
assert.equal(webpage.primaryImageOfPage?.url, IMAGE_URL);
assert.equal(webpage.about?.['@id'], dataset?.['@id'], 'WebPage should be about the Dataset');
assert.ok(dataset.description.length >= 50, 'Dataset needs a real description');
assert.ok(
  dataset.distribution.some((d) => d.contentUrl === FEED_URL && d.encodingFormat === 'application/json'),
  'Dataset should point at the live feed',
);
// No closed model names or promo wording in any tag, alt text or JSON-LD.
const seoText = [
  titleText,
  ...[...headHtml.matchAll(/content="([^"]*)"/g)].map((m) => m[1]),
  ldText,
].join(' ');
assert.deepEqual(closedModelNames(seoText), [], 'SEO tags name a closed model');
assert.ok(
  !/%\s*off|\bdiscount|official price|list price|\bdeal\b/i.test(seoText),
  'SEO tags read like a price promo',
);

// 3. The social preview: a real 1200x630 PNG under 300 KB, plus its committed source.
//    The card is a standalone brand asset (dark), not a screenshot of the light page.
const png = await readFile(new URL('./frontend/ire-app/public/og-image.png', root));
assert.equal(png.subarray(1, 4).toString('latin1'), 'PNG', 'og-image.png should be a PNG');
assert.equal(png.readUInt32BE(16), 1200, 'og image width');
assert.equal(png.readUInt32BE(20), 630, 'og image height');
assert.ok(png.length < 300 * 1024, `og image should be under 300 KB, is ${png.length}`);
const ogSource = await read('./scripts/ire-og-image/og-image.html');
assert.ok(
  !/<link[^>]*href="[^"]*frontend\/public\/ire/.test(ogSource),
  'the og image source should not link the retired page stylesheet',
);
assert.ok(ogSource.includes('--background:'), 'the og image source should carry its own tokens');
const ogCopy = visibleText(ogSource);
assert.deepEqual(closedModelNames(ogCopy), [], 'og image names a closed model');
assert.ok(!/\$|%|discount|official|cheaper/i.test(ogCopy), 'og image makes a price claim');

// 4. The feed fixture the browser checks replay. It stands in for the live feed, so it
//    has to keep the same open-weight guarantees the real one carries.
const saved = JSON.parse(await read('./scripts/fixtures/ire-today.saved.json'));
for (const key of ['schema_version', 'generated_at', 'day_et', 'stale_after', 'source_repo', 'sources', 'notice', 'tiers']) {
  assert.ok(key in saved, `feed fixture is missing ${key}`);
}
assert.equal(saved.schema_version, 'ire-feed/v2');
assert.equal(saved.open_weight_only, true, 'the fixture should be the open-weight feed');
for (const tier of ['cheap', 'strongest_open']) {
  const t = saved.tiers[tier];
  assert.ok(t && typeof t.as_of === 'string', `fixture ${tier} tier needs as_of`);
  assert.ok(Array.isArray(t.entries) && t.entries.length > 0, `fixture ${tier} tier needs entries`);
  for (const e of t.entries) {
    for (const k of ['rank', 'model_family', 'recommended', 'gate_reasons', 'best_route', 'price_usd_per_mtok', 'health', 'routes', 'open_weight', 'licence']) {
      assert.ok(k in e, `fixture ${tier} entry ${e.model_family ?? '?'} is missing ${k}`);
    }
    assert.equal(e.open_weight, true, `fixture ${tier} entry ${e.model_family} is not open-weight`);
    assert.match(e.licence.url, /^https:\/\//, `fixture ${tier} entry ${e.model_family} needs a licence URL`);
    const names = closedModelNames([e.model_family, e.vendor, e.best_route, ...e.routes].join(' '));
    assert.deepEqual(names, [], `fixture ${tier} entry ${e.model_family} names a closed model: ${names}`);
  }
}
// The utility tier is optional and its rows carry the open-weight verdict themselves:
// true (verified licence) or null (listed, licence unverified). Closed families never appear.
if (saved.tiers.utility) {
  const u = saved.tiers.utility;
  assert.ok(Array.isArray(u.entries) && u.entries.length > 0, 'fixture utility tier needs entries');
  for (const e of u.entries) {
    for (const k of ['rank', 'model_family', 'recommended', 'gate_reasons', 'best_route', 'price_usd_per_mtok', 'health', 'routes', 'open_weight']) {
      assert.ok(k in e, `fixture utility entry ${e.model_family ?? '?'} is missing ${k}`);
    }
    assert.ok(
      e.open_weight === true || e.open_weight === null,
      `fixture utility entry ${e.model_family} must be open-weight true or null, not ${e.open_weight}`,
    );
    assert.ok(!(e.open_weight !== true && e.recommended), `fixture utility entry ${e.model_family} is unverified but recommended`);
    if (e.open_weight === true) {
      assert.match(e.licence?.url ?? '', /^https:\/\//, `fixture utility entry ${e.model_family} is verified and needs a licence URL`);
    }
    const names = closedModelNames([e.model_family, e.vendor, e.best_route, ...e.routes].join(' '));
    assert.deepEqual(names, [], `fixture utility entry ${e.model_family} names a closed model: ${names}`);
  }
}

// 5. Nothing that looks like a credential ships with the page or the fixture.
const keyLike = /(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{20,}|ihub[_-][A-Za-z0-9]{16,})/;
assert.ok(!keyLike.test(html), 'the dashboard shell contains something that looks like a key');
assert.ok(!keyLike.test(JSON.stringify(saved)), 'the feed fixture contains something that looks like a key');

// 6. Routing. /ire and /ire/ serve the dashboard; the old /ire/app path redirects to it
//    (vercel.json uses `permanent: true`, which Vercel serves as a 308; the Caddyfile
//    mirrors it with an explicit 301).
const vercel = JSON.parse(await read('./vercel.json'));
const rewrites = vercel.rewrites.map((r) => r.source);
const catchAll = rewrites.indexOf('/((?!.*\\.html$).*)');
assert.ok(catchAll >= 0, 'vercel.json should keep the SPA catch-all');
for (const source of ['/ire', '/ire/']) {
  const i = rewrites.indexOf(source);
  assert.ok(i >= 0, `vercel.json should rewrite ${source}`);
  assert.equal(vercel.rewrites[i].destination, '/ire/index.html');
  assert.ok(i < catchAll, `${source} rewrite must come before the SPA catch-all`);
}
assert.ok(!rewrites.includes('/ire/app'), 'the old /ire/app rewrite should be gone');
for (const source of ['/ire/app', '/ire/app/']) {
  const r = (vercel.redirects ?? []).find((x) => x.source === source);
  assert.ok(r, `vercel.json should redirect ${source}`);
  assert.equal(r.destination, '/ire/');
  assert.equal(r.permanent, true, `${source} should be a permanent redirect`);
}
const caddy = await read('./deploy/gravebuster/Caddyfile');
assert.match(
  caddy,
  /@ire path \/ire \/ire\/\n\s*handle @ire \{\n\s*rewrite \* \/ire\/index\.html/,
  'Caddyfile should mirror the /ire rewrite',
);
assert.ok(
  caddy.indexOf('handle @ire') < caddy.indexOf('rewrite * /index.html'),
  'the Caddy /ire rule must come before the SPA fallback',
);
assert.match(
  caddy,
  /@ireAppLegacy path \/ire\/app \/ire\/app\/\n\s*redir @ireAppLegacy \/ire\/ 301/,
  'Caddyfile should redirect the old /ire/app path',
);
// The site's own SPA keeps a /ire route that hands off with a full page load, because the
// portfolio card renders /ire as an in-app <Link> (client-side, so no host rewrite runs).
const siteApp = await read('./frontend/src/app/App.tsx');
assert.ok(siteApp.includes('path="/ire" element={<IrePageRedirect />}'), 'App.tsx should hand /ire off to the dashboard');
const sitemap = await read('./scripts/generate-sitemap.mjs');
assert.ok(sitemap.includes("'/ire',"), 'sitemap should list /ire');

// 7. The homepage card links to the page and to GitHub.
const projects = JSON.parse(await read('./frontend/src/app/portfolios/endtoend-engineer/engineering/projects.json'));
const ire = projects.find((p) => p.id === 11);
assert.equal(ire?.title, 'Inference Recommendation Engine');
assert.ok(ire.links.some((l) => l.url === '/ire'), 'IRE card should link to /ire');
assert.ok(
  ire.links.some((l) => l.url === 'https://github.com/Pukujan/inference-recommendation-engine'),
  'IRE card should keep its GitHub link',
);

console.log('IRE dashboard static checks passed.');
