# TASK-DB-0092 — homepage project categories

| Field | Value |
|-------|-------|
| **Created** | 2026-10-14 |
| **Branch** | `task/TASK-DB-0092-project-categories` (branched from `origin/main` @ `db0372b`) |
| **Status** | In progress |

## Goal

Group the homepage Engineering Projects carousel so the default view is everything, with shipped products and system features ahead of the rest, and so each bucket can be filtered on its own.

## Categories

| Category | Projects, in showcase order |
|---|---|
| Shipped | Ekagajpatra, Study OS |
| Systems | Agent Custom Setup, Cortex, Project Continuity Modules, ONI vs My Agent Ready Architecture |
| Research | Eval Lab, Legal Workflow Research, Inference Recommendation Engine, FOSSIL |
| Experiments | Orbitgraph, Fluffy V4, Voidfeed |
| Client Work | SaaS Dashboard Systems |

Voidfeed had no category when it landed. It sits with the other play projects.

## Done

- Each project in `frontend/src/app/portfolios/endtoend-engineer/engineering/projects.json` has a `category`.
- `orderProjectsForShowcase` in `frontend/src/app/lib/projectOrder.ts` orders the carousel. The default **All** view leads with Ekagajpatra, Eval Lab, and Agent Custom Setup, then the remaining shipped products and systems, then the rest of research, experiments, and client work.
- `EngineeringProjects.tsx` renders filter chips (All, Shipped, Systems, Research, Experiments, Client Work), a category badge on each card, and switches the filter when a `#project-<id>` deep link points at a card outside the current filter.
- `scripts/test-homepage-content-stability.mjs` asserts the categories and the curated order. `startedAt` stays as evidence. The date sort helper remains, and the carousel no longer uses it.

## Checks

- `node scripts/test-homepage-content-stability.mjs`
- Browser, desktop and 390px: each filter, clicking a small card into the feature slot, `#project-2` (ONI, stays on All), and `#project-3` from Experiments (switches to Shipped and features Ekagajpatra).
