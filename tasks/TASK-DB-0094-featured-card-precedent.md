# TASK-DB-0094 — featured card: Precedent

| Field | Value |
|-------|-------|
| **Created** | 2026-10-17 |
| **Branch** | `task/TASK-DB-0094-featured-card-precedent` (branched from `origin/main` @ `e6cf510`) |
| **Status** | In progress |

## Goal

Replace Starfield (TASK-DB-0093) with **Precedent** as the homepage's lead Engineering Project. The owner's direction: position the card around the problem it solves and its relevance to legal workflow AI, not around how fast it was built or the hackathon result.

## Card

`projects.json` id 15 keeps its slot. Category `shipped`, status `ongoing`, `startedAt` 2026-10-16 (repo creation). Live app `https://arize.design-bakery.com`, public repo `Pukujan/arize-ai-hackersprint`.

The project is the Daytona HackSprint #6 × Arize AI (NYC) build: a multi-agent legal research system that writes short cited memos, verifies every citation against what it retrieved, and traces groundedness and citation safety in Arize. It placed Top 8 of 380 participants (65 submissions).

Copy leads with the problem — a chatbot can cite a case that does not exist — and what Precedent does about it. The placement appears as one stat, not as the card's framing.

## Done

- `projects.json` id 15 is Precedent; Starfield is removed.
- `projectOrder.ts` leads with Precedent in `ALL_LEAD_TITLES` and the `shipped` order.
- `scripts/test-homepage-content-stability.mjs` asserts the new lead, id, date, category, live URL and repo URL.

## Checks

- `node scripts/test-homepage-content-stability.mjs`
- Browser, desktop and 390px: default view features Precedent; Shipped filter leads with it.
