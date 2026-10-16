# TASK-DB-0093 — featured card: Starfield

| Field | Value |
|-------|-------|
| **Created** | 2026-10-16 |
| **Branch** | `task/TASK-DB-0093-featured-card-starfield` (branched from `origin/main` @ `8fdb914`) |
| **Status** | In progress |

## Goal

Put **Starfield** on the homepage Engineering Projects showcase as the featured card. The live app is already at `https://legal-rag.design-bakery.com`. The public repo is `Pukujan/legal-rag`.

## Card

`projects.json` id 15. `startedAt` is the repo creation date `2026-10-16` (`2026-10-16T07:48:16Z`). Category `shipped`, status `ongoing`.

The default All view leads with the named titles in `projectOrder.ts`. Starfield is first, so it renders in the FEATURED slot. Ekagajpatra, Eval Lab, and Agent Custom Setup stay on the same page as the three smaller cards.

The live link is absolute. A relative path would become an in-app route, and this app is a separate container. The GitHub link is the public site repo.

Copy is what the live app does: one question, word matches and citation links on the map, and a passage behind each sentence in the answer. Logged questions are published on the Benchmarks page.
