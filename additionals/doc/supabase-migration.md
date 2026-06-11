# Supabase migration plan

**Topic devlog (normative):** [guidelines/agent-devlog-supabase-migration.md](../guidelines/agent-devlog-supabase-migration.md)

## Decision summary

Move off Firebase to **Supabase** because:

1. **Firebase Storage** could not be enabled on Spark; Blaze upgrade blocked by billing (`OR_BACR2_44`).
2. **Save post** failed without object storage — Firestore cannot hold large `data:` image payloads (~1 MiB doc limit).
3. **Supabase** provides **PostgreSQL + Auth + Storage** on a free tier without GCP prepayment.

## Supabase = Postgres

The database is **real PostgreSQL**. You can use SQL, migrations (`supabase/migrations/`), JSONB for CMS blobs, and standard relational modeling. Storage files live in **Supabase Storage** (object store), not inside Postgres byte columns.

## Phases

| # | Work | Owner action |
|---|------|----------------|
| 1 | Storage uploads in publish kit | Create Supabase project; public bucket `design-bakery`; set `SUPABASE_*` in `backend/.env` |
| 2 | Admin Auth | **Backend JWT** — `ADMIN_JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` in `backend/.env` |
| 3 | Postgres CMS | Run `001_initial.sql`; `pnpm run migrate:firestore-to-supabase`; set `CONTENT_BACKEND=supabase` |
| 4 | Agent tables | Move `agent_usage` / `agent_audit` / blog reads on API |
| 5 | Remove Firebase | Drop deps and env vars |

## Quick start (Phase 1)

1. [supabase.com](https://supabase.com) → new project  
2. Storage → bucket `design-bakery` → **Public**  
3. Settings → API → copy URL + **service_role** (backend) + **anon** (frontend)  
4. `backend/.env`: see `backend/.env.example`  
5. `pnpm run test:publish-kit-upload`

## Phase 3 — Postgres CMS + data migration

1. Supabase SQL Editor → run `supabase/migrations/001_initial.sql` (and `002_agent_usage_text_id.sql` before Phase 4)
2. `backend/.env`: `CONTENT_BACKEND=supabase` + existing `SUPABASE_*`
3. `frontend/.env`: `VITE_CONTENT_BACKEND=supabase` + `VITE_BLOG_API_URL=http://localhost:8787`
4. Preview: `pnpm run migrate:firestore-to-supabase -- --dry-run`
5. Migrate: `pnpm run migrate:firestore-to-supabase`
6. `pnpm run dev:stack` → verify public blog pages and admin save
