# TASK-DB-0074 — move design-bakery's data layer onto octo

| Field | Value |
|-------|-------|
| **Created** | 2026-10-06 |
| **Issue** | — (finding recorded here; octo-side incident filed at [octo-database#162](https://github.com/Pukujan/octo-database/issues/162), now resolved) |
| **Branch** | `main` |
| **Status** | **Data layer done and verified (2026-10-07). New file uploads done.** Schema applied, content migrated, backend on octo's SQL surface, image uploads on octo's file API, and the 193 image URLs rewritten (zero `supabase.co/storage` left). Two items remain, both blocked on a credential that is **not on this machine**; each now has exact human steps below. The workspace key needs the `delete` scope added — an **allowance edit on the existing key**, not a re-mint. Drafts + `agent_tokens` need design-bakery's Supabase URL **and** service-role key. Deploy (`VITE_BLOG_API_URL=same-origin`, `WITH_EDGE`, DNS) is owned by another agent. |

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

## Storage (2026-10-06)

New uploads go through `backend/services/src/octoFiles.ts`: upload into the
private bucket, then `POST /api/files/:id/publish`. The stored URL is the stable
address Octo returns, `https://files.design-bakery.com/<fileId>`. Signed
download links expire and are not stored. `GET /api/public/assets/:fileId` remains
only for a URL already saved in that shape.

Call sites: `mediaStorage.ts`, `coverStudioStorage.ts`, `blog/publishKit/storage.ts`,
`heroCache.ts`. A `storage_path` that is still a Supabase object key (not a UUID)
is deleted through the old client. Delete unpublishes first (write scope), then
`DELETE`s the private object. The workspace key is owner and has `read,write,files`.
It does not have `delete`, so the private object stays when a caller tries to
remove one.

The live private bucket had been `R2_BUCKET=study-os-transcripts`. 53 Octo objects
already in that bucket (`workspaces/` and `derived/`, 396,427 bytes) were copied
into the `octo` bucket, then `R2_BUCKET`, `CLOUDFLARE_R2_BUCKET`, and
`OCTO_R2_BUCKET` were set to `octo` and `octo-api` was recreated. Compose's
default image is `octo-api:latest` (the tag from several days ago, no publish
route). The running API is `octo-api:77b68367ab99`. Recreate with
`IMAGE_TAG=77b68367ab99`.

`scripts/migrate-supabase-storage-to-octo.mjs --apply` rewrote **193** Supabase
Storage URLs (28 blog posts, 31 media rows, 30 cover-studio rows, 0 hero-cache
rows). A follow-up count found zero `supabase.co/storage` URLs left in those
tables, and a sample cover returned HTTP 200 `image/png` from
`files.design-bakery.com`.

Still open:

- **Delete scope** — the workspace key holds `read`, `write`, `files` but not
  `delete`, so the app cannot remove a public asset's private object. octo can
  **edit the existing key's allowances** (no re-mint, the secret does not change);
  the human steps are in "Remaining items (2026-10-07)" below.
- **Drafts + `agent_tokens`** — re-run `scripts/migrate-supabase-to-octo.mjs` with
  design-bakery's `SUPABASE_SERVICE_ROLE_KEY`. Neither the key nor the project URL
  is on this machine; the exact human steps are below.
- **Deploy** — the storage code is on `main` (PR #90 merged). Production still needs
  `VITE_BLOG_API_URL=same-origin`, sticky `WITH_EDGE`, and DNS cutover on a
  staging hostname first. **Another agent owns this item; not touched here.** The
  rewritten URLs are absolute, so a reader of the Octo rows can load the images
  before that cutover.

## Remaining items (2026-10-07)

Re-checked both open items against the octo checkout (`D:\development\octo-db`,
`Pukujan/octo-database`) and the live API. Both need a credential that is **not on
this machine**, so neither could be completed here. No secret value is recorded in
this file — only variable names.

### Item 1 — add the `delete` scope to the workspace key (human-only)

**What it actually needs.** This is not a re-mint. octo's Access page and
`PATCH /api/keys/:id` **edit the allowances on an existing key** (commit `bc245b8`,
2026-10-06); the secret, workspace binding and role stay put, so `octo_db_design_bakery`
does not have to be re-issued or re-copied into `.env`.

The route is gated exactly like minting: `confirmGate` refuses any API-key caller
(`403 FORBIDDEN: Destructive commands require a human session; API keys can never
confirm.`), and a human session must also supply the confirmation secret (plus a
TOTP code when MFA is enrolled). Verified against the live API: `PATCH /api/keys/<id>`
with the workspace key returns that 403, and `DELETE /api/files/<id>` with the
current key returns `403 FORBIDDEN: Token is missing the required 'delete' scope`.

**Credential needed:** an octo **human browser session** for the owner account
(`OCTO_SESSION_SECRET`-signed `octo_sess_` bearer token, from the dashboard's Google
login) plus the account's **confirmation secret**. Neither is on this machine — the
`octodb_my_account_key` in `Desktop\configs\.env` is a stale API key (`401`) and, in
any case, an API key can never satisfy the gate. So a human must do this.

The running deployment already supports this path, so nothing has to be rebuilt
first: the live `PATCH /api/keys/<id>` answered with the human-session refusal
rather than `404` (the route is present in `octo-api:77b68367ab99`), and the
dashboard bundle served at `octodb.design-bakery.com` contains the per-key
allowance form (`key-allowances` / "Save allowances").

**Recommended (dashboard, no commands):**

1. Sign in at the octo dashboard → the **design-bakery** workspace → **Access**.
2. Under "API keys", tick **delete** on `design-bakery workspace key` (key id
   `d766b846-f977-49ef-a691-9f9129f3243e`) and press **Save allowances**.
3. Type the confirmation code shown on the form (and the authenticator code if MFA
   is on).

**Equivalent commands (curl), if preferred.** The session token comes from the
dashboard; set it in the shell only, never in a file:

```bash
OCTO_API_BASE=https://octodb.design-bakery.com
WS=e2f12428-518a-4f10-bf16-7b90ad9a8751
KEY_ID=d766b846-f977-49ef-a691-9f9129f3243e
# export OCTO_SESSION=<octo_sess_... from the dashboard session>

# 1. ask for a one-time confirmation code (prints it; you type it back next)
curl -sS -X POST "$OCTO_API_BASE/api/me/confirm-challenge" \
  -H "Authorization: Bearer $OCTO_SESSION"
# → {"code":"XXXXXX","expiresAt":"..."}   (10-minute TTL, single use)

# 2. set the allowances — replaces the list, so include the existing three too
curl -sS -X PATCH "$OCTO_API_BASE/api/keys/$KEY_ID" \
  -H "Authorization: Bearer $OCTO_SESSION" -H "Content-Type: application/json" \
  -d '{"scopes":["read","write","files","delete"],"confirmSecret":"XXXXXX"}'
# → 200 {... "scopes":["read","write","files","delete"] ...}
```

**Verify (this is the acceptance test; a non-403 means the scope is live):**

```bash
curl -sS -o /dev/null -w '%{http_code}\n' -X DELETE \
  "$OCTO_API_BASE/api/files/00000000-0000-4000-8000-000000000000?workspaceId=$WS" \
  -H "Authorization: Bearer $(grep -E '^octo_db_design_bakery=' /c/Users/pujan/Desktop/configs/.env | cut -d= -f2-)"
# before: 403 (missing 'delete' scope)   after: 404 FILE_NOT_FOUND  ← success
```

The key's secret is unchanged, so `OCTO_API_KEY` in the backend env needs no edit.

### Item 2 — migrate drafts + `agent_tokens` (human-only)

**What it actually needs.** Two values, neither present on this machine:

- `SUPABASE_SERVICE_ROLE_KEY` for design-bakery's project `ukjflpgrfmgwazogrgdv`.
  The only service-role key on the machine (`FININT_SUPABASE_SERVICE_ROLE_KEY` in
  `Desktop\configs\.env`) belongs to a **different** project (`pzwltxkckghixuklxypr`),
  and design-bakery's project ref appears nowhere on disk.
- `SUPABASE_URL` — the script requires it, and it is not recorded in this repo
  either (`additionals/doc/env.md` documents the variable but no value; no
  `backend/.env` exists). The URL is public (`https://ukjflpgrfmgwazogrgdv.supabase.co`)
  but is written out here for completeness only.

The migration itself is idempotent and already handles this: `TABLES` in
`scripts/migrate-supabase-to-octo.mjs` already lists `agent_tokens`, and the script
prints a note when the service-role key is absent. Nothing in the script needs a
change — it is a re-run with the key set.

**Commands (human, with the two values in the shell):**

```bash
cd /d/development/design-bakery.com
export SUPABASE_URL=https://ukjflpgrfmgwazogrgdv.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=<service_role key for that project>
export OCTO_API_BASE=https://octodb.design-bakery.com
export OCTO_WORKSPACE_ID=e2f12428-518a-4f10-bf16-7b90ad9a8751
export OCTO_WS_KEY=$(grep -E '^octo_db_design_bakery=' /c/Users/pujan/Desktop/configs/.env | cut -d= -f2-)

node scripts/migrate-supabase-to-octo.mjs --dry-run   # inspect first
node scripts/migrate-supabase-to-octo.mjs             # apply
```

**Verify** — a non-zero `agent_tokens` count once the key is used:

```sql
select (select count(*) from blog_posts where published_at is null) drafts,
       (select count(*) from agent_tokens) tokens;
```

## Data-layer verification (2026-10-07, read-only)

Re-confirmed against the live octo API with the workspace key. The key still works;
`GET /api/keys` returns scopes `read,write,files` (no `delete`) — i.e. item 1 is
still open. The backend query path in `backend/services/src/db.ts` is intact (it
posts to `POST /api/workspaces/:id/query` with `OCTO_WORKSPACE_ID` + `OCTO_API_KEY`).

| Check | Result |
|---|---|
| identity | `current_database()` = `octo_ws_design_bakery_c192afbc`, `current_user` = `..._rw` |
| rows | 34 `blog_posts`, 41 `cms_documents`, 31 `media_assets`, 30 `cover_studio_assets` |
| drafts | 33 published, **1** draft (a genuine draft, correctly hidden by the public route) |
| `supabase.co/storage` URLs in blog/media/cover | **0** |
| `files.design-bakery.com` URLs | 28 blog, 31 media, 30 cover |
| `agent_tokens` / `agent_audit` / `agent_usage` | 0 / 0 / 0 |

**Contradiction found:** the "Still open" bullet says drafts were not migrated because
the anon key cannot read them. But the database holds **34** `blog_posts` — 33
published **and** the 1 draft — and that draft's `created_at` is `2026-05-28`
(Supabase-era, not created in octo), so it *was* carried over. The migration script's
Supabase read is paginated with a `Range` header, which is a plausible reason the
policy did not narrow the page, but the live Supabase RLS policy could not be
inspected (no credential), so the mechanism is **unconfirmed**. What is certain: the
blog draft is present, and the genuinely empty tables are `agent_tokens`,
`agent_audit` and `agent_usage`. The item-2 verification should therefore check the
`agent_tokens` count, not the blog draft count — and the re-run should still be done
to pick up any other unpublished `cms_documents`.

## Next step

- **Human:** add the `delete` scope to the workspace key — an allowance edit on the
  existing key, not a re-mint (steps in "Item 1" above). The key's secret does not
  change.
- **Human:** re-run `scripts/migrate-supabase-to-octo.mjs` with
  `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for `agent_tokens` and any other
  unpublished rows (steps in "Item 2" above).
- **Another agent owns:** DNS cutover (staging hostname first) with
  `VITE_BLOG_API_URL=same-origin` and sticky `WITH_EDGE`. Recreate `octo-api` only
  with `IMAGE_TAG=77b68367ab99` until `latest` is that build.
