# TASK-DB-0080 — the IRE page learns the image tier, and gains a React dashboard

| Field | Value |
|-------|-------|
| **Created** | 2026-10-07 |
| **Issue** | [#60](https://github.com/Pukujan/design-bakery/issues/60) (design work order for the IRE Today's Picks page) |
| **Merged** | [#101](https://github.com/Pukujan/design-bakery/pull/101) (`4640138`) |
| **Status** | Deployed and verified live at `https://www.design-bakery.com/ire/app/` |

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
- **Deploying on its own schedule.** The Caddyfile and `vercel.json` both gained
  `/ire/app` directory-index rules, and the app is now live (below). What is *not* done is
  any coordination of deploys: the box deploys only when someone runs `deploy.sh` (the
  auto-deploy timer is installed but not enabled), so two people deploying at once can
  collide — which is exactly what happened here.

## Deployed

`deploy/gravebuster/deploy.sh` ran on gravebuster against main and the site is live:

- `https://www.design-bakery.com/ire/app/` → 200, `<title>IRE Daily Picks</title>`, with
  `/ire/app/assets/index-*.js` and `.css` both 200. The shell is the dashboard's own, not
  the site's SPA fallback. *(True when this shipped. TASK-DB-0081 moved the dashboard to
  `/ire/`, so `/ire/app/` 301s and `/ire/app/assets/*` now falls through to the SPA
  fallback — see that task's boundaries.)*
- The dashboard renders in a real browser with all eight hooks present (`picks-hero`,
  `tier-tabs`, `price-chart`, `capability-chart`, `health-summary`, `picks-table`,
  `utility-section`, `provenance`), reads the live feed (list day "Wed 7 Oct 2026",
  built 13:47 EDT) and logs no console errors.
- The feed itself is reachable from the browser: `raw.githubusercontent.com` answers the
  `data/ire-feed` copy 200 with `Access-Control-Allow-Origin: *`, so no proxy is needed.

### Incident during the deploy: two deploys raced, the API container was lost

Merging is not the deploy — the auto-deploy timer is not enabled — so this task's deploy
was run by hand. While it was building, a **second session** in the same checkout started
its own `deploy.sh` for main's later commit `14bc3fce3f3a`. The two runs interleaved:
each rebuilt and swapped `web`, and their `api` swaps collided on the same container name.
Docker's compose recreate failed with `No such container: ec034ace994f…`, leaving the API
container in `Created` — so **`/api/*` answered 502 on the live site** (the blog API and
the crawler link previews) until it was put back.

Recovery: re-ran the step the failed deploy intended —
`DESIGN_BAKERY_API_IMAGE=design-bakery-api:14bc3fce3f3a-20261007T222359Z docker compose
-f docker-compose.yml -f docker-compose.edge.yml up -d --no-deps api`. The first attempt
inherited a stale container name (`ec034ace994f_design-bakery-api`), which would have
broken `docker inspect design-bakery-api` on the next deploy, so the container was removed
and recreated under its compose name. Both containers are now healthy
(`design-bakery-web` and `design-bakery-api` on `14bc3fce3f3a-…`), `/health` is 200, and
`/api/public/blogs` is 200 through Caddy.

The stale `.deploy-state` (it still names `4335435`) is not a problem: the next deploy
compares against the remote and would re-deploy, which is the safe direction.

**Lesson for the next person:** one deploy at a time per box. `deploy.sh` has no lock, and
the collision cost a live 502 on `/api/*`.

## Next step

None — the page and the dashboard are live. Two separate decisions remain, both the
owner's: whether to retire the static `/ire` page now that the dashboard exists (issue
#60's static-only contract would need a deliberate revision), and whether to enable the
auto-deploy timer so a merge deploys without a hand-run script.
