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
  `db-public-ekagajpatra-english-subtitles.vtt` is untouched). Small pages go first, the blog tail last. Not run by the deploy (the deploy kit
  moved to `deploy/vps/`, which this task does not touch): run it by hand after content changes,
  `docs/self-hosting.md` §5.
- **Every turn retrieves before the model** (`route.ts`): `retrieve(turnQueries(messages))` queries the message, and the
  message with the last exchange (so "what else does he have?" resolves); reranked on both channels since 2026-11-07
  (voice gives the reranked query 1.5 s, chat 2.5 s, then one retry without it). It starts before the rate-limit check so it overlaps it. Passages go into the last user turn
  as search results (not instructions), every passage path is marked retrieved for the citation guard, and the prompt
  carries persona, rules, the visitor's page and a short `siteIndex()` (titles and paths per kind) instead of
  `siteBrief`. The relevance cut is relative, because rerank logits are not comparable across questions (the answer
  to "What experience do you have?" scores -6, "hello" scores -0.4 against About): the best chunk must clear -6.5 and
  the rest must be within 3 of it; without the reranker, similarity ≥ 0.45. With nothing left the model is told to
  just chat and state no facts. The content page the visitor is on joins the context query ("this project"). On a
  call the prompt says speech recognition mishears names ("President" → Precedent, "Arise" → Arize). If Octo errors or is slow, the full `siteBrief`
  is used instead, as before.
- **Retired:** `cachedAnswer` / `routeRequest` routing. Main removed it too (#221, the owner's rule of 2026-11-05: no
  regex decides what a visitor means), along with `answers.ts`, `routines.ts`, `gotchas.ts` and `smallTalk.ts`, so
  after the merge there are no canned replies at all; every line goes to the model.
- **Navigation from retrieval** (`backend/src/copilot/cite.ts` `groundCite`): after the reply, the server picks the
  retrieved section whose content words the reply shares most (≥ 3 words and ≥ 25% of the reply's), checks its anchor
  and heading against the live sections, takes a quote of at most `QUOTE_MAX` from that chunk's own sentences that
  `checkQuote` finds in the section, records it in the citation log and emits `cite {path, anchor, heading, quote,
  mode:'perch'}`. Since 2026-11-07 the reply must also name the
  section's page (its title, or two of its title's content words; home and Contact are exempt). No cite when the
  model already pointed somewhere, after `site_catalog` (a list or a count), when the model moved the page elsewhere,
  or when nothing clearly sourced the reply. The visitor's message is never read for this (spec P-2). Quote candidates never cross a
  line (separate elements on the page) and skip table rows (rendered as cells, without pipes).
- Render-source fixes found in the browser (`sections.ts`, `knowledge.ts`): a project's Built with is one block per
  chip, and an About focus item's title and description are separate blocks; the page reads those elements with no
  space between, so a quote spanning them never matched (this also tightens `cite_section`'s quote check).
  Plain code, so it cannot point at a section the reply did not use. Frontend unchanged; voice waits for the answer, so
  the page still moves before speech.
- `search_site` (tool) uses the same retrieval, one hit per page. The keyword count is gone: when Octo is down it says
  so, and the turn already carries the full brief.
- **Lists and counts from data, not search** (`tools.ts` `site_catalog`): "how many papers", "latest post", "list your
  projects", "which projects are shipped" read the project, paper, post and role lists (filter by status or
  category, newest first). This is the one exception to "every answer from RAG": search returns the top few
  sections, so it cannot count or rank. Such questions get no section cite.
- **Misheard names** (`names.ts`): before the search, each word of the message of five letters or more is compared
  with the known names (project titles, Built with tools, companies, coined words in paper titles) by Double Metaphone
  and edit distance (≤1, ≤2 from seven letters; not a prefix or inflection; not itself a known name). A match is
  added to the context query (`probably Precedent`) and told to the model as a likelihood ("President" probably
  means Precedent); the visitor's words are never rewritten.
- Trace attributes `copilot.retrieval` (`rag` / `brief`), `copilot.retrieval_ms`, `copilot.retrieved`.
  `COPILOT_EVAL=1` adds tokens and retrieval to the `done` event for `scripts/eval-copilot-turns.mjs`.
