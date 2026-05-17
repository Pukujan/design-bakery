# Design Bakery — documentation

Personal portfolio site with multiple engineering “skins” on one codebase.

## Quick start

```bash
pnpm install
pnpm dev
pnpm build
```

Copy `.env.example` to `.env` and set `VITE_FIREBASE_API_KEY` (and related Firebase fields) for admin login and Firestore. Leave `VITE_FIREBASE_ENABLE_CONTENT_SYNC` unset or `false` unless you use Realtime DB JSON sync.

## Docs

| File | Contents |
|------|----------|
| [routes.md](./routes.md) | **All routes** — public URLs, admin paths, section anchors, navbar |
| [project-guide.md](./project-guide.md) | Architecture, portfolios, content/data, how to extend |
