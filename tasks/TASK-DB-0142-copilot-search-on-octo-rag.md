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
  with a context header `<item title>: <heading>` (`Precedent: Built with`, `Arize: <role>`), so a chunk carries what
  it is about; the header is stripped before a passage reaches the model or the cite, so a quote always comes from
  the body. Home (About with hero and skills; one per role, including the
  collapsed details, from the list the page renders: `relevant-experience-rendered-list.json` / Octo
  `relevant_experience_rendered`, via `loadShownExperience`) and Contact (services, links) are indexed too; skills are
  not a rendered page, so they ride on About.
- **Table `site_sections`** in the workspace's Octo Postgres (`supabase/migrations/013_site_sections.sql`, applied):
  path, anchor, heading, kind (project | paper | post | experience | about | skills | contact), item_title,
  content_hash, octo_document_id, updated_at; primary key (path, anchor). A search hit maps by document id to
  {path, anchor, heading} (`sectionRows()`, 60 s cache; title parsing is the fallback), and the sync diffs against it.
  The `site:` titles stay, for title-prefix scoping. Octo ingest is per document (same text: `created:false`, same id;
  changed text: a new version, same id) and `DELETE /api/rag/documents/<id>` exists.
- **`scripts/sync-copilot-rag.mjs`** (`pnpm sync:copilot-rag`, `--dry-run`, `--only home,contact`): diffs against
  `site_sections` (unchanged hash and document: no Octo call; a repeat run takes ~3 s); deletes rows and documents
  whose section is gone, then orphan `site:` documents, except for a kind that loaded empty this run;
  resets documents an interrupted ingest left with 0 chunks; never touches a title without `site:` (the existing
  `db-public-ekagajpatra-english-subtitles.vtt` is untouched). Small pages go first, the blog tail last. Runs after
  every API deploy (`deploy/gravebuster/deploy.sh` `sync_copilot_rag`, 600 s cap, never fails a deploy,
  `COPILOT_RAG_SYNC=0` skips); `docs/self-hosting.md` §7.
- **Every turn retrieves before the model** (`route.ts`): `retrieve(turnQueries(messages))` queries the message, and the
  message with the last exchange (so "what else does he have?" resolves); reranked for text, plain hybrid for voice
  (rerank adds ~0.5–1 s). It starts before the rate-limit check so it overlaps it. Passages go into the last user turn
  as search results (not instructions), every passage path is marked retrieved for the citation guard, and the prompt
  carries persona, rules, the visitor's page and a short `siteIndex()` (titles and paths per kind) instead of
  `siteBrief`. The relevance cut is relative, because rerank logits are not comparable across questions (the answer
  to "What experience do you have?" scores -6, "hello" scores -0.4 against About): the best chunk must clear -6.5 and
  the rest must be within 3 of it; without the reranker, similarity ≥ 0.45. With nothing left the model is told to
  just chat and state no facts. The content page the visitor is on joins the context query ("this project"). On a
  call the prompt says speech recognition mishears names ("President" → Precedent, "Arise" → Arize). If Octo errors or is slow (2.5 s, one retry without rerank), the full `siteBrief`
  is used instead, as before.
- **Retired:** `cachedAnswer` / `routeRequest` routing (intents, small talk, offers, `banter:ack`) and the tools-off
  small-talk path. **Kept canned:** the prompt-injection reply (security: it must not reach the model) and the gotcha
  trick questions (`gotchas.ts`, known-correct answers). `answers.ts` / `routines.ts` stay in place but unwired, to
  avoid conflicts with PR 204; delete after it merges.
- **Navigation from retrieval** (`backend/src/copilot/cite.ts` `groundCite`): after the reply, the server picks the
  retrieved section whose content words the reply shares most (≥ 3 words and ≥ 25% of the reply's), checks its anchor
  and heading against the live sections, takes a quote of at most `QUOTE_MAX` from that chunk's own sentences that
  `checkQuote` finds in the section, records it in the citation log and emits `cite {path, anchor, heading, quote,
  mode:'perch'}`. No cite when the model already pointed somewhere, when the visitor's message has no content words
  and no back-reference ("how are you", "hello"), when it asks for a list or a count, or when nothing clearly sourced the reply. Quote candidates never cross a
  line (separate elements on the page) and skip table rows (rendered as cells, without pipes).
- Render-source fixes found in the browser (`sections.ts`, `knowledge.ts`): a project's Built with is one block per
  chip, and an About focus item's title and description are separate blocks; the page reads those elements with no
  space between, so a quote spanning them never matched (this also tightens `cite_section`'s quote check).
  Plain code, so it cannot point at a section the reply did not use. Frontend unchanged; voice waits for the answer, so
  the page still moves before speech.
- `search_site` (tool) uses the same retrieval, one hit per page, keyword fallback.
- **Lists and counts from data, not search** (`tools.ts` `site_catalog`): "how many papers", "latest post", "list your
  projects", "which projects are shipped" read the project, paper, post and role lists (filter by status or
  category, newest first). This is the one exception to "every answer from RAG": search returns the top few
  sections, so it cannot count or rank. Such questions get no section cite.
- **Misheard names** (`names.ts`): before the search, each word of the message of five letters or more is compared
  with the known names (project titles, Built with tools, companies, coined words in paper titles) by Double Metaphone
  and edit distance (≤1, ≤2 from seven letters; not a prefix or inflection; not itself a known name). A match is
  added to the context query (`probably Precedent`) and told to the model as a likelihood ("President" probably
  means Precedent); the visitor's words are never rewritten.
- Trace attributes `copilot.retrieval` (`rag` / `rerank-off` / `brief`), `copilot.retrieval_ms`, `copilot.retrieved`.
  `COPILOT_EVAL=1` adds tokens and retrieval to the `done` event for `scripts/eval-copilot-turns.mjs`.
- Tests: `pnpm test:copilot-search` (offline, in CI): mapping, queries, request shape, rerank retry, every fallback,
  the cite choice and quote, and for every indexed section of two projects, two papers and home: the anchor is live,
  the heading matches, and the quote is on the page under it. Checked once in a real browser too (Vite, the page's
  own `headingFor` / `sectionElements` / text-walk logic): 39 of 39 sections of precedent, website-copilot, papers 001
  and 006 (sampled) and home resolve, every quote found. `pnpm check:copilot-rag`: live sections per question.
  `scripts/eval-copilot-turns.mjs <api> [--voice]`: replays the trace conversations.

**Evidence.** Before/after per trace question, latency and cost: see the PR description (2026-11-03).

**Next.**
- Delete the unwired `answers.ts` intents and `routines.ts` after PR 204 merges.
- A blog post published from the CMS is not indexed until the next deploy or a manual `pnpm sync:copilot-rag`.
