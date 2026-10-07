# TASK-DB-0076 — serve design-bakery.com from gravebuster, not Vercel

| Field | Value |
|-------|-------|
| **Created** | 2026-10-07 |
| **Issues** | [#52](https://github.com/Pukujan/design-bakery/issues/52) (self-host the frontend), [#80](https://github.com/Pukujan/design-bakery/issues/80) (self-host the backend) |
| **Status** | Done — the cutover is live |

## Goal

Move the public site off Vercel and Railway onto gravebuster, the box that already runs the Cloudflare Tunnel and the owner's other projects. The containers and the deploy scripts were in place (TASK-DB-0055, TASK-DB-0071, TASK-DB-0075); what remained was the tunnel ingress, the DNS records, the host secrets and the flip itself.

## What changed

Nothing in this repository — the cutover is host and Cloudflare state, so the record lives here and the change is described rather than diffed.

The Cloudflare Tunnel `study-os-gravebuster` (token-managed, so its ingress lives in the Zero Trust dashboard, not a `config.yml` on the host) gained two hostnames, both pointing at the web container:

| Hostname | Service |
|---|---|
| `www.design-bakery.com` | `http://design-bakery-web:80` |
| `design-bakery.com` | `http://design-bakery-web:80` |

The ingress entries went in before the DNS change, so no request hit the catch-all 404 while the records propagated. The existing `study`, `octodb` and `bench` entries are unchanged.

DNS in the `design-bakery.com` zone:

- `www` moved from a CNAME to `cname.vercel-dns.com` to a CNAME to `58bfc693-1741-4782-9b2d-ee3c481bcec5.cfargotunnel.com`.
- The apex `A` record to Vercel's `76.76.21.21` was replaced with a CNAME to the same tunnel. Cloudflare flattens an apex CNAME, so no A record is needed. The Caddyfile already answers the apex with a 307 to `www`, which is how the site behaved on Vercel.

On gravebuster:

- `WITH_EDGE=1` is set in `deploy/gravebuster/.env`, so every deploy keeps the web container on `study-os_edge`, the network the tunnel container is on. Without it a plain deploy drops the container off that network and the tunnel 502s.
- `design-bakery-web` and `design-bakery-api` were connected to `study-os_edge` with stable aliases, so the tunnel resolves them by name.
- `deploy/gravebuster/.env.api` was created (mode 600) from the maintainer's local values. It holds the Octo workspace key, the OpenRouter key, the admin credentials and the legacy Supabase key. The bcrypt admin hash contains `$`, which docker compose interpolates inside an `env_file`, so every `$` is written as `$$`; without that the hash is mangled and admin login fails.
- The web image was built from `origin/main` (`aab743f`) with `deploy.sh --with-edge`, and the API image was built and started with the same secrets file.

## Evidence

The live hostname `www.design-bakery.com` no longer returns `x-vercel-cache` or `x-vercel-id`; it answers from gravebuster through Cloudflare. Verified on the live hostname:

- `/` 200, `/ire` 200, `/robots.txt` 200, `/research/papers/db-r-2026-010` 200
- `/api/public/blogs` 200 `application/json` — the blog API answers through the Caddy `/api/*` proxy, reading the Octo-backed rows
- `/studyos` 307, `/ai-for-good` 308 — the vercel.json parity rules still hold
- the apex returns 307 to `https://www.design-bakery.com/`

The same routes were checked on `staging.design-bakery.com` first, so the live flip followed a rehearsal on the real host.

The pre-flip DNS records are saved outside the repository as a rollback file (`dns-rollback-design-bakery-20261007.json`): `www` → `cname.vercel-dns.com`, apex → `A 76.76.21.21`. Restoring those two records puts the site back on Vercel. Containers roll back with `deploy/gravebuster/rollback.sh`.

## Non-goals

- The Vercel Edge OG middleware (`middleware.ts` + `frontend/src/og/`) still has no gravebuster equivalent, so crawler link previews for blog and case-study URLs stay the one deliberate parity gap until the Node sidecar in issue #80 Step E lands.
- Deleting the old Supabase object bytes. The rows point at `https://files.design-bakery.com/<fileId>`; the bytes stay in Supabase until the owner removes them.
- Re-minting the Octo workspace key with the `delete` scope.
