#!/usr/bin/env node
/**
 * Debug publish-kit Storage upload without the admin UI.
 *
 * Run from repo root:  pnpm run test:publish-kit-upload
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const servicesDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(servicesDir, '..');

function parseArgs(argv) {
  let blogId = 99999;
  let useEmulator = false;
  for (const arg of argv) {
    if (arg === '--emulator') useEmulator = true;
    else if (arg.startsWith('--blog-id=')) blogId = Number(arg.slice('--blog-id='.length));
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: test-publish-kit-upload [--blog-id=N] [--emulator]`);
      process.exit(0);
    }
  }
  return { blogId, useEmulator };
}

function step(title) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 52 - title.length))}`);
}

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

function fail(msg) {
  console.error(`  ✗ ${msg}`);
}

async function loadEnv() {
  const { loadRootEnv } = await import('../../../scripts/load-root-env.mjs');
  loadRootEnv();
}

const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

async function readFirebaseProjectId() {
  try {
    const rc = JSON.parse(readFileSync(resolve(root, 'archive/firebase/.firebaserc'), 'utf8'));
    return rc.projects?.default ?? 'auth-system-be464';
  } catch {
    return 'auth-system-be464';
  }
}

async function main() {
  const { blogId, useEmulator } = parseArgs(process.argv.slice(2));

  console.log('Publish kit upload debug');
  console.log(`  blog numericId: ${blogId}`);
  console.log(`  emulator HTTP:  ${useEmulator ? 'yes' : 'no'}`);

  await loadEnv();

  step('Build');
  const build = spawnSync('npm', ['run', 'build'], { cwd: servicesDir, stdio: 'inherit' });
  if (build.status !== 0) process.exit(build.status ?? 1);
  ok('tsc OK');

  const { resolveImageStorageBackend, isSupabaseStorageConfigured } = await import('../lib/supabaseClient.js');
  const { ensureFirebaseAdminApp, resolveStorageBucket } = await import('../lib/firebaseApp.js');
  const { uploadBlogImage } = await import('../lib/blog/publishKit/storage.js');
  const { commitVisualImages } = await import('../lib/blog/publishKit/commitVisual.js');

  step('Environment');
  const storageBackend = resolveImageStorageBackend();
  console.log(`  image storage: ${storageBackend}`);
  if (storageBackend === 'supabase') {
    console.log(`  supabase bucket: ${process.env.SUPABASE_STORAGE_BUCKET ?? '(unset)'}`);
    console.log(`  supabase url: ${process.env.SUPABASE_URL ?? '(unset)'}`);
  } else {
    console.log(`  firebase bucket: ${resolveStorageBucket()}`);
  }
  console.log(`  PUBLISH_KIT_SKIP_PRODUCTION_STORAGE: ${process.env.PUBLISH_KIT_SKIP_PRODUCTION_STORAGE ?? '(unset)'}`);
  console.log(`  FIREBASE_STORAGE_EMULATOR_HOST: ${process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? '(unset)'}`);
  console.log(`  FIREBASE_EMULATOR_HUB: ${process.env.FIREBASE_EMULATOR_HUB ?? '(unset)'}`);

  if (storageBackend === 'supabase') {
    if (!isSupabaseStorageConfigured()) {
      fail('Supabase Storage env missing. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET in backend/.env');
      process.exit(1);
    }
    ok('supabase configured');
  } else {
    ensureFirebaseAdminApp();
    ok('firebase-admin initialized');
  }

  let passed = 0;
  let failed = 0;

  step('Inter fonts (publishKit/fonts.ts)');
  try {
    const { interFontFaceDefs, ensurePublishKitFontconfig } = await import('../lib/blog/publishKit/fonts.js');
    ensurePublishKitFontconfig();
    const defs = interFontFaceDefs();
    if (!defs.includes('base64') || defs.length < 1000) {
      throw new Error('font face defs missing embedded WOFF data');
    }
    if (!process.env.FONTCONFIG_PATH?.includes('inter-fonts')) {
      throw new Error('fontconfig not registered for Inter');
    }
    ok('Inter WOFF + fontconfig registered for sharp/SVG renders');
    passed++;
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
    failed++;
  }

  step('Direct uploadBlogImage (og)');
  try {
    const png = Buffer.from(TINY_PNG_BASE64, 'base64');
    const result = await uploadBlogImage({ numericId: blogId, kind: 'og', png });
    if (!result?.url || result.url.startsWith('data:')) {
      fail(result ? `bad url: ${result.url.slice(0, 80)}` : 'returned null');
      failed++;
    } else {
      ok(`url: ${result.url}`);
      passed++;
    }
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
    failed++;
  }

  const ogDataUrl = `data:image/png;base64,${TINY_PNG_BASE64}`;

  step('commitVisualImages');
  try {
    const urls = await commitVisualImages({
      numericId: blogId,
      ogPreviewDataUrl: ogDataUrl,
      coverPreviewDataUrl: ogDataUrl,
      sameImageForCoverAndOg: true,
    });
    if (urls.ogImageUrl?.startsWith('data:') || !urls.ogImageUrl?.startsWith('http')) {
      fail('non-storable URLs');
      console.log('  ', urls);
      failed++;
    } else {
      ok(`og: ${urls.ogImageUrl}`);
      ok(`cover: ${urls.coverImageUrl}`);
      ok(`thumb: ${urls.thumbnailImageUrl}`);
      passed++;
    }
  } catch (err) {
    fail(err instanceof Error ? err.message : String(err));
    failed++;
  }

  if (useEmulator) {
    step('Emulator HTTP commit_visual');
    const project = await readFirebaseProjectId();
    const url = `http://127.0.0.1:5001/${project}/us-central1/invokeBlogPublishKit`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            version: 1,
            action: 'commit_visual',
            blogId,
            blogSnapshot: { title: 'Test', excerpt: 'e', content: 'c', numericId: blogId },
            visualCommit: {
              ogPreviewDataUrl: ogDataUrl,
              coverPreviewDataUrl: ogDataUrl,
              sameImageForCoverAndOg: true,
            },
          },
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        fail(`HTTP ${res.status}: ${text.slice(0, 300)}`);
        failed++;
      } else {
        const json = JSON.parse(text);
        const og = json.result?.visual?.ogImageUrl ?? '';
        if (og.startsWith('http') && !og.startsWith('data:')) {
          ok(`emulator og: ${og}`);
          passed++;
        } else {
          fail('emulator returned data: or empty (callable may need admin auth token)');
          console.log('  ', text.slice(0, 400));
          failed++;
        }
      }
    } catch (err) {
      fail(`${err instanceof Error ? err.message : String(err)} — run pnpm run dev`);
      failed++;
    }
  }

  console.log(`\n══ passed ${passed}  failed ${failed} ══`);
  if (failed > 0) {
    console.log('\nTips:');
    console.log('  • Bucket missing? Set FIREBASE_STORAGE_BUCKET in backend/.env.');
    console.log('  • Credentials? Run: gcloud auth application-default login');
    console.log('  • Or test via emulator: pnpm run dev  then  pnpm run test:publish-kit-upload:emulator');
    console.log('  • Browser path: sign in to admin + firebase deploy --only storage');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
