# TASK-DB-0100 — Homepage Seo Voice

<!-- continuity:task {"acceptance":["Current homepage metadata, social image, favicon and sitemap are served in production","Homepage text reflows around the black hole without overlapping or overflowing on resize","The public-content chatbot and voice calls answer and recover from errors","Production deployment is verified"],"depends_on":["external:https://github.com/Pukujan/design-bakery/issues/143"],"goal":"Make the homepage SEO, flowing text and public-content assistant work for visitors","id":"DB-0100","issue_url":"https://github.com/Pukujan/design-bakery/issues/145","next_action":"Verify changes locally, publish the review branch, and verify the site and voice in production","owner":"codex","priority":"normal","protocol_version":"0.1.0-draft","schema":"project-continuity.task.v1","status":"active","why":"Visitors need readable content, current previews and reliable ways to ask about published work"} -->

- Status: active
- Owner: codex
- Priority: normal
- Depends on: [image-tag handoff #143](https://github.com/Pukujan/design-bakery/issues/143)

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

- Leaf: [#145](https://github.com/Pukujan/design-bakery/issues/145); parent: none; dependency: [#143](https://github.com/Pukujan/design-bakery/issues/143).
- Primary writer: Codex; branch: `codex/homepage-seo-voice`; issue #145 as of 2026-11-02 is open.
- Pull request, exact checks and delivery receipt pending.

## Checkpoint log

No checkpoints yet.

## Handoff

Read PROJECT → CURRENT → this task → minimum relevant spec. Checkpoint before stopping.
