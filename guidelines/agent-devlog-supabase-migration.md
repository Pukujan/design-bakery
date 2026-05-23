# Agent devlog — Supabase migration (Firebase exit)

| Field | Value |
|-------|-------|
| **Document date** | 2026-05-22 |
| **Created** | 2026-05-22 |
| **Last updated** | 2026-05-22 |

**For Cursor agents.** Read before changing auth, CMS content storage, blog data reads/writes, or image upload paths.

### Revision history

| Date | Notes |
|------|--------|
| 2026-05-22 | Decision + phased plan; Supabase Storage backend in publish kit; why Firebase was abandoned |
| 2026-05-22 | Phase 3: frontend `contentApi.ts`; `adminContentService` + `blogData` branch to Express `/api/content` + `/api/public` |

---

## Why we are leaving Firebase

Production blog **Save** and publish-kit **commit_visual** failed repeatedly. Root causes stacked:

| Issue | Symptom | Cause |
|-------|---------|-------|
| **Storage bucket missing** | API 500; `The specified bucket does not exist` | Firebase **Cloud Storage** was never provisioned on project `auth-system-be464` |
| **Spark plan gate** | Console prompts **Upgrade** to enable Storage | Google policy (2024–2026): new/default Storage buckets require **Blaze** (billing account linked) |
| **Billing blocked** | `Billing setup can't be completed [OR_BACR2_44]` | Payment method rejected for GCP billing; optional **$10 prepayment** required |
| **Firestore save pressure** | Save blocked or posts too large | Firestore **~1 MiB per document**; preview **`data:` image URLs** must not be written — images need **HTTPS object storage URLs** first |
| **Split stack confusion** | CORS, wrong API port, stale `server/` process | Express on :8787 vs Vite :5300; browser Storage uploads unreliable in prod |

**Firestore itself** (text fields, CMS JSON docs) was usable for reads/writes at small scale. The **combined pipeline** (generate images → upload → store URLs in post docs) **could not complete** without working object storage and stable billing. That is the migration driver — not “Postgres is magic,” but **Firebase Storage + billing blocked the product**.

Oracle Cloud was considered for Storage/DB and rejected: **high integration cost** for this codebase vs **Supabase** (Postgres + Auth + Storage, one vendor, free tier, no GCP card gate).

---

## Is Supabase “Postgres”? Will it work?

**Yes — Supabase is managed PostgreSQL** (plus add-ons):

| Layer | What it is |
|-------|------------|
| **Database** | Real **PostgreSQL** (SQL, migrations, indexes, JSONB). Not a Firestore clone. |
| **Auth** | Supabase Auth (JWT); replaces Firebase Auth for admin. |
| **Storage** | Object storage (S3-like), **not** bytea blobs in Postgres rows. Public URLs for blog images. |
| **Client API** | `@supabase/supabase-js` → PostgREST over Postgres + Storage REST |

This app maps cleanly:

| Firebase today | Supabase target |
|----------------|-----------------|
| Firestore `blog_posts` + CMS `{ items }` / `{ item }` docs | Postgres tables + **JSONB** for CMS blobs (or normalized later) |
| Firebase Auth (admin email/password) | Supabase Auth + same `ALLOWED_ADMIN_EMAILS` on API |
| Firebase Storage `blog-publish/…` | Supabase Storage bucket `design-bakery` (public read) |
| Realtime Database sync | **Remove** (already off by default) |
| Firebase Functions callables | **Express API** on Railway (already primary when `VITE_BLOG_API_URL` set) |

**Confidence:** Storage + Auth + a Postgres schema for `blog_posts` and CMS is a **standard** Supabase pattern. The **large** effort is rewriting `adminContentService.ts` (~60 collection patterns) — not whether Postgres can hold the data.

---

## Migration phases

