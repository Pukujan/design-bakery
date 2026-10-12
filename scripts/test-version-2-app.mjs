#!/usr/bin/env node
// Static checks for the /version-2 page (frontend/version-2-app): that the Vite base,
// the asset prefix and the /version-2 routing in vercel.json, the Caddyfile and
// deploy.sh all agree. No network, no browser; runs in CI.
//
// History: this page was briefly promoted to the site root (`/`) in TASK-DB-0084, with
// the site shell moved to /shell/index.html. That promotion was reverted in
// TASK-DB-0085 — the page is additive again, `/` is the shell, and the two documents no
// longer share a path. These checks pin the additive wiring, including the parts of the
// promotion worth keeping (the arrival plate and its prefix discipline).
//
// The rendered behaviour lives in the browser: the page is walked by hand (and by the
// same harness the spike used) after a deploy, since it is a scroll-driven canvas scene
// rather than a set of discrete widgets.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');
const exists = (p) => existsSync(fileURLToPath(new URL(p, root)));

// 1. The page is served from /version-2, and the Vite base, the router basename and the
//    asset prefix all agree with that. A mismatch here is the /ire class of bug: assets
//    404 or the router matches its catch-all and renders the 404 page.
const viteConfig = await read('./frontend/version-2-app/vite.config.ts');
assert.ok(viteConfig.includes('base: "/version-2/"'), 'the app should build with base /version-2/');
const appTsx = await read('./frontend/version-2-app/src/App.tsx');
assert.ok(appTsx.includes('basename="/version-2"'), 'the router basename should be /version-2');

// 1a. The scene plates are public/ files referenced through the base prefix. A bare
//     "/generated-…" path would resolve to the site root and 404 under /version-2.
const art = await read('./frontend/version-2-app/src/lib/art.ts');
assert.ok(art.includes('import.meta.env.BASE_URL'), 'the plate paths should go through import.meta.env.BASE_URL');
assert.ok(!/["'`]\/(?:generated-|plate-)/.test(art), 'a plate path is root-absolute and will 404 under /version-2');
for (const plate of art.matchAll(/(?:generated-[\d]+-[0-9a-f]+|plate-[a-z0-9-]+)\.png/g)) {
  assert.ok(
    exists(`./frontend/version-2-app/public/${plate[0]}`),
    `the plate ${plate[0]} is referenced but not committed under frontend/version-2-app/public`,
  );
}

// 2. The build wiring: a script that installs the app's own lockfile and copies its
//    output into the site's dist tree, chained from the frontend build.
assert.ok(exists('./scripts/build-version-2-app.mjs'), 'scripts/build-version-2-app.mjs should exist');
assert.ok(exists('./frontend/version-2-app/pnpm-lock.yaml'), 'the app keeps its own lockfile');
assert.ok(exists('./frontend/index.html'), 'the site shell document should exist at the site root');
const frontendPkg = JSON.parse(await read('./frontend/package.json'));
assert.ok(
  frontendPkg.scripts.build.includes('build-version-2-app.mjs'),
  'the frontend build should chain build-version-2-app.mjs',
);

// 2a. The build copies the app into dist/version-2, and does NOT swap documents — the
//     TASK-DB-0084 swap (shell aside, journey over index.html) must not come back.
const buildScript = await read('./scripts/build-version-2-app.mjs');
assert.match(buildScript, /frontend\/dist\/version-2/, 'the build should target frontend/dist/version-2');
assert.ok(!buildScript.includes('shell/index.html'), 'the build should not move the shell aside');

// 3. Routing parity: /version-2 and /version-2/ serve the app's shell, before the SPA
//    catch-all, in vercel.json and the Caddyfile alike.
const vercel = JSON.parse(await read('./vercel.json'));
const rewrites = vercel.rewrites.map((r) => r.source);
const catchAll = rewrites.indexOf('/((?!.*\\.html$).*)');
assert.ok(catchAll >= 0, 'vercel.json should keep the SPA catch-all');
assert.equal(
  vercel.rewrites[catchAll].destination,
  '/index.html',
  'the SPA catch-all should serve the site shell at /index.html',
);
for (const source of ['/version-2', '/version-2/']) {
  const i = rewrites.indexOf(source);
  assert.ok(i >= 0, `vercel.json should rewrite ${source}`);
  assert.equal(vercel.rewrites[i].destination, '/version-2/index.html');
  assert.ok(i < catchAll, `${source} rewrite must come before the SPA catch-all`);
}
assert.ok(
  !vercel.redirects.some((r) => r.source === '/version-2' || r.source === '/version-2/'),
  'vercel.json should not redirect /version-2 — it serves the page',
);
const caddy = await read('./deploy/gravebuster/Caddyfile');
assert.match(
  caddy,
  /@version2 path \/version-2 \/version-2\/\n\s*handle @version2 \{\n\s*rewrite \* \/version-2\/index\.html/,
  'Caddyfile should mirror the /version-2 rewrite',
);
assert.ok(!caddy.includes('/shell/index.html'), 'the Caddyfile should not serve a /shell/index.html document');

// 3a. The server-side consumer that reads the shell by path must agree with the additive
//     wiring: the shell is at /index.html, not the promotion's /shell/index.html.
const shareHtml = await read('./backend/src/og/blogShareHtml.ts');
assert.ok(
  shareHtml.includes("new URL('/index.html', origin)"),
  'the Open Graph crawler HTML should read the shell from /index.html',
);

// 4. The deploy smoke test exercises the page: its shell and a scene plate under the base
//    path (the plate proves the asset prefix resolves through the rewrite). The two body
//    checks pin the two documents apart — a status-only smoke cannot tell them apart.
const deploy = await read('./deploy/gravebuster/deploy.sh');
assert.match(deploy, /check 200 \/version-2\b/, 'deploy.sh should smoke-check /version-2');
assert.match(deploy, /body_has \/version-2 "\/version-2\/assets\/"/, 'deploy.sh should assert /version-2 is the journey');
assert.match(deploy, /check 200 \/version-2\/plate-[a-z0-9-]+\.png/, 'deploy.sh should smoke-check a scene plate');
assert.match(deploy, /body_has \/ "Fullstack Design Engineer"/, 'deploy.sh should assert / is the site shell');
assert.ok(!deploy.includes('/shell/index.html'), 'deploy.sh should not reference a /shell/index.html document');

// 5. The app is its own eslint project (like frontend/ire-app), so the root lint does not
//    walk it with the site's config.
const eslint = await read('./eslint.config.mjs');
assert.ok(eslint.includes("'frontend/version-2-app/**'"), 'the root eslint config should ignore the app');

console.log('version-2 page static checks passed.');
