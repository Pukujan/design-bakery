# TASK-DB-0086 — CD on the Mac: launchd auto-deploy agent

| Field | Value |
|-------|-------|
| **Created** | 2026-10-12 |
| **Issues** | None filed — owner direction in session ("create a cd pipeline for auto deployments") |
| **Branch** | `task/TASK-DB-0086-mac-autodeploy` |
| **Base** | `main` @ `bc7512a` |
| **Status** | In progress |

## Goal

Merges to `main` deploy themselves on the Mac within ~5 minutes, closing the gap
TASK-DB-0084 recorded as open owner work ("The Mac still has no auto-deploy scheduler").
`deploy/gravebuster/autodeploy.sh` already implements the poll-and-deploy logic and runs
on gravebuster under systemd; on the Mac it worked only when run by hand.

## Approach (owner-approved)

Three options were presented: a launchd agent on the Mac, a GitHub Action SSHing in over
Tailscale (needs a Tailscale OAuth client only the owner can mint), and a self-hosted
GitHub runner (rejected — the repo is **public**, and GitHub advises against self-hosted
runners on public repos: a fork PR that edits a workflow could execute on the box). The
launchd agent was chosen: no secrets, no inbound access, and it reuses every safety
mechanism in `deploy.sh` (lock, smoke, auto-rollback).

## What changed

- **`deploy/gravebuster/launchd/com.designbakery.autodeploy.plist`** (new) — per-user
  launchd agent, `StartInterval=300`, `RunAtLoad`, PATH prepending `/usr/local/bin`,
  logging to `~/Library/Logs/design-bakery-autodeploy.log`. Modeled 1:1 on the
  `com.octo.autodeploy` agent already on the box (same interval, log location, PATH).
- **`docs/self-hosting.md`** — §0's macOS list (item 3) and §6 now describe the Mac agent
  with its install/disable commands, and record the one dependency worth remembering: `gh`
  is not installed on the Mac and `origin` is HTTPS, so the poller authenticates through
  the login keychain (`credential.helper=osxkeychain`) — the same path
  `com.octo.autodeploy` uses.

No script changes were needed: `autodeploy.sh` was already macOS-ready (lock directory,
PATH prepend), and `deploy.sh` writes `SHA=` back to `.deploy-state` only after its smoke
test passes — so a failed deploy is retried on the next tick rather than recorded as done.

## Verification

- `bash -n deploy/gravebuster/autodeploy.sh` — clean.
- Non-interactive fetch from the Mac checkout confirmed working over HTTPS
  (`GIT_TERMINAL_PROMPT=0 git fetch --prune origin main`, exit 0).
- Installed on the Mac, first real cycle observed: (filled in after install)

## Next

- Merge, then run the install + verification steps on the Mac.
