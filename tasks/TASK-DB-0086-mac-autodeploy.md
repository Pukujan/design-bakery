# TASK-DB-0086 — CD on the Mac: a launchd auto-deploy agent

| Field | Value |
|-------|-------|
| **Created** | 2026-10-12 |
| **Issues** | None filed — owner direction in session ("create a cd pipeline for auto deployments") |
| **Branch** | `task/TASK-DB-0086-mac-autodeploy` |
| **Base** | `main` @ `bc7512a` |
| **Status** | In progress — agent installed and running on the Mac; first cycle observed |

## Goal

A merge to `main` deploys itself on the Mac within ~5 minutes, with no human step. This is
the open owner work TASK-DB-0084 recorded ("The Mac still has no auto-deploy scheduler") and
the macOS counterpart of the systemd timer TASK-DB-0081 enabled on gravebuster.

## Why this is a small task

`deploy/gravebuster/autodeploy.sh` already does the whole job — fetch `origin/main`,
compare against the `SHA` in `.deploy-state`, and `exec deploy.sh --no-pull --ref <sha>`
when it moved. It was already made macOS-portable in TASK-DB-0082 (lock directory instead
of `flock(1)`, `/usr/local/bin` prepended to `PATH`). All that was missing on the Mac was a
scheduler to run it. Nothing in the deploy path needed to change.

## Approach (owner-approved)

Three mechanisms were offered; the owner chose the launchd agent:

1. **launchd agent on the Mac (chosen).** No secrets, no inbound access, reuses `deploy.sh`'s
   lock, smoke and auto-rollback. Mirrors the `com.octo.autodeploy` agent already running on
   that machine.
2. **GitHub Action over Tailscale + SSH.** Rejected for now: it needs a Tailscale OAuth
   client minted in the admin console (owner-gated) plus an SSH key as a repo secret, for no
   functional gain.
3. **Self-hosted GitHub runner.** Rejected: the repo is **public**, and GitHub advises
   against self-hosted runners on public repos — a fork PR that edits a workflow could
   execute on the box. The box also runs several other stacks, which this deployment must
   not disturb.

## What changed

- **`deploy/gravebuster/launchd/com.designbakery.autodeploy.plist`** (new) — per-user agent:
  `StartInterval=300`, `RunAtLoad=true`, `PATH` with `/usr/local/bin`, stdout+stderr to
  `~/Library/Logs/design-bakery-autodeploy.log`. Same shape as `com.octo.autodeploy`.
- **`docs/self-hosting.md`** — §0's macOS list (item 3) and §6 now document the Mac agent
  and its install/disable commands, and record the one dependency worth remembering: `gh` is
  **not** installed on the Mac and `origin` is HTTPS, so the poller authenticates through the
  login keychain (`credential.helper=osxkeychain`) — the same path `com.octo.autodeploy` uses.

No changes to `autodeploy.sh` or `deploy.sh` were needed. The state contract already holds:
`deploy.sh` calls `state_write` (which writes `SHA=`) **only after** its smoke test passes, so
a failed deploy is retried on the next tick rather than being recorded as done.

## Verification

- `plutil -lint` on the plist — OK.
- `bash -n deploy/gravebuster/autodeploy.sh` — clean.
- Non-interactive fetch from the Mac checkout works over HTTPS
  (`GIT_TERMINAL_PROMPT=0 git fetch --prune origin main`, exit 0).
- `autodeploy.sh --dry-run` on the Mac reported the correct pending move
  (`new commit on origin/main: bc7512a975a1 (deployed: 4b5f95c2960b)`).
- **First real cycle (the CD proof):** installing the agent deployed `bc7512a` on its own
  with no human step — see the deploy evidence in
  [TASK-DB-0085](TASK-DB-0085-journey-back-to-version-2.md)'s follow-up / this task's log.

## Next

- Confirm the first cycle's smoke result, then verify from the public edge.
- Watch the next merge to `main` deploy without any hand run — that is the actual acceptance
  test for "CD".
