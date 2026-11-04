# TASK-DB-0144 — Site positioning refresh (AI product engineer, one-person studio)

<!-- continuity:task {"acceptance":["Hero, About, Roles and project order carry the owner-approved copy; live products lead the showcase","Legal appears only as one past role (Fitzgerald, Feb-Jun 2026, last) and one project (Precedent)","Copilot identity answers and SEO descriptions no longer frame the work as legal","test-homepage-content-stability and copilot tests pass"],"depends_on":[],"goal":"Home page says who the owner is now: AI product engineer, one-person studio; legal out of the lead","id":"DB-0144","issue_url":"https://github.com/Pukujan/design-bakery/issues/209","next_action":"Owner reviews PR #210; on their go, merge (Komodo deploys) and write the six ete__ documents to Octo","owner":"claude-code","priority":"P1","protocol_version":"0.1.0-draft","schema":"project-continuity.task.v1","status":"active","why":"Owner asked; copy approved 2026-11-04"} -->

- Status: active
- Owner: claude-code
- Priority: P1
- Depends on: none

Owning issue: Pukujan/design-bakery#209.

**Goal.** The home page described the owner as a legal-focused AI/ML engineer. It should say who they are now: an AI product
engineer running a one-person studio that takes a product from research to design, build, deployment and monitoring on its
own infrastructure. Legal leaves the lead: one past role and one project (Precedent), lower on the page. Copy approved by the
owner on 2026-11-04.

**Done.**
- Content JSON (`frontend/src/app/portfolios/endtoend-engineer/engineering/`): new hero and About copy (three outcomes clients
  buy: live voice agents, answers from your own documents, a working demo in a week, plus "built, deployed, watched"), a line
  for hiring readers (forward-deployed / founding engineer) in the About callout, hero stats cut to "Awards Won · 6".
- Roles: "Design Bakery · AI Product Engineer · One-person studio", Jun 2026 - Present, leads (replaces "Independent AI
  Projects"). The Fitzgerald Law Firm stays as the one past legal role, retitled "AI Workflow Systems", Feb 2026 - Jun 2026,
  at the bottom (owner: the role ended in June).
- Projects: new cards NYC Map Agent (live) and Octo (public repo); startedAt is each repo's creation date. Legal Workflow
  Research leaves the showcase (its case-study page stays at its URL). `projectOrder.ts` leads with live products: Website
  Copilot, NYC Map Agent, Octo, Ekagajpatra, Study OS, Agent Custom Setup, Eval Lab, Precedent.
- Hard-coded copy: hero roles line (`LabHero.tsx`), the copilot's identity answers (`backend/src/copilot/answers.ts`, they
  said "mostly in legal"), site and page SEO descriptions, two skill-category labels.
- `test-homepage-content-stability.mjs` pins the new order, the studio role first and the legal role last.

**Evidence.** `node scripts/test-homepage-content-stability.mjs`, `test:copilot-answers`, `test:copilot-router`,
`test:copilot-chips`, `test:icon-coverage`, `test:og-routing`, `test:og-contract` pass; frontend typecheck and build pass.
Not checked in a browser (the Mac's disk was full).

**Next step (needs the owner's go).** The live page reads these documents from Octo (`cms_documents`, keys `ete__*`), with this
JSON only as fallback. After merge, write the same six documents to Octo (`engineering_hero_content`,
`engineering_about_content`, `engineering_projects`, `engineering_skills`, `relevant_experience_content`,
`relevant_experience_rendered`), or the old copy stays live. Merging to `main` deploys through Komodo
(`design-bakery-deploy-on-push`).

## Checkpoint log

No checkpoints yet.

### 2026-11-04 20:15:06 UTC — claude-code

<!-- continuity:checkpoint {"agent":"claude-code","blocked":[],"changed":["none"],"completed":["work completed"],"decisions":["no new decisions"],"evidence":["no external evidence recorded"],"next_action":"Owner reviews PR #210; on their go, merge (Komodo deploys) and write the six ete__ documents to Octo so the live page shows the new copy.","protocol_version":"0.1.0-draft","schema":"project-continuity.checkpoint.v1","task_id":"DB-0144","timestamp":"2026-11-04T20:15:06Z"} -->
<!-- continuity:checkpoint-operation {"payload_sha256":"1edf2e4419db2b2277816252fd093bc2474dae12c3cdfeca4a4dcfddb6758f53","request_id":"fb20d9e80bf14717936015ba849ca11d","schema":"project-continuity.checkpoint-operation.v1","task_id":"DB-0144"} -->

Completed:
- work completed

Evidence:
- no external evidence recorded

Decisions:
- no new decisions

Changed:
- none

Blocked/uncertain:
- none

Next:
- Owner reviews PR #210; on their go, merge (Komodo deploys) and write the six ete__ documents to Octo so the live page shows the new copy.

## Handoff

Read PROJECT → CURRENT → this task → minimum relevant spec. Checkpoint before stopping.
