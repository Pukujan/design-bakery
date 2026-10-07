# TASK-DB-0077 — Open Graph link previews behind Caddy (issue #80 Step E)

| Field | Value |
|-------|-------|
| **Created** | 2026-10-07 |
| **Issue** | [#80](https://github.com/Pukujan/design-bakery/issues/80) Step E (last code-only Vercel dependency) |
| **Branch** | `task/TASK-DB-0077-og-sidecar` |
| **PR** | [#96](https://github.com/Pukujan/design-bakery/pull/96) — merged `e3e8c3a` |
| **Status** | Done — merged and deployed to gravebuster; OG previews verified live |

## Goal

`middleware.ts` at the repo root is Vercel **Edge** middleware: it rewrites the SPA
shell for `/blogs`, `/blogs/:id`, `/{endtoend|legal-workflow|ai|forward-deployed}-engineer/blogs[/:id]`
and `/case-studies/:path*` with crawler-friendly `<title>` / `og:*` tags drawn from
the blog source, so a link-preview bot sees a real preview instead of the generic
homepage shell. Nothing on gravebuster reproduces it, so retiring the Vercel project
would lose it — it is the one deliberate parity gap recorded in
`docs/self-hosting.md` §2.

Reproduce that logic **inside the existing Express `api` container** (no new sidecar,
no new tunnel hostname, no DNS record, no CORS) and route the paths to it from Caddy.

## Done

- **`backend/src/og/`** — the DOM-free OG modules moved from `frontend/src/og/`:
  `blogShareHtml.ts`, `blogSocialMeta.ts`, `caseStudyShareMeta.ts`,
  `linkPreviewCrawlers.ts`, `resolveSocialPreviewImage.ts`, plus a new
  `siteSeoDefaults.ts`. The frontend keeps only what the browser needs:
  `blogSocialMeta.ts` (a byte-identical copy) and the new `blogSocialMetaClient.ts`
  (the `document` / `import.meta.env` half). `middleware.ts` and the four
  Vercel-only frontend modules are deleted.
- **`backend/src/api/ogPreview.ts`** (new, 306 lines) — a router mounted app-wide
  from `backend/src/server.ts`. It is **total over the paths Caddy sends it**:
  - `BLOG_DETAIL_RE` → fetch the SPA shell, inject the per-post `<title>` / `og:*` /
    `article:*` tags;
  - `BLOG_LIST_RE` → the shell with the blog-list title and description;
  - `CASE_STUDY_RE` → `resolveCaseStudyShareMeta`, else the plain shell;
  - `OG_PREFIX_RE` → the plain shell (the catch-all for anything matching the Caddy
    matcher the three regexes above do not cover);
  - `next()` for everything else, and an early `next()` for `/\.html$/i` so a
    missing `.html` still 404s.
  - Non-GET/HEAD are rejected.
- **`Vary: User-Agent`** on every injected response, plus a single uncacheable
  `OG_CACHE = 'public, max-age=0, must-revalidate'`. One URL now has two bodies
  (crawler vs browser) and Cloudflare's cache ignores `Vary: User-Agent`, so the
  response must not be cached at all — which is what the SPA fallback already did
  for these paths, so nothing cacheable regressed.
- **API-down degradation** — `serveShellOrUnavailable()` returns the SPA shell with
  a real 200 when the shell fetch fails, so a web-only deploy or an API crash-loop
  cannot 502 a working blog page.
- **`deploy/gravebuster/Caddyfile`** — `@ogPreview` (a `path_regexp` matcher
  identical to the router's coverage) + `reverse_proxy api:8787`, placed **after**
  the filesystem handlers and the `.html` 404 so a real file or a static case-study
  directory still wins, and a missing `.html` still 404s. A top-level
  `handle_errors` block degrades those paths to the shell on dial failure (with
  `respond "{file./srv/index.html}" 200` — `handle_errors` keeps the error status,
  and `{file.}` does not resolve against `root`). Scoped by path so `/api/*` errors
  stay errors.
- **`deploy/gravebuster/docker-compose.yml`** — `SITE_URL` on the `api` service
  (canonical URLs and absolute `og:image` links; without it the internal compose
  origin would leak into the tags). `OG_SHELL_ORIGIN` overrides the shell origin
  (default `http://web:80`). Documented in `.env.example`.
- **Two drift tests** wired into CI (`.github/workflows/ci.yml`) and `package.json`:
  - `pnpm test:og-routing` — parses `@ogPreview` / `@ogShellFallback` out of the
    Caddyfile, evaluates the router's own regexes, and checks 36 paths against both.
  - `pnpm test:og-contract` — byte-compares the two `blogSocialMeta.ts` copies and
    compares `SITE_NAME` / `DEFAULT_OG_IMAGE_PATH` across the two `siteSeoDefaults.ts`.
- **`scripts/find-orphans.mjs`** — `EXTRA_ENTRIES` is now empty (`middleware.ts` was
  the only entry).
- **Docs** — `docs/self-hosting.md` §2 row resolved + a new "Link previews (Open
  Graph)" subsection; `deploy/gravebuster/README.md`.

## Evidence

- `pnpm lint` clean; `pnpm run build`, `pnpm --dir frontend run typecheck` and
  `pnpm --dir backend run build` all pass.
- `node scripts/find-orphans.mjs --strict` → "No unexpected orphaned files found" (exit 0).
- `node scripts/test-og-routing.mjs` → "36 paths agree (Caddy @ogPreview ⇄ backend router)".
- `node scripts/test-og-contract.mjs` → "blogSocialMeta.ts copies match, site defaults match".
- The real Caddyfile validates against real Caddy 2.11.7 (`caddy validate`), and the
  adapted JSON shows `handle_errors` lands in the server's `errors` key, not silently
  ignored in `routes`.
- **End-to-end through real Caddy 2.11.7** against a locally-built shell and a
  locally-built API (throwaway octo stub for the data path):
  - `/blogs/1` with a crawler UA → `<title>Confidence-Routed Legal Workflows</title>`
    with the full og/twitter/article tag set;
  - `/blogs` crawler → `<title>Engineering Blog | Design Baker</title>`;
  - `/case-studies/ekagajpatra` → the API (SPA-backed); `/case-studies/study-os` and
    `/case-studies/fossil` → served from disk, never reaching the API;
  - `/case-studies/foo.html` → 404; `/about` → SPA fallback;
  - `/api/public/blogs` → 200 JSON through the proxy;
  - **API stopped** → blog and case-study paths still 200 with the shell, while
    `/api/*` stays 502.

## Deployed (2026-10-07)

Merged as `e3e8c3a` (PR #96) and deployed to gravebuster with
`deploy/gravebuster/deploy.sh --ref origin/main`. The image went from `aab743f` to
`e3e8c3a67f5c`; the smoke test passed (`/healthz`, `/`, `/research/papers/db-r-2026-010`,
`/robots.txt`, 308 `/ai-for-good`, 307 `/studyos`, and `/api/public/blogs` 200 JSON
through the Caddy proxy). Verified on the live hostname with a crawler UA
(`facebookexternalhit/1.1`):

| Path | `<title>` now |
|---|---|
| `/blogs/1` | Building Scalable Form Systems in Next.js |
| `/blogs` | Engineering Blog \| Design Baker |
| `/case-studies/ekagajpatra` | Ekagajpatra Case Study \| Design Baker |
| `/case-studies/invest-ai` | InvestAI Case Study \| Design Baker |
| `/case-studies/ai-agents/v4` | ONI vs Agent-Ready Architecture (v4) \| Design Baker |
| `/case-studies/legal-workflow-research` | Legal Workflow Research: Building Safer AI Systems for Litigation Operations |

Before the deploy, all of these returned the generic shell
`Design Baker | Fullstack Design Engineer & AI Workflow Systems`. `/case-studies/studyos`
still returns the shell — `studyos` is not one of the five known case-study slugs, so
that is the intended unknown-slug behaviour, not a gap. The injected responses carry
`Vary: User-Agent` + `Cache-Control: public, max-age=0, must-revalidate`, and a browser
UA on `/blogs/1` gets the same injected HTML with the `#root` mount for React to hydrate
over — matching the Edge middleware, which rewrote the shell for every request.

## Not verifiable here

Docker Desktop is not running on this machine, so the container path was proven
against the same binaries run directly on the host (real Caddy, the real
`backend/lib/server.js`), not inside the compose stack. The first real container run
was the gravebuster deploy above.

## Scope

- Move the DOM-free OG modules to `backend/src/og/`; keep the frontend copy
  byte-identical and guarded by `test:og-contract`.
- `backend/src/api/ogPreview.ts` + its mount in `backend/src/server.ts`.
- `@ogPreview` + `handle_errors` in `deploy/gravebuster/Caddyfile`.
- `SITE_URL` / `OG_SHELL_ORIGIN` wiring in `docker-compose.yml` + `.env.example`.
- The two drift tests, the CI steps, and `find-orphans.mjs`'s `EXTRA_ENTRIES`.
- `docs/self-hosting.md` §2 + the link-previews subsection; `deploy/gravebuster/README.md`.

## Non-goals

- Deleting the Vercel project (owner-gated; this only removes the *code* dependency).
- Any DNS, tunnel-ingress or Vercel-dashboard change (owner-gated).
- Caching the injected bodies at the edge (deliberately uncacheable — see `OG_CACHE`).
- Touching the `/api/*` proxy semantics or the deploy scripts (TASK-DB-0075).
