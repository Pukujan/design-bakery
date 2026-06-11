# Firebase (legacy / optional)

Firebase is **optional** — production uses **Supabase + Railway Express** ([doc/deploy-vercel-railway.md](../doc/deploy-vercel-railway.md)).

This folder holds Firebase CLI config and Storage rules for:

- **Callable emulator** — `pnpm run dev:functions` (local publish kit without Express)
- **Legacy Storage** — when `IMAGE_STORAGE` is not Supabase
- **Optional deploy** — `firebase deploy --config firebase/firebase.json` (requires Blaze)

| File | Purpose |
|------|---------|
| `firebase.json` | Functions source → `backend/services`, Storage rules |
| `.firebaserc` | Project id (`auth-system-be464`) |
| `storage.rules` | Storage security rules |
| `storage.cors.json` | GCS CORS for localhost uploads — `pnpm run storage:cors` |
