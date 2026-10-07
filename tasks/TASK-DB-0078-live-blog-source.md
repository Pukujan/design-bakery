# TASK-DB-0078 — point the live frontend build at the same-origin API

| Field | Value |
|-------|-------|
| **Created** | 2026-10-07 |
| **Issue** | [#80](https://github.com/Pukujan/design-bakery/issues/80) (backend off Railway, frontend off Vercel) |
| **Branch** | `task/TASK-DB-0078-live-blog-source` |
| **Status** | Done — the box's `.env` is set and the live site serves the octo content |

## Goal

After [TASK-DB-0076](TASK-DB-0076-gravebuster-cutover.md) moved the domain onto
gravebuster, the live site was serving **stale blog content**: `deploy/gravebuster/.env`
set no `VITE_BLOG_API_URL`, so the built SPA never called the backend and fell back to
the committed `blog-data.json` snapshot. `/blogs` rendered **6 of 7 posts** while the
octo-backed API had **33**, and `sitemap.xml` listed only the snapshot's 14 blog URLs.
On Vercel this was configured (`VITE_BLOG_API_URL` = the Railway URL); the cutover
dropped it. Wire the build to the backend that now runs in the `api` container.

## What changed

- **`deploy/gravebuster/.env` on the box** (git-ignored, non-secret build knobs):
  `VITE_BLOG_API_URL=https://www.design-bakery.com`. The site's own origin, so the SPA
  calls Caddy's `/api/*` proxy **same-origin** (no CORS, no `ALLOWED_ORIGINS` change),
  and being an absolute URL it also lets the **build-time sitemap generator** — a Node
  script with no browser origin — fetch the live blog list. `same-origin` (the literal
  `resolveApiBase` maps to `window.location.origin`) also fixes the browser but not the
  sitemap, so the absolute URL is preferred.
- **`deploy/gravebuster/.env.example`** — the `VITE_BLOG_API_URL` guidance now points
  at the production origin instead of a Railway placeholder, and says these are build
  args (a redeploy is needed, not a restart).
- **`docs/self-hosting.md`** §3 (build-time config) and §8 (the API-reachability
  decision) now record the shipped value and why it is not the literal `same-origin`.

Nothing in `frontend/` changed — `resolveApiBase` already accepts any absolute URL and
the `same-origin` literal, and `isSupabaseDirectReadEnabled()` returns false whenever
`VITE_BLOG_API_URL` is set, so the backend is authoritative and the legacy Supabase
anon-key read stays off (correct: the data layer is octo, TASK-DB-0074).

## Evidence

**Before** (live, `e3e8c3a`, browser + crawler):

- `/blogs` → "6 of 7 posts"; **zero** `/api/` requests from the page; the JS bundle
  embedded the 7-post snapshot.
- `sitemap.xml` → 14 blog detail URLs.
- API `GET /api/public/blogs` → 33 posts.

**After** (live, same SHA, redeployed with the env):

- `/blogs` → "6 of 33 posts"; the page makes
  `GET /api/public/blogs` + `GET /api/public/blog-categories` **same-origin**.
- `/blogs/23` → "Legal AI Confidence Scores: When to Trust or Flag" with its body,
  from `GET /api/public/blogs/23`.
- `sitemap.xml` → **66** blog detail URLs (`/blogs/N` + `/endtoend-engineer/blogs/N`
  for all 33 posts; was 14).
- The deploy smoke test passed (including `/api/public/blogs` 200 JSON through Caddy),
  and the OG previews from [TASK-DB-0077](TASK-DB-0077-og-sidecar.md) still resolve
  (`/blogs/1` → the post title, `/blogs` → the list title, `/case-studies/ekagajpatra`
  → its title) after the rebuild.

## Non-goals

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — deliberately **not** set; the
  browser must not read the legacy Supabase directly now that octo is the data layer.
- `VITE_CONTENT_BACKEND` — declared in `frontend/src/env.d.ts` but never read; a no-op.
- `VITE_SITE_URL` — optional; `resolveSiteOrigin()` falls back to the browser origin,
  which is the public host, so it is left unset (matching the Vercel build).
- Deleting the Vercel project (owner-gated; rollback still points at Vercel).
