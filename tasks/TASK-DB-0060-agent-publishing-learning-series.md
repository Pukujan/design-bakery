# TASK-DB-0060 — agent publishing API, content lanes, and a verification learning series

| Field | Value |
|-------|-------|
| **Created** | 2026-10-05 |
| **Issue** | [#66](https://github.com/Pukujan/design-bakery/issues/66) |
| **Branch** | `task/TASK-DB-0060-agent-publishing-api` |
| **Status** | In progress. Slice A (lanes doc) and Slice B (agent publishing API) implemented and locally green; PR open. Slices C and D not started. Issue #66 owns scope and the full method. |

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

Slice B is done; Slice C (learning series + pocket dictionary) is produced *through* the new API, so it is the next slice. Reuse the existing CMS and `blog_posts`; do not build a parallel store.

## Done

### Slice A — content lanes and provenance

- `additionals/doc/content-lanes.md` documents the two lanes (blog = casual, scan-first; research = deep, verifiable), the one-evidence-record-per-post bridge, and points at CGM for the method instead of re-specifying it.
- Claim-record shape and the "one record per post, beside the content" rule are stated; PROV-O is referenced conceptually, RDF/SHACL/SPARQL stay out of scope.
- Not done here: the CGM writing-router follow-up and `schema.org/Article` JSON-LD (both optional, tracked by #66).

### Slice B — agent publishing API

- `POST /api/agent/posts` (create, draft unless `publishedAt` is an ISO string) and `PUT /api/agent/posts/:numericId` (omitted `publishedAt` preserves, ISO publishes, `null` unpublishes).
- `requireAgentToken` middleware (`backend/src/middleware/agentAuth.ts`) + `findAgentToken` (`backend/src/auth/agentToken.ts`); only the SHA-256 hex of a 32-byte random token is stored.
- Migration `010_agent_tokens_and_draft_visibility.sql`: `agent_tokens` table (RLS on, no policies) and `blog_posts_public_read` = `published_at is not null`, so drafts are invisible to the anon key (public site + sitemap).
- `createBlogPost` gives agent creates a draft-by-default insert (`upsertBlogPost`'s insert auto-publishes for the admin flow); `findBlogByNumericId` returns null instead of throwing; `listBlogPosts({ publishedOnly })` filters backend service-role reads; `GET /api/public/blogs/:numericId` 404s a draft.
- Payload validation (`agentPostPayload.ts`) rejects unknown fields, caps content at 256 KB, and restricts agent-supplied `seo` image URLs to site-relative paths (closes the SSRF a token holder could otherwise trigger).
- Writes recorded best-effort in `agent_audit`.
- Docs: `additionals/guidelines/agent-devlog-agent-publishing.md`; `additionals/doc/architecture.md`, `agent-devlog-index.md`, `checkpoints/CURRENT.md` updated.
- Test: `pnpm test:agent-posts` (31 validator checks), wired into CI's `quality` job.

### Evidence

- `pnpm --dir backend run build` and `pnpm --dir backend/services run build` succeed.
- Full local CI sequence (lint → build → frontend typecheck → backend build → agent-posts → publish-kit fonts → homepage content) exits 0.
- Not yet done: migration 010 applied to the Supabase project; a live token issued and a real post created→published end-to-end.

### Next step

Slice C — write and publish the Alloy / TLA+ / Dafny / Lean series through `/api/agent/*`, plus the linkable pocket dictionary.
