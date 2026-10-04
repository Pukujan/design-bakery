# TASK-DB-0057: IRE market page at /ire

| Field | Value |
|-------|-------|
| **Created** | 2026-10-04 |
| **Issue** | Pukujan/inference-recommendation-engine#77 (no design-bakery issue) |
| **Branch** | `ire-market-page` |
| **Status** | PR open, waiting for owner review (public, market-facing copy). Do not auto-merge. |

## Goal

A public page at `/ire` that explains IRE in plain language and shows today's cheap and frontier picks from the IRE daily feed, linked from the IRE homepage card.

## Done

- `frontend/public/ire/index.html`: standalone static page in the Study OS case-study style (inline CSS, no build step). Eight sections: hero with today's top picks, both tiers in tabs, the price-ladder problem plus the Oct 4 frontier refresh as the real story, how a pick gets made, use it with your own key (Claude Code / LiteLLM / curl, cx/ caveat), for agents (feed URL, schema, jq one-liner, MCP planned), limits, receipts (provenance) and call to action.
- Data: the page fetches `https://raw.githubusercontent.com/Pukujan/inference-recommendation-engine/data/ire-feed/feed/v1/today.json` in the browser (CORS `*`), renders with `textContent` only, shows each tier's `as_of`, a stale banner when now is past `stale_after`, and falls back to `/ire/today.saved.json` with a "saved copy from <date>" note. If both fail it shows an error with a link to the raw feed.
- Saved copy: committed at `frontend/public/ire/today.saved.json`; `frontend` build runs `scripts/refresh-ire-saved-feed.mjs` after `vite build`, which refreshes the copy inside `frontend/dist` from the live feed (best effort, never touches the source tree; `IRE_FEED_REFRESH=0` skips it).
- Routing: `/ire` and `/ire/` rewrites in `vercel.json` (before the SPA catch-all), the matching `@ire` block in `deploy/gravebuster/Caddyfile`, and a `/ire` route in `App.tsx` (`modules/ire/IrePageRedirect.tsx`) so in-app `<Link to="/ire">` clicks do a full page load. Sitemap lists `/ire`.
- `projects.json` id 11: added a "Today's Picks" link to `/ire` ahead of the GitHub link.
- Tests: `pnpm test:ire-page` (static wiring + saved feed shape + no key-like strings) and `pnpm test:ire-page:browser` (Playwright on the built site: live render of both tabs, blocked-feed fallback, stale banner with a mocked clock, both-fail error state, 390px mobile, no console errors; `-- --live` hits the real feed). Both run in CI.

## Next step

- Owner review of the copy, then merge.
- When an IRE MCP server exists, replace the "planned" note in the For agents section.
