# TASK-DB-0082 — host design-bakery on the Mac while gravebuster is down

| Field | Value |
|-------|-------|
| **Created** | 2026-10-11 |
| **Issues** | [#52](https://github.com/Pukujan/design-bakery/issues/52) (self-host) — the host changed, the issue's goal is unchanged |
| **Branch** | `task/TASK-DB-0082-mac-hosting-cutover` |
| **Status** | Merged ([#110](https://github.com/Pukujan/design-bakery/pull/110), `08b1d62`) and deployed live on the Mac; octo data recovery and auto-deploy scheduler still open |

## Goal

gravebuster (the owner's Linux box, the host since TASK-DB-0076) went offline —
Tailscale cannot reach it and every gravebuster-origin hostname on the tunnel
502s. The site's own hostnames (`www` / apex) went down with it. The owner
asked to bring design-bakery.com back by hosting it on the MacBook Pro, in
containers alongside octo, which already runs there. Scope was narrowed
explicitly: **design-bakery only** — not study-os, bench, or acs.

The key fact that made this a same-day job rather than a migration: the
Cloudflare Tunnel `study-os-gravebuster` is shared by both boxes, and the
**Mac's `octo-cloudflared` container is already connected to that same
tunnel**. Its ingress already routes `www` and the apex to
`http://design-bakery-web:80`. Nothing in Cloudflare needed to change — the
502 was simply "no container named `design-bakery-web` on the Mac". Stand up
that container on the tunnel network and the site comes back.

## What changed

### The deploy kit became portable (the only code change)

`deploy/gravebuster/deploy.sh`, `rollback.sh` and `autodeploy.sh` ran on Linux
and broke on macOS in two ways:

1. **`flock(1)` does not exist on macOS.** The lock (added in TASK-DB-0081 to
   stop the deploy collision that 502'd `/api/*`) was `exec 9>"$LOCK_FILE"` +
   `flock -n 9`. The first Mac run died with
   `deploy.sh: line 137: flock: command not found`.
2. **Docker Desktop's CLI is not on the non-interactive SSH PATH.** The Mac
   runs this over plain SSH (like gravebuster did); `ssh mac <script>` has no
   `/usr/local/bin` on PATH, so even `command -v docker` failed. A login shell
   has it; a script run does not.

Fixes, deliberately minimal and Linux-safe:

- All three scripts prepend `/usr/local/bin` to `PATH` after
  `set -euo pipefail` (harmless on Linux).
- `deploy.sh` + `rollback.sh` replace the flock with a portable
  **lock directory** scheme in a shared `acquire_lock()` function:
  `mkdir` is atomic on both platforms; the holder writes its `pid` inside;
  the EXIT trap removes the directory. Stale-lock rules: a dead pid (or a pid
  older than `STALE_LOCK_MAX_MINUTES`, default 24 h — pid reuse safety valve)
  is taken over; a lock with no pid yet is only taken over after
  `STALE_LOCK_MINUTES` (default 60 m — the mkdir→write-pid window); a leftover
  plain FILE at the lock path (the pre-macOS scheme) is removed on sight.
  Non-blocking as before: a live lock fails fast with the same message.
- A subtle bug found while testing this code: the EXIT trap originally used
  `rmdir`, but the lock directory holds the pid file, so `rmdir` (empty
  directories only) would have **left the lock behind on every run**. It is
  `rm -rf`. Verified on the Mac: the lock is gone after a run.

Header comments and `usage()` line ranges were kept line-count-neutral so the
`sed -n '2,26p'` / `'2,21p'` help extraction still works (verified with
`--help` on the Mac).

### The Mac deploy checkout

`~/apps/design-bakery` on the Mac (cloned earlier in this work, beside octo's
`~/apps/octo`), with:

- `deploy/gravebuster/.env` — `WEB_HOST_PORT=8085`, `API_HOST_PORT=8789`,
  `EDGE_NETWORK=study-os_edge`, `WITH_EDGE=1` (sticky tunnel attachment),
  `VITE_SITE_URL` / `VITE_BLOG_API_URL=https://www.design-bakery.com`
  (same-origin `/api` + full sitemap, per docs/self-hosting.md §3).
- `deploy/gravebuster/.env.api` (mode 600) — `OCTO_API_BASE=https://octodb.design-bakery.com`,
  a fresh `ADMIN_JWT_SECRET` (`openssl rand -base64 48`), `ALLOWED_ORIGINS`,
  `PUBLISH_KIT_VISUAL_MODE=template`; **empty** `OCTO_WORKSPACE_ID`,
  `OCTO_API_KEY`, `ADMIN_EMAIL`, `OPENROUTER_API_KEY` pending the owner's new
  workspace key.

Note: 8789 is the repo's reconciled API default (TASK-DB-0079); 8788 is free
on the Mac but the default was kept so both hosts match the documented
convention.

## Deployed

From the Mac, `deploy.sh --ref origin/task/TASK-DB-0082-mac-hosting-cutover`
(web + API, edge attached) — exit 0:

```
[2026-10-11T11:44:03Z] deploy OK: d9d23cded990 -> design-bakery-web:d9d23cded990-20261011T114250Z
```

Both images built (`design-bakery-web:d9d23cded990-20261011T114250Z`,
`design-bakery-api:d9d23cded990-20261011T114324Z`), both containers
`healthy`, API `/health` up, smoke test all green (`/healthz`, `/`,
`/research/papers/db-r-2026-010`, `/robots.txt`, `/ire` 200; `/ire/app` 301;
`/ai-for-good` 308; `/studyos` 307), and the expected
`WARN /api/public/blogs returned 500` — the API is up but has no octo
workspace key yet.

The first run of the day also validated the stale-lock recovery paths for
real: it hit a leftover zero-byte `.deploy.lock` FILE (from the failed flock
run before the macOS fixes were checked out) and removed it
("pre-directory lock scheme"), and a second overlapping run failed fast on
the held lock exactly as designed.

### Verified live (public, through the tunnel)

| Check | Result |
|---|---|
| `https://www.design-bakery.com/` | 200 text/html |
| `/healthz` | 200 text/plain, body `ok` — proves it is the Mac's container |
| `/ire` | 200, `<title>Today's open-weight model picks on InferHub \| IRE</title>` |
| `/robots.txt`, `/research/papers/db-r-2026-010` | 200 |
| apex → www | 307 |
| `/api/public/blogs` | 500 (expected — key-less API; site falls back to the 7-post snapshot) |
| `docker inspect design-bakery-web` networks | `design-bakery_default` + `study-os_edge` (tunnel attached) |
|gravebuster reachability | still down (Tailscale no reply) |

The blog serves the committed 7-post `blog-data.json` snapshot until the
octo key arrives (this is the designed fallback, TASK-DB-0078's inverse).

## Known facts / watch out

- **The tunnel is shared.** `study-os-gravebuster` now has one live connector
  (the Mac). When gravebuster comes back, its cloudflared reconnects to the
  same tunnel and Cloudflare will load-balance **every hostname** across both
  origins: `www`/apex would split between two builds, and study/bench/acs
  (gravebuster-only origins) would flap back to 502 whenever Cloudflare picks
  the Mac connector. This needs an owner decision before that happens
  (gravebuster's own hostname origins, token rotation, or retiring
  gravebuster's connector).
- **No auto-deploy on the Mac yet.** There is no launchd equivalent of the
  gravebuster systemd timer; deploys are by hand (`deploy.sh`). The script
  comments note this.
- **`/api/*` 500s and crawler previews degrade** until `OCTO_WORKSPACE_ID` +
  `OCTO_API_KEY` are filled into `.env.api` and the API container is
  recreated (`docker compose up -d --no-deps api` — env changes need a
  recreate, and the OG router also needs the data layer).
- **The octo data gap is real.** The Mac's octo has no design-bakery
  workspace (workspaces: `personal`, `aba`, `personal-branding-project`,
  `chatgpt` + guests; DBs: no `octo_ws_design_bakery_*`). The content lives
  in gravebuster's octo (`octo_ws_design_bakery_c192afbc`), which is
  unreachable. The owner said they will provide a new workspace key later —
  that fixes the API's *access*, but the 136 content rows themselves still
  need to come back from gravebuster (or be re-migrated from the Supabase
  source the original migration read, if that route still has the data).
- Docker Desktop on the Mac must be running for the site to be up (no
  restart-on-boot guarantee configured yet — login-item/launchd follow-up).

## Evidence

- Mac `deploy.log` tail quoted above (deploy OK at 2026-10-11T11:44:03Z).
- `.deploy-state`: `SHA=d9d23cded990…`, both `CURRENT_*_IMAGE` set,
  `DEPLOYED_AT=2026-10-11T11:44:03Z`.
- Public checks table above (run from the Windows box, so through the real
  Cloudflare edge).
- `bash -n` on all three scripts; `deploy.sh --help` / `rollback.sh --help`
  render correctly on the Mac (usage line ranges intact).
- Lock behaviour exercised on the Mac for real: stale-FILE takeover and the
  fail-fast path both logged (see deploy.log 11:42:21 / 11:42:50).

## Boundaries and non-goals

- **Not moved:** study-os, eval-lab bench, acs — they stay on gravebuster
  (owner narrowed the scope explicitly). Their hostnames 502 until
  gravebuster returns.
- **Not changed:** anything in Cloudflare — no ingress, DNS, or token change.
  The tunnel was already correct.
- **Not done here (open):** octo workspace key + data recovery, launchd
  auto-deploy, Docker Desktop auto-start, the split-brain decision.
- The Vercel project stays untouched as the DNS-level rollback (see
  docs/self-hosting.md §5 step 7).

## Next step

1. Owner supplies a new octo workspace key + workspace id → fill
   `.env.api`, recreate the API container, verify `/api/public/blogs` 200.
2. Recover the content rows from gravebuster's octo when the box is back.
3. Decide the tunnel split-brain plan **before** gravebuster reconnects.
4. launchd timer for `autodeploy.sh` (port of the systemd unit).
