# TASK-DB-0161: Reach, impact and "what I can do with AI" on the site

**Goal.** The owner says their production platforms have served at least 100,000,000 people across hosted platforms, SaaS applications and design and development tools. That figure, the numbers from their research and the outcomes of their projects were missing from the site, and so was a clear statement of what they can do with AI.

**Rule.** No invented metric. The only figure without a file behind it is 100M+, which is the owner's own (given 2026-11-09). Every other number traces to a file below.

**Done.**
- Hero: a reach line under the title. Removed the same day at the owner's request ("in such a weird place"); the 100M+ figure stays as the first tile of the AI section.
- Home: a new "What I can do with AI" section after About (`LabCapabilities`), with six impact figures (`about.json` `impact`) and six capabilities (`about.json` `aiSection`).
- Project pages: an "Outcome" line on Ekagajpatra, Precedent, Eval Lab, Riley and Cortex (`projects.json` `outcome`).
- Research: a "Result." line for papers 008 to 011 on `/research` and on each paper page (`researchPapers.ts` `result`). Papers 001 to 007 report no original results, so they get none.
- The copilot's site brief carries the reach, impact, capabilities, outcomes and results.
- Docs: `additionals/doc/project-guide.md` (how the live page reads content from Octo; "Numbers on the site").

## Sources

| Figure | Source |
|---|---|
| 100M+ people served | The owner, in chat, 2026-11-09 |
| 35,000+ registered users (Ekagajpatra) | Existing site copy; case study `frontend/extras/Create Presentation Case Study/src/app/components/v2/ImpactSectionV2.tsx:11` (internal metric, not audited) |
| 190 s to 28 s, about 85% faster; completion 34% to 87% | Same case study, `PrototypeTestingSectionV2.tsx:470-499` ("Measured over 8 months of iteration", line 231) |
| Top 8 of 380 participants, 65 submissions (Precedent) | `tasks/TASK-DB-0094-featured-card-precedent.md:17` |
| 25 judges, 760 questions, best 99.2%; 84.5% vs 97.4%; 99.8% on 80.4% answered | `frontend/src/app/modules/research/content/db-r-2026-010.md:10, 161, 176-177` |
| 2.0 s median voice reply, 185 of 190 under 4 s | `additionals/doc/copilot-spec.md:123` (backend only, scripted, 2026-11-05) |
| `cite` held in 35 of 35 runs | `additionals/doc/copilot-spec.md:110` |
| Voice match 98% at 1.0 s | `voice-agent/README.md:28` (14 LibriSpeech speakers, clean set) |
| Nepasoft up to 99% on internal benchmarks | Existing site copy, `relevant-experience.json` (the owner's) |
| 16 of 16 gamed artifacts rejected; rubric over model (n=18) | `db-r-2026-008.md:169, 249-252` |
| 11 issues, all reproduced, 6 code defects; loses 5 of 9 rows | `db-r-2026-009.md:136, 366-368` |
| Two CI guards caught real defects on landing | `db-r-2026-011.md:3, 10-11` (rounded on purpose) |

## Open, needs the owner

- What makes up the 100M+: which platforms, and is it people reached, users or visits.
- Ekagajpatra: the card says "99% Cost Reduction" and "5 Awards / Grants"; the case study says 6 awards and both "up to 99%" and "90%+". No source for either. Not touched here.
- ONI "500+ Agents Tested": no test log in this repo. Not touched here.
- Riley's "merge-to-deploy in about 3 minutes" (resume) is not in this repo; this repo's Komodo poll is every 5 minutes.

**Evidence.** Frontend typecheck, lint, `test:homepage-content` and backend build pass. Dev server: hero, the AI section, an Outcome line and Result lines checked at 800 px and 375 px wide, no horizontal scroll.

**Next.** After the merge, write `ete__engineering_about_content` and `ete__engineering_projects` to Octo so the live page shows them (the live page reads Octo first).
