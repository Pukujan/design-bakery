# Current Repository Checkpoint

<!-- continuity:current {"active_task":"DB-0152","active_task_file":"tasks/TASK-DB-0152-calls-on-our-voice-agent.md","protocol_version":"0.1.0-draft","schema":"project-continuity.current.v1"} -->

## Program state

Feature work resumed on the owner's direction after the DB-0102 rollback. The site's live calls run on this repo's voice worker (`voice-agent/`, container `design-bakery-voice` on the VPS) since 2026-11-08; Claude Haiku answers chat and call turns first (DB-0151).

## Active

- [DB-0152](../tasks/TASK-DB-0152-calls-on-our-voice-agent.md): live calls on our voice worker. Merged (#238), switched over and checked with a scripted call on www.
- [DB-0153](../tasks/TASK-DB-0153-call-trace-fixes.md): fixes from the owner's 2026-11-08 call traces (greeting, moon following papers, references, narration, page name, messages on a call, spoken emails, false stalls). PR open, not merged.
- [PR #205](https://github.com/Pukujan/design-bakery/pull/205): Octo RAG retrieval before the model, so calls get real search. Up to date with main, checks green, not merged.

## Queued

- [#145](https://github.com/Pukujan/design-bakery/issues/145): previous SEO/homepage/assistant requests, deferred.
- [DB-0101 / #147](https://github.com/Pukujan/design-bakery/issues/147): virtual Pujan, voice/mobile/contact/reading/adaptive requests, deferred after owner rejected the UI.
- [#151](https://github.com/Pukujan/design-bakery/issues/151): proposed live AI consultation demo and service funnel.
- [#152](https://github.com/Pukujan/design-bakery/issues/152): proposed NYC project portfolio entry.

## Source request log

[tasks/requests/owner-requests-2026-11-02.md](../tasks/requests/owner-requests-2026-11-02.md) preserves the owner prompts, corrections, screenshots context and final stop/rollback instruction. Historical implementation checkpoints remain evidence of what happened, not current acceptance.

## Next atomic action

Owner review and merge of PR #205, then a scripted call that asks about a paper to see retrieval on a call turn.
