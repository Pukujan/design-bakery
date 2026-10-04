#!/usr/bin/env node
// Static checks for the IRE market page (IRE #77). No network, no browser; runs in CI.
// The browser checks (live feed, fallback, stale banner, mobile) live in
// scripts/test-ire-page-browser.mjs.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { closedModelNames, visibleText } from './ire-closed-models.mjs';

const root = new URL('..', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');
const FEED_URL =
  'https://raw.githubusercontent.com/Pukujan/inference-recommendation-engine/data/ire-feed/feed/v2/today.json';

// 1. The page and its saved feed copy.
const html = await read('./frontend/public/ire/index.html');
assert.ok(html.includes(FEED_URL), 'page should fetch the live IRE feed');
assert.ok(html.includes("'/ire/today.saved.json'"), 'page should fall back to the saved copy');
for (const id of ['picks', 'real-story', 'how', 'use-it', 'agents', 'limits', 'receipts']) {
  assert.ok(html.includes(`id="${id}"`), `page should have a #${id} section`);
}
for (const id of ['tab-cheap', 'tab-strongest_open', 'panel-cheap', 'panel-strongest_open', 'stale-banner', 'saved-note', 'error-note', 'feed-url']) {
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
assert.equal(saved.schema_version, 'ire-feed/v2');
assert.equal(saved.open_weight_only, true, 'saved feed should be the open-weight feed');
for (const tier of ['cheap', 'strongest_open']) {
  const t = saved.tiers[tier];
  assert.ok(t && typeof t.as_of === 'string', `saved ${tier} tier needs as_of`);
  assert.ok(Array.isArray(t.entries) && t.entries.length > 0, `saved ${tier} tier needs entries`);
  for (const e of t.entries) {
    for (const k of ['rank', 'model_family', 'recommended', 'gate_reasons', 'best_route', 'price_usd_per_mtok', 'health', 'routes', 'open_weight', 'licence']) {
      assert.ok(k in e, `saved ${tier} entry ${e.model_family ?? '?'} is missing ${k}`);
    }
    assert.equal(e.open_weight, true, `saved ${tier} entry ${e.model_family} is not open-weight`);
    assert.match(e.licence.url, /^https:\/\//, `saved ${tier} entry ${e.model_family} needs a licence URL`);
    const names = closedModelNames([e.model_family, e.vendor, e.best_route, ...e.routes].join(' '));
    assert.deepEqual(names, [], `saved ${tier} entry ${e.model_family} names a closed model: ${names}`);
  }
}

// 1b. Open-weight only: no closed model names in the copy, and no price-comparison promos.
const copy = visibleText(html);
assert.deepEqual(closedModelNames(copy), [], 'page copy names a closed model family or vendor');
assert.ok(!/%\s*off|\bdiscount|official price|list price|\bsave \d|\bdeal\b|cheaper than (the )?official/i.test(copy), 'page copy reads like a price promo');
assert.ok(!/official|discount/i.test(JSON.stringify(Object.keys(saved))) && !/"[^"]*(official|discount)[^"]*":/i.test(JSON.stringify(saved)), 'saved feed carries official-price or discount fields');
assert.ok(!/frontier/i.test(copy), 'page should talk about the strongest open-weight models, not a frontier list');
assert.ok(/open-weight/i.test(copy), 'page should say it covers open-weight models');

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

// 5. Color themes. Every color lives in frontend/public/ire/theme.css; the page has none.
const themeCss = await read('./frontend/public/ire/theme.css');
assert.ok(html.includes('<link rel="stylesheet" href="/ire/theme.css">'), 'page should load /ire/theme.css (absolute, so /ire without a slash works)');
assert.ok(html.includes('<html lang="en" data-theme="dark">'), 'page should start in the dark theme');
assert.ok(html.includes('var FOLLOW_DEVICE_LIGHT = false;'), 'page should start dark even on a light-mode device');
assert.ok(/How it works[\s\S]*To change a color[\s\S]*To add a theme/.test(themeCss.slice(0, 3000)), 'theme.css should open with the how-to comment');
const COLOR_VALUE = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;
const NAMED_COLOR = /(?<![\w-])(?:white|black|red|green|blue|gray|grey|silver|yellow|orange|purple|pink|navy|teal|cyan|magenta)(?![\w-])/i;
const cssParts = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1])
  .concat([...html.matchAll(/\sstyle="([^"]*)"/g)].map((m) => m[1]));
const scriptParts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
for (const css of cssParts) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!COLOR_VALUE.test(stripped), `hard-coded color in the page CSS: ${stripped.match(COLOR_VALUE)?.[0]} (put it in theme.css)`);
  assert.ok(!NAMED_COLOR.test(stripped), `named color in the page CSS: ${stripped.match(NAMED_COLOR)?.[0]} (put it in theme.css)`);
}
for (const js of scriptParts) {
  assert.ok(!COLOR_VALUE.test(js), `hard-coded color in the page script: ${js.match(COLOR_VALUE)?.[0]}`);
}
// Each theme block defines exactly the same variables, and the page's picker lists the same themes.
const blocks = {};
const themeRules = themeCss.replace(/\/\*[\s\S]*?\*\//g, '');
for (const m of themeRules.matchAll(/((?:\[data-theme="[a-z-]+"\][,\s]*|:root,\s*)+)\{([^}]*)\}/g)) {
  const vars = [...m[2].matchAll(/(--[a-z0-9-]+)\s*:/g)].map((v) => v[1]).sort();
  for (const name of [...m[1].matchAll(/data-theme="([a-z-]+)"/g)].map((n) => n[1])) blocks[name] = vars;
}
const themeNames = Object.keys(blocks).sort();
assert.deepEqual(themeNames, ['contrast', 'dark', 'light', 'midnight'], 'theme.css should define dark, light, midnight and contrast');
for (const name of themeNames) assert.deepEqual(blocks[name], blocks.dark, `theme "${name}" should define the same variables as dark`);
assert.ok(/:root,\s*\[data-theme="dark"\]/.test(themeRules), 'dark should also be the :root default');
const used = new Set([...html.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
const defined = new Set([...themeRules.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]).concat(['--sans', '--mono']));
for (const v of used) assert.ok(defined.has(v), `page uses ${v} but no theme defines it`);
const options = [...html.matchAll(/<option value="([a-z-]+)">/g)].map((m) => m[1]).sort();
assert.deepEqual(options, themeNames, 'the theme picker should list every theme');
const listed = (html.match(/var THEMES = \[([^\]]*)\]/) ?? [])[1];
assert.deepEqual(listed?.match(/[a-z-]+/g).sort(), themeNames, 'the head script should know every theme');

