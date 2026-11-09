#!/usr/bin/env node
/** Run after `pnpm --dir backend run build`: exercise crawler canonicals through the router. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import express from '../backend/node_modules/express/index.js';
import { ogPreviewRouter } from '../backend/lib/api/ogPreview.js';

const shell = await readFile(new URL('../frontend/index.html', import.meta.url), 'utf8');
const prior = { ...process.env };
Object.assign(process.env, {
  SITE_URL: 'https://www.design-bakery.com',
  OG_SHELL_ORIGIN: 'http://fake-web',
  OCTO_API_BASE: 'http://fake-octo',
  OCTO_WORKSPACE_ID: 'test',
  OCTO_API_KEY: 'test',
});
const row = {
  id: 'test-post', legacy_doc_id: null, numeric_id: 23,
  title: 'A test post', excerpt: 'Test description', content: 'Public text',
  tags: [], category: 'engineering', author: 'Design Baker', color: null,
  date: '2026-01-01', read_time: '1 min', cover_image_url: null,
  thumbnail_image_url: null, seo: null, published_at: '2026-01-01T00:00:00Z',
};
const originalFetch = globalThis.fetch;
let shellAvailable = true;
globalThis.fetch = (input, init) => {
  const url = String(input);
  if (url === 'http://fake-web/index.html') return Promise.resolve(new Response(shell, { status: shellAvailable ? 200 : 503 }));
  if (url === 'http://fake-octo/api/workspaces/test/query') {
    // Project pages read cms_documents; none there means the repo projects.json is used.
    const cms = String(init?.body ?? '').includes('cms_documents');
    return Promise.resolve(Response.json({ rows: cms ? [] : [row] }));
  }
  return originalFetch(input, init);
};
const app = express();
app.use(ogPreviewRouter);
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
try {
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const prefix of ['', '/endtoend-engineer', '/legal-workflow-engineer', '/ai-engineer', '/forward-deployed-engineer']) {
    for (const [suffix, canonical] of [['/blogs/', '/blogs'], ['/blogs/23/', '/blogs/23']]) {
      const response = await originalFetch(`${origin}${prefix}${suffix}`, { headers: { 'user-agent': 'facebookexternalhit/1.1' } });
      assert.equal(response.status, 200, `${prefix}${suffix} remains navigable`);
      const html = await response.text();
      assert.match(html, new RegExp(`<link rel="canonical" href="https://www\\.design-bakery\\.com${canonical}"`));
      assert.match(html, new RegExp(`<meta property="og:url" content="https://www\\.design-bakery\\.com${canonical}"`));
      assert.ok(html.includes('property="og:image" content="https://www.design-bakery.com/images/design-baker-social.png"'), 'list and posts without a cover use the current brand image');
    }
  }
  for (const path of ['/work/riley', '/work/riley/']) {
    const response = await originalFetch(`${origin}${path}`, { headers: { 'user-agent': 'facebookexternalhit/1.1' } });
    assert.equal(response.status, 200, `${path} remains navigable`);
    const html = await response.text();
    assert.ok(html.includes('<link rel="canonical" href="https://www.design-bakery.com/work/riley"'), `${path} canonical`);
    assert.ok(html.includes('property="og:image" content="https://www.design-bakery.com/og/projects/riley.jpg"'), `${path} uses the project share image`);
    assert.match(html, /<meta property="og:title" content="Riley \| Design Baker"/);
  }
  const unknown = await originalFetch(`${origin}/work/not-a-project`, { headers: { 'user-agent': 'facebookexternalhit/1.1' } });
  assert.equal(unknown.status, 200, 'an unknown project still gets the shell (the SPA shows its 404)');
  shellAvailable = false;
  const fallback = await originalFetch(`${origin}/endtoend-engineer/blogs`, { headers: { 'user-agent': 'facebookexternalhit/1.1' } });
  const html = await fallback.text();
  assert.equal(fallback.status, 200);
  assert.ok(html.includes('property="og:image" content="https://www.design-bakery.com/images/design-baker-social.png"'));
  assert.ok(html.includes('property="og:type" content="website"'));
  assert.equal([...html.matchAll(/<meta name="description"/g)].length, 1);
  assert.ok(html.includes('href="https://www.design-bakery.com/endtoend-engineer/blogs/23"'), 'fallback links retain their original portfolio prefix');
  console.log('og-canonical: list and post aliases keep routes and share canonical URLs; /work pages get project cards');
} finally {
  globalThis.fetch = originalFetch;
  for (const key of ['SITE_URL', 'OG_SHELL_ORIGIN', 'OCTO_API_BASE', 'OCTO_WORKSPACE_ID', 'OCTO_API_KEY']) {
    if (prior[key] === undefined) delete process.env[key]; else process.env[key] = prior[key];
  }
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
