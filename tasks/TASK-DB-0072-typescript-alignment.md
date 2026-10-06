# TASK-DB-0072 — align TypeScript on one version

| Field | Value |
|-------|-------|
| **Created** | 2026-10-06 |
| **Issue** | [#78](https://github.com/Pukujan/design-bakery/issues/78) (remaining modular restructuring) |
| **Branch** | `task/TASK-DB-0072-typescript-alignment` |
| **Status** | Complete — verified locally; PR open. |

## Goal

Step 2 of [modularization-plan.md](../additionals/doc/modularization-plan.md):
`frontend` was on TypeScript `^6.0.3` while `backend` and `backend/services` were on
`^5.8.3` (resolving 5.9.3), so the repo ran two compilers. Move them to one version.
The plan flagged the risk: TS 6 may flag new errors in the backend.

## Done

- `backend/package.json` and `backend/services/package.json`:
  `typescript` `^5.8.3` → `^6.0.3`.
- `pnpm install` → lockfile drops the now-unused `typescript@5.9.3` entry; one
  `typescript@6.0.3` remains.

## Evidence

- **TS 6 does not flag the backend.** `pnpm --dir backend run build` (services `tsc`
  + backend `tsc`) exits 0 with no new diagnostics — so the plan's alternative
  ("or pin 5.9 everywhere") was not needed; forward to 6 was the cleaner move.
- Full gate: `pnpm lint`, `pnpm --dir frontend run typecheck`, `pnpm run build`,
  `pnpm test:homepage-content`, `pnpm test:icon-coverage`, `pnpm test:ire-page`,
  `node scripts/find-orphans.mjs --strict` — all pass.
- `typescript-eslint`'s peer range (`>=4.8.4 <6.1.0`) covers 6.0.3, so lint is unaffected.
- Lockfile diff is 4 insertions / 11 deletions — one version for every workspace.

## Next step

- Merge when CI is green. Remaining plan steps are all owner-gated: the mp4 (step 7)
  and the Firebase leftovers (step 8, still read by `scripts/apply-storage-cors.mjs`,
  `dev-functions.mjs`, `free-emulator-port.mjs`, and the Firestore→Supabase migration).
