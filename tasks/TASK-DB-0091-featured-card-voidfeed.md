# TASK-DB-0091 — featured card: Voidfeed

| Field | Value |
|-------|-------|
| **Created** | 2026-10-13 |
| **Branch** | `task/TASK-DB-0091-featured-card-voidfeed` (branched from `origin/main` @ `dee8a21`) |
| **Status** | In progress |

## Goal

Add **Voidfeed** to the homepage Engineering Projects showcase as the newest card, and host the game itself at `https://voidfeed.design-bakery.com`.

The game is `Pukujan/voidfeed` (private): a single-page 3D space-horror arcade game on three.js, built in one shot with an AI coding agent as a capability experiment. Every visual and sound is generated at runtime — no image or audio files.

## Done

### 1. Hosting (the game's own repo)

Deploy kit added to `Pukujan/voidfeed` under `deploy/gravebuster/`, mirroring the design-bakery / github-planets pattern:

- `Dockerfile` — `node:24-bookworm-slim` builds the Vite client, `caddy:2-alpine` serves `dist/`. **Pins `pnpm@10.32.1` explicitly** via `corepack prepare` — voidfeed's `package.json` has no `packageManager` field, so the github-planets Dockerfile's bare `corepack enable` would not put a usable pnpm on PATH.
- `Caddyfile` — static serve on `:80`, `/healthz` liveness endpoint, `/assets/*` immutable cache, SPA fallback to `index.html` for everything else.
- `docker-compose.yml` — container `voidfeed-web`, published `127.0.0.1:8093` only.
- `docker-compose.edge.yml` — attaches the external `study-os_edge` network with the alias `voidfeed-web`.
- `.env.example`, `Dockerfile.dockerignore`.

Deployed to the Mac at `~/apps/voidfeed` (transferred with `git archive` — tracked files only, so no `node_modules` or `dist` crosses the wire; the Mac has no `gh`). Built and started with `docker compose up -d --build`.

**Cloudflare wiring** (the tunnel is token-managed and remotely configured, so its ingress lives in the API, not on disk):

- Proxied CNAME `voidfeed.design-bakery.com` → `58bfc693-1741-4782-9b2d-ee3c481bcec5.cfargotunnel.com`.
- Tunnel ingress rule inserted **before** the `http_status:404` catch-all: `voidfeed.design-bakery.com` → `http://voidfeed-web:80`. The PUT is a full replacement, so the body was derived from the GET result (never hand-authored), the pre-change config was saved as a rollback artifact, and the readback was diffed to prove no other rule moved (version 9 → 10).

### 2. Homepage card

`frontend/src/app/portfolios/endtoend-engineer/engineering/projects.json` — appended id 14:

| Field | Value |
|---|---|
| id | 14 (next free; 12 and 13 are ACS and Orbitgraph) |
| startedAt | 2026-10-13 — repo creation, `Pukujan/voidfeed` (private; 2026-10-14T00:10:19Z = 2026-10-13 ET) |
| status | ongoing |
| links | one, `Live App` → the absolute `https://voidfeed.design-bakery.com` |

Voidfeed's `startedAt` (2026-10-13) is newer than Orbitgraph's (2026-10-11), so it renders as the big **FEATURED** card and Orbitgraph becomes the first small card. 14 projects still gives 4 carousel pages.

**Why the link is absolute:** `isInternalAppPath` (`frontend/src/app/lib/caseStudyRoutes.ts:30`) turns any relative `/...` URL into an in-app React-Router `<Link>`; this app is served by a separate container, not a route in the SPA. **Why there is no GitHub link:** the repo is private (a private-repo link would 404 for every visitor) — the same rule the Orbitgraph card follows.

## Copy rules applied

Per TASK-DB-0090: no contrast reveals, no negation lists, no trailing pile-ons, no self-answered questions / colon reveals, no stock openers, no em dashes in the tagline. One fragment and one list-of-three at most. No invented metrics — "four worlds" is `STAGES.length` in the game's `src/game/config.ts`. Honest scope note carried.

## Evidence / facts used

- `Pukujan/voidfeed` private, created 2026-10-14T00:10:19Z. `src/game/config.ts:67-160` defines exactly four `STAGES`; `AI_RULES.md` documents the loop (guardians → checkpoints → the feed), the right-mouse cutting beam, and that all assets are procedural; `index.html:12-17` loads Anton + Chakra Petch from Google Fonts (one runtime external dependency — the only non-procedural asset).
- Palette: the game's void `#05030a` and blood `#e33b7e`; the card uses a dark plum `#1A0A16` (the featured card draws white text on `project.color`) with `#E33B7E` as the accent.
- Live URL returns 200; the game renders its start screen and starts a run.

## Tests added

`scripts/test-homepage-content-stability.mjs`:
- Voidfeed exists, has id 14, `startedAt` 2026-10-13, and its `Live App` link is the absolute `https://voidfeed.design-bakery.com`.
- Voidfeed is `rendered[0]` — the newest project renders as the featured card.
- No card links to `github.com/Pukujan/voidfeed` (private-repo leak guard, alongside the existing github-planets guard).

## Gates

`pnpm test:homepage-content`, `test:ire-app`, `test:icon-coverage`, lint, build, frontend typecheck, `find:orphans --strict`.

## Notes

- **TASK-DB-0089 does not exist** anywhere in the repo; this takes the next free id above the highest used (0090).
- The tunnel config rollback artifact is kept at `D:\development\void feed\.cf-backup\tunnel-config.before.json` until the task is closed.
- `study.design-bakery.com` returns 502 — **pre-existing and unrelated**: its `api:8000` origin is a gravebuster stack that is not running on the Mac. Rule 0 is byte-identical before and after this change.
