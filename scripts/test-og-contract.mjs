#!/usr/bin/env node
/**
 * `blogSocialMeta.ts` exists twice, byte-identical:
 *
 *   frontend/src/og/blogSocialMeta.ts    (browser, imported via the `@og` alias)
 *   backend/src/og/blogSocialMeta.ts     (the link-preview router)
 *
 * The backend's tsconfig `rootDir: src` is why it is a copy and not a shared import.
 * A copy that drifts means the browser and the crawler-facing HTML emit different
 * Open Graph tags for the same page — invisible in the browser, and exactly the class
 * of bug the duplication invites.
 *
 * The backend also carries a two-value subset of `frontend/src/app/seo/siteSeoDefaults.ts`;
 * those values are checked against the frontend originals for the same reason.
 *
 * No network, no build; runs in CI.
 *
 *   node scripts/test-og-contract.mjs
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');

const FRONTEND_SOCIAL_META = './frontend/src/og/blogSocialMeta.ts';
const BACKEND_SOCIAL_META = './backend/src/og/blogSocialMeta.ts';

const frontendSocialMeta = await read(FRONTEND_SOCIAL_META);
const backendSocialMeta = await read(BACKEND_SOCIAL_META);

/** First line that differs, so a drift report names the line instead of the file. */
function firstDifference(a, b) {
  const aLines = a.split('\n');
  const bLines = b.split('\n');
  const max = Math.max(aLines.length, bLines.length);
  for (let i = 0; i < max; i += 1) {
    if (aLines[i] !== bLines[i]) {
      return `line ${i + 1}: backend ${JSON.stringify(bLines[i] ?? '<eof>')} vs frontend ${JSON.stringify(aLines[i] ?? '<eof>')}`;
    }
  }
  return 'no differing line (trailing bytes differ)';
}

assert.equal(
  backendSocialMeta,
  frontendSocialMeta,
  `${BACKEND_SOCIAL_META} has drifted from ${FRONTEND_SOCIAL_META} ` +
    `(${firstDifference(frontendSocialMeta, backendSocialMeta)}). They are meant to be ` +
    'byte-identical, line endings included — copy the frontend file over the backend one.',
);

// The constants the backend's og modules read out of its local siteSeoDefaults.
function exportedConst(source, name) {
  const m = source.match(new RegExp(`export const ${name}\\s*=\\s*'([^']*)'`));
  assert.ok(m, `could not find an exported string const ${name}`);
  return m[1];
}

const frontendDefaults = await read('./frontend/src/app/seo/siteSeoDefaults.ts');
const backendDefaults = await read('./backend/src/og/siteSeoDefaults.ts');

for (const name of ['SITE_NAME', 'DEFAULT_OG_IMAGE_PATH']) {
  assert.equal(
    exportedConst(backendDefaults, name),
    exportedConst(frontendDefaults, name),
    `backend/src/og/siteSeoDefaults.ts ${name} has drifted from the frontend value`,
  );
}

console.log('og-contract: blogSocialMeta.ts copies match, site defaults match');
