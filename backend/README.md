# design-bakery-api (Express backend)

Blog AI: **publish kit** + **promo agent**. Reuses `functions/` handlers.

**Layout:** [additionals/doc/architecture.md](../additionals/doc/architecture.md) (MVC-style layers under `src/`)  
**Deploy:** [docs/self-hosting.md](../docs/self-hosting.md)  
**Env:** `backend/.env` — see [additionals/doc/env.md](../additionals/doc/env.md) and `backend/.env.example`

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

## Production

The API runs as the `design-bakery-api` container on the VPS, next to the site, and Komodo
deploys it when `main` moves. See [docs/self-hosting.md](../docs/self-hosting.md).

| Setting | Value |
|---------|--------|
| Start | `node backend/lib/server.js` |
| Health | `/health` |

Variables: see `backend/.env.example`; on the VPS they live in `deploy/gravebuster/.env.api`.
