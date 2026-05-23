# Scripts

Active dev and deploy helpers. Run from repo root (`pnpm run …`).

| Script | npm command |
|--------|-------------|
| `dev.mjs` | `pnpm run dev` |
| `dev-functions.mjs` | `pnpm run dev:functions` |
| `codegraph-sync.mjs` | `pnpm run codegraph:sync` (also `predev`) |
| `export-deploy-env.mjs` | `pnpm run export:deploy-env` |
| `split-env.mjs` | `pnpm run env:split` |
| `apply-storage-cors.mjs` | `pnpm run storage:cors` |
| `migrations/migrate-firestore-to-supabase.ts` | `pnpm run migrate:firestore-to-supabase` |

Legacy / one-off scripts live in [`archive/`](archive/).
