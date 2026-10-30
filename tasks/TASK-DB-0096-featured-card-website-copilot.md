# TASK-DB-0096 — featured card: Website Copilot

| Field | Value |
|-------|-------|
| **Created** | 2026-10-30 |
| **Branch** | `task/TASK-DB-0096-featured-card-website-copilot` (branched from `origin/main` @ `0529fe5`) |
| **Status** | In progress |

## Goal

Add **Website Copilot** as the homepage's lead Engineering Project, ahead of Precedent. Owner direction: feature it, and do not link the GitHub repo.

## Card

`projects.json` id 16 (next free id). Category `shipped`, status `ongoing`, `startedAt` 2026-10-28 (repo creation of `Pukujan/voice-agent-research`, 2026-10-29T03:37Z = 2026-10-28 US Eastern). Links: live demo `https://demo.design-bakery.com` and concept video `https://copilot.design-bakery.com`. No GitHub link.

Copy leads with the problem (visitors abandon long forms and help pages) and what the copilot does: a voice call that asks one question at a time, fills fields only as the visitor confirms, never submits, answers from the company's documents or says it doesn't know, and keeps data in house.

## Done

- `projects.json` gains id 16 Website Copilot; Precedent keeps id 15.
- `projectOrder.ts` leads with Website Copilot in `ALL_LEAD_TITLES` and the `shipped` order.
- `scripts/test-homepage-content-stability.mjs` asserts the new lead, id, date, category, both URLs, and no GitHub link.

## Checks

- `node scripts/test-homepage-content-stability.mjs`
- `node scripts/test-icon-coverage.mjs`
- Browser, desktop and 390px: default view features Website Copilot; Shipped filter leads with it.