| Phase | Scope | Status |
|-------|--------|--------|
| **0** | Decision, env contract, devlog | **Done** (this doc) |
| **1** | **Storage** — `uploadBlogImage` → Supabase when `SUPABASE_*` set | **In code** — `backend/services/src/blog/publishKit/storage.ts`, `supabaseClient.ts` |
| **2** | **Auth** — backend JWT (`POST /api/auth/login`) + Express `requireAdmin` | **Done** (when `ADMIN_*` set) |
| **3** | **Postgres CMS** — schema + replace Firestore in `adminContentService.ts`, `blogData.ts` | **In code** — set `CONTENT_BACKEND=supabase` + `VITE_CONTENT_BACKEND=supabase`; run `001_initial.sql` |
| **4** | **Backend agents** — `getBlogByNumericId`, `agent_usage`, `agent_audit` → Postgres | Planned |
| **5** | **Decommission Firebase** — remove `firebase` / `firebase-admin`, env vars, emulators | After 1–4 |

Run **`supabase/migrations/001_initial.sql`** in Supabase SQL editor before Phase 3.

---

## Environment

### Backend (`backend/.env`)

```env
# Storage + Postgres CMS (Phase 1 + 3)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=design-bakery
IMAGE_STORAGE=supabase
CONTENT_BACKEND=supabase

# Admin login (Phase 2) — backend JWT, not Supabase Auth
ADMIN_JWT_SECRET=long-random-string
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=dev-password
# ADMIN_PASSWORD_HASH=...  # production

VITE_BLOG_API_URL is only in frontend/.env
```

### Frontend (`frontend/.env`)

```env
VITE_BLOG_API_URL=http://localhost:8787
VITE_CONTENT_BACKEND=supabase
# Supabase anon key only needed for direct client reads (optional)
```

Legacy Firebase vars remain until Phase 5; do not delete until migration complete.

---

## Canonical paths

| Area | Path |
|------|------|
| Supabase Storage upload (server) | `backend/services/src/blog/publishKit/storage.ts` |
| Supabase admin client | `backend/services/src/supabaseClient.ts` |
| SQL schema | `supabase/migrations/001_initial.sql`, `002_agent_usage_text_id.sql` |
| Content API client (frontend) | `frontend/src/app/lib/contentApi.ts` |
| CMS (Firestore or API) | `frontend/src/app/lib/adminContentService.ts` |
| Public blog reads | `frontend/src/app/modules/blog/data/blogData.ts` |
| Migration script | `scripts/migrations/migrate-firestore-to-supabase.ts` — `pnpm run migrate:firestore-to-supabase` |
| API auth | `backend/src/middleware/auth.ts` |
| Plan overview | `doc/supabase-migration.md` (if present) |

---

## Safe / avoid

| Safe | Avoid |
|------|--------|
| Server-side image upload via Express when `VITE_BLOG_API_URL` set | Browser upload to Firebase Storage in production |
| `service_role` key **only** on Railway / backend | Exposing `SUPABASE_SERVICE_ROLE_KEY` in Vite |
| JSONB CMS rows mirroring Firestore `{ items }` shape during migration | Big-bang rewrite of every admin editor at once |
| Budget alert on Supabase/GCP if any billing linked later | Committing `.env` or service keys |

---

## Test

```bash
# After SUPABASE_* in backend/.env and public bucket created
pnpm run test:publish-kit-upload

pnpm run dev:stack
# Admin → Save post → Network: POST /api/publish-kit commit_visual
# Firestore/Postgres post doc should get https://…supabase.co/storage/… URLs
```

---

## Checklist before merge (migration PRs)

- [ ] Supabase bucket **public read** for blog images (or signed URLs documented)
- [ ] RLS policies for CMS tables (public read, authenticated write)
- [ ] `pnpm run test:publish-kit-upload` passes with `IMAGE_STORAGE=supabase`
- [ ] Admin login works on Supabase Auth (Phase 2+)
- [ ] Session dev log + this doc **Last updated** date bumped

---

## Links

- [Supabase Storage docs](https://supabase.com/docs/guides/storage)
- [Firebase Storage billing FAQ (why Blaze required)](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)
- [agent-devlog-blog-publish-kit.md](agent-devlog-blog-publish-kit.md) — publish kit flow
