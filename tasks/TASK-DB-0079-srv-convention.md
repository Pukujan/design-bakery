# TASK-DB-0079 — adopt the `/srv` hosting convention (issue #98)

| Field | Value |
|-------|-------|
| **Created** | 2026-10-07 |
| **Issue** | [#98](https://github.com/Pukujan/design-bakery/issues/98) (proposal — author the target; the move is owner-gated) |
| **Branch** | `task/TASK-DB-0079-srv-convention` |
| **Status** | Open — target authored and validated; the move is blocked (see below) |

## Goal

Issue #98 asks each hosted project to conform to the operator's one-project-one-directory
hosting standard: repo at `/srv/<project>/app`, a single compose file at the deploy root,
`PROJECT.json`, loopback-only ports, and the single Cloudflare tunnel as the only public
ingress. The issue is explicit that it **authorizes no server change by itself** — author
and validate the target, then move only on explicit operator direction. This task does the
authoring and validation half.

## Done

- **API port reconciled.** The compose default, both scripts' fallback, `.env.example` and
  the docs said `8788`, but the live bind is `8789` — `ss -tlnp` confirms `8788` is taken
  by another stack on gravebuster (`rootlessport`), which is why the box's `.env` sets
  `API_HOST_PORT=8789`. A fresh box without that override would have failed to bind. All
  four defaults now read `8789`, matching the live bind:
  - `deploy/gravebuster/docker-compose.yml` (`${API_HOST_PORT:-8789}`)
  - `deploy/gravebuster/deploy.sh` / `rollback.sh` (`API_HOST_PORT=${API_HOST_PORT:-8789}`)
  - `deploy/gravebuster/.env.example`, `docs/self-hosting.md` (§7, §8), the 2026-10-07 devlog
- **`deploy/gravebuster/PROJECT.json`** (new) — the manifest the standard calls for: owner,
  purpose, exposure (hostnames, tunnel, edge network, loopback ports), the octo data layer,
  and the compose file/name. **The schema is inferred from issue #98** (it names owner,
  purpose, exposure, data but no field spec) — reconcile it against a sibling project's
  `PROJECT.json` before relying on it as canonical.
- **Validation of the current stack** (read-only, on gravebuster): `docker ps` shows
  `design-bakery-web` on `127.0.0.1:8085` and `design-bakery-api` on `127.0.0.1:8789`,
  both loopback-only; `ss -tlnp` confirms both bind `127.0.0.1`; the compose file already
  pins `name: design-bakery` and already has the `docker-compose.edge.yml` overlay.

## Blocked — the `/srv` move breaks the deploy scripts

Issue #98's target puts the repo at `/srv/design-bakery/app/` with the deploy files at
`/srv/design-bakery/`. That layout does not work with the current scripts, because both
derive the repo from their own location and the compose build context points at it:

- `deploy.sh` / `rollback.sh`: `REPO_DIR=${DEPLOY_REPO_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}`
  — from `/srv/design-bakery/` this resolves to `/`, not the repo.
- `docker-compose.yml` `web` service: `build.context: ../..` — the same wrong path.

So the move is **not** the "two edits and a move" #98 estimates. It needs either the repo
to stay two levels under the deploy root (`/srv/design-bakery/app/deploy/gravebuster/`,
which defeats the standard's flat layout) or the scripts and compose to be parameterized
(`DEPLOY_REPO_DIR` plus an explicit `build.context`). That is a code change to author
**before** the move, and it is deliberately not made here — it changes the deploy path for
a live site and belongs with the cutover.

Also unresolved by the issue: the guardrail says the directory is not a migration candidate
until `git status --porcelain` is empty, and the box currently has two untracked files
(`deploy/gravebuster/.env.bak-20261006T073626Z`, `.env.bak-20261007`). These are **backups**
(one predates this session), not work-in-progress, and `git stash list` is empty — so this
is a cleanup decision for the owner, not a "push your work first" blocker.

## Not done (owner-gated)

- Moving the deploy root to `/srv/design-bakery/`. Per #98's guardrails this needs explicit
  operator direction naming the host, a re-run of the read-only probes first, and the
  script/compose parameterization above.
- Deleting the old `~/apps/design-bakery` directory (only after the new stack serves).

## Evidence

- `grep -rn API_HOST_PORT deploy/gravebuster docs/self-hosting.md` → all four defaults `8789`.
- On gravebuster: `docker ps` → `design-bakery-api 127.0.0.1:8789->8787/tcp`,
  `design-bakery-web 127.0.0.1:8085->80/tcp`; `ss -tlnp` → `8788` held by another stack's
  `rootlessport`, `8789` is ours.
- `docker compose -p design-bakery config` renders (run in the cutover task; unchanged here).

## Non-goals

- Any server change (move, port rebind, tunnel edit) — #98 authorizes none on its own.
- Renaming the containers, the network, or the hostnames.
