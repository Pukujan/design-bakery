# Archived Firebase helpers

Firebase was removed from the active stack (2026-05-22). Supabase + Express API is the only supported path.

| File | Purpose |
|------|---------|
| `firebaseApp.ts` | One-time `pnpm run migrate:firestore-to-supabase` (requires `pnpm add -D firebase-admin` at repo root) |

Active Firebase CLI config (if any) remains under `firebase/` for historical reference only — not used by dev or deploy.
