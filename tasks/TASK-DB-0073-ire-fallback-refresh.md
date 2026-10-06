# TASK-DB-0073 — refresh the /ire page's committed fallback

| Field | Value |
|-------|-------|
| **Created** | 2026-10-06 |
| **Issue** | [#87](https://github.com/Pukujan/design-bakery/issues/87) (stale committed fallback) |
| **Branch** | `task/TASK-DB-0073-ire-fallback-refresh` |
| **Status** | Complete — verified locally; PR open. |

## Goal

The `/ire` page falls back to `frontend/public/ire/today.saved.json` when its live feed
fetch fails. That committed copy was from 2026-10-04 and still named
`alicn/deepseek-v4.1-flash` at rank 1, a route IRE stopped picking on 2026-10-05. Refresh
the committed copy so the fallback names the route the engine actually picks.

## Done

- `frontend/public/ire/today.saved.json`: replaced with the current live feed
  (`generated_at 2026-10-05T23:57:15Z`, top cheap pick `cb/deepseek-v4.1-flash`). Written
  in the copy's existing shape (one-space indent, trailing newline, LF).

## Evidence

- The deployed copy is already current: `https://www.design-bakery.com/ire/today.saved.json`
  reads `generated_at 2026-10-05T23:57:15Z` and `cb/deepseek-v4.1-flash`, because
  `scripts/refresh-ire-saved-feed.mjs` rewrites the `dist` copy after every `vite build`.
  Only the committed source copy had drifted.
- The new copy passes the page's own validator (open-weight `ire-feed/v2`, both text
  tiers present, every entry `open_weight: true`).
- `pnpm test:ire-page` — passed.
- `pnpm build` then `pnpm test:ire-page:browser` — 17/17 browser checks passed.

## Next step

- Merge when CI is green. The copy drifts again only when a build-time refresh fails, so
  a future follow-up could add a scheduled refresh; not needed for this fix.
