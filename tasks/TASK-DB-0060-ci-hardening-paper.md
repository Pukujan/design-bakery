# TASK-DB-0060: research paper db-r-2026-011 (CI hardening before/after)

| Field | Value |
|-------|-------|
| **Created** | 2026-10-05 |
| **Issue** | none (owner-directed; no design-bakery issue opened) |
| **Branch** | `task/TASK-DB-0060-ci-hardening-paper` |
| **Status** | Merged 2026-10-05 (PR #63, squash commit `b0da979`), live at `/research/papers/db-r-2026-011`. Paper status stays `pending` until the owner promotes it to `approved`. |

## Goal

Publish a working paper at `/research/papers/db-r-2026-011` that shows a before/after of a quality-gate hardening: what the gate checked before, the five guards added in eleven days, what two of them caught on the day they landed, and where the gate is still blind. The source is a private production codebase; the public version is genericized (no repository name, issue numbers, or product specifics).

## Done

- `frontend/src/app/modules/research/content/db-r-2026-011.md`: the paper. Six sections plus a short-version alert, a `rp-meta` aside, one GFM table, and one mermaid `graph TD`. React-markdown + gfm + rehype-raw + GitHub alerts + MermaidDiagram render it unchanged from the private source, with the project name, guard filenames and issue numbers removed.
- `frontend/src/app/modules/research/data/researchPapers.ts`: `PAPER_011` entry (`status: pending`), listed first in `RESEARCH_PAPERS` (newest first). Title matches the markdown H1 so the page header does not duplicate the heading.
- Every figure in the paper was re-verified against the private repository on 2026-10-05 before publishing: the gate step count over time (18 → 23), the 68 → 63 baseline prune, nine tracked `.bak` files, the committed literal `D:` directory, sixteen untracked runtime files, two `/home/<user>/` placeholders, twelve tests in the orphan-guard suite, 39 `plugins/**.py` and 10 `skills/**.py`, and 112 of 123 failed `pull_request` quality runs with zero jobs.

## Checks (local, 2026-10-05)

- `pnpm lint` — clean.
- `pnpm --dir frontend run typecheck` — clean.
- `pnpm run build` — passes.
- Page rendered via `vite preview` + headless Chrome: title, `pending` badge, the alert callout, the `rp-meta` aside, the defect-class table and the mermaid diagram all render; `/research` lists it first ("Showing 11 papers").

## Privacy boundary

The source repository is private. The public paper carries no repository name, no issue numbers, no guard filenames and no product specifics — only the shape of the change and the counts. The `rp-meta` aside states the evidence is a private repository and not independently reproducible.

## Publish (2026-10-05)

- PR [#63](https://github.com/Pukujan/design-bakery/pull/63) squash-merged to `main` as `b0da979`; all checks passed (`quality` 2m3s, Vercel, Vercel Preview Comments).
- Vercel production deployment for `b0da979` succeeded. The live page renders the title, `pending` badge, alert callout, `rp-meta` aside, five-row defect table and the mermaid diagram (all six node labels).

## Next step

- Owner review of the paper's *status*: promote `status` to `approved` once accepted. The page is already public; only the badge is provisional.
- If the paper is kept, consider a short topic devlog note on "publishing a private-repo case study" (genericization checklist). Not written.
