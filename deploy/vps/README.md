# design-bakery deploy kit

The container stack that serves the site (`frontend` SPA, built with pnpm + Vite) and its
Express API on the VPS, routed by the rules in `Caddyfile`. Full runbook:
[`docs/self-hosting.md`](../../docs/self-hosting.md).

Komodo runs these files by this path: the stack `design-bakery-vps` in
`pukujan-lab-2/server-management`, `komodo/resources/stacks-vps.toml`.

| file | purpose |
| --- | --- |
| `Dockerfile` | multi-stage: `node:24-bookworm-slim` + pnpm build → `caddy:2-alpine` serving `frontend/dist` |
| `Dockerfile.api` | single-stage `node:24-bookworm-slim` + pnpm build → runs the Express API (`backend/lib/server.js`) with fontconfig + DejaVu Sans |
| `Caddyfile` | static server with the site's redirect/rewrite rules (the source of truth for routing), plus the `/api/*` and link-preview proxies to `api:8787` |
| `docker-compose.yml` | the `web` and `api` containers, both published on `127.0.0.1` only |
| `docker-compose.edge.yml` | overlay joining the Cloudflare Tunnel's docker network (`study-os_edge`) |
| `deploy.sh` | fetch ref → build tagged images → swap containers → smoke test (auto-rollback on failure). Takes an exclusive lock so only one deploy runs at a time. Komodo runs it as the stack's pre-deploy |
| `rollback.sh` | swap back to the previously deployed image tags (web + API); takes the same lock |
| `PROJECT.json` | machine-readable summary: hostnames, ports, compose files, data layer |
| `.env.example` | copy to `.env` (git-ignored) for ports, edge network, image tags and the public `VITE_*` build args |
| `.env.api.example` | template for `.env.api` — every variable, with where each value comes from |
| `.env.api` | **secrets** for the API container (git-ignored) — Octo workspace key, OpenRouter, admin password |

Deploys happen on their own: a merge to `main` is picked up by Komodo's
`design-bakery-deploy-on-push` action within about five minutes. To deploy or roll back by
hand on the VPS:

```bash
cd ~/apps/design-bakery
deploy/vps/deploy.sh --ref origin/main
deploy/vps/rollback.sh
```

Besides `/api/*`, Caddy sends the blog and case-study paths to `api:8787` so link
previews get per-post `<title>` / `og:*` tags (`backend/src/api/ogPreview.ts`; the matcher
is `@ogPreview` in the Caddyfile, and `pnpm test:og-routing` keeps the two in step). When
the API is down, Caddy degrades those paths to the plain SPA shell rather than 502ing them.
