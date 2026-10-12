# TASK-DB-0084 — make the cinematic journey the production homepage at `/`

| Field | Value |
|-------|-------|
| **Created** | 2026-10-12 |
| **Issues** | None filed — owner direction in session ("finish the design and replace it") |
| **Branch** | `task/TASK-DB-0084-cinematic-homepage-production` |
| **Base** | `main` @ `0e91fd9c1bed` |
| **Status** | In progress — code complete and verified locally; not yet merged or deployed |

## Goal

The cinematic journey shipped additively at `/version-2` (TASK-DB-0083). This task
promotes it to the site's actual homepage: `https://www.design-bakery.com/` becomes the
scroll-driven journey, the old SPA shell moves to `/shell/index.html`, and `/version-2`
becomes a permanent redirect to `/`. It also finishes the design itself — real contact
links and real site navigation, no dead entries.

## Why the build has to swap documents

`/` is the one path a rewrite cannot move. Vercel evaluates `redirects` before the
filesystem but `rewrites` **after** it, and `deploy/gravebuster/Caddyfile` mirrors that
(order matters; the catch-all `/((?!.*\.html$).*)` matches any extension, `.png` and `.js`
included). So no rewrite can change what `/` serves — the file at
`frontend/dist/index.html` **is** the homepage. The swap therefore happens at build time
in `scripts/build-home-app.mjs`: `vite build` writes the shell to `dist/index.html`, the
script moves it aside to `dist/shell/index.html` and copies the journey build over
`dist/index.html`.

Two consumers read the shell **by path** and had to follow it:

- `deploy/gravebuster/Caddyfile` — the SPA fallback (`rewrite * /shell/index.html`) and
  the Open Graph `handle_errors` fallback (`{file./srv/shell/index.html}`).
- `backend/src/og/blogShareHtml.ts` — `fetchSpaIndexHtml` now fetches
  `/shell/index.html`, which is the document the crawler HTML is built from.

## What changed

- **`scripts/build-home-app.mjs`** (renamed from `build-version-2-app.mjs`) — now the
  two-document swap instead of a copy into `dist/version-2`. Installs the app's own
  lockfile with `--ignore-workspace`, builds it, moves the shell aside, copies the journey
  over `dist/index.html`, and merges the journey's assets and scene plates into the shared
  `dist/assets` and `dist/`. Fails loudly if the shell document is missing. Kill-switch
  `HOME_APP_BUILD=0` (was `VERSION_2_APP_BUILD`).
- **`frontend/package.json`** — the build chain runs `build-home-app.mjs`.
- **`frontend/version-2-app/vite.config.ts`** — `base: "/"` (was `"/version-2/"`), so the
  scene plates resolve at the site root.
- **`frontend/version-2-app/src/App.tsx`** — the router is gone; the journey is the whole
  page and unknown paths are served the shell by the host.
- **`vercel.json`** — `/version-2` and `/version-2/` move from `rewrites` to `redirects`
  (`permanent: true` → `/`); the SPA catch-all destination changes `/index.html` →
  `/shell/index.html`.
- **`deploy/gravebuster/Caddyfile`** — `@version2Legacy` + `redir … / 308`; SPA fallback
  and `handle_errors` repointed at `/shell/index.html` / `/srv/shell/index.html`.
- **`deploy/gravebuster/deploy.sh`** — smoke lines updated (`/version-2` 200 → 308, a
  journey plate at the root, `/shell/index.html` 200) plus two new body checks that pin
  the two documents apart, and a **re-exec after the checkout** so the incoming revision's
  own smoke block runs (see below).
- **Design finish** — `frontend/version-2-app/src/data/content.ts`: the real LinkedIn URL,
  the dead `/resume` link removed (no resume URL exists anywhere on the site), and a
  `SITE_NAV` list (`/blogs`, `/research`); `TopNav.tsx` renders it on desktop and mobile;
  `Night.tsx`'s contact links are GitHub + LinkedIn only.
- **Guards** — `scripts/test-home-app.mjs` (renamed, rewritten for the new wiring);
  `scripts/test-ire-app.mjs`'s SPA-fallback assertion now looks for
  `rewrite * /shell/index.html`; root `package.json` `test:version-2-app` →
  `test:home-app`; the CI step renamed; the eslint comment updated.

## The deploy re-exec (found while doing this)

`deploy.sh` checks out the requested ref at what is now step 3 but did not re-exec, so a
deploy ran the **outgoing** revision's `smoke()` against the **incoming** container. That
is a live trap: this change turns `/version-2` from 200 into 308, so the outgoing smoke
line `check 200 /version-2` would have failed and the deploy would have rolled itself
back. TASK-DB-0083 hit the same hole in the harmless direction (its new smoke lines
simply did not run). The fix is one guarded
`DEPLOY_REEXEC=1 exec "$SELF" "$@"` immediately after the checkout; `exec` keeps the pid,
so the deploy lock taken earlier stays ours and the EXIT trap is re-armed.

## Verification

- `pnpm lint`, `pnpm --dir frontend run typecheck`, `pnpm --dir backend run build` — clean.
- Full `pnpm run build` — the swap logs
  `homepage published at frontend/dist/index.html (2258 bytes); site shell moved to
  frontend/dist/shell/index.html (1973 bytes)`; `dist/index.html` is the journey
  (`<title>Design Bakery — AI Engineer</title>`), `dist/shell/index.html` is the shell
  (`<title>Design Baker | Fullstack Design Engineer & AI Workflow Systems</title>`), and
  every asset either document references resolves.
- `pnpm test:home-app`, `test:ire-app`, `test:og-routing`, `test:og-contract`,
  `test:homepage-content`, `test:icon-coverage`, `test:agent-posts`,
  `find:orphans --strict` — all pass.
- **Real `caddy:2` container** serving the built `dist` through this Caddyfile: `/` 200
  journey (no shell marker), `/shell/index.html` 200 shell (marker present), SPA-fallback
  paths render the shell, `/version-2` and `/version-2/` 308 → `/`, the root scene plate
  200, `/ire` 200, `/ire/app` 301, `/ai-for-good` 308, `/studyos` 307, `/healthz` 200,
  and the og-preview paths degrade to the shell while the API is absent.
- **Not yet verified:** the live deploy (Mac) and the browser walk of the finished design.

## Open owner decisions

- Whether the retired shell homepage should stay reachable at some path (it is currently
  only reachable at `/shell/index.html`, which is a build artefact path, not a page).
- The `frontend/version-2-app` → `home-app` directory rename (blocked locally by a
  Windows file lock; the directory deliberately keeps its historical name).

## Next

Deploy to the Mac (`deploy.sh --ref <main sha>`), verify from the public edge that `/` is
the journey and `/version-2` 308s, then walk the journey in a real browser.
