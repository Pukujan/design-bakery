# design-bakery-api (Express backend)

Blog AI: **publish kit** + **promo agent**. Reuses `functions/` handlers.

**Deploy:** [doc/deploy-vercel-railway.md](../doc/deploy-vercel-railway.md)  
**Env:** `backend/.env` — see [doc/env.md](../doc/env.md) and `backend/.env.example`

## Local

```bash
cp backend/.env.example backend/.env
# From repo root:
pnpm run dev:api
```

`GET http://localhost:8787/health`

Point the UI at the API in **`frontend/.env`**:

```env
VITE_BLOG_API_URL=http://localhost:8787
```

## Railway

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Start | `node lib/index.js` |
| Health | `/health` |

Variables: see `backend/.env.example` (set in Railway dashboard, not Vercel).
