#!/usr/bin/env node
/**
 * Agent publishing API — payload validation checks.
 *
 * Runs against the compiled services module, so build first:
 *   pnpm --dir backend/services run build
 *   pnpm --dir backend/services run test:agent-posts
 *
 * No network and no Supabase: this covers only the pure validator.
 */
import { validateAgentPostPayload, AGENT_POST_MAX_CONTENT_BYTES } from '../lib/content/agentPostPayload.js';

let failures = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`ok   ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${name}`);
    console.error(`     ${error instanceof Error ? error.message : String(error)}`);
  }
}

function validBody(overrides = {}) {
  return {
    title: 'Measuring figure pipeline drift',
    excerpt: 'A short summary.',
    date: '2026-10-06',
    readTime: 7,
    tags: ['research', 'tooling'],
    category: 'ai-ml',
    color: '#4F46E5',
    author: 'design-bakery agent',
    content: '## Intro\n\nSee ![loss](/research/figures/loss.png).',
    coverImageUrl: '/research/figures/cover.png',
    seo: {},
    ...overrides,
  };
}

function expectOk(name, body) {
  check(name, () => {
    validateAgentPostPayload(body);
  });
}

function expectFail(name, body, needle) {
  check(name, () => {
    let threw = false;
    try {
      validateAgentPostPayload(body);
    } catch (error) {
      threw = true;
      const message = error instanceof Error ? error.message : String(error);
      if (needle && !message.includes(needle)) {
        throw new Error(`expected message to contain "${needle}", got "${message}"`, { cause: error });
      }
    }
    if (!threw) throw new Error('expected validation to throw, but it passed');
  });
}

// ── accepted ──────────────────────────────────────────────────────────────
expectOk('full payload', validBody());
expectOk('publishedAt null (draft)', validBody({ publishedAt: null }));
expectOk('publishedAt ISO', validBody({ publishedAt: '2026-10-06T12:00:00Z' }));
expectOk('optional fields omitted', validBody({ color: undefined, coverImageUrl: undefined, seo: undefined }));
expectOk('tags empty array', validBody({ tags: [] }));
expectOk('content at the size limit', validBody({ content: 'x'.repeat(AGENT_POST_MAX_CONTENT_BYTES) }));
expectOk('relative seo image path', validBody({ seo: { ogImageUrl: '/research/figures/cover.png' } }));

check('normalizes publishedAt null', () => {
  const out = validateAgentPostPayload(validBody({ publishedAt: null }));
  if (out.publishedAt !== null) throw new Error(`expected null, got ${JSON.stringify(out.publishedAt)}`);
});

check('normalizes readTime to a number', () => {
  const out = validateAgentPostPayload(validBody({ readTime: 7 }));
  if (out.readTime !== 7) throw new Error(`expected 7, got ${JSON.stringify(out.readTime)}`);
});

// ── rejected ──────────────────────────────────────────────────────────────
expectFail('body is not an object', 'not an object', 'JSON object');
expectFail('body is an array', [], 'JSON object');
expectFail('missing title', validBody({ title: undefined }), 'title');
expectFail('blank title', validBody({ title: '   ' }), 'title');
expectFail('missing excerpt', validBody({ excerpt: undefined }), 'excerpt');
expectFail('missing author', validBody({ author: undefined }), 'author');
expectFail('missing category', validBody({ category: undefined }), 'category');
expectFail('missing content', validBody({ content: undefined }), 'content');
expectFail('NUL in content', validBody({ content: 'before\u0000after' }), 'NUL');
expectFail('content over the limit', validBody({ content: 'x'.repeat(AGENT_POST_MAX_CONTENT_BYTES + 1) }), 'at most');
expectFail('bad date', validBody({ date: '06-10-2026' }), 'ISO date');
expectFail('readTime zero', validBody({ readTime: 0 }), 'positive integer');
expectFail('readTime fractional', validBody({ readTime: 1.5 }), 'positive integer');
expectFail('readTime as string', validBody({ readTime: '7' }), 'positive integer');
expectFail('tags not an array', validBody({ tags: 'research' }), 'array of strings');
expectFail('tags with a non-string', validBody({ tags: ['ok', 3] }), 'array of strings');
expectFail('seo not an object', validBody({ seo: 'nope' }), 'object');
expectFail('absolute seo image URL', validBody({ seo: { ogImageUrl: 'https://evil.example/x.png' } }), 'site-relative');
expectFail('absolute seo ogImage URL', validBody({ seo: { ogImage: 'http://127.0.0.1/x.png' } }), 'site-relative');
expectFail('color not hex', validBody({ color: 'rebeccapurple' }), 'hex color');
expectFail('unknown top-level field', validBody({ slug: 'nope' }), 'Unknown field');
expectFail('bad publishedAt', validBody({ publishedAt: 'yesterday' }), 'publishedAt');

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll agent post validation checks passed.');