// 6. SEO and the social preview. Crawlers get these from the static file (no JS needed).
const headHtml = html.slice(0, html.indexOf('</head>'));
const meta = (attr, name) => {
  const m = headHtml.match(new RegExp(`<meta ${attr}="${name.replace(/[:.]/g, '\\$&')}" content="([^"]*)">`));
  return m ? m[1] : null;
};
const PAGE_URL = 'https://www.design-bakery.com/ire';
const IMAGE_URL = 'https://www.design-bakery.com/ire/og-image.png';
const titleText = (headHtml.match(/<title>([^<]+)<\/title>/) ?? [])[1];
assert.ok(titleText && titleText.length >= 30 && titleText.length <= 60, `title should be 30-60 characters: ${titleText}`);
const description = meta('name', 'description');
assert.ok(description && description.length >= 140 && description.length <= 160, `meta description should be 140-160 characters, is ${description?.length}`);
assert.ok(headHtml.includes(`<link rel="canonical" href="${PAGE_URL}">`), 'canonical URL');
const required = {
  'og:type': 'website', 'og:site_name': 'Design Baker', 'og:url': PAGE_URL, 'og:image': IMAGE_URL,
  'og:image:type': 'image/png', 'og:image:width': '1200', 'og:image:height': '630',
};
for (const [k, v] of Object.entries(required)) assert.equal(meta('property', k), v, `${k}`);
for (const k of ['og:title', 'og:description', 'og:image:alt']) assert.ok(meta('property', k)?.length > 20, `${k} should be set`);
assert.equal(meta('name', 'twitter:card'), 'summary_large_image');
assert.equal(meta('name', 'twitter:image'), IMAGE_URL);
for (const k of ['twitter:title', 'twitter:description', 'twitter:image:alt']) assert.ok(meta('name', k)?.length > 20, `${k} should be set`);
assert.equal(meta('name', 'robots'), 'index, follow');
// theme-color has to be a literal; keep it equal to the dark theme's --background.
const darkBg = themeRules.match(/:root,\s*\[data-theme="dark"\]\s*\{[^}]*--background:\s*(#[0-9a-f]{6})/i)?.[1];
assert.equal(meta('name', 'theme-color')?.toLowerCase(), darkBg?.toLowerCase(), 'theme-color should match the dark --background');
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
assert.ok(dataset.distribution.some((d) => d.contentUrl === FEED_URL && d.encodingFormat === 'application/json'), 'Dataset should point at the live feed');
// No closed model names or promo wording in any tag, alt text or JSON-LD.
const seoText = [titleText, ...[...headHtml.matchAll(/content="([^"]*)"/g)].map((m) => m[1]), ldText].join(' ');
assert.deepEqual(closedModelNames(seoText), [], 'SEO tags name a closed model');
assert.ok(!/%\s*off|\bdiscount|official price|list price|\bdeal\b/i.test(seoText), 'SEO tags read like a price promo');
// The image itself: a real 1200x630 PNG under 300 KB, plus its committed source.
const png = await readFile(new URL('./frontend/public/ire/og-image.png', root));
assert.equal(png.subarray(1, 4).toString('latin1'), 'PNG', 'og-image.png should be a PNG');
assert.equal(png.readUInt32BE(16), 1200, 'og image width');
assert.equal(png.readUInt32BE(20), 630, 'og image height');
assert.ok(png.length < 300 * 1024, `og image should be under 300 KB, is ${png.length}`);
const ogSource = await read('./scripts/ire-og-image/og-image.html');
assert.ok(ogSource.includes('frontend/public/ire/theme.css'), 'og image source should use the page theme tokens');
const ogCopy = visibleText(ogSource);
assert.deepEqual(closedModelNames(ogCopy), [], 'og image names a closed model');
assert.ok(!/\$|%|discount|official|cheaper/i.test(ogCopy), 'og image makes a price claim');

console.log('IRE page static checks passed.');
