# TASK-DB-0143: site positioning refresh (AI product engineer, one-person studio)

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
