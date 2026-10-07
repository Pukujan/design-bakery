# Agent devlog — Open Graph link previews (blog and case-study routes)

| Field | Value |
|-------|-------|
| **Document date** | 2026-10-07 |
| **Created** | 2026-10-07 |
| **Last updated** | 2026-10-07 |

**For Cursor agents.** Read before touching the link-preview router, the Caddyfile's
`@ogPreview` / `handle_errors` blocks, the `ogPreviewRouter` mount in `server.ts`, or
either copy of `blogSocialMeta.ts`.

### Revision history

| Date | Notes |
|------|--------|
| 2026-10-07 | Created. Replaces the Vercel Edge middleware (`middleware.ts`, deleted) with a router in the `api` container behind Caddy (TASK-DB-0077, issue #80 Step E). |

---

## What this is

A shared blog or case-study link must preview with the **post's** title, description
and image. The SPA shell is one static `index.html` with the generic homepage tags, so
a crawler that gets the shell shows "Design Bakery" for every URL.

The fix is a **body swap, not a render**: fetch the shell, inject the right
`<title>` / `og:*` / `twitter:*` / `article:*` tags into its `<head>`, send it. Browsers
get the same shell plus those tags, and the SPA hydrates over them — so the two
audiences share one URL and one document, and there is no separate crawler page.

## Where it runs (and why there)

| Layer | Piece |
|-------|-------|
| Caddy | `@ogPreview` `path_regexp` → `reverse_proxy api:8787`; a top-level `handle_errors` degrades to the shell when the API is down |
| Express `api` container | `backend/src/api/ogPreview.ts` — `ogPreviewRouter`, mounted app-wide in `backend/src/server.ts` |
| Backend modules | `backend/src/og/` — `blogShareHtml`, `blogSocialMeta`, `caseStudyShareMeta`, `linkPreviewCrawlers`, `resolveSocialPreviewImage`, `siteSeoDefaults` |
| Frontend modules | `frontend/src/og/blogSocialMeta.ts` (byte-identical copy) + `blogSocialMetaClient.ts` (browser-only) |

It lives in the **existing** `api` container on purpose: no new sidecar, no new tunnel
hostname, no DNS record, no CORS. Caddy already proxies `/api/*` there.

## The two rules that must not be broken

### 1. `@ogPreview` (Caddy) and the router must agree

`@ogPreview` covers blog list/detail (bare and under each of the four portfolio
prefixes) plus every `/case-studies/*` path. The router is **total over that set**: a
path Caddy routes here can never fall through to the Express 404, because the last
branch (`OG_PREFIX_RE`) serves the plain shell.

The router is deliberately a **superset** of the three specific regexes — it is the
catch-all for anything the Caddy matcher sends that the specific ones do not match.
`pnpm test:og-routing` parses both sides out of their source files and checks 36 paths;
a documented disagreement is allowed (`/blogs/abc` is `false` in Caddy — it is not a
detail path there — and `shell` in Express).

**If you change one, change the other and re-run `pnpm test:og-routing`.**

### 2. `blogSocialMeta.ts` exists twice, byte-identical

`backend/tsconfig.json` has `rootDir: "src"`, so the backend cannot import from
`frontend/`. The module is duplicated instead of shared. `pnpm test:og-contract`
fails CI on any byte difference, and also compares `SITE_NAME` /
`DEFAULT_OG_IMAGE_PATH` across the two `siteSeoDefaults.ts` files.

**Edit the frontend copy, then copy it over the backend one (or vice versa) — never
hand-merge.**

## Caching: one URL, two bodies

Every injected response sets **`Vary: User-Agent`** and is **uncacheable**
(`OG_CACHE = 'public, max-age=0, must-revalidate'`).

- `Vary` alone is not enough: Cloudflare's cache ignores `Vary: User-Agent`, so a
  shared cache would hand a crawler the browser's shell or the reverse.
- Nothing cacheable regressed — the SPA fallback already served these paths with
  `max-age=0`.
- **Do not "optimize" this into a cached response** without a per-UA cache key at the
  edge.

## Ordering in the Caddyfile

`@ogPreview` sits **after** the filesystem handlers and the `.html` 404, and **before**
the SPA fallback:

- a real file, or a static case-study directory (`study-os`, `fossil`, `fluffy-v4`,
  `cortex`), is served from disk and **never reaches the API**;
- a missing `.html` still 404s instead of becoming a preview;
- everything else that the matcher covers falls to the API.

`handle_errors` runs only on status ≥400 and **keeps the error's status code**, so the
shell must be sent with an explicit `200` and read through `{file.}` — which does
**not** resolve against `root`, hence the absolute `/srv/index.html`. It is scoped by
path on purpose: an error under `/api/*` must stay an error, because the frontend
reads JSON there and a silent `index.html` would be worse than the 502.

## Canonical paths

| Area | Path |
|------|------|
| The router | `backend/src/api/ogPreview.ts` |
| Mount | `backend/src/server.ts` (`app.use(ogPreviewRouter)`) |
| Shared OG modules (backend) | `backend/src/og/*.ts` |
| Shared OG module (frontend copy) | `frontend/src/og/blogSocialMeta.ts` |
| Browser-only half | `frontend/src/og/blogSocialMetaClient.ts` |
| Caddy routing | `deploy/gravebuster/Caddyfile` (`@ogPreview`, `handle_errors`) |
| Drift tests | `scripts/test-og-routing.mjs`, `scripts/test-og-contract.mjs` |
| Env | `SITE_URL` (public origin), `OG_SHELL_ORIGIN` (default `http://web:80`) |

## Test

```bash
pnpm test:og-routing    # Caddy @ogPreview ⇄ backend router, 36 paths
pnpm test:og-contract   # the duplicated modules have not drifted

# Live (once deployed): a crawler UA must get the post title, not the shell.
curl -A 'facebookexternalhit/1.1' -s https://www.design-bakery.com/blogs/1 | grep -o '<title>[^<]*</title>'
#   → <title>Confidence-Routed Legal Workflows</title>  (the post, not "Design Bakery")
```

Locally, against a built shell + the API on loopback:

```bash
curl -A 'facebookexternalhit/1.1' -s http://127.0.0.1:8085/blogs/1 | grep -o '<title>[^<]*</title>'
curl -A 'facebookexternalhit/1.1' -s http://127.0.0.1:8085/case-studies/study-os | grep -o '<title>[^<]*</title>'
```

## Safe / avoid

| Safe | Avoid |
|------|--------|
| Editing the frontend `blogSocialMeta.ts` and copying it to the backend | Hand-editing one copy only (CI `test:og-contract` fails) |
| Adding a path to both `@ogPreview` and `OG_PREFIX_RE` | Adding it to the Caddyfile only (falls through to the Express 404) |
| Serving these paths uncached with `Vary: User-Agent` | Caching an injected body, or dropping `Vary` |
| A real static `.html` for a case study (served from disk, no API) | Relying on the router for a path that has a real file |
| `SITE_URL` set on the `api` service | Leaving it unset — the compose origin leaks into `og:url` / `og:image` |

## Checklist before merge

- [ ] `pnpm test:og-routing` and `pnpm test:og-contract` pass
- [ ] `node scripts/find-orphans.mjs --strict` passes (no dead OG module)
- [ ] Caddyfile validates; `@ogPreview` and `OG_PREFIX_RE` still agree
- [ ] `SITE_URL` documented for the `api` service
- [ ] This doc's **Last updated** bumped, and the session log updated

## Links

- `docs/self-hosting.md` §2 (parity) and the "Link previews (Open Graph)" subsection
- [agent-devlog-index.md](agent-devlog-index.md)
- `.cursor/rules/og-previews.mdc`
