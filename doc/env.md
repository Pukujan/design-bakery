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

- **Frontend** — `VITE_*` only (Firebase web config, feature flags, `VITE_BLOG_API_URL`)
- **Backend** — secrets (`OPENROUTER_API_KEY`, Supabase Storage, optional legacy Firebase Admin)

**Blog images (recommended):** Supabase Storage via `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` in `backend/.env`. No GCP billing required.

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

## Split combined env

```bash
pnpm run env:split
```
