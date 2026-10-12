#!/usr/bin/env node
// Static checks for the cinematic-journey homepage (frontend/version-2-app, published
// at `/`): that the Vite base, the plate prefix, the two-document build swap and the
// routing in vercel.json, the Caddyfile and deploy.sh all agree. No network, no browser;
// runs in CI.
//
// Why this exists: `/` is the one path a rewrite cannot move. Vercel evaluates
// `redirects` before the filesystem but `rewrites` after it, and Caddy mirrors that, so
// the SPA catch-all never sees a request for `/` — the file at frontend/dist/index.html
// IS the homepage. The swap that puts it there happens at build time
// (scripts/build-home-app.mjs), and every consumer that used to read the shell at
// /index.html now reads it at /shell/index.html. These checks pin all of that together.
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

// 1. The page is served from the site root: the Vite base is `/` and there is no router.
//    A leftover basename or a router catch-all would render the wrong thing at `/`.
const viteConfig = await read('./frontend/version-2-app/vite.config.ts');
assert.ok(viteConfig.includes('base: "/"'), 'the app should build with base /');
const appTsx = await read('./frontend/version-2-app/src/App.tsx');
assert.ok(!appTsx.includes('basename='), 'the app is single-route; it should have no router basename');
assert.ok(!/from ["']react-router/.test(appTsx), 'the app should not import a router');

// 1a. The scene plates are public/ files referenced through the base prefix. A hardcoded
//     prefix would break if the app were ever mounted elsewhere.
const art = await read('./frontend/version-2-app/src/lib/art.ts');
assert.ok(art.includes('import.meta.env.BASE_URL'), 'the plate paths should go through import.meta.env.BASE_URL');
assert.ok(!/["'`]\/generated-/.test(art), 'a plate path is hardcoded root-absolute; use the base prefix');
for (const plate of art.matchAll(/(?:generated-[\d]+-[0-9a-f]+|plate-[a-z0-9-]+)\.png/g)) {
  assert.ok(
    exists(`./frontend/version-2-app/public/${plate[0]}`),
    `the plate ${plate[0]} is referenced but not committed under frontend/version-2-app/public`,
  );
}

// 2. The build wiring: a script that installs the app's own lockfile, builds it, and
//    performs the two-document swap, chained from the frontend build.
assert.ok(exists('./scripts/build-home-app.mjs'), 'scripts/build-home-app.mjs should exist');
assert.ok(exists('./frontend/version-2-app/pnpm-lock.yaml'), 'the app keeps its own lockfile');
assert.ok(exists('./frontend/index.html'), 'the site shell document should exist to be moved aside');
const frontendPkg = JSON.parse(await read('./frontend/package.json'));
assert.ok(
  frontendPkg.scripts.build.includes('build-home-app.mjs'),
  'the frontend build should chain build-home-app.mjs',
);

// 2a. The swap itself: the shell is moved to shell/index.html and the journey is copied
//     over index.html. If either half goes missing, `/` and `/shell/index.html` swap
//     identities and the whole routing scheme inverts.
const buildScript = await read('./scripts/build-home-app.mjs');
assert.match(buildScript, /rename\(shellHtml, `\$\{shellTarget\}\/index\.html`\)/, 'the build should move the shell to shell/index.html');
assert.match(buildScript, /cp\(`\$\{built\}\/index\.html`, shellHtml\)/, 'the build should copy the journey over index.html');

// 3. Routing parity: `/` is the journey (no rule needed — the file is the homepage), the
//    shell is reachable only at /shell/index.html, and the retired /version-2 path
//    permanently redirects home. Checked in vercel.json and the Caddyfile alike.
const vercel = JSON.parse(await read('./vercel.json'));
const rewrites = vercel.rewrites.map((r) => r.source);
assert.ok(
  !rewrites.includes('/version-2') && !rewrites.includes('/version-2/'),
  'vercel.json should no longer rewrite /version-2 — it is a redirect now',
);
const catchAll = rewrites.indexOf('/((?!.*\\.html$).*)');
assert.ok(catchAll >= 0, 'vercel.json should keep the SPA catch-all');
assert.equal(
  vercel.rewrites[catchAll].destination,
  '/shell/index.html',
  'the SPA catch-all should serve the shell from /shell/index.html',
);
const redirects = new Map(vercel.redirects.map((r) => [r.source, r]));
for (const source of ['/version-2', '/version-2/']) {
  const rule = redirects.get(source);
  assert.ok(rule, `vercel.json should redirect ${source}`);
  assert.equal(rule.destination, '/', `${source} should redirect to the homepage`);
  assert.equal(rule.permanent, true, `${source} should be a permanent redirect`);
}
assert.ok(
  !vercel.rewrites.some((r) => r.destination === '/index.html'),
  'no rewrite should target /index.html — that path is the homepage document itself',
);

const caddy = await read('./deploy/gravebuster/Caddyfile');
assert.match(
  caddy,
  /@version2Legacy path \/version-2 \/version-2\/\n\s*redir @version2Legacy \/ 308/,
  'Caddyfile should mirror the /version-2 permanent redirect home',
);
assert.match(
  caddy,
  /handle \{\n\s*rewrite \* \/shell\/index\.html/,
  'the Caddy SPA fallback should serve the shell from /shell/index.html',
);
assert.match(
  caddy,
  /respond "\{file\.\/srv\/shell\/index\.html\}" 200/,
  'the Caddy Open Graph error fallback should read the shell from /srv/shell/index.html',
);

// 3a. The server-side consumer that reads the shell by path must agree with the swap.
const shareHtml = await read('./backend/src/og/blogShareHtml.ts');
assert.ok(
  shareHtml.includes("new URL('/shell/index.html', origin)"),
  'the Open Graph crawler HTML should read the shell from /shell/index.html',
);

// 4. The deploy smoke test exercises the swap: `/` must be the journey and not the shell,
//    the shell must be reachable at its own path, a journey scene plate must resolve at
//    the site root, and /version-2 must now be the 308 it became.
const deploy = await read('./deploy/gravebuster/deploy.sh');
assert.match(deploy, /check 200 \/shell\/index\.html\b/, 'deploy.sh should smoke-check /shell/index.html');
assert.match(deploy, /check 308 \/version-2\b/, 'deploy.sh should smoke-check the /version-2 redirect');
assert.match(deploy, /check 200 \/(?:generated-[\d]+-[0-9a-f]+|plate-[a-z0-9-]+)\.png/, 'deploy.sh should smoke-check a scene plate at the root');
assert.match(deploy, /body_lacks \/ "Fullstack Design Engineer"/, 'deploy.sh should assert / is not the shell');
assert.match(deploy, /body_has \/shell\/index\.html "Fullstack Design Engineer"/, 'deploy.sh should assert the shell is the shell');
assert.ok(!/check 200 \/version-2\b/.test(deploy), 'deploy.sh should no longer expect /version-2 to serve a page');

// 5. The app is its own eslint project (like frontend/ire-app), so the root lint does not
//    walk it with the site's config.
const eslint = await read('./eslint.config.mjs');
assert.ok(eslint.includes("'frontend/version-2-app/**'"), 'the root eslint config should ignore the app');

console.log('homepage (cinematic journey at /) static checks passed.');
