# TASK-DB-0120 — dead project links and project images that did not match the projects

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0120-project-links-images` (from `main`) |
| **Status** | In review |

## Goal

The Website Copilot "Live Demo" pointed at a host that no longer exists, other project links went nowhere, and the key-art images were generic still lifes that did not show what each project does. The owner asked for both to be fixed, and for the images to stay space themed, made with their Codex CLI.

## Links (every project link tested, 2026-11-02)

- Website Copilot: Live Demo `demo.design-bakery.com` (Cloudflare 530, no service) now goes to `copilot.design-bakery.com/#demos`; Concept Video to `/#video`. Both anchors exist on the live copilot site.
- Study OS: Live App `study.design-bakery.com` (530, not deployed; no study stack on the VPS) removed. GitHub moved to `pukujan-lab-2/Study-os`.
- Precedent: GitHub moved to `pukujan-lab-2/arize-ai-hackersprint`.
- ONI: the private `create-modular-monolith` Source link removed (npm package link kept, it returns 200 from the registry).
- Legal Workflow Research: the private GitHub link removed from the card; on its case study page the dead "Technical Demo" (a 404 Vercel app), the "View GitHub" buttons and the four private or missing repos in the repo list are removed (the public `litigation-prompt-engineering` stays).
- `scripts/test-homepage-content-stability.mjs` now checks the new links and that Study OS does not link the dead host.

## Images

- All 15 regenerated with the Codex CLI image tool from one shared space art direction (near-black space, one accent colour per project taken from its `accentColor`, one central subject, no text), with a scene per project that shows what it does: Website Copilot (a dish beams a voice wave that fills a form field), Study OS (a prism and stepping-stone asteroids), Cortex (robots waiting at a vault airlock), Fossil (a meteorite cross-section with a fossil branching tree), ONI (a modular orbital station), Ekagajpatra (paperwork becoming a lit runway to a portal), Legal Workflow Research (a prism satellite routing papers to trays with a human review hand), Fluffy V4 (one creature in a row of different worlds), Eval Lab (scales weighing a judge orb against a crystal), Project Continuity (a memory capsule passed between spacecraft), Inference Recommendation (a rail junction with the best lane lit), Agent Custom Setup (a leader with a key and a queue), Orbitgraph (a constellation of repo planets), Voidfeed (a planet shattering into a black hole, a fighter firing), Precedent (a telescope pulling verified law books to a drafted page).
- Cropped to 4:3 and saved as 1400x1050 WebP, 57 to 125 KB each, over the old files in `frontend/public/lab/projects/`.

## Not done

- `/studyos` still redirects to the dead Study OS host in the legacy gravebuster Caddy config and Vercel config.
- Other case study pages were not scanned for dead links.
