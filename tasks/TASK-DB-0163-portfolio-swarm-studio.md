# TASK-DB-0163: Swarm Studio in the work list

**Goal.** The owner asked for Swarm Studio (the Hermes Agent hackathon plugin, public repo Pukujan/swarm-studio) on the portfolio.

**Done.**
- New project 21 **Swarm Studio**, category shipped. Copy from the repo's README and `docs/brand/PITCH.md`; start date is the repo creation date.
- Pictures: `frontend/public/lab/projects/swarm-studio.webp` (1400×1050) and `frontend/public/og/projects/swarm-studio.jpg` (1200×630), from a Studio screenshot of the Wildflower Records build. `LabWork.tsx` `PROJECT_MEDIA` gains 21.
- Order (frontend and backend `projectOrder.ts`): Swarm Studio follows Riley in All and Shipped.
- The live list is Octo `cms_documents` (endtoend-engineer / engineering_projects). It matched the repo file before this change; the entry is appended there after the deploy, not with "Push repo defaults".
- `scripts/test-homepage-content-stability.mjs` checks the new entry.
