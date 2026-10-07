#!/usr/bin/env node
/**
 * The Open Graph link-preview routing is written twice, in two languages:
 *
 *   deploy/gravebuster/Caddyfile          `@ogPreview` / `@ogShellFallback` (RE2)
 *   backend/src/api/ogPreview.ts          the Express router (JavaScript regexes)
 *
 * Nothing but this test stops them drifting, and a drift is silent: a path Caddy
 * routes to the API that the router does not recognise, or a path Caddy stops
 * routing at all, shows up only as a link that previews as the generic homepage.
 * Both failure modes shipped once already (issue #80, Step E).
 *
 * The table below is the contract. It is checked against the regexes parsed out of
 * both files, so a change to either has to be reflected in the other. No network,
 * no server; runs in CI.
 *
 *   node scripts/test-og-routing.mjs
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url);
const read = (p) => readFile(new URL(p, root), 'utf8');

// --- the Caddy matchers ---------------------------------------------------------

const caddyfile = await read('./deploy/gravebuster/Caddyfile');

function caddyMatcher(name) {
  const m = caddyfile.match(new RegExp(`^\\s*@${name}\\s+path_regexp\\s+(\\S+)\\s*$`, 'm'));
  assert.ok(m, `Caddyfile: no '@${name} path_regexp <pattern>' line`);
  return m[1];
}

const ogPreviewPattern = caddyMatcher('ogPreview');
const ogShellFallbackPattern = caddyMatcher('ogShellFallback');

// The fallback that degrades to the SPA shell when the API is down has to cover
// exactly the paths that can 502, i.e. exactly the ones proxied above.
assert.equal(
  ogShellFallbackPattern,
  ogPreviewPattern,
  '@ogShellFallback must match the same paths as @ogPreview',
);

const OG_PREVIEW_RE = new RegExp(ogPreviewPattern);

// --- the Express matchers -------------------------------------------------------

const routerSource = await read('./backend/src/api/ogPreview.ts');

// Evaluated rather than re-parsed: the declarations are `new RegExp` over template
// literals, so their `\d` and `${PORTFOLIO_PREFIX}` escapes only resolve when the
// source is actually run. This is the repo's own file, not input.
const declarationBlock = routerSource.match(
  /const PORTFOLIO_PREFIX =[\s\S]*?const OG_PREFIX_RE = [^\n]*;/,
);
assert.ok(declarationBlock, 'ogPreview.ts: could not find the path regex declarations');

const buildMatchers = new Function(
  `${declarationBlock[0]}
   return { BLOG_DETAIL_RE, BLOG_LIST_RE, CASE_STUDY_RE, OG_PREFIX_RE };`,
);
const { BLOG_DETAIL_RE, BLOG_LIST_RE, CASE_STUDY_RE, OG_PREFIX_RE } = buildMatchers();

assert.ok(BLOG_DETAIL_RE instanceof RegExp, 'ogPreview.ts: BLOG_DETAIL_RE is not a RegExp');

// Mirrors the router's branch order in ogPreviewRouter.use().
function classifyExpress(pathname) {
  if (/\.html$/i.test(pathname)) return 'none';
  if (BLOG_DETAIL_RE.test(pathname)) return 'detail';
  if (BLOG_LIST_RE.test(pathname)) return 'list';
  if (CASE_STUDY_RE.test(pathname)) return 'case-study';
  if (OG_PREFIX_RE.test(pathname)) return 'shell';
  return 'none';
}

// `@ogPreview` sits after the `.html` 404 handler, so a `.html` path never reaches
// the API however the regex reads.
function caddyRoutes(pathname) {
  return !/\.html$/i.test(pathname) && OG_PREVIEW_RE.test(pathname);
}

// --- the contract ---------------------------------------------------------------

/** `express` is what the router must classify the path as *when it is reached*. */
const CASES = [
  // Blog list and detail, bare and behind each portfolio prefix.
  ['/blogs', true, 'list'],
  ['/blogs/', true, 'list'],
  ['/blogs/1', true, 'detail'],
  ['/blogs/1/', true, 'detail'],
  ['/blogs/1234', true, 'detail'],
  ['/endtoend-engineer/blogs', true, 'list'],
  ['/endtoend-engineer/blogs/', true, 'list'],
  ['/endtoend-engineer/blogs/7', true, 'detail'],
  ['/legal-workflow-engineer/blogs', true, 'list'],
  ['/legal-workflow-engineer/blogs/7/', true, 'detail'],
  ['/ai-engineer/blogs', true, 'list'],
  ['/ai-engineer/blogs/7', true, 'detail'],
  ['/forward-deployed-engineer/blogs', true, 'list'],
  ['/forward-deployed-engineer/blogs/7', true, 'detail'],

  // Case studies. The static ones are served from disk before the API sees them,
  // but they are still inside the matcher and must classify as case studies.
  ['/case-studies/ekagajpatra', true, 'case-study'],
  ['/case-studies/invest-ai', true, 'case-study'],
  ['/case-studies/ai-agents/v4', true, 'case-study'],
  ['/case-studies/legal-workflow-research/', true, 'case-study'],
  ['/case-studies/study-os', true, 'case-study'],
  ['/case-studies/fossil', true, 'case-study'],
  ['/case-studies/fluffy-v4', true, 'case-study'],
  ['/case-studies/cortex', true, 'case-study'],
  ['/case-studies/cortex/a', true, 'case-study'],

  // Not routed: no file, no blog, no case study. The SPA fallback owns these.
  ['/', false, 'none'],
  ['/about', false, 'none'],
  ['/blog', false, 'none'],
  ['/blogsomething', false, 'none'],
  ['/case-studies', false, 'none'],
  ['/endtoend-engineer', false, 'none'],
  ['/images/site-og.png', false, 'none'],
  ['/assets/index-abc123.js', false, 'none'],
  ['/index.html', false, 'none'],

  // `.html` is a 404 before either matcher runs.
  ['/case-studies/foo.html', false, 'none'],
  ['/blogs/1.html', false, 'none'],

  // A non-numeric post id is not a detail route and not a list route, but it is
  // still under the prefix — so the router must serve the shell, not 404. Caddy
  // never routes it (the regex requires digits), which is why the two columns
  // disagree here on purpose.
  ['/blogs/abc', false, 'shell'],
  ['/blogs/1/extra', false, 'shell'],
];

for (const [pathname, caddyExpected, expressExpected] of CASES) {
  assert.equal(
    caddyRoutes(pathname),
    caddyExpected,
    `Caddy @ogPreview should${caddyExpected ? '' : ' not'} route ${pathname}`,
  );
  assert.equal(
    classifyExpress(pathname),
    expressExpected,
    `Express router should classify ${pathname} as '${expressExpected}'`,
  );
  if (caddyExpected) {
    assert.notEqual(
      classifyExpress(pathname),
      'none',
      `${pathname} is proxied to the API, so the router must handle it`,
    );
  }
}

console.log(`og-routing: ${CASES.length} paths agree (Caddy @ogPreview ⇄ backend router)`);
