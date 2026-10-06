# TASK-DB-0074 — move design-bakery's data layer onto octo

| Field | Value |
|-------|-------|
| **Created** | 2026-10-06 |
| **Issue** | — (finding recorded here; octo-side incident filed at [octo-database#162](https://github.com/Pukujan/octo-database/issues/162), now resolved) |
| **Branch** | `main` |
| **Status** | **Data layer done.** Schema applied, content migrated, and the backend re-pointed off PostgREST onto octo's SQL surface (2026-10-06). Remaining: migrate Supabase **Storage** (11 call sites) onto octo's file API, and migrate drafts + `agent_tokens` (needs the service-role key). |

## Done (2026-10-06)

1. **Boot block** pasted into `AGENTS.md` (§ Data layer — Octo).
2. **Schema applied** to `octo_ws_design_bakery_c192afbc` via `POST /api/workspaces/:id/query`.
   `supabase/migrations/000_octo_bootstrap.sql` defines the `auth.role()` / `auth.uid()`
   stubs the 001–010 files need (they are plain PostgreSQL otherwise; `gen_random_uuid()`
   is native on pg16). Result: 8 tables, RLS on, policies created.
3. **Content migrated** — 34 `blog_posts`, 41 `cms_documents`, 31 `media_assets`,
   30 `cover_studio_assets` (136 rows) from hosted Supabase. Idempotent upsert on the
   primary key: `scripts/migrate-supabase-to-octo.mjs` (with `scripts/octo-query.mjs`).
   Only the public anon key was available, so **drafts and `agent_tokens` were not
   readable** and are not yet migrated — re-run the script with
   `SUPABASE_SERVICE_ROLE_KEY` set to pick them up.
4. **Backend re-pointed off PostgREST** onto octo's SQL surface. New
   `backend/services/src/db.ts` (`dbQuery`/`dbQueryAll`/`dbQueryOne`/`dbExec` +
   `dbInsert`/`dbUpdate`/`dbDelete`) posts SQL to `POST /api/workspaces/:id/query` with the
   workspace key. Rewrote the data calls in `blogPosts.ts`, `cmsDocuments.ts`,
   `mediaLibrary.ts`, `coverStudioLibrary.ts`, `heroCache.ts`, `agentAudit.ts`,
   `agentToken.ts`, and `agentAuth.ts`. `DbError.code` carries the pg SQLSTATE, so the
   `createBlogPost` `23505` retry still works. The workspace's own `_rw` role **owns** the
   tables, so RLS is bypassed exactly as `service_role` was — visibility rules are now
   explicit `WHERE` clauses.
5. **Same-origin API ingress** wired: `resolveApiBase()` in `frontend/src/app/lib/adminToken.ts`
   treats `VITE_BLOG_API_URL=same-origin` as the page origin, and `blogSource.ts` disables the
   direct Supabase read whenever a backend API base is configured (backend authoritative).
   Caddy `handle /api/*` proxy added to `deploy/gravebuster/Caddyfile`.
6. **Verified end-to-end** against octo: `/api/public/blogs` → 33 (34th is a genuine draft,
   correctly hidden), `/api/public/blogs/34` → content len 32766, agent endpoint →
   "Unknown agent token" (proves `agent_tokens` is queried). `pnpm run lint`,
   `find:orphans:strict`, `test:homepage-content`, `test:agent-posts`, backend + services
   builds, and the frontend production build all pass.

## Decisive constraint (verified from the octo checkout)

The workspace database's **connection string is returned exactly once at provisioning**
and octo exposes **no reveal/rotate route** — only `POST /api/workspaces/:id/database`
(provision; 409 if it already exists) and the SQL surface. `docs/consuming-octo.md` says
so directly: *"If you lose it, use the SQL surface (which needs no string), or the owner
can rotate it."* The string was not stored anywhere reachable (not in
`Desktop\configs\.env`, not in the repo), so **the backend cannot become a `pg` client
today** without an owner-side rotation. The supported path is the **SQL surface**
(`POST /api/workspaces/:id/query`, workspace key, no connection string) — which is also
what the boot block tells future agents to prefer.

## Why

design-bakery is being moved off hosted platforms (Vercel → gravebuster, issue #52/#80).
Its **data** still lives in hosted Supabase (`ukjflpgrfmgwazogrgdv`) + a Railway API.
Per the owner, **octo is the single designated data layer for every owner project** — no
agent hosts its own database, all data lives in the cloud through octo.

During this investigation an agent recommended a *dedicated self-hosted Postgres container*
for design-bakery. That is the exact anti-pattern octo exists to prevent and was rejected by
the owner; it is recorded in octo's own issue log as
[octo-database#162](https://github.com/Pukujan/octo-database/issues/162).

## What already exists (verified 2026-10-06)

- **octo workspace `design-bakery`** = `e2f12428-518a-4f10-bf16-7b90ad9a8751` (created 08:28 today).
- **A valid workspace key** for it: `octo_db_design_bakery` in
  `C:\Users\pujan\Desktop\configs\.env`. Verified: `GET /api/workspaces` with it →
  `200`, returns exactly the design-bakery workspace, role `owner`, scopes `read,write,files`.
- The **account-level** key in the same file (`octodb_my_account_key`) is **stale** — `401`,
  its hash is not in `octo.api_keys`.
- octo public API: `https://octodb.design-bakery.com` (tunnel → `octo-web` → `octo-api:3001`).
- octo's **Slice 20** (merged, PR #155 / commit `a6224c3`) provisions a **real Postgres per
  workspace**: `octo_ws_<slug>_<suffix>` + owning `_rw` role, pgvector enabled, connection
  string returned **once**. Code: `src/server/provisioning.ts`; route
  `POST /api/workspaces/:id/database` at `src/server/index.ts` (~L1520).

## The blocker — RESOLVED (octo side, 2026-10-06)

The octo **deployed** on gravebuster was commit `3f36fa9e5b79`, which predated Slice 20, so
`octo.workspace_databases` and the provisioning route were absent. **All of that is now
done** (owner-side, later on 2026-10-06):

| Piece | State |
|---|---|
| octo deployed on gravebuster | `eb43f9b7aba3`, deployed 2026-10-06T16:01Z (has Slice 20 + 21) |
| `octo.workspace_databases` | exists |
| design-bakery workspace database | **provisioned** 2026-10-06T14:13Z |
| db / role | `octo_ws_design_bakery_c192afbc` / `octo_ws_design_bakery_c192afbc_rw` (`active`) |
| `octo.workspace_database_credentials` | exists (encrypted role password, Slice 21) |
| incident #162 | resolved by PR #163 (`docs/consuming-octo.md` + README pointer) |
| tables in the database | **0** — schema not yet applied |

**Slice 21 (PR #173, `e275f29`)** added the key that removes the connection-string friction:
`POST /api/workspaces/:id/query` runs SQL against the workspace's own database with **just an
Octo API key** — no connection string, host or port crosses the wire. A workspace-scoped key
**is** allowed here (unlike provisioning), read scope opens a read-only transaction, write
scope can carry a whole migration.

Verified working with the existing `octo_db_design_bakery` workspace key:

```bash
curl -sS -X POST "https://octodb.design-bakery.com/api/workspaces/e2f12428-518a-4f10-bf16-7b90ad9a8751/query" \
  -H "Authorization: Bearer $OCTO_WS_KEY" -H "Content-Type: application/json" \
  -d '{"sql":"SELECT current_database() AS db, current_user AS role"}'
# → {"db":"octo_ws_design_bakery_c192afbc","role":"octo_ws_design_bakery_c192afbc_rw", ...}
```

So design-bakery can apply its schema and migrate its data **without ever handling a
Postgres connection string** — the octo API key alone is sufficient.


## The design-bakery side (the refactor)

design-bakery's backend spoke **PostgREST**, not plain Postgres:

- `backend/services/src/supabaseClient.ts` — `@supabase/supabase-js` admin client.
- **13 files** import it; **~47** `.from()` calls; **11** `storage.from()` sites.
- Frontend public reads use the Supabase anon key directly (`frontend/src/app/lib/supabasePublic.ts`,
  `modules/blog/data/blogSupabase.ts`).

Done:

1. Replaced the `@supabase/supabase-js` **data** calls with the thin octo data layer
   (`backend/services/src/db.ts`) over `POST /api/workspaces/:id/query`. A `pg` client was
   impossible — see "Decisive constraint" above (no connection string).
2. Applied design-bakery's own `supabase/migrations/001–010` to the provisioned database
   (`auth.role()` / `auth.uid()` stubs supplied by `000_octo_bootstrap.sql`).
3. Migrated existing content (blog posts, CMS documents, media, cover-studio) out of hosted
   Supabase.
4. Admin auth is already custom (admin JWT + `ADMIN_PASSWORD`) — not Supabase GoTrue, so it
   is unaffected. `agent_tokens` lookups now go through the data layer.

Remaining:

- **Storage** — the **11 `storage.from()` call sites** (media library, cover-studio library,
  publish-kit hero cache + `storage.ts`) still use Supabase Storage. Moving them onto octo's
  file API is the largest remaining piece; the Supabase block in `backend/.env.example` is
  labelled storage-only until then.
- **Drafts + `agent_tokens`** — only the anon key was available at migration time, so
  service-role-only rows are not yet migrated. Re-run `scripts/migrate-supabase-to-octo.mjs`
  with `SUPABASE_SERVICE_ROLE_KEY` set.
- **Deploy** — set `VITE_BLOG_API_URL=same-origin` in the web build args, deploy the Caddy
  `/api` proxy + edge attachment fix, and cut DNS over (staging hostname first).

## Next step

- Apply the remaining Storage migration, then re-run the content migration with the
  service-role key to pick up drafts + `agent_tokens`.
- Deploy: `VITE_BLOG_API_URL=same-origin` on the web build; Caddy `/api` + sticky
  `WITH_EDGE` on gravebuster; Cloudflare tunnel + DNS (staging hostname first).
