# TASK-DB-0051 — consolidated Eval Lab judge paper (db-r-2026-010)

| Field | Value |
|-------|-------|
| **Created** | 2026-09-24 |
| **Issue** | [#45](https://github.com/Pukujan/design-bakery/issues/45) |
| **PR** | [#44](https://github.com/Pukujan/design-bakery/pull/44) |
| **Branch** | `task/TASK-DB-0051-consolidated-judge-paper` |
| **Source** | Eval Lab TASK-0056, PR [Pukujan/Eval-lab#64](https://github.com/Pukujan/Eval-lab/pull/64), merge commit `50aeb9876592f99cd1a3a0201305ad69585afd70` |
| **Status** | PR open against `main`; squash-merge once CI is green (owner-approved). |

## Goal

Replace the research paper at `/research/papers/db-r-2026-010` with Eval Lab's
consolidated paper, *Accuracy is not enough: correctness and coverage of
independent judges on identical objective decisions*. Keep the paper id so
existing URLs keep working.

## Done

- `frontend/src/app/modules/research/content/db-r-2026-010.md`: generated from
  Eval Lab `paper/paper.md` at `50aeb98`. The only changes are for the site's
  renderer (react-markdown + remark-gfm + rehype-raw):
  - generated-table comment markers removed;
  - the four Markdown images became `<figure class="research-figure">` blocks
    with `<figcaption>` (the italic caption text moved into the figcaption);
  - every `github.com/Pukujan/Eval-lab/{tree,blob}/main/...` link now points at
    the merge-commit permalink. The repository header also links Eval Lab
    `main` and the canonical `paper/paper.md` at that commit.
  No numbers were edited. Every table comes from Eval Lab
  `scripts/analyze_judge_comparison.py` (EXP-029).
- `frontend/src/app/modules/research/data/researchPapers.ts` (`PAPER_010`):
  - new title, abstract and tags;
  - id `db-r-2026-010`, status `pending`, and submitted date `2026-09-22`
    are unchanged.
- `frontend/public/research/figures/benchmark/`:
  - added `blind_accuracy_vs_coverage` and `blind_conditional_vs_all_record`
    (PNG + SVG);
  - refreshed `grok_protocol_ablation` and `local_qwen_calibration`;
  - replaced `manifest.json` verbatim from Eval Lab;
  - removed `direct_wave_accuracy_coverage` and
    `inferhub_wave_accuracy_coverage`, which are no longer referenced.
- `frontend/src/app/portfolios/endtoend-engineer/engineering/projects.json`:
  - Eval Lab card (id 9) description, tech and two stat labels now match the
    narrowed research question;
  - selective escalation is described as future work (it was "an active
    research direction");
  - the stat count is still 3.

## Evidence

- On Node 20 / pnpm 10.32.1 (box clone):
  - `pnpm install --frozen-lockfile`, `pnpm run lint`,
    `pnpm --dir frontend run typecheck` and `pnpm run build` pass.
  - Rendered `/research/papers/db-r-2026-010` from `vite preview` with headless
    Chrome: the title, tags, abstract, GFM tables and figures render.
- On Alex's PC (Node 24.14.1): `node scripts/test-homepage-content-stability.mjs`
  passes (pnpm is not installed there). Backend build and publish-kit font
  checks were not run locally; this change doesn't touch the backend, and CI runs them.

## Next step

- After merge, confirm the Vercel production deployment for the merge commit.
- When Eval Lab's paper changes, regenerate this file from `paper/paper.md` at
  the new merge commit, with the same figure/link transforms, and re-copy
  `paper/figures/benchmark/*` plus `manifest.json`.
