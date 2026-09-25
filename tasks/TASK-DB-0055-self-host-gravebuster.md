# TASK-DB-0055 — self-host design-bakery on gravebuster (move off Vercel)

| Field | Value |
|-------|-------|
| **Created** | 2026-09-25 |
| **Issue** | [#52](https://github.com/Pukujan/design-bakery/issues/52) |
| **PR** | [#54](https://github.com/Pukujan/design-bakery/pull/54) |
| **Branch** | `task/TASK-DB-0055-self-host-gravebuster` |
| **Status** | Container running and verified on gravebuster; DNS still on Vercel. PR open, do not merge without the owner's review. |

## Goal

Serve the site from gravebuster instead of Vercel, through the same Cloudflare Tunnel
pattern already used for `study.design-bakery.com`, with the previous image kept for
rollback and the Vercel project left in place as a fallback.

## Done

- **`deploy/gravebuster/`** — multi-stage `Dockerfile` (node 24 + pnpm build → Caddy
  serving `frontend/dist`), `Caddyfile` reproducing every `vercel.json` rule plus the
  apex→www 307, `docker-compose.yml` (container `design-bakery-web` on
  `127.0.0.1:8085` only), `docker-compose.edge.yml` (opt-in join of the tunnel network),
  `deploy.sh` (fetch → build tagged image → swap → health/smoke check → auto-rollback),
  `rollback.sh`, `autodeploy.sh` + `systemd/` units (implemented, disabled),
  `README.md`, `.env.example`.
- **Deployed** from `~/apps/design-bakery` on gravebuster at `b77f058759db`; image
  `design-bakery-web:b77f058759db-20260925T005947Z`; healthy; the previous tag is
  retained.
- **Rollback verified** in both directions (`rollback.sh`).
- **Parity verified** against `https://www.design-bakery.com` on 21 paths — identical
  status, content type and body size everywhere except `/sitemap.xml` (build lacked the
  live blog source), the 404 body and our own `/healthz`. Bodies byte-identical for
  `/robots.txt`, `/ai-for-good/`, both cortex pages and all four redirect responses.
  Table and known differences in [docs/self-hosting.md](../docs/self-hosting.md) §2.
- **Tunnel research (read-only):** `study-os-cloudflared-1` is a **token-based,
  remotely-managed** tunnel (`TUNNEL_TOKEN` env, no `config.yml`/credentials on disk), so
  ingress is dashboard-side and the origin must be a docker DNS name on `study-os_edge`.
  The `--with-edge` overlay was verified to attach and answer `ok` from that network, then
  detached again.
- **`docs/self-hosting.md`** — architecture, deploy, rollback, the exact remaining
  Cloudflare steps, the staging-hostname plan, and the auto-deploy timer.

## Not done (manual, needs the Cloudflare dashboard)

1. `deploy.sh --with-edge` to attach the container to `study-os_edge`.
2. Add `staging.design-bakery.com` → `http://design-bakery-web:80`, verify, then add
   `www.design-bakery.com` + `design-bakery.com` (record the current DNS targets first —
   that is the DNS rollback).
3. Optionally enable the auto-deploy timer.

Nothing in Cloudflare DNS, the tunnel ingress, or the Vercel project was changed.

## Known gaps

- Social/OG meta injection from the Vercel Edge middleware (`middleware.ts`, not
  `vercel.json`) is not reproduced — crawlers/link previews on `/blogs/*` and SPA
  case-study routes get the generic shell title. Status and content type are unaffected.
- `sitemap.xml` and the JS entry hash differ until the `VITE_*` build args
  (`VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`, or `VITE_BLOG_API_URL`) are set in
  `deploy/gravebuster/.env`.
