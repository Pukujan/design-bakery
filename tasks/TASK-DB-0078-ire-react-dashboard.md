# TASK-DB-0078 — the IRE page learns the image tier, and gains a React dashboard

| Field | Value |
|-------|-------|
| **Created** | 2026-10-07 |
| **Issue** | [#60](https://github.com/Pukujan/design-bakery/issues/60) (design work order for the IRE Today's Picks page) |
| **Status** | Built and verified locally; not deployed |

## Goal

Two things, because they answer the same request.

First, the daily feed grew a third list. IRE shipped an image and multimodal tier
(`tiers.utility`) in the IRE repo's PR #100, and `/ire` still rendered only the two text
tiers, so that list was invisible to anyone reading the page. The page had to learn it.

Second, the page was a hand-written HTML file with no charts. The owner asked for the
picks to be readable as charts and graphs, built through the `app-builder-automation`
generator rather than by hand.

## What changed

### The static page keeps working, and learns the image tier

`frontend/public/ire/index.html` reads the feed and now understands the third list:

- The tier switch grows a third tab, "Image and multimodal", and it appears only when the
  feed carries `tiers.utility`. A feed without that key hides the tab and the section
  instead of showing an empty one.
- `tiers.utility` gets its own panel and table. Its rows carry the open-weight verdict:
  a verified licence, or listed with an unverified licence. An unverified row prints
  "Licence not verified" and links no licence, and it is never recommended.
- The two text tiers keep the older, stricter rule — a row whose `open_weight` is not
  `true` is dropped before render. The utility tier keeps `true` and `null` and drops
  `false`, which is what the feed contract says.

`scripts/refresh-ire-saved-feed.mjs` learned the same rule, so the committed fallback
copy can hold a utility tier without the refresh rejecting it. That mattered: the old
check asserted `open_weight === true` for every entry in every tier, so the first
fallback carrying an unverified row would have failed the build.

`frontend/public/ire/today.saved.json` was refreshed from the live feed and now carries
the tier (`generated_at` 2026-10-07T17:47:24Z).

### A React dashboard, generated and vendored

The dashboard was produced with `app-builder-automation`, the owner's spec-to-React-app
generator. It runs the whole generation loop — design direction, file writes, a typecheck
gate and a completeness gate that requires each declared `data-testid` to appear as a
literal JSX attribute — against the InferHub endpoint. The run passed on step 48 with 52
files written, and chose a warm-paper palette (paper `#F4F2EA`, forest `#2F6B4F`, oxide
`#A6501F`) with Space Grotesk, IBM Plex Sans and IBM Plex Mono.

The generator was driven without touching its repository. Its system prompt is assembled
from exported constants in `server/src/prompts.mjs`, and one of them, `DATA_ACCESS`, is
hardcoded to a personal-branding SQLite contract (`GET /api/views/:name` over nine fixed
view names). A wrapper in the ACS scratch tree re-imports those constants, swaps that one
block for the IRE feed contract, and calls the same `generate()` the CLI calls. The
generated app is a static frontend: it fetches the public feed URL in the browser, holds
no key and has no backend.

The app lives in `frontend/ire-app/` and is served at `/ire/app/`. It renders eight
sections, each carrying the hook the spec named:

| Hook | Section |
|---|---|
| `picks-hero` | Header, with the day, the build time and a stale warning |
| `tier-tabs` | The three-way tier switch |
| `price-chart` | Input and output price per model, as bars (recharts) |
| `capability-chart` | Capability against blended price, as a scatter |
| `health-summary` | Route-health counts for the visible tier |
| `picks-table` | One row per entry, with route, prices, health and verdict |
| `utility-section` | The image and multimodal list |
| `provenance` | The receipts: commit, snapshot digest, feed link |

`frontend/ire-app` is deliberately not a pnpm workspace member. It wants Vite 8 and
Tailwind 3; the root workspace pins Vite 6.3.5 through a `pnpm.overrides` entry and runs
Tailwind 4. Adding it to `pnpm-workspace.yaml` would rewrite the shared lockfile and break
the `--frozen-lockfile` installs in Docker and CI. It keeps its own lockfile instead, and
`scripts/build-ire-app.mjs` installs it with `--ignore-workspace` (without that flag pnpm
climbs to the root workspace and leaves `@vitejs/plugin-react-swc` unresolvable), builds
it, and copies the output into `frontend/dist/ire/app/`. The `frontend` build script runs
it between `vite build` and the feed refresh, so Docker and CI get it for free.

The app's router carries `basename="/ire/app"`. Without it the app boots, matches its
catch-all route and renders "404 — Oops! Page not found" at its own URL, because
`BrowserRouter` sees `/ire/app/` where the route is `/`.

## Evidence

Run locally against the built output in `frontend/dist`:

- `pnpm --dir frontend run build` — cold build from a deleted `node_modules` and `dist`;
  the site builds, the app builds and lands in `frontend/dist/ire/app/`, the feed refresh
  runs. Exit 0.
- `pnpm test:ire-app:browser` — new. Serves the built tree, answers the feed with the
  committed copy, and asserts every required hook renders, the tier switch changes the
  table, an unverified utility row links no licence, no closed model vendor name or
  price-promo wording reaches the rendered text, 375px does not scroll sideways, and the
  console stays clean. Passes.
- `pnpm test:ire-page` — the static page checks, including the new utility-tier block.
  Passes.
- `pnpm test:ire-page:browser` — 17/17, including the new utility-tab scenario. Passes.
- `pnpm lint`, `node scripts/find-orphans.mjs --strict`, `pnpm --dir frontend run
  typecheck` — all pass. `frontend/ire-app/**` is added to the eslint ignores because it
  carries its own config; the orphan detector's roots do not include it.

The dashboard was also opened by hand at 1440px and 375px. It reads as a data tool: the
tier switch re-scopes the table, both charts and the health summary; the utility section
shows the single unverified row held back with its reason; the provenance footer prints
the commit, the snapshot digest and a link to the raw feed.

## Non-goals

- **Retiring the static page.** The static page still owns `/ire`. The dashboard is
  additive at `/ire/app/`, and the static page links to it. The static-only contract in
  issue #60 assumed no React; superseding it is a separate decision, and the two browser
  gates are written against the static page's internals, so that flip is its own change.
- **Deploying.** Nothing here is on gravebuster yet. The Caddyfile and `vercel.json` both
  gained `/ire/app` directory-index rules so the subpath serves correctly on either host,
  but the deploy has not run.

## Next step

Deploy to gravebuster with `deploy/gravebuster/deploy.sh` and check `/ire/app/` on the
live hostname, including that the app reaches the feed through the tunnel.
