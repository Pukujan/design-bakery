# TASK-DB-0142: the copilot answers from Octo RAG, and the page goes to the section it used

**Goal.** The copilot answered from canned keyword routes (`cachedAnswer`: intents, small talk, project and service
answers) and a large site summary in the prompt, and `search_site` counted query words in blurbs. The owner wants every
reply grounded in RAG search, and the page to move to the section the answer came from. Octo (this project's data
layer) runs hybrid lexical + vector search with a bge reranker at `/api/rag/*`.

**Done.**
- **Index, one document per page section** (`backend/src/copilot/siteSearch.ts` `siteDocuments()`), titled with the
  section's address: `site:/work/precedent#built-with`, `site:/research/papers/db-r-2026-004#3-method`,
  `site:/blogs/34#<heading-id>`, `site:/#story-about`, `site:/#role-<company-role>`, `site:/contact`. Anchors and
  headings come from `sections.ts`, the same render source the page and the copilot's `walkTo` / `headingFor` /
  `highlightQuote` use, so text is the page's wording with markdown stripped, split at headings. Each document starts
  with a context line `<page title>: <heading>`. Home (About with hero and skills; one per role, including the
  collapsed details) and Contact (services, links) are indexed too; skills are not a rendered page, so they ride on About.
- **`scripts/sync-copilot-rag.mjs`** (`pnpm sync:copilot-rag`, `--dry-run`, `--only home,contact`): idempotent through
  Octo's content hash; deletes `site:` documents whose section is gone, except for a kind that loaded empty this run;
  resets documents an interrupted ingest left with 0 chunks; never touches a title without `site:` (the existing
  `db-public-ekagajpatra-english-subtitles.vtt` is untouched). Small pages go first, the blog tail last. Runs after
  every API deploy (`deploy/gravebuster/deploy.sh` `sync_copilot_rag`, 600 s cap, never fails a deploy,
  `COPILOT_RAG_SYNC=0` skips); `docs/self-hosting.md` §7.
- **Every turn retrieves before the model** (`route.ts`): `retrieve(turnQueries(messages))` queries the message, and the
  message with the last exchange (so "what else does he have?" resolves); reranked for text, plain hybrid for voice
  (rerank adds ~0.5–1 s). It starts before the rate-limit check so it overlaps it. Passages go into the last user turn
  as search results (not instructions), every passage path is marked retrieved for the citation guard, and the prompt
  carries persona, rules, the visitor's page and a short `siteIndex()` (titles and paths per kind) instead of
  `siteBrief`. Low-relevance results are dropped (rerank < -3, similarity < 0.5); with nothing left the model is told
  to just chat and state no facts. If Octo errors or is slow (2.5 s, one retry without rerank), the full `siteBrief`
  is used instead, as before.
- **Retired:** `cachedAnswer` / `routeRequest` routing (intents, small talk, offers, `banter:ack`) and the tools-off
  small-talk path. **Kept canned:** the prompt-injection reply (security: it must not reach the model) and the gotcha
  trick questions (`gotchas.ts`, known-correct answers). `answers.ts` / `routines.ts` stay in place but unwired, to
  avoid conflicts with PR 204; delete after it merges.
- **Navigation from retrieval** (`backend/src/copilot/cite.ts` `groundCite`): after the reply, the server picks the
  retrieved section whose content words the reply shares most (≥ 3 words and ≥ 25% of the reply's), checks its anchor
  and heading against the live sections, takes a quote of at most `QUOTE_MAX` from that chunk's own sentences that
  `checkQuote` finds in the section, records it in the citation log and emits `cite {path, anchor, heading, quote,
  mode:'perch'}`. No cite when the model already pointed somewhere, or nothing clearly sourced the reply (small talk).
  Plain code, so it cannot point at a section the reply did not use. Frontend unchanged; voice waits for the answer, so
  the page still moves before speech.
- `search_site` (tool) uses the same retrieval, one hit per page, keyword fallback.
- Trace attributes `copilot.retrieval` (`rag` / `rerank-off` / `brief`), `copilot.retrieval_ms`, `copilot.retrieved`.
  `COPILOT_EVAL=1` adds tokens and retrieval to the `done` event for `scripts/eval-copilot-turns.mjs`.
- Tests: `pnpm test:copilot-search` (offline, in CI): mapping, queries, request shape, rerank retry, every fallback,
  the cite choice and quote, and for every indexed section of two projects, two papers and home: the anchor is live,
  the heading matches, and the quote is on the page under it. `pnpm check:copilot-rag`: live sections per question.
  `scripts/eval-copilot-turns.mjs <api> [--voice]`: replays the trace conversations.

**Evidence.** Before/after per trace question, latency and cost: see the PR description (2026-11-03).

**Next.**
- Delete the unwired `answers.ts` intents and `routines.ts` after PR 204 merges.
- A blog post published from the CMS is not indexed until the next deploy or a manual `pnpm sync:copilot-rag`.
