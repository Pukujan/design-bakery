# TASK-DB-0102 — Restore Before UI Work

<!-- continuity:task {"acceptance":["Application and configuration match pre-session revision 154350f","All owner requests remain in future issue logs","Required checks pass and Komodo serves rollback"],"depends_on":[],"goal":"Restore the pre-session site while preserving all future requests","id":"DB-0102","issue_url":"https://github.com/Pukujan/design-bakery/issues/150","next_action":"Pass CI, merge rollback, and verify Komodo production images","owner":"codex","priority":"normal","protocol_version":"0.1.0-draft","schema":"project-continuity.task.v1","status":"active","why":"The owner rejected the new UI and explicitly stopped feature work"} -->

- Status: active
- Owner: codex
- Leaf: [#150](https://github.com/Pukujan/design-bakery/issues/150)
- Parent: [#145](https://github.com/Pukujan/design-bakery/issues/145)
- Dependencies: none
- Branch: `codex/restore-before-ui-work`

## Goal

Restore application/config changes from #148 and #149 to `154350f`, the origin/main revision at the start of this session, without rewriting history. Preserve task/history/request logs.

## Acceptance criteria

- [ ] Runtime/config files exactly match `154350f`.
- [ ] Owner prompts are preserved in [the request archive](requests/owner-requests-2026-11-02.md).
- [ ] Existing feature issues remain open and deferred; new proposals #151 and #152 are recorded.
- [ ] Required CI and Komodo rollback verification complete.

## Checkpoint log

## Next action

Pass required CI, auto-merge and verify Komodo production images. No feature work is authorized.
