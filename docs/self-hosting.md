# Self-hosting design-bakery on gravebuster

Runbook for serving the `frontend` SPA from gravebuster (the owner's Linux box)
instead of Vercel — TASK-DB-0055, issue
[#52](https://github.com/Pukujan/design-bakery/issues/52).

**Current state (2026-09-25):** the container runs on gravebuster and answers on
`127.0.0.1:8085`, verified 1:1 against `https://www.design-bakery.com`. DNS is
**still on Vercel** — nothing public has moved. The Vercel project stays in place
(disconnected) as the rollback until the new host has run cleanly for a while.

---

## 1. Architecture

```
browser ──► Cloudflare edge (design-bakery.com zone, proxied)
              │
              ├─ study.design-bakery.com ──► study-os tunnel ──► study-os-api-1:8000   (unchanged)
              │
              └─ www / apex (TO BE ADDED) ──► same tunnel ──► design-bakery-web:80
                                                                    │  Caddy, static
                                                                    └─ /ai-for-good/* ─► ai-for-good-livid.vercel.app
```

| Piece | Value |
| --- | --- |
| Deploy checkout | `~/apps/design-bakery` on gravebuster (detached HEAD at the deployed SHA) |
| Compose project | `design-bakery` (`deploy/gravebuster/docker-compose.yml`) |
| Container | `design-bakery-web` (Caddy 2 on `:80`, `restart: unless-stopped`, healthcheck on `/healthz`) |
| Published port | `127.0.0.1:8085` — loopback only, never the LAN/WAN |
| Image | `design-bakery-web:<sha12>-<UTC timestamp>` (~182 MB), plus a `<sha12>` alias |
| Tunnel | the existing `study-os-cloudflared-1` container (token-based, remotely managed) |
| Logs | `docker logs design-bakery-web`, `deploy/gravebuster/deploy.log`, `deploy/gravebuster/autodeploy.log` |

**Build.** `deploy/gravebuster/Dockerfile` is a two-stage build: `node:24-bookworm-slim`
runs the same steps as Vercel (`pnpm install --frozen-lockfile`, then
`pnpm --dir frontend run build`, output `frontend/dist`), and `caddy:2-alpine` serves
the result. Node 24 comes from `.node-version`, pnpm 10.32.1 from
`package.json#packageManager`.

**Routing.** `deploy/gravebuster/Caddyfile` reproduces every rule in `vercel.json`,
commented 1:1. The important semantics, which are easy to get wrong:

1. `redirects` are evaluated **before** the filesystem (`/ai-for-good` → `/ai-for-good/` 308,
   `/studyos[/…]` → `https://study.design-bakery.com/…` 307).
2. `rewrites` are evaluated **after** the filesystem — so `/case-studies/cortex` serves the
   real `case-studies/cortex/index.html`, and only `/case-studies/cortex/a` (which exists
   solely as `…/a/index.html`) hits the cortex rewrite.
3. The catch-all `/((?!.*\.html$).*)` → `/index.html` is the SPA fallback, and paths ending
   in `.html` deliberately 404 instead of falling back.
4. Not in `vercel.json`: the apex → `https://www.design-bakery.com` **307** is Vercel
   *domain* configuration. It is reproduced in the Caddyfile (`@apex host design-bakery.com`)
   so both hostnames can point at this container without serving the site twice.

`/ai-for-good/*` is proxied to the separate `ai-for-good-livid.vercel.app` app with
`Host` rewritten to the destination, matching Vercel's rewrite proxy. That app is out of
scope for this move (issue #52).

---

## 2. Parity with Vercel

Probed from gravebuster on 2026-09-25 against commit `5361a4cb64b5`; local =
`http://127.0.0.1:8085`, live = `https://www.design-bakery.com`.

| Path | local (status / content-type) | live (status / content-type) |
| --- | --- | --- |
| `/` | 200 text/html; charset=utf-8 | 200 text/html; charset=utf-8 |
| `/research/papers/db-r-2026-010` | 200 text/html; charset=utf-8 | 200 text/html; charset=utf-8 |
| `/research/papers/db-r-2026-010/` | 200 text/html; charset=utf-8 | 200 text/html; charset=utf-8 |
| `/research/papers/nope-does-not-exist` | 200 text/html; charset=utf-8 | 200 text/html; charset=utf-8 |
| `/some/deep/spa/route` | 200 text/html; charset=utf-8 | 200 text/html; charset=utf-8 |
| `/robots.txt` | 200 text/plain; charset=utf-8 | 200 text/plain; charset=utf-8 |
| `/sitemap.xml` | 200 application/xml | 200 application/xml |
| `/assets/index-BQtZzjba.css` | 200 text/css; charset=utf-8 | 200 text/css; charset=utf-8 |
| `/case-studies/cortex` | 200 text/html; charset=utf-8 | 200 text/html; charset=utf-8 |
| `/case-studies/cortex/` | 200 text/html; charset=utf-8 | 200 text/html; charset=utf-8 |
| `/case-studies/cortex/a` | 200 text/html; charset=utf-8 | 200 text/html; charset=utf-8 |
| `/case-studies/cortex/b/index.html` | 200 text/html; charset=utf-8 | 200 text/html; charset=utf-8 |
| `/case-studies/cortex/nope.html` | 404 text/plain; charset=utf-8 | 404 text/plain; charset=utf-8 |
| `/nope.html` | 404 text/plain; charset=utf-8 | 404 text/plain; charset=utf-8 |
| `/ai-for-good` | 308 → `/ai-for-good/` | 308 → `https://www.design-bakery.com/ai-for-good/` |
| `/ai-for-good/` | 200 text/html; charset=utf-8 | 200 text/html; charset=utf-8 |
| `/ai-for-good/assets/index-BbMbqSAa.js` | 200 application/javascript; charset=utf-8 | 200 application/javascript; charset=utf-8 |
| `/studyos` | 307 → `https://study.design-bakery.com/` | 307 → `https://study.design-bakery.com/` |
| `/studyos/foo/bar` | 307 → `https://study.design-bakery.com/foo/bar` | 307 → `https://study.design-bakery.com/foo/bar` |
| `/studyos/foo/bar?q=1` | 307 → `…/foo/bar?q=1` (query kept) | 307 → `…/foo/bar?q=1` |
| apex `design-bakery.com/research/papers/db-r-2026-010` (Host override) | 307 → `https://www.design-bakery.com/research/papers/db-r-2026-010` | 307 → same |

Body-level checks (md5 of the response body, local vs live): **byte-identical** for
`/robots.txt`, `/ai-for-good/`, `/case-studies/cortex`, `/case-studies/cortex/a`. The
cortex sizes match exactly (537 / 49858 / 454 bytes), as does the proxied app (2190 /
227478 bytes).

### Known differences (all deliberate or content-level, none are routing bugs)

| Difference | Why | Fix if it matters |
| --- | --- | --- |
| `/` HTML body differs in one line | `index.html` references the hashed entry bundle; the JS hash differs because the Vercel build had `VITE_*` env vars inlined and this build did not | set the `VITE_*` values in `deploy/gravebuster/.env` and redeploy |
| `/sitemap.xml` 4140 bytes vs 10292 | `scripts/generate-sitemap.mjs` prefers the live blog list (Supabase / Railway API) and fell back to the committed `blog-data.json` snapshot, so only the bundled posts are listed | same `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (or `VITE_BLOG_API_URL`) build args |
| `/healthz` | internal liveness endpoint for the container healthcheck and `deploy.sh`; the live site has no such route (it would SPA-fallback to 200 text/html) | leave it; it is the "is this our container?" marker |
| 308/307 responses have an empty body and no `Content-Type` | Caddy sends the status + `Location`; Vercel adds a 15-byte `text/plain` body | cosmetic |
| `/ai-for-good` `Location` is relative (`/ai-for-good/`) | the container only ever sees `http://` from the tunnel, so an absolute URL would downgrade the scheme at the edge; RFC 7231 allows a relative `Location` | cosmetic |
| Social/OG meta injection missing | Vercel Edge middleware (`middleware.ts` at the repo root, not `vercel.json`) rewrites the SPA shell for `/blogs/*`, `/{portfolio}/blogs/*` and `/case-studies/*` with crawler-friendly `<title>`/`og:*` taken from the blog source. Without it those routes return the plain app shell. Status and content type are unchanged, browsers render identically — only what a link-preview bot or crawler reads differs | run the same (isomorphic) logic as a small Node sidecar behind Caddy, or accept the generic preview |
| Vercel response headers absent (`x-vercel-*`, `access-control-allow-origin: *`, `NEL`/`Report-To`) | platform headers | not reproduced; add via Cloudflare if ever needed |

Cache headers do match Vercel's defaults: HTML `public, max-age=0, must-revalidate`,
other static files `public, max-age=14400, must-revalidate`.

---

## 3. Deploy

First-time setup on gravebuster (already done for this deploy):

```bash
git clone https://github.com/Pukujan/design-bakery.git ~/apps/design-bakery
cd ~/apps/design-bakery
cp deploy/gravebuster/.env.example deploy/gravebuster/.env   # port 8085, optional VITE_*
```

Deploy a ref (default `origin/main`):

```bash
cd ~/apps/design-bakery
deploy/gravebuster/deploy.sh --ref origin/main
```

What `deploy.sh` does, in order:

1. `git fetch --prune origin` and resolve the ref to a SHA.
2. Remember the currently running image (`docker inspect` on `design-bakery-web`).
3. `git checkout --force --detach <sha>` — the deploy checkout is intentionally detached;
   do not expect a branch there.
4. `docker compose build` a new image tagged `<sha12>-<UTC timestamp>` (and `<sha12>`).
5. `docker compose up -d --no-deps web` with the new image.
6. Health-check `127.0.0.1:8085/healthz` (up to 90 s), then smoke-check
   `/`, `/research/papers/db-r-2026-010`, `/robots.txt` (200), `/ai-for-good` (308),
   `/studyos` (307).
7. On success: write `deploy/gravebuster/.deploy-state` (`SHA`, `CURRENT_IMAGE`,
   `PREVIOUS_IMAGE`, `DEPLOYED_AT`) and log to `deploy/gravebuster/deploy.log`.
8. On failure: swap the previous image back automatically, health-check it, exit 1
   (`--no-rollback` to skip).

Useful flags: `--no-pull` (use the local checkout), `--with-edge` (also attach the
Cloudflare Tunnel network, see §5), `--port <n>`, `--no-rollback`.

Manual verification after any deploy:

```bash
curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' http://127.0.0.1:8085/
curl -sS -o /dev/null -w '%{http_code} %{redirect_url}\n' http://127.0.0.1:8085/studyos/foo
```

### Build-time config (`deploy/gravebuster/.env`, git-ignored)

Public values only — they are inlined into the JS bundle. Unset is a valid state (the
blog falls back to the committed snapshot), but for full content parity with the Vercel
build set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (anon public key — never
`service_role`) and/or `VITE_BLOG_API_URL`, then redeploy.

---

## 4. Rollback

```bash
cd ~/apps/design-bakery
deploy/gravebuster/rollback.sh              # back to PREVIOUS_IMAGE from .deploy-state
deploy/gravebuster/rollback.sh --list       # image tags on the host
deploy/gravebuster/rollback.sh --image design-bakery-web:97563897ca1e
```

`rollback.sh` swaps the container to the recorded previous tag, health-checks it and
flips `CURRENT_IMAGE`/`PREVIOUS_IMAGE` so the same command rolls forward again. No
rebuild is involved, so it takes a couple of seconds. Old images are never deleted by
the scripts; each is ~182 MB, so prune deliberately when the list gets long:

```bash
docker images design-bakery-web    # inspect first
docker image prune -a --filter 'until=720h'   # only if you no longer need the tags
```

Disaster recovery (host lost, checkout gone): `git clone`, copy `.env`, then
`deploy.sh --ref <sha>` — the image is reproducible from the commit.

**DNS-level rollback** (once the tunnel is live): see §5 step 7.

---

## 5. Routing www.design-bakery.com and the apex (remaining manual steps)

### What the existing tunnel looks like

Inspected read-only on gravebuster:

- `study-os-cloudflared-1` runs `cloudflare/cloudflared:2026.9.3` with
  `command: tunnel --no-autoupdate run` and the token supplied as the `TUNNEL_TOKEN`
  environment variable, from `/srv/study-os/docker-compose.yml`.
- **It is a token-based, remotely-managed tunnel.** There is no `config.yml`, no
  `credentials.json` and no ingress file on disk — the ingress rules live in the
  Cloudflare Zero Trust dashboard (or the Cloudflare API). Nothing about hostnames can
  be changed from gravebuster.
- The container is attached to the `study-os_edge` bridge network together with
  `study-os-api-1`, so its ingress targets a **docker DNS name** (e.g.
  `http://study-os-api-1:8000`), not a host port.
- `study.design-bakery.com` is the only public hostname known to be on it.

Consequence: the new hostname is added in the dashboard, and the origin must be
reachable *from the cloudflared container*, i.e. on `study-os_edge` — not on the host's
`127.0.0.1:8085`.

### Steps (do these when ready; nothing here has been done yet)

1. **Attach our container to the tunnel network.** Uses
   `deploy/gravebuster/docker-compose.edge.yml`, which joins `study-os_edge` as an
   *external* network and adds the alias `design-bakery-web`. It creates, modifies and
   restarts nothing in the study-os stack — it only adds a second member to a network
   that stack already owns.

   ```bash
   cd ~/apps/design-bakery
   deploy/gravebuster/deploy.sh --with-edge --no-pull --ref "$(git rev-parse HEAD)"
   # or, equivalently, without rebuilding:
   docker compose -f deploy/gravebuster/docker-compose.yml \
                  -f deploy/gravebuster/docker-compose.edge.yml up -d --no-deps web
   ```

   Verify the tunnel can reach it. The cloudflared image is distroless — it has no shell,
   `wget` or `getent` — so check reachability from a throwaway container on the same
   network instead (this is the same DNS path cloudflared uses):

   ```bash
   docker run --rm --network study-os_edge alpine wget -qO- --timeout=5 http://design-bakery-web/healthz
   # → ok
   ```

   (Verified on 2026-09-25: the overlay attaches cleanly, `design-bakery-web` resolves on
   `study-os_edge` and answers `ok`; the study-os containers were not touched. The network
   was then detached again — the deployed container currently sits on
   `design-bakery_default` only.)

2. **Staging hostname first.** Zero Trust → Networks → Tunnels → the tunnel whose public
   hostnames include `study.design-bakery.com` → **Public Hostnames** → *Add a public
   hostname*:

   | Field | Value |
   | --- | --- |
   | Subdomain | `staging` |
   | Domain | `design-bakery.com` |
   | Service | `HTTP` → `design-bakery-web:80` |

   Cloudflare creates the proxied CNAME automatically because the zone is on Cloudflare.
   Then, from anywhere: `curl -sS -o /dev/null -w '%{http_code}\n' https://staging.design-bakery.com/healthz`
   → `200` proves traffic is hitting this container (the live Vercel site has no
   `/healthz`; it would answer `200 text/html` from the SPA fallback — check the
   content type to be sure).

3. **Record the current production DNS targets.** In Cloudflare → DNS → Records, note
   what `www` and the apex currently point at (Vercel; a proxied record hides the target
   from `dig`, which only shows Cloudflare's anycast IPs). Screenshot or copy the
   targets — this is the DNS rollback path.

4. **Add the production hostnames** on the same tunnel, same service target:
   `www.design-bakery.com` and `design-bakery.com` (apex). Adding them replaces the
   existing proxied records; the Vercel project itself is not touched.

5. **Verify** (expect the same results as the §2 table):

   ```bash
   for p in / /research/papers/db-r-2026-010 /case-studies/cortex /ai-for-good /studyos /robots.txt; do
     printf '%-38s %s\n' "$p" "$(curl -sS -o /dev/null -w '%{http_code} %{content_type}' https://www.design-bakery.com$p)"
   done
   curl -sSI https://design-bakery.com/ | grep -i '^location'   # apex -> www 307
   curl -sS -o /dev/null -w '%{http_code}\n' https://www.design-bakery.com/healthz   # 200 = our container
   ```

   Purge the Cloudflare cache for `design-bakery.com` afterwards, and check the zone's
   SSL/TLS mode is still what it was (the tunnel terminates TLS itself, so the origin
   mode does not apply to tunnel hostnames).

6. **Watch it.** `docker logs -f design-bakery-web`, `deploy/gravebuster/deploy.log`, and
   a 200 from `/healthz` after each deploy.

7. **DNS rollback** (if anything looks wrong): delete the two public hostnames (or
   re-point the records back to the targets recorded in step 3). DNS propagates in
   seconds on a proxied Cloudflare record, and the Vercel project is still deployed and
   untouched, so the site returns to its current state. The container can stay running
   on `127.0.0.1:8085` meanwhile.

**Shortcut if you want a partial flip:** adding only `www` works — leave the apex record
at Vercel and it will keep 307-ing the apex to `www`, which then lands on the tunnel. The
Caddyfile's apex rule then simply never fires. This keeps a dependency on the Vercel
project, so it is only a transition state.

### Staging hostname plan

`staging.design-bakery.com` (step 2) is a full second entry point to the same container.
It exists so the tunnel/edge path can be proven before touching production DNS, and it
stays useful for verifying a deploy before the flip.

- **Point it at a specific build** to test a branch: `deploy.sh --ref origin/<branch>` —
  but note the container is a single deployment, so staging and production hostnames
  always serve the *same* image. For two images at once, add a second service/port
  (e.g. `web-staging` on `127.0.0.1:8086` with its own image tag) and give it its own
  public hostname.
- **Keep it out of search results.** The SPA computes canonical/OG URLs from
  `window.location.origin`, so staging pages self-canonicalize to
  `staging.design-bakery.com`. `sitemap.xml` is built with `VITE_SITE_URL` (default
  `https://www.design-bakery.com`), so it keeps pointing at production — good. Add one
  of: a Cloudflare Transform Rule adding `X-Robots-Tag: noindex` for
  `http.host eq "staging.design-bakery.com"`, or Cloudflare Access in front of the
  hostname so only the owner can reach it (recommended).
- Once production is on the tunnel and stable, the staging hostname can be deleted from
  the tunnel ingress (no DNS cleanup needed beyond that).

---

## 6. Auto-deploy on merge to main

Implemented, **not enabled**. gravebuster is not publicly reachable, so there is no
GitHub webhook to receive; instead a systemd timer polls `origin/main` and deploys when
the SHA moves.

```bash
# enable (as root; the units use User=yoav like the other gravebuster timers)
sudo cp ~/apps/design-bakery/deploy/gravebuster/systemd/design-bakery-autodeploy.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now design-bakery-autodeploy.timer

systemctl list-timers design-bakery-autodeploy.timer   # next run
journalctl -u design-bakery-autodeploy.service -n 50   # what happened
tail -f ~/apps/design-bakery/deploy/gravebuster/autodeploy.log

# disable
sudo systemctl disable --now design-bakery-autodeploy.timer
```

- `autodeploy.sh` fetches `origin/main`, compares it with the deployed `SHA` in
  `.deploy-state`, and calls `deploy.sh --no-pull --ref <sha>` only when it differs.
  `--dry-run` reports without deploying.
- The timer fires every 5 minutes (`OnCalendar=*:0/5`, `RandomizedDelaySec=90`), so a
  merge to main goes live within ~5 minutes. It is `Type=oneshot`, `Nice=10`,
  `CPUSchedulingPolicy=batch` to stay out of the way of the other stacks on the box.
- A failed deploy is logged and rolls back automatically (see §3 step 8); the timer keeps
  firing regardless. `journalctl`/`autodeploy.log` are the source of truth.
- Alternatives considered: a GitHub Action that SSHes into gravebuster (needs inbound
  reachability or a self-hosted runner), or `watchtower`-style image polling. The
  pull-based timer needs no inbound access and no credentials on GitHub.

---

## 7. Operational notes

- **Do not touch** the study-os stack, `agent-telemetry`, `langfuse`, `infisical`, or any
  other stack on gravebuster. This deployment only ever touches its own container, image
  tags, and the `127.0.0.1:8085` port (checked free with `ss -ltn`; the box is busy —
  re-check before changing `WEB_HOST_PORT`).
- **Secrets:** `deploy/gravebuster/.env` is git-ignored and holds no secrets today (only
  the port, image tag and optional public `VITE_*` values). Keep it that way.
- **Disk:** ~182 MB per image, two tags per deploy. Prune old tags deliberately (§4).
- **Repo checkout:** `~/apps/design-bakery` is managed by `deploy.sh` (detached HEAD).
  Do not develop in it; edits there are overwritten on the next deploy.
- **Vercel:** unchanged and still deployed. Do not modify the Vercel project or its
  domains while the migration is in flight — it is the fallback.
