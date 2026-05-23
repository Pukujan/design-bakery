#!/usr/bin/env node
/**
 * Copy Firestore CMS + blog_posts into Supabase Postgres.
 *
 * Prerequisites:
 *   1. Run supabase/migrations/001_initial.sql in Supabase SQL Editor
 *   2. backend/.env — GOOGLE_APPLICATION_CREDENTIALS_PATH, SUPABASE_*, CONTENT_BACKEND=supabase
 *
 * Usage:
 *   pnpm run migrate:firestore-to-supabase              # migrate all
 *   pnpm run migrate:firestore-to-supabase -- --dry-run # preview only
 *   pnpm run migrate:firestore-to-supabase -- --blogs-only
 *   pnpm run migrate:firestore-to-supabase -- --cms-only
 */

import { loadBackendEnv } from '../load-backend-env.mjs';
import { ensureFirebaseAdminApp, adminFirestore } from '../../archive/firebase/firebaseApp.ts';
import { upsertBlogPost, type BlogPostDto } from '../../backend/services/src/content/blogPosts.ts';
import { setCmsArray, setCmsObject } from '../../backend/services/src/content/cmsDocuments.ts';
import {
  isSupabaseConfigured,
  supabaseAdmin,
} from '../../backend/services/src/supabaseClient.ts';

const SKIP_COLLECTIONS = new Set(['blog_posts', 'agent_usage', 'agent_audit']);

type Flags = {
  dryRun: boolean;
  blogsOnly: boolean;
  cmsOnly: boolean;
  verbose: boolean;
};

function parseArgs(argv: string[]): Flags {
  const flags: Flags = { dryRun: false, blogsOnly: false, cmsOnly: false, verbose: false };
  for (const arg of argv) {
    if (arg === '--') continue;
    if (arg === '--dry-run') flags.dryRun = true;
    else if (arg === '--blogs-only') flags.blogsOnly = true;
    else if (arg === '--cms-only') flags.cmsOnly = true;
    else if (arg === '--verbose' || arg === '-v') flags.verbose = true;
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: migrate-firestore-to-supabase [--dry-run] [--blogs-only] [--cms-only] [-v]`);
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  if (flags.blogsOnly && flags.cmsOnly) {
    console.error('Use --blogs-only or --cms-only, not both.');
    process.exit(1);
  }
  return flags;
}

function step(title: string) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 56 - title.length))}`);
}

function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
}

function warn(msg: string) {
  console.warn(`  ! ${msg}`);
}

function resolveNumericId(data: Record<string, unknown>, fallback: number): number {
  const raw = data.numericId ?? data.id;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) return parseInt(raw.trim(), 10);
  return fallback;
}

function firestoreBlogToDto(docId: string, raw: Record<string, unknown>, numericFallback: number): BlogPostDto {
  const tags = raw.tags;
  return {
    id: docId,
    numericId: resolveNumericId(raw, numericFallback),
    title: String(raw.title ?? ''),
    excerpt: String(raw.excerpt ?? ''),
    date: String(raw.date ?? ''),
    readTime: String(raw.readTime ?? raw.read_time ?? ''),
    tags: Array.isArray(tags) ? tags.map(String) : [],
    category: String(raw.category ?? ''),
    color: String(raw.color ?? ''),
    author: String(raw.author ?? ''),
    content: String(raw.content ?? ''),
    coverImageUrl: typeof raw.coverImageUrl === 'string' ? raw.coverImageUrl : undefined,
    thumbnailImageUrl: typeof raw.thumbnailImageUrl === 'string' ? raw.thumbnailImageUrl : undefined,
    seo: raw.seo && typeof raw.seo === 'object' ? (raw.seo as Record<string, unknown>) : undefined,
  };
}

function hasMeaningfulPayload(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number' || typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some(hasMeaningfulPayload);
  }
  return false;
}

async function assertSupabaseTables(): Promise<void> {
  const sb = supabaseAdmin();
  for (const table of ['blog_posts', 'cms_documents'] as const) {
    const { error } = await sb.from(table).select('*').limit(1);
    if (error?.message?.includes('Could not find the table')) {
      throw new Error(
        `Postgres table "${table}" is missing. Run supabase/migrations/001_initial.sql in Supabase SQL Editor first.`,
      );
    }
    if (error) throw new Error(`Supabase check failed (${table}): ${error.message}`);
  }
}

