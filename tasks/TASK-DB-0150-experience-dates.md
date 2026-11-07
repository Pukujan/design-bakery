# TASK-DB-0150: Experience dates match LinkedIn

**Goal.** The site's experience dates should match LinkedIn and Pujan's resume.

**Done.** In `relevant-experience.json` and `relevant-experience-rendered-list.json` (`frontend/src/app/portfolios/endtoend-engineer/engineering/`):
- Nepasoft LLC: Mar 2024 - Oct 2025 · 1 yr 8 mos (was Dec 2025 · 1 yr 10 mos).
- Kulchan Pvt. Ltd: Jun 2016 - Nov 2019 · 3 yrs 6 mos (was Dec 2018 · 2 yrs 7 mos).

The Fitzgerald Law Firm stays Feb 2026 - Jun 2026, as on LinkedIn.

**Evidence.** `node scripts/test-homepage-content-stability.mjs` passes.

**Next.** The live site reads these from Octo `cms_documents` (`relevant_experience_content`, `relevant_experience_rendered`): after merge, write both to Octo.
