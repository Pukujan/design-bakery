#!/usr/bin/env node
// Runs after `vite build`. Refreshes the IRE page's saved feed copy inside the build
// output (frontend/dist/ire/today.saved.json) from the live daily feed, so the
// fallback the page shows when the live fetch fails is as fresh as the deploy.
//
// Best effort by design: on any network or validation problem the committed copy
// (frontend/public/ire/today.saved.json, copied into dist by Vite) stays in place and
// the build continues. Never writes to the source tree, so deploy checkouts stay clean.
// Set IRE_FEED_REFRESH=0 to skip (offline builds).
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const FEED_URL =
  'https://raw.githubusercontent.com/Pukujan/inference-recommendation-engine/data/ire-feed/feed/v1/today.json';
const target = new URL('../frontend/dist/ire/today.saved.json', import.meta.url);
const TIMEOUT_MS = 10_000;

function isFeed(d) {
  return (
    d &&
    typeof d === 'object' &&
    typeof d.schema_version === 'string' &&
    d.schema_version.startsWith('ire-feed/v1') &&
    typeof d.generated_at === 'string' &&
    typeof d.stale_after === 'string' &&
    Array.isArray(d.tiers?.cheap?.entries) &&
    Array.isArray(d.tiers?.frontier?.entries) &&
    d.tiers.cheap.entries.length > 0
  );
}

async function main() {
  if (process.env.IRE_FEED_REFRESH === '0') {
    console.log('[ire-feed] refresh skipped (IRE_FEED_REFRESH=0); keeping the committed saved copy.');
    return;
  }
  if (!existsSync(target)) {
    console.warn('[ire-feed] dist/ire/today.saved.json not found; is the build output missing?');
    return;
  }
  const committed = JSON.parse(await readFile(target, 'utf8'));
  try {
    const res = await fetch(FEED_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const live = await res.json();
    if (!isFeed(live)) throw new Error('response does not look like an ire-feed/v1 document');
    if (Date.parse(live.generated_at) < Date.parse(committed.generated_at)) {
      console.log('[ire-feed] live feed is older than the committed copy; keeping the committed copy.');
      return;
    }
    await writeFile(target, `${JSON.stringify(live, null, 1)}\n`);
    console.log(`[ire-feed] saved copy refreshed (generated_at ${live.generated_at}).`);
  } catch (err) {
    console.warn(`[ire-feed] could not refresh the saved copy (${err.message}); keeping the committed copy from ${committed.generated_at}.`);
  }
}

main().catch((err) => {
  console.warn(`[ire-feed] unexpected error, build continues: ${err.message}`);
});
