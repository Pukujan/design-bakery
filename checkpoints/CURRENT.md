# Current Repository Checkpoint

<!-- continuity:current {"active_task":"DB-0152","active_task_file":"tasks/TASK-DB-0152-calls-on-our-voice-agent.md","protocol_version":"0.1.0-draft","schema":"project-continuity.current.v1"} -->

## Program state

Feature work resumed on the owner's direction after the DB-0102 rollback. The site's live calls run on this repo's voice worker (`voice-agent/`, container `design-bakery-voice` on the VPS) since 2026-11-08; Claude Haiku answers chat and call turns first (DB-0151).

## Active

- [DB-0161](../tasks/TASK-DB-0161-reach-and-impact.md): a "What I can do with AI" section with sourced impact figures led by the 100M+ reach (the hero line was removed at the owner's request), Outcome lines on five project pages and Result lines on papers 008 to 011; open questions for the owner in the task file.
- [DB-0160](../tasks/TASK-DB-0160-songs.md): songs from the owner's Flow Music plan: the song maker on the VPS (Chrome only while a song is made), the copilot's make_song (asks the style first, cached in Octo, daily limits), the chat player with both takes (Take 1 / Take 2), autoplay once per song; songs in the background card, audio copied to Octo files, daily sign-in renewal; 2 new songs a visitor a day (pass or address), saved songs free to replay. Not yet tried on a call.
- [DB-0159](../tasks/TASK-DB-0159-seo-project-pages.md): SEO for the 18 project pages: in the sitemap, fuller descriptions, own share images, and server-side link previews for `/work/<slug>`.
- [DB-0158](../tasks/TASK-DB-0158-voice-match-lenient.md): the call stopped dropping the owner's own lines as another voice (cut-off 0.18, print learnt from the first three turns, a repeat is kept).
- [DB-0157](../tasks/TASK-DB-0157-space-covers.md): space covers for Maybe, Maybe Home, Riley, NYC Map Agent and Octo in place of the DB-0156 screenshots.
- [DB-0156](../tasks/TASK-DB-0156-portfolio-maybe-home-riley.md): Website Copilot becomes Maybe with its own picture; Maybe Home and Riley join the work list; NYC Map Agent gets its picture.
- [DB-0155](../tasks/TASK-DB-0155-page-buttons-summarise.md): a page button in the chat summarises what it opens, and the way to keep talking sparkles after each reply.
- [DB-0154](../tasks/TASK-DB-0154-speech-gateway.md) / [#241](https://github.com/Pukujan/design-bakery/issues/241): the live call's speech goes through the shared speech gateway on the VPS instead of the socat tunnel. Merged (#242, #243), deployed, checked with scripted calls.
- [DB-0152](../tasks/TASK-DB-0152-calls-on-our-voice-agent.md): live calls on our voice worker. Merged (#238), switched over and checked with a scripted call on www.
- [DB-0153](../tasks/TASK-DB-0153-call-trace-fixes.md): fixes from the owner's 2026-11-08 call traces (greeting, moon following papers, references, narration, page name, messages on a call, spoken emails, false stalls) and per-page browser titles. Merged (#240) and deployed 2026-11-08 (web, api and voice on 2aa249c); not yet tried on a real call.
- [PR #205](https://github.com/Pukujan/design-bakery/pull/205): Octo RAG retrieval before the model, so calls get real search. Up to date with main, checks green, not merged.

## Queued

- [#145](https://github.com/Pukujan/design-bakery/issues/145): previous SEO/homepage/assistant requests, deferred.
- [DB-0101 / #147](https://github.com/Pukujan/design-bakery/issues/147): virtual Pujan, voice/mobile/contact/reading/adaptive requests, deferred after owner rejected the UI.
- [#151](https://github.com/Pukujan/design-bakery/issues/151): proposed live AI consultation demo and service funnel.
- [#152](https://github.com/Pukujan/design-bakery/issues/152): proposed NYC project portfolio entry.

## Source request log

[tasks/requests/owner-requests-2026-11-02.md](../tasks/requests/owner-requests-2026-11-02.md) preserves the owner prompts, corrections, screenshots context and final stop/rollback instruction. Historical implementation checkpoints remain evidence of what happened, not current acceptance.

## Next atomic action

On the owner's next real call, check Phoenix for the DB-0153 fixes (greeting, moon on a paper walk, references, spoken email, stalls). PR #205 edits the same copilot files as #240, so it needs a rebase before the owner reviews and merges it; then a scripted call that asks about a paper to see retrieval on a call turn.
