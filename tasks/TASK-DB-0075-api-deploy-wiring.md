# TASK-DB-0075 — deploy the API container with the web container

| Field | Value |
|-------|-------|
| **Created** | 2026-10-07 |
| **Issue** | [#80](https://github.com/Pukujan/design-bakery/issues/80) (self-host the API off Railway) |
| **Branch** | `task/TASK-DB-0075-api-deploy-wiring` |
| **Status** | In progress |

## Goal

The `api` compose service exists (TASK-DB-0071) but **nothing deploys it**:
`deploy.sh` and `rollback.sh` both run `compose up -d --no-deps web`, build only
`web`, and track only `design-bakery-web` in `.deploy-state`. So on gravebuster the
API container is never built, never started, never health-checked and never rolled
back — and the `handle /api/* { reverse_proxy api:8787 }` rule already in the
Caddyfile 502s because no `api` container is listening.

This makes the API deploy a first-class part of `deploy.sh`/`rollback.sh`, the same
way the web container is.

## Done

- `deploy.sh` — builds/tags `design-bakery-api:<sha12>-<utc>` when the API is
  enabled, swaps the `api` container, health-checks `127.0.0.1:$API_HOST_PORT/health`
  (non-optional: an unhealthy API fails the deploy), records
  `CURRENT_API_IMAGE`/`PREVIOUS_API_IMAGE` in `.deploy-state`, and rolls the API back
  with the web container on smoke failure.
- `rollback.sh` — swaps the API image back alongside the web image, health-checks it,
  and flips the API tags. A web-only rollback preserves the recorded API tags.
- A run that does not deploy the API never blanks the recorded API images
  (`api_state_current`/`api_state_previous` helpers), so a later API rollback still
  has a target.
- `/health` alone only proves the Node process is up, so the deploy also GETs
  `/api/public/blogs` **through the web container** when the API is enabled — the check
  that actually exercises the Caddy `/api/*` rule. A gateway status (502/503/504) fails
  the deploy (the original bug); a 500 only warns (a data-layer/secret problem, not a
  routing one, and rolling back does not fix an upstream outage).
- The API gets its own `API_HEALTH_TIMEOUT` (180 s): the image is ~1 GB and Node
  cold-starts slower than Caddy.
- The enable decision is logged at deploy start, including the "enabled but
  `.env.api` missing → content routes will 500" warning.
- `.env.example` — documents `API_HOST_PORT`, `DESIGN_BAKERY_API_IMAGE` and the
  `WITH_API` enable knob.
- `docs/self-hosting.md` §3/§4/§7/§8 and `deploy/gravebuster/README.md`.

## Evidence

- `bash -n` clean on both scripts; `--help` output correct for both.
- `docker compose config` resolves both `web` and `api`.
- Enable-rule table (7 cases: default/env-file/`WITH_API`/`--with-api`/`--no-api`)
  unit-tested — all as specified.
- State preservation unit-tested: an API deploy records the API tags; a following
  web-only deploy leaves them intact.

## Not verifiable here

Docker Desktop is not running on this machine, so the container build/swap/health
path cannot be exercised end-to-end locally — only the script logic and the compose
config. First real run is on gravebuster.

## Scope

- `deploy.sh` — build and tag `design-bakery-api:<sha12>-<utc>`, swap the `api`
  container, health-check `127.0.0.1:$API_HOST_PORT/health`, record
  `CURRENT_API_IMAGE`/`PREVIOUS_API_IMAGE`, and roll the API back with the web
  container when the smoke test fails.
- `rollback.sh` — swap the API image back alongside the web image.
- `.env.example` — document the API image/port knobs and the enable rule.
- `docs/self-hosting.md` §3/§4/§8 and `deploy/gravebuster/README.md`.

## Enable rule

The API deploys only when it is wanted, so a web-only deploy stays fast:

- default: on **iff** `deploy/gravebuster/.env.api` exists (it holds the secrets the
  API needs to be useful);
- `--with-api` / `--no-api` override for a single run;
- `WITH_API=1` in `deploy/gravebuster/.env` makes it permanent.

## Non-goals

- The Cloudflare Tunnel ingress and DNS (owner-gated).
- Moving the Railway secrets into `.env.api` (owner-gated).
- The Vercel Edge OG middleware replacement (separate slice).
