# TASK-DB-0060 — agent publishing API, content lanes, and a verification learning series

| Field | Value |
|-------|-------|
| **Created** | 2026-10-05 |
| **Issue** | [#66](https://github.com/Pukujan/design-bakery/issues/66) |
| **Branch** | `task/TASK-DB-0060-agent-publishing-learning-series` |
| **Status** | Not started. Issue #66 owns scope and the full method. |

## Goal

Let agents publish posts through an API, split content into a casual blog lane and a verifiable research lane, and ship a short formal-methods learning series plus a linkable pocket dictionary — all produced through the new API so the series dogfoods the pipeline.

## Scope

Four slices, detailed in issue #66:

- **A — lanes and provenance.** design-bakery adapts CGM's method (`Pukujan/content-generation-modules`); it does not re-specify it. Blog lane = casual, human, scan-first. Research lane = deep, verifiable, commit-pinned.
- **B — agent publishing API.** `requireAgentToken`, an `agent_tokens` table, `POST /api/agent/posts` and `PUT /api/agent/posts/:numericId`, delegating to the existing `upsertBlogPost`. `publishedAt` is the draft/published switch.
- **C — learning series + pocket dictionary.** Alloy / TLA+ / Dafny / Lean, before/after screenshots in 3–4 steps, the TLA+ manual-init walkthrough, agent applicability as risk-based routing vs PDD/SDD/TDD, and a linkable glossary surface.
- **D — engagement.** Likes, comments, and view counts on blogs and case studies.

## Read first

- Issue [#66](https://github.com/Pukujan/design-bakery/issues/66) — scope, the method section, validation rules, and out-of-scope.
- CGM `docs/WRITING_ROUTING.md`, `docs/CONTENT_RESEARCH.md`, `docs/PROVENANCE_AND_CITATION.md`.

## Next

Start with Slice B (the API), since Slice C is produced through it. Reuse the existing CMS and `blog_posts`; do not build a parallel store.

## Done

(empty until the work starts)