async function migrateBlogs(dryRun: boolean, verbose: boolean): Promise<{ migrated: number; skipped: number }> {
  const db = adminFirestore();
  const snap = await db.collection('blog_posts').get();

  let migrated = 0;
  let skipped = 0;
  let fallbackId = 1;

  const docs = [...snap.docs].sort((a, b) => {
    const na = resolveNumericId(a.data() as Record<string, unknown>, 0);
    const nb = resolveNumericId(b.data() as Record<string, unknown>, 0);
    return na - nb;
  });

  for (const docSnap of docs) {
    const raw = docSnap.data() as Record<string, unknown>;
    const dto = firestoreBlogToDto(docSnap.id, raw, fallbackId);
    fallbackId = Math.max(fallbackId, dto.numericId ?? 0) + 1;

    if (!dto.title.trim() && !dto.content.trim()) {
      skipped += 1;
      if (verbose) warn(`blog_posts/${docSnap.id} — empty, skipped`);
      continue;
    }

    if (dryRun) {
      ok(`blog ${dto.numericId} "${dto.title.slice(0, 48)}" ← ${docSnap.id}`);
      migrated += 1;
      continue;
    }

    await upsertBlogPost(dto);
    ok(`blog ${dto.numericId} "${dto.title.slice(0, 48)}" ← ${docSnap.id}`);
    migrated += 1;
  }

  if (snap.empty) warn('No documents in Firestore blog_posts.');
  return { migrated, skipped };
}

async function migrateCms(dryRun: boolean, verbose: boolean): Promise<{ migrated: number; skipped: number }> {
  const db = adminFirestore();
  const collections = await db.listCollections();

  let migrated = 0;
  let skipped = 0;

  for (const col of collections.sort((a, b) => a.id.localeCompare(b.id))) {
    const name = col.id;
    if (SKIP_COLLECTIONS.has(name)) {
      if (verbose) warn(`${name} — skipped (handled separately or Phase 4)`);
      continue;
    }

    const dataSnap = await col.doc('data').get();
    if (!dataSnap.exists) {
      skipped += 1;
      if (verbose) warn(`${name}/data — missing, skipped`);
      continue;
    }

    const payload = dataSnap.data() as Record<string, unknown> | undefined;
    if (!payload || !hasMeaningfulPayload(payload)) {
      skipped += 1;
      if (verbose) warn(`${name}/data — empty, skipped`);
      continue;
    }

    const items = payload.items;
    if (Array.isArray(items)) {
      if (dryRun) {
        ok(`${name} — array (${items.length} items)`);
      } else {
        await setCmsArray(name, items);
        ok(`${name} — array (${items.length} items)`);
      }
      migrated += 1;
      continue;
    }

    const { item: _i, items: _a, ...legacy } = payload;
    const objectPayload =
      payload.item !== undefined && payload.item !== null
        ? payload.item
        : Object.keys(legacy).length > 0
          ? legacy
          : null;

    if (!hasMeaningfulPayload(objectPayload)) {
      skipped += 1;
      if (verbose) warn(`${name}/data — no item/items, skipped`);
      continue;
    }

    if (dryRun) {
      ok(`${name} — object`);
    } else {
      await setCmsObject(name, objectPayload);
      ok(`${name} — object`);
    }
    migrated += 1;
  }

  return { migrated, skipped };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  loadBackendEnv();

  console.log('Firestore → Supabase Postgres migration');
  if (flags.dryRun) console.log('(dry run — no writes)');

  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  }

  ensureFirebaseAdminApp();
  await assertSupabaseTables();

  const migrateBlogsFlag = !flags.cmsOnly;
  const migrateCmsFlag = !flags.blogsOnly;

  let blogStats = { migrated: 0, skipped: 0 };
  let cmsStats = { migrated: 0, skipped: 0 };

  if (migrateBlogsFlag) {
    step('Blog posts');
    blogStats = await migrateBlogs(flags.dryRun, flags.verbose);
  }

  if (migrateCmsFlag) {
    step('CMS documents');
    cmsStats = await migrateCms(flags.dryRun, flags.verbose);
  }

  step('Summary');
  if (migrateBlogsFlag) {
    console.log(`  Blogs:  ${blogStats.migrated} migrated, ${blogStats.skipped} skipped`);
  }
  if (migrateCmsFlag) {
    console.log(`  CMS:    ${cmsStats.migrated} migrated, ${cmsStats.skipped} skipped`);
  }

  if (flags.dryRun) {
    console.log('\nRe-run without --dry-run to write to Supabase.');
  } else {
    console.log('\nDone. Set CONTENT_BACKEND=supabase and VITE_CONTENT_BACKEND=supabase, then restart dev:stack.');
  }
}

main().catch((error) => {
  console.error('\nMigration failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
