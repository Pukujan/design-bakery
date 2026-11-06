# TASK-DB-0145 — Maybe, Maybe Home and Riley as three portfolio projects

| Field | Value |
|-------|-------|
| **Created** | 2026-11-06 |
| **Branch** | `task/TASK-DB-0145-maybe-projects` (from `main`) |
| **Status** | In review |

## Goal

The owner hosts the Maybe family on three subdomains and wants each shown as its own project, with a space-themed cover that says what its page says. The "Website Copilot" card no longer matched its site: maybe.design-bakery.com (and copilot.design-bakery.com, which serves the same page) is now Maybe, a story page about people alone with a letter, a form or a manual, and its `#demos` and `#video` anchors are gone.

## Done

- Card 16 is now **Maybe** (slug `maybe`, was `website-copilot`): copy from the live page, links `maybe.design-bakery.com` and `/tax` ("Talk to it yourself" on the page). Same id and start date.
- New **Maybe Home** (id 19, home.design-bakery.com, repo pukujan-lab-2/first-home-nyc) and **Riley** (id 20, riley.design-bakery.com and its phone line, repo pukujan-lab-2/nurse-screen). Both repos are private, so no repo links.
- Covers made with the Codex CLI image tool, with two existing covers attached as the style reference: Maybe (a person at a moon-outpost table, a warm helper reading one line of a form with them), Maybe Home (eight stepping stones to a brownstone on an asteroid, a key at the door, speech bubbles beside the buyer), Riley (a nurse's phone signal landing on one lit calendar day at an orbital hospital). 1400x1050 WebP; `website-copilot.webp` removed.
- Showcase order (frontend and copilot `projectOrder.ts`) leads with Maybe, Maybe Home, Riley, then NYC Map Agent. `scripts/test-homepage-content-stability.mjs` checks the new cards.

## Evidence

- All three hosts and `maybe.design-bakery.com/tax` answer 200 (2026-11-06).
- `node scripts/test-homepage-content-stability.mjs` passes.

## Next step

After merge, write `projects.json` to Octo (`cms_documents`, portfolio `endtoend-engineer`, collection `engineering_projects`): the live page and the copilot read Octo first, so the cards don't change until then. `/work/website-copilot` no longer exists; the old link 404s.
