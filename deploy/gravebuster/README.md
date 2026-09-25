# design-bakery on gravebuster

Container stack that serves the `frontend` SPA (built with pnpm + Vite) from
gravebuster, reproducing every rule in `vercel.json`. Full runbook:
[`docs/self-hosting.md`](../../docs/self-hosting.md).

| file | purpose |
| --- | --- |
| `Dockerfile` | multi-stage: `node:24-bookworm-slim` + pnpm build → `caddy:2-alpine` serving `frontend/dist` |
| `Caddyfile` | static server + `vercel.json` redirect/rewrite parity (1:1 comments) |
| `docker-compose.yml` | the `web` container, published on `127.0.0.1:${WEB_HOST_PORT:-8085}` only |
| `docker-compose.edge.yml` | optional overlay joining the Cloudflare Tunnel's docker network |
| `deploy.sh` | fetch ref → build tagged image → swap container → smoke test (auto-rollback on failure) |
| `rollback.sh` | swap back to the previously deployed image tag |
| `autodeploy.sh` | poll `origin/main` and deploy on change (run by the systemd timer) |
| `systemd/` | `design-bakery-autodeploy.{service,timer}` — **not enabled** by default |
| `.env.example` | copy to `.env` (git-ignored) for port / image / optional `VITE_*` build args |

Quick start on gravebuster:

```bash
git clone https://github.com/Pukujan/design-bakery.git ~/apps/design-bakery
cd ~/apps/design-bakery
cp deploy/gravebuster/.env.example deploy/gravebuster/.env
deploy/gravebuster/deploy.sh --ref origin/main
curl -sI http://127.0.0.1:8085/ | head -1
```

The container is `design-bakery-web`, the image repo is `design-bakery-web`
(tagged `<sha12>-<utc timestamp>`). Nothing is reachable from outside the host
until the Cloudflare Tunnel ingress points at it.
