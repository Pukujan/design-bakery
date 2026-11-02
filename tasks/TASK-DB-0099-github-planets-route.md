# TASK-DB-0099 — `/github-planets` serves Orbitgraph again

| Field | Value |
|-------|-------|
| **Created** | 2026-11-01 |
| **Branch** | `task/TASK-DB-0099-github-planets-route` (branched from `origin/main` @ `20280d3`) |
| **Status** | PR open |

## Goal

Orbitgraph's "Live App" link (`projects.json` id 13, `https://www.design-bakery.com/github-planets`) shows Orbitgraph, not the site's 404 page.

## Cause

The route was dropped, not the link. Orbitgraph runs on the VPS as `github-planets-web`, built with `APP_BASE_PATH=/github-planets/` (its canonical URL is `https://www.design-bakery.com/github-planets/`). Until 2026-11-02 tunnel A sent **all** of `www` to that container; on 2026-11-02 the `www` route was moved to `design-bakery-web:80` (server-management `vps/PLAN.md`, tunnel config version 9). Nothing routed the `/github-planets` prefix any more, so the SPA fallback rendered the 404 page (HTTP 200).

## Change

- `deploy/gravebuster/Caddyfile` — `@githubPlanets` (`/github-planets`, `/github-planets/*`) proxies to `github-planets-web:3000` without stripping the prefix. Both containers are on `study-os_edge` on the VPS (`WITH_EDGE=1`), where the name resolves.
- `docs/self-hosting.md` — architecture diagram gains the route.

## Evidence

On the VPS, a throwaway container from `design-bakery-web:local` with the new Caddyfile on `study-os_edge` (production untouched): `caddy validate` passes; `/github-planets`, `/github-planets/`, `/github-planets/nope` → 200 `Orbitgraph — repo cartography`; `/github-planets/orbit.svg` and the hashed JS bundle → 200; `/` and `/blogs` still serve the site.

## Next step

Merge; `design-bakery-autodeploy.timer` on the VPS redeploys. Then `curl -s https://www.design-bakery.com/github-planets/ | grep -o '<title>[^<]*'` should print the Orbitgraph title.