- Tests: `pnpm test:copilot-search` (offline, in CI): mapping, queries, request shape, rerank retry, every fallback,
  the cite choice and quote, and for every indexed section of two projects, two papers and home: the anchor is live,
  the heading matches, and the quote is on the page under it. Checked once in a real browser too (Vite, the page's
  own `headingFor` / `sectionElements` / text-walk logic): 39 of 39 sections of precedent, website-copilot, papers 001
  and 006 (sampled) and home resolve, every quote found. `pnpm check:copilot-rag`: live sections per question.
  `scripts/eval-copilot-turns.mjs <api> [--voice]`: replays the trace conversations.

**Evidence.** Before/after per trace question, latency and cost: see the PR description (2026-11-03).

## 2026-11-07: brought up to date with main

- Merged `main` (46 commits: lanes, booking by state, `summarize_page` / `step_list` / `tour_next`, leave-a-message,
  Haiku first, charts) into the branch. Main's behaviour wins wherever they met: `route.ts` is main's with retrieval
  added (prompt index + passages, `groundCite` after the reply, `site_catalog` in the tool list, lanes still filter
  it). `answers.ts` stays deleted. `deploy/vps/deploy.sh` is main's (no sync hook).
- **No regex** in the RAG code: `siteSearch.ts`, `cite.ts`, `names.ts` and the new parts of `knowledge.ts` use
  character checks from the new `words.ts`. `cite.ts` no longer reads the visitor's message at all: the old
  `LIST_QUESTION` / `FOLLOW_UP` patterns are gone; lists are recognised by the model having called `site_catalog`.
  `test-copilot-search` checks these files hold no regex, and `check-copilot-rag.mjs` compares by prefix.
- **Voice turns are reranked** (`retrieve(..., { voice })`). Measured from this Mac: one reranked Octo query
  ~0.7 s (0.65–1.45 s), vector-only ~0.35 s; a turn's two queries together ~1.3 s; retrieval per turn in the evals
  0.7–1.9 s, up to 3 s with two evals running at once.
- Index re-synced (`pnpm sync:copilot-rag`): main's role renames, two new projects (Octo, NYC map agent) and a
  removed project. 19 new or changed, 9 deleted, 0 failed; then role headers became "Work experience at <company>"
  (6 re-indexed), so "Where have you worked?" finds the roles.
- The passages block now says it is not written by the visitor and not part of the conversation: with the old label,
  "what was the first project we talked about?" got "we haven't talked about a project yet" in 2 of 5 runs; 8 of 8
  right after.
- Checks: `test:copilot-search`, `test:copilot-truncation`, `test:sim-harness`, `test:copilot-memory`,
  `test:copilot-tools`, `check:lanes`, `test:copilot-lanes`, `test:copilot-exempt`, `test:copilot-stream`,
  `test:copilot-cite`, `test:copilot-chips`, `test:homepage-content`, lint, `find-orphans --strict`: all pass.
  `test:copilot-news` fails on main too (its voice-prompt line was removed on main; not in CI).

**Evidence (2026-11-07).** `scripts/eval-copilot-turns.mjs`, before = the live site (main), after = this branch on a
local API, Haiku answering both. "Page" is where the page went.

| Question | Before, text | After, text | Before, voice | After, voice |
|---|---|---|---|---|
| What stack is Precedent built with? | right; button to /work/precedent, no section | right; cite `/work/precedent#what-it-is`, quote on page | right; page did not move | right; page to `#what-it-is` with the quote |
| what's the President project? | "isn't a project on this site" | "You likely mean Precedent"; button to /work/precedent | "sounds like Precedent"; navigate | "I think you mean Precedent"; `summarize_page` walks what-it-is, built-with, go-deeper |
| How many research papers do you have? | 11 | 11 via `site_catalog`, no cite | "12 … wait, 11" | 11, no cite |
| What did Arise have to do with this project? | leaked its reasoning ("The visitor says Arise…"), then answered | "Arize … listed under Built with" | leaked its reasoning | "probably Arize"; cite `#built-with` |
| What's your latest blog post? | post 34 | post 34; button to /blogs/34 | post 34, after a long self-correction about the last turn | post 34, no cite |

Whole turn on a call (eval `ms`): before 0.7–1.9 s, after 1.5–4.8 s; the retrieval wait is most of the difference.

**Next.**
- Re-index on deploy: add the sync step back to `deploy/vps/deploy.sh` once the session moving calls onto
  `voice-agent/` is done with that folder (until then: `pnpm sync:copilot-rag` by hand after content changes).
- Octo's rerank path costs 0.35–0.45 s over a vector-only query although the reranker answers in ~0.1 s; worth a look
  on the Octo side, since a call hears it.
- "What experience do you have?" retrieves blog sections about "experience", not the roles (the answer is right, from
  the index; no role is cited).
