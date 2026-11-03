# TASK-DB-0142: the copilot's search_site on Octo RAG

**Goal.** `search_site` counted query words in project blurbs, paper abstracts and blog excerpts, so it could not find
anything said only in the body of a paper or post, nor a paraphrase. Octo (this project's data layer) already runs
production RAG: hybrid lexical + vector search, then a bge reranker, at `/api/rag/*`. Use it for passage-level search,
and keep the site summary (`siteBrief`) in the system prompt unchanged, so the model still always knows everything that exists.

**Done.**
- `backend/src/copilot/siteSearch.ts`:
  - `siteDocuments()`: one document per project (title, tagline, description, highlights from `stats`, tech), research
    paper (full markdown via `readPaper`, the abstract if the file is missing) and published blog post (full content via
    `readBlog`). Each is titled `site:<page path>` (`site:/work/precedent`, `site:/research/papers/db-r-2026-004`,
    `site:/blogs/34`), so a match maps back to its page.
  - `searchSite(query)`: `POST /api/rag/query` with `{ workspaceId, query, limit: 15, filter: { titlePrefix: 'site:',
    latestVersionOnly: true } }`, 2.5 s timeout. Matches map to the old output shape (`kind`, `ref`, `title`, `summary`):
    only `site:` documents whose page still exists in the live content, one hit per page (the best-ranked chunk is the
    summary, 300 chars), at most 6. If Octo is not configured, `COPILOT_RAG=off`, errors, times out, returns bad JSON or
    finds no site page, the old keyword count (`keywordSearch`, unchanged) answers.
- `tools.ts`: `search_site` calls `searchSite` and still calls `citations.retrieve(ref)` for every hit, so the citation
  guard is unchanged.
- `scripts/sync-copilot-rag.mjs` (`pnpm sync:copilot-rag`, `--dry-run`): ingests every document via
  `POST /api/rag/documents` (3 at a time); Octo's content hash makes an unchanged page a no-op and a changed one a new
  version. Deletes `site:` documents whose page is gone, except for a kind that loaded empty this run (`loadBlogs()`
  answers `[]` when the database is away; that must not wipe the blog index). Resets `site:` documents left with 0
  chunks by an interrupted ingest (re-sending identical text would otherwise stay a no-op forever). Never touches a
  document without the `site:` prefix (the existing `db-public-ekagajpatra-english-subtitles.vtt` is untouched).
- Deploy: `deploy/gravebuster/deploy.sh` runs the sync inside the new `design-bakery-api` container after the smoke checks
  pass (`sync_copilot_rag`, 600 s cap, `COPILOT_RAG_SYNC=0` skips). It never fails a deploy. Documented in
  `docs/self-hosting.md` §7, including the manual re-run after publishing a blog post through the CMS (no deploy happens then).
- Tests: `pnpm test:copilot-search` (offline, mocked fetch: config, mapping/dedupe/filtering/cap, request shape, the five
  fallbacks, no request without config, tool still marks hits retrieved), added to CI. `pnpm check:copilot-rag`: live
  questions against Octo, prints refs and timing, exits 1 if Octo did not answer or an expected page is missing.

**Evidence.** See the PR description for the live sync and check output (2026-11-03).

**Next.**
- A blog post published from the CMS is not in the index until the next deploy or a manual sync. If that matters, call
  the sync for the one post from the publish path (or nightly from the existing scheduler).
- The model still has `read_paper` / `read_blog` for full text; with passage search, the summary the model sees could be
  the matching chunk's section heading plus text (sections.ts) if answers need tighter citations.
