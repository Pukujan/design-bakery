# TASK-DB-0071 — containerize the Express API for gravebuster

| Field | Value |
|-------|-------|
| **Created** | 2026-10-06 |
| **Issue** | [#80](https://github.com/Pukujan/design-bakery/issues/80) (self-host the API off Railway) |
| **Branch** | `task/TASK-DB-0071-backend-container` |
| **Status** | Complete — container builds and serves `/health`; PR open. |

## Goal

Issue #80's first slice: there is no gravebuster deployment for the Express API at
all — no Dockerfile, no compose service, no tunnel hostname. The frontend half
(TASK-DB-0055) already serves from `design-bakery-web`. This adds the API half,
loopback-first, mirroring the existing frontend container.

## Done

- `deploy/gravebuster/Dockerfile.api` — single-stage `node:24-bookworm-slim`:
  corepack pnpm → `apt-get install fontconfig fonts-dejavu-core` (the same packages
  root `nixpacks.toml` installs for Railway) → `pnpm install --frozen-lockfile
  --prod=false` → `pnpm --dir backend/services run build && pnpm --dir backend run
  build` → `node backend/lib/server.js`. Build and start commands are the same as
  `backend/railway.toml`.
- `deploy/gravebuster/Dockerfile.api.dockerignore` — same context pruning as the web
  image, plus `backend/services/lib`.
- `deploy/gravebuster/docker-compose.yml` — new `api` service,
  `127.0.0.1:${API_HOST_PORT:-8788}:8787`, secrets from an optional `.env.api`.
  `deploy.sh` / `rollback.sh` address `web` explicitly (`--no-deps web`), so the
  frontend deploy is unaffected.
- `.gitignore` — `deploy/gravebuster/.env.api` (secrets: Supabase service role,
  OpenRouter, admin password, agent tokens).
- `deploy/gravebuster/.env.example` + `README.md` updated for the new service.

## Verification

- `docker compose -f deploy/gravebuster/docker-compose.yml config` → valid; services
  `api` and `web`.
- `git check-ignore -v deploy/gravebuster/.env.api` → ignored.
- `docker build -f deploy/gravebuster/Dockerfile.api -t design-bakery-api:local .` →
  builds clean (~1.07 GB).
- Container smoke test (`docker run -d -p 127.0.0.1:8788:8787 design-bakery-api:local`):
  - `GET /health` → **200** `{"ok":true,"service":"design-bakery-api"}` within ~2 s.
  - Docker healthcheck settles to **healthy** (~3 s after start-period).
  - Startup log: `[publish-kit:fonts] using system DejaVu Sans (Railway apt
    fonts-dejavu-core)` — the fontconfig + DejaVu path matches Railway exactly.
  - `GET /api/public/blogs` without credentials → 500 with a clear
    "Supabase is not configured" message (degrades, does not crash).

The first build shipped without a `CMD`, so the container ran bare `node` and exited
0 — caught only by actually running it. `CMD ["node", "backend/lib/server.js"]` is
now set, matching `backend/railway.toml`.

## Open questions (owner)

- **Ingress:** expose the API at its own tunnel hostname (e.g. `api.design-bakery.com`)
  or reverse-proxy `/api` from the `web` Caddyfile to the `api` container
  (same-origin)? Same-origin removes CORS entirely and matches `VITE_BLOG_API_URL=""`.
- **Secrets:** the container needs the Railway env set moved into
  `deploy/gravebuster/.env.api`.
- Railway stays authoritative until the tunnel points at gravebuster.

## Next step

- Verify the image builds and `/health` answers on `127.0.0.1:8788`, then decide the
  ingress question above and wire the tunnel.
