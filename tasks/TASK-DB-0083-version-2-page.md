# TASK-DB-0083 — publish the cinematic-journey homepage as `design-bakery.com/version-2`

| Field | Value |
|-------|-------|
| **Created** | 2026-10-11 |
| **Issues** | None filed — owner direction in session ("host it in my design-bakery … design-bakery.com/version-2") |
| **Branch** | `task/TASK-DB-0083-version-2-page` |
| **Status** | Merged ([#111](https://github.com/Pukujan/design-bakery/pull/111), `fe30727`) and deployed — live at `https://www.design-bakery.com/version-2` |

## Goal

Put the finished spike app — the scroll-driven cinematic Design Bakery homepage — on the
live site at a second path, `/version-2`, so the owner can see it at
`https://www.design-bakery.com/version-2` without disturbing the current homepage.

The app was built by the ABA Pro pipeline (bakeoff 0002 r3) and lived only in the ABA
repo's git-ignored scratch tree. It is a `vite_react_shadcn_ts` project — the same
scaffold as the existing `frontend/ire-app` — so the `/ire` sub-app is the template:
its own lockfile, `base` set to the mount path, a build script that copies its output
into `frontend/dist/<path>`, and a Caddyfile/vercel.json rewrite pair.

## What changed

- **`frontend/version-2-app/`** — the app, copied from the ABA spike (`app-v3`), minus
  the dead `src/App.css` and `src/components/made-with-dyad.tsx` and the Dyad build
  tooling (`@dyad-sh/react-vite-component-tagger`, its plugin and its dependency entry).
  Not a pnpm workspace member: it wants Vite 8 / Tailwind 3, the root workspace pins Vite
  6.3.5 / Tailwind 4. Keeps its own `pnpm-lock.yaml`.
- **`vite.config.ts`** — `base: "/version-2/"`, so the shell's asset refs carry the mount
  prefix.
- **`src/App.tsx`** — `basename="/version-2"` on the router. Without it the router sees
  `/version-2/` where its route is `/`, matches the catch-all and renders the 404 page.
- **`src/lib/art.ts`** — the seven scene plates were root-absolute strings
  (`"/generated-….png"`). Vite rewrites `index.html` asset refs for `base` but does
  **not** rewrite string literals in source, so those would have 404'd under the prefix.
  They now go through `import.meta.env.BASE_URL`.
- **`scripts/build-version-2-app.mjs`** — installs the app's own lockfile
  (`--ignore-workspace`) and copies `dist` to `frontend/dist/version-2`; chained from
  `frontend/package.json`'s build.
- **`deploy/gravebuster/Caddyfile`** — a `@version2` block mirroring `@ire`, after the
  filesystem handlers and before the SPA fallback, serving `/version-2` and `/version-2/`
  from `dist/version-2/index.html`. Hashed assets and plates are real files served by the
  shared `@exactFile` handler.
- **`vercel.json`** — `/version-2` and `/version-2/` rewrites to `/version-2/index.html`,
  before the SPA catch-all, keeping the two host configs 1:1.
- **`deploy/gravebuster/deploy.sh`** — smoke-checks `/version-2` and one scene plate.
- **`scripts/test-version-2-app.mjs`** (+ `test:version-2-app`, CI step, root eslint
  ignore) — a static guard that the base, the basename, the asset prefix, the routing in
  both host configs, the build chain and the smoke checks all agree.

## Evidence

Run in `D:\development\design-bakery.com`, on the branch.

| Check | Result |
|---|---|
| `pnpm --dir frontend run build` | exit 0 — site + `dist/ire` + `dist/version-2` (index.html 1117 B; one JS 381.72 kB / 121.13 kB gz; one CSS 77.71 kB / 15.08 kB gz) |
| `pnpm lint` | clean |
| `pnpm test:version-2-app` | "version-2 page static checks passed." |
| `pnpm test:ire-app` | "IRE dashboard static checks passed." (regression) |
| `pnpm test:og-routing` | 36 paths agree (Caddyfile still parses as before) |
| `node scripts/find-orphans.mjs --strict` | no unexpected orphaned files |

### Routing, proven through a real Caddy

`caddy:2-alpine` in Docker, mounting the Caddyfile and the built `frontend/dist`:

```
/version-2                                 -> 200 text/html; charset=utf-8
/version-2/                                -> 200 text/html; charset=utf-8
/version-2/index.html                      -> 200 text/html; charset=utf-8
/version-2/assets/index-szfgLsHE.js        -> 200 application/javascript; charset=utf-8
/version-2/assets/index-DpcCMBTV.css       -> 200 text/css; charset=utf-8
/version-2/generated-1791737493819-….png   -> 200 image/png 2646363 bytes (1672x941)
/version-2/favicon.ico                     -> 200 image/vnd.microsoft.icon
/version-2/robots.txt                      -> 200 text/plain; charset=utf-8
/                                          -> 200   <title>Design Baker | Fullstack …</title>  (site unchanged)
/ire                                       -> 200   (unchanged)
/healthz                                   -> 200
```

`/version-2` serves the app's own shell — `<title>Design Bakery — AI Engineer</title>` —
not the site shell.

### Rendered in a real browser

Headless Chromium against the Caddy-served build: the arrival line renders, the router
resolves (no 404 page), all eleven projects are in the DOM, the sunset plate loads from
`/version-2/generated-….png`, `scrollWidth === clientWidth` (no horizontal overflow), and
zero console errors.

## Boundaries and non-goals

- **A second path, not a replacement.** The current homepage still owns `/`; `/version-2`
  is additive. Nothing on the existing site changed.
- **No SEO/head work.** Unlike `/ire` (which replaced a static page and had to carry its
  `og:*` tags), this page is a new URL with the app's own `<title>`/description. No
  canonical, no `og:*`, no JSON-LD were added — not asked for.
- **The app's own pages are not built.** Project "Case Study" / "Research Paper" links
  point at paths that exist on the main site (`/case-studies/…`, `/research/…`); the
  browser leaves the app for them. That is the intended behaviour.
- **Not touched:** `task/TASK-DB-0082-mac-hosting-cutover` (this branch is stacked on it —
  the Mac runs that ref today), the octo data move, the tunnel split-brain.

## Deploy

Deployed from the Mac checkout (`~/apps/design-bakery`) with
`deploy/gravebuster/deploy.sh --ref 973097d7ffb41751148cd4b131f8dc0ce1fa00ea`, exit 0.
Image `design-bakery-web:973097d7ffb4-20261011T195949Z` built and swapped in; the API
container was rebuilt from the same ref and its health endpoint came up.

The smoke block that ran was the one already parsed from the previously-deployed ref
(d9d23cd), so the log shows `/ire` → `/ire/app` → `/ai-for-good` with no `/version-2`
lines: `deploy.sh` checks out the requested ref at line 330 but does not re-exec, so a
deploy always runs the *outgoing* script's checks. The new `/version-2` and plate smoke
lines are committed and run on the next deploy; live behaviour was verified directly
instead (below).

### Verified from the public edge, after the deploy

| Check | Result |
|---|---|
| `GET https://www.design-bakery.com/version-2` | 200 — `<title>Design Bakery — AI Engineer</title>` |
| `GET https://www.design-bakery.com/version-2/` | 200 |
| `GET …/version-2/generated-1791737493819-ac12e96dface.png` | 200 `image/png` 2,646,363 bytes |
| `GET https://www.design-bakery.com/` | 200 — site shell unchanged (`Design Baker | Fullstack …`) |

Headless Chromium against the live URL: arrival line renders ("Design Bakery — AI
Engineer"), all eleven projects present (01–11 WORK), five roles, all seven scene plates
requested under `/version-2/` and 200, `scrollWidth === clientWidth` (no overflow),
zero console errors.

## Merge

This branch was stacked on `task/TASK-DB-0082-mac-hosting-cutover`. Once 0082 merged
([#110](https://github.com/Pukujan/design-bakery/pull/110), `08b1d62`), the branch was
rebased onto the new `main` so it would not re-apply 0082's commits, and merged as
[#111](https://github.com/Pukujan/design-bakery/pull/111) (`fe30727`, squash).

The Mac deploy ran from `973097d` — the pre-rebase tip. The rebase orphaned that SHA, but
every version-2 path is byte-identical between `973097d` and `main` (`git diff` empty over
`frontend/version-2-app`, the two scripts, the Caddyfile and `vercel.json`), so the running
build matches accepted history in content. The next deploy from `main` picks up the same
code under a main-history SHA.

## Next step

None outstanding — the page is live and the branch is merged. If the two `/version-2` smoke
lines are wanted in the deploy log, they appear automatically on the next deploy (the script
re-parses from the newly-checked-out ref on that run).
