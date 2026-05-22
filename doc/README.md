# Design Bakery — documentation

Personal portfolio site with multiple engineering “skins” on one codebase.

## Quick start

```bash
pnpm install
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
pnpm dev
pnpm build
```

Copy `frontend/.env.example` → `frontend/.env` and `backend/.env.example` → `backend/.env`. See [env.md](./env.md).

## Docs

| File | Contents |
|------|----------|
| [env.md](./env.md) | **Env files** — `frontend/.env` vs `backend/.env` |
| [deploy-vercel-railway.md](./deploy-vercel-railway.md) | **Production** — same repo: Vercel (frontend) + Railway (Express API) |
| [routes.md](./routes.md) | **All routes** — public URLs, admin paths, section anchors, navbar |
| [project-guide.md](./project-guide.md) | Architecture, portfolios, content/data, how to extend |
