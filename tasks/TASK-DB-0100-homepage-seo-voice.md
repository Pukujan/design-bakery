# TASK-DB-0100 — Homepage Seo Voice

<!-- continuity:task {"acceptance":["Current homepage metadata, social image, favicon and sitemap are served in production","Homepage text reflows around the black hole without overlapping or overflowing on resize","The public-content chatbot and voice calls answer and recover from errors","Production deployment is verified"],"depends_on":["external:https://github.com/Pukujan/design-bakery/issues/143"],"goal":"Make the homepage SEO, flowing text and public-content assistant work for visitors","id":"DB-0100","issue_url":"https://github.com/Pukujan/design-bakery/issues/145","next_action":"Wait for renewed owner direction; implementation deferred and rejected UI rolled back under DB-0102.","owner":"codex","priority":"normal","protocol_version":"0.1.0-draft","schema":"project-continuity.task.v1","status":"queued","why":"Visitors need readable content, current previews and reliable ways to ask about published work"} -->

- Status: queued — owner deferred further work
- Owner: codex
- Priority: normal
- Depends on: [image-tag handoff #143](https://github.com/Pukujan/design-bakery/issues/143)

## Owner disposition

The owner stopped feature work and requested rollback to `154350f`. Treat the implementation checkpoints below as historical evidence, not current acceptance. Preserve requests in [the prompt archive](requests/owner-requests-2026-11-02.md); resume only with renewed direction. Rollback: [#150](https://github.com/Pukujan/design-bakery/issues/150).

## Goal

Make the homepage SEO, flowing text and public-content assistant work for visitors

## Why

Visitors need readable content, current previews and reliable ways to ask about published work

## Allowed files

- `frontend/`, `backend/src/copilot/`, `backend/src/og/`, `scripts/`, and relevant task and devlog documentation.

## Human outcome

Visitors can recognize the site in search and shared links, read the homepage, and ask about published work by text or voice.

## Scope and boundaries

- In scope: search metadata, social image, favicon, homepage text flow, public chatbot and voice integration.
- Out of scope: private Octo documents and changes to the Octo backend.
- Dependency: the Komodo image-tag handoff; voice service availability and real microphone verification remain to be checked.

## Acceptance criteria

- [ ] Homepage metadata, image and favicon are served correctly.
- [ ] Responsive text flows around the black hole without overlap.
- [ ] Text and voice answers use published site content, and the live call works.
- [ ] CI and the production deployment are verified.

## Evidence and sources

Link repository state at a revision and cite external factual claims directly. Record commands and results for claims that need verification.

## Reproduction details (only when needed)

Starting revision, material inputs/configuration, runtime, exact command or prompt, observed result, and limitations.

## Related records

- Parent: [#145](https://github.com/Pukujan/design-bakery/issues/145); parent of [DB-0101 / #147](https://github.com/Pukujan/design-bakery/issues/147); dependency: [#143](https://github.com/Pukujan/design-bakery/issues/143).
- Primary writer: Codex; historical implementation branch: `codex/homepage-seo-voice`; issue #145 was open as of 2026-11-02.
- Pull request, exact checks and delivery receipt pending.

### 2026-11-02 — virtual Pujan and mobile copilot scope

The owner requested that the remaining voice and chat experience be tracked as a child
task before implementation. GitHub issue [#147](https://github.com/Pukujan/design-bakery/issues/147)
is now a child of this parent issue. It records the virtual-Pujan persona, call
connection feedback, audio-reactive planet, confirmation-first navigation, project-card
destination, and mobile chat/keyboard/minimized states. Three visual directions were
generated for review. Implementation is explicitly waiting for the owner to select a
visual direction.

## Checkpoint log

### 2026-11-02 — copilot cost, answer length, durable limits, workspace id redaction

Picked up the checkpoint at `a09c0cd` (`codex/homepage-seo-voice`) after the Codex
session hit its usage limit, merged it into `main`, and finished the assistant work.

**What the traces said.** `GET /api/workspaces/<id>/otel/read/spans` (Octo → Phoenix,
39 spans, 11 turns) showed the shape of the problem: about **180k prompt tokens against
4k completion**, so roughly 45:1 in favour of input. A bare "Hello" cost 8,130 prompt
tokens; the tour cost 48,885 across six tool steps. Output was small in tokens but long
in characters because one turn leaked its reasoning.

Two defects were visible in the text itself:

- The "give me a tour" turn arrived as ~1,400 characters of thinking, then `</think>`,
  then the real answer, then a repeat of its own last paragraph — 1,525 characters shown
  where 150 was meant.
- Several turns opened with narration before a tool call ("Let me pull up the blog page
  for you."), which reads as filler next to the answer.

**Changes**

- `backend/src/copilot/answers.ts` — an instant tier ahead of the model. Nine intents
  (greeting, identity, contact, tour, blog, research, experience, projects, booking) are
  answered from the site's own data with no model call. Keyword-first matching, because
  fuzzy scoring alone could not separate "how do i contact pujan" from `tell me about
  pujan`. It fires on the first turn, or on a near-exact match later, so a follow-up
  ("open", "summarise that") still reaches the model with its context.
- `backend/src/copilot/textFilter.ts` — the streaming hygiene, extracted so it is
  testable. Short answers are held to the end of the turn so a late `</think>` can be cut
  unseen; longer answers stream and get a `replace` event if a think block turns up;
  narration before a tool call is dropped; text after a tool starts a new paragraph.
- `backend/src/copilot/route.ts` — the instant tier runs **before** the durable limiter,
  so cached answers cost nothing and still work when the rate-budget database is down.
  The visitor's page moved out of the system prompt into the last user message: the
  prompt is now byte-identical across a conversation, which is what lets a provider's
  prefix cache hit instead of re-billing the brief on every step of a tool loop.
- `backend/src/copilot/knowledge.ts` — the brief trimmed (paper abstracts 420 → 150
  chars, blog excerpts 160 → 80, project copy clipped at 220, two highlights per role).
- `backend/src/copilot/durableLimit.ts` — `durableLimitConfigured()`. A limiter that was
  never configured is a deploy gap and falls back to the in-memory window; a configured
  limiter that fails still fails closed.
- `frontend/.../store.ts` — handles the `replace` event; the answer badge distinguishes
  an instant answer from a live model.
- `eslint.config.mjs` — ignores `.claude/**`, so a leftover agent worktree no longer
  makes ESLint see two tsconfig roots and fail every file.

**Security (owner request).** The octo workspace identifier was committed in ten places
across `AGENTS.md`, `PROJECT.json`, `docs/`, `additionals/` and three task files. It is
now gone from every tracked file and the docs point at `OCTO_WORKSPACE_ID` in
`backend/.env` / `deploy/gravebuster/.env.api` instead. No key was ever committed — the
only matches for the key patterns are placeholders in the `.example` files. **The
identifier remains in git history**; purging it needs a `git filter-repo` rewrite and a
force-push of `main`, which is owner-gated (the same call as the tracked video in #78).

**Deployment state**

- `supabase/migrations/011_copilot_rate_limit.sql` was **not applied**, and no
  `COPILOT_*` variable was set on the host — so the deployed `/chat` would have answered
  `503 LIMIT_UNAVAILABLE` to every visitor. The migration is now applied to the workspace
  (verified: `copilot_take_rate_slot` exists and admits a slot), and
  `COPILOT_RATE_SECRET` / `COPILOT_PASS_SECRET` are set in `deploy/gravebuster/.env.api`
  (mode 600, previous file backed up beside it).
- The voice service is live: `POST https://copilot.design-bakery.com/api/voice/token`
  answers `200` with `{"url":"wss://copilot.design-bakery.com", token, room, stack}`,
  which is exactly what `POST /api/copilot/voice` validates before issuing a grant.

**Checks run:** `pnpm lint`, `pnpm --dir frontend run typecheck`,
`pnpm --dir backend run build`, `pnpm test:copilot-answers` (13 intents, 6 follow-ups
routed to the model), `pnpm test:copilot-stream` (6 cases, including the real leaked
tour text), `pnpm test:homepage-content`, `pnpm test:icon-coverage`. A local API run
returned `cache:greeting`, `cache:contact`, `cache:tour` and `cache:experience` as
expected, one navigation per answer.

**Still open:** the production deploy and a live verification; a real microphone call;
and whether a semantic cache is worth a table — with 11 turns in the sample, the
deterministic tier is where the money is, and the bigger lever is the 8k prompt.

## Handoff

Read PROJECT → CURRENT → this task → minimum relevant spec. Checkpoint before stopping.
