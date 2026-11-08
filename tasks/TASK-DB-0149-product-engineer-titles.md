# TASK-DB-0149: Titles say product engineering

**Goal.** Much of Pujan's work was AI product engineering or product engineering under other titles. The experience section should say so, with The Fitzgerald Law Firm as forward deployed engineering, and say what Design Bakery work is: working directly with the people who have the problem, discovery to production in weeks.

**Done.** Both `relevant-experience.json` and `relevant-experience-rendered-list.json` (`frontend/src/app/portfolios/endtoend-engineer/engineering/`):
- Subtitle: "Product engineering all the way through: production AI, full-stack products and front-end work."
- Titles: Nepasoft "AI Product Engineer"; ekagajpatra "Lead Product Engineer · Design & Full-Stack"; Perpetual Motion "Frontend Product Engineer"; Kulchan "Product Engineer · Solutions" (rendered list); Fitzgerald "Forward Deployed Engineer · Legal AI" with a new summary.
- Design Bakery: new summaries (licensed paralegals and litigators, licensed real estate agents, designers and artists, AI engineers; discovery to production in weeks), three highlights, tags "Forward Deployed" and "Discovery to Production".
- Nepasoft's first sentence says "AI Product Engineer"; ekagajpatra's longer summary adds using ChatGPT to go from wireframes to frontend code the same day.

LinkedIn was updated to match by hand with Pujan approving each save. The originals (LinkedIn's 12 entries and old headline, and these two files as they were on `main`) are kept in Octo, table `linkedin_snapshots`.

**Evidence.** `node scripts/test-homepage-content-stability.mjs` passes.

**Next.** The live site reads these from Octo `cms_documents` (`relevant_experience_content`, `relevant_experience_rendered`): after merge, write both to Octo, with the owner's OK. Dates still differ from LinkedIn: Kulchan ends Dec 2018 here, Nov 2019 there; Nepasoft Dec 2025 here, Oct 2025 there.
