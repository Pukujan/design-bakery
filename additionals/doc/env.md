# Environment variables

Monorepo layout:

| Package | Folder | Env file |
|---------|--------|----------|
| **Frontend** | `frontend/` | `frontend/.env` |
| **Backend** | `backend/` | `backend/.env` |

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

- **Frontend** — `VITE_*` only (Firebase web config, feature flags, `VITE_BLOG_API_URL`, optional **`VITE_SUPABASE_URL`** + **`VITE_SUPABASE_ANON_KEY`** for fast public blog reads)
- **Backend** — secrets (`OPENROUTER_API_KEY`, Supabase **`service_role`** key, optional legacy Firebase Admin)

**Blog images (recommended):** Supabase Storage via `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` in `backend/.env`. No GCP billing required.

**Public blog reads (browser):** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` in `frontend/.env` / Vercel — use the **anon public** key from the dashboard, **not** `SUPABASE_SERVICE_ROLE_KEY`. See [Get the anon key](#get-the-supabase-anon-key) below.

**Legacy:** Firebase Storage still works if `IMAGE_STORAGE=firebase` and Firebase Admin creds are set.

Firebase callable source lives in `backend/services/` (optional deploy; Express on Railway is the default prod path).

## Local dev

```bash
pnpm run dev          # frontend + optional Functions emulator
pnpm run dev:stack    # frontend + Express API (:8787)
pnpm run dev:web      # frontend only
pnpm run dev:api      # backend only
```

## Production

| Host | Root directory | Env |
|------|----------------|-----|
| **Vercel** | `frontend` | `frontend/.env.example` |
| **Railway** | `backend` | `backend/.env.example` |

See [deploy-vercel-railway.md](./deploy-vercel-railway.md).

## Get the Supabase anon key

Use the same Supabase project as `backend/.env` (`SUPABASE_URL`).

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. **Project Settings** (gear) → **API**.
3. Copy **Project URL** → `VITE_SUPABASE_URL` (same host as `SUPABASE_URL` in backend).
4. Under **Project API keys**, copy **`anon` `public`** (sometimes labeled “anon key” or “Publishable”).
5. Paste into `frontend/.env` as `VITE_SUPABASE_ANON_KEY=...` and the same on **Vercel** (Production).

Do **not** copy **`service_role`** into the frontend — that key bypasses RLS and must stay in `backend/.env` / Railway only.

After editing `frontend/.env`, restart `pnpm run dev` or `pnpm run dev:stack`.

## Split combined env

```bash
pnpm run env:split
```
