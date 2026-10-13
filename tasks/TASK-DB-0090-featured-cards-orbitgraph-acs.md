# TASK-DB-0090 — featured cards: Orbitgraph + Agent Custom Setup

| Field | Value |
|-------|-------|
| **Created** | 2026-10-13 |
| **Branch** | `task/TASK-DB-0090-featured-cards-orbitgraph-acs` (branched from `origin/main` @ `8f629c4`) |
| **Status** | In progress |

## Goal

Add two featured projects to the homepage Engineering Projects showcase, with the card copy written under the owner's PRD-agent copy rules (the vendored `marketingskills/copywriting` v2.2.0 skill + the PRD-agent brand-language boundaries).

1. **Orbitgraph** — the repo-cartography app live at `https://www.design-bakery.com/github-planets` (served by its own container through the Cloudflare tunnel, not by design-bakery's own `vercel.json` / Caddyfile).
2. **Agent Custom Setup** — the multi-agent coordination pack, live at `https://acs.design-bakery.com`.

## Copy rules applied

- No contrast reveals ("Not X. Y."), no negation lists ("No X, no Y, no Z"), no trailing pile-ons, no self-answered questions / colon reveals, no stock openers, no em dashes in the tagline.
- One fragment and one list-of-three per card, at most.
- No invented metrics and no numeric claims without a supporting artifact; no unexplained acronyms; no generic product-speak.
- Every card carries the house honest scope note.

## Done

- **Project data** (`frontend/src/app/portfolios/endtoend-engineer/engineering/projects.json`): appended ids 12 and 13.
  - **12 Agent Custom Setup** — reuses the id the deleted 2026-10-07 card held, so an old `/#project-12` deep link opens ACS again. Copy written fresh about the product itself, not the rejected onboarding page.
  - **13 Orbitgraph** — the newest `startedAt` (2026-10-11), so it renders as the big featured card.

  | Rendered order | startedAt | Source |
  |---|---|---|
  | Orbitgraph | 2026-10-11 | repo creation, `Pukujan/github-planets` (private; 2026-10-11T13:43Z) |
  | Agent Custom Setup | 2026-09-25 | repo creation, `Pukujan/agent-custom-setup` (public; 2026-09-25T20:31Z) |

  `startedAt` is when work began (repo creation), matching the file's convention for every other card; the ACS site's 2026-10-07 publication is a milestone, not the start.

- **Orbitgraph links**: one, `Live App` → the **absolute** `https://www.design-bakery.com/github-planets`. Absolute because `isInternalAppPath` (`frontend/src/app/lib/caseStudyRoutes.ts:30`) turns any relative `/...` URL into an in-app React-Router `<Link>`, and that path is a separate container, not a route in this SPA. No GitHub link: the repo is **private** (a private-repo link would 404 for every visitor).
- **Agent Custom Setup links**: `Live Site` → `https://acs.design-bakery.com` and `GitHub · Public` → `https://github.com/Pukujan/agent-custom-setup` (public).

## Evidence / facts used (no invented numbers)

- **Orbitgraph** (`D:\development\github-planets`): `index.html` title "Orbitgraph — repo cartography"; README: a GitHub account rendered as a solar system, each repo a planet, primary language → color, 52 weeks of commit activity → size and ring, shared language → link, click a planet for its card; without a `GITHUB_TOKEN` it renders clearly-labelled sample planets. Stack React / TypeScript / three.js / Vite + Nitro / Tailwind. Repo `Pukujan/github-planets` private, created 2026-10-11T13:43:49Z. Live URL returns 200.
- **Agent Custom Setup**: repo `Pukujan/agent-custom-setup` public, created 2026-09-25T20:31:19Z; description: the multi-agent hotload pack — join-order roles, boss lease + claim queue, agent-less watchdog, proposals → PRs. `.coord/assignment.json` (the pack installed in this repo): boss lease default 30 min, claim queue **FIFO** after a vacancy, watchdog is agent-less ~10 min liveness and **"Watchdog != failover"** — it writes a vacant seat; the queue moves the lease. Site palette `#243028` pine / `#d6a15a` brass. Live URL returns 200.

## Tests added

`scripts/test-homepage-content-stability.mjs`:
- Orbitgraph's `Live App` link is the absolute design-bakery URL, and **no** card links to `github.com/Pukujan/github-planets` (private-repo leak guard).
- ACS carries both links and `startedAt` 2026-09-25; Orbitgraph carries `startedAt` 2026-10-11.

## Gates

`pnpm test:homepage-content`, `test:ire-app`, `test:icon-coverage`, lint, build, frontend typecheck, `find:orphans --strict`.
