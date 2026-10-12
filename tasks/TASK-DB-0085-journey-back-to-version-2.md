# TASK-DB-0085 — move the cinematic journey back to `/version-2`, restore the shell homepage

| Field | Value |
|-------|-------|
| **Created** | 2026-10-12 |
| **Issues** | None filed — owner caught the TASK-DB-0084 promotion in session ("Was my main homepage just replaced by version 2? It was to stay in version 2, not replace my old homepage") |
| **Branch** | `task/TASK-DB-0085-journey-back-to-version-2` |
| **Base** | `origin/main` @ `2e0d6be` |
| **Status** | **Done** — merged (PR #116 → `4b5f95c`) and deployed to the Mac; verified live from the public edge 2026-10-12 |

## Goal

Undo the TASK-DB-0084 promotion. `https://www.design-bakery.com/` is the site shell SPA
again, the cinematic journey is back at `/version-2` as an additive page, and the old
`/shell/index.html` build-artifact path is gone. **Keep every piece of #113's design
work** — the redone cut, the sakura tree, the regenerated arrival plate, the finished nav
and contact links.

## Why this exists

TASK-DB-0084 (`7c2343a`) entangled two things in one commit: the routing promotion and
the design redo. Its only recorded authorization was a session paraphrase — *"finish the
design and replace it"* — with no issue filed, and its own **Open owner decisions** section
had left unresolved *"whether the retired shell homepage should stay reachable at some
path"*. It was merged and deployed anyway. The owner did not want the homepage replaced;
`/version-2` was always meant to be additive.

## What changed

The revert restores the pre-promotion (`0e91fd9`) wiring and keeps the design. Concretely:

- **`vercel.json`** — `/version-2` + `/version-2/` are `rewrites` (→ `/version-2/index.html`)
  again, before the SPA catch-all; the two `redirects` entries are gone; the catch-all
  destination is `/index.html`.
- **`deploy/gravebuster/Caddyfile`** — the `@version2` rewrite block is back and
  `@version2Legacy` + `redir … / 308` is deleted; the SPA fallback is `rewrite * /index.html`;
  the OG `handle_errors` reads `{file./srv/index.html}`.
- **`scripts/build-version-2-app.mjs`** — restored (additive copy into `frontend/dist/version-2`);
  `scripts/build-home-app.mjs` deleted.
- **`scripts/test-version-2-app.mjs`** — restored guard, with the plate-existence,
  `import.meta.env.BASE_URL` and lockfile assertions from the deleted `test-home-app.mjs`
  ported in, plus assertions that the document swap does **not** come back.
- **`scripts/test-ire-app.mjs`** — the SPA-fallback assertion is `rewrite * /index.html` again.
- **`frontend/package.json`**, **root `package.json`**, **`.github/workflows/ci.yml`** — the
  build chain and test/CI step names point at `build-version-2-app.mjs` / `test:version-2-app`.
- **`frontend/version-2-app/vite.config.ts`** — `base: "/version-2/"`.
- **`frontend/version-2-app/src/App.tsx`** + **`src/pages/NotFound.tsx`** — the router
  (`basename="/version-2"`) and the catch-all 404 are restored, matching the app's
  pre-promotion shape (and its `package.json` / `pnpm-lock.yaml`, which come back with it).
- **`frontend/version-2-app/index.html`** — the `og:*`/`twitter:*` block from #113 is **kept**
  (a genuine improvement) but `canonical` and `og:url` are retargeted to
  `https://www.design-bakery.com/version-2`. Owner decision: index it as its own page, the
  `/ire` precedent.
- **`backend/src/og/blogShareHtml.ts`** — `fetchSpaIndexHtml` fetches `/index.html` again.
- **`deploy/gravebuster/deploy.sh`** — `smoke()` restored to the pre-promotion checks
  (`check 200 /version-2`, a plate under the prefix) with the two body checks that pin the
  two documents apart rewritten for the restored polarity. **The `DEPLOY_REEXEC` fix is kept**
  (see below).

## Kept from #113 on purpose

- **Every design file** — `components/journey/*` (`BladeArc`, `SeamCut`, `SakuraTree`, …),
  `data/content.ts`, `styles/journey.css`, `lib/art.ts`, `lib/journey-state.ts`,
  `hooks/useJourneyScroll.ts`, `globals.css`, `public/plate-arrival.png`. The revert touches
  none of them.
- **The `deploy.sh` re-exec fix.** `7c2343a` added a guarded `DEPLOY_REEXEC=1 exec "$SELF" "$@"`
  after the `git checkout`, so a deploy runs the **incoming** revision's `smoke()` against the
  incoming container. That is unrelated to the promotion, and it is what makes *this* change
  safe: it flips `/version-2` from 308 back to 200, and without the re-exec the outgoing
  revision's `check 308 /version-2` would fail and auto-roll-back the deploy. The promotion's
  own deploy log shows that exact trap firing (`08:04:05Z` failed `expected 200, got 308 for
  /version-2`).

## Verification

- `pnpm lint`, `pnpm --dir frontend run typecheck`, `pnpm --dir backend run build` — clean.
- Full `pnpm run build` — `dist/index.html` is the shell
  (`<title>Design Baker | Fullstack Design Engineer & AI Workflow Systems</title>`),
  `dist/version-2/index.html` is the journey (`<title>Design Bakery — AI Engineer</title>`)
  with `/version-2/assets/*` refs, `dist/version-2/plate-arrival.png` present, and **no**
  `dist/shell/`.
- `test:version-2-app`, `test:ire-app`, `test:og-routing`, `test:og-contract`,
  `test:homepage-content`, `test:icon-coverage`, `test:agent-posts`, `find:orphans --strict` —
  all pass. `bash -n deploy/gravebuster/deploy.sh` — clean.
- **Real `caddy:2-alpine` container** serving the built `dist` through this Caddyfile:
  `/` 200 shell, `/version-2` + `/version-2/` 200 journey, `/version-2/assets/*` 200,
  `/version-2/plate-arrival.png` 200, `/shell/index.html` **404**, `/blogs` and
  `/research/papers/db-r-2026-010` 200, `/ire` 200, `/ire/app` 301, `/ai-for-good` 308,
  `/studyos` 307, `/healthz` 200, and an og path degrading to the shell with the API absent.
- **Headless browser walk** of `/version-2/` at 1440×900 and 390×844: arrival plate, nav,
  work cards and About section render, the scroll journey drives (doc height ≈ 12.6k px),
  zero console errors. `/` renders the shell homepage.
- **Verified live (Mac) 2026-10-12.** Merged as PR #116 (squash → `4b5f95c`); CI `quality`
  and `orphans` both success. Deploy run by hand over SSH
  (`deploy/gravebuster/deploy.sh --ref 4b5f95c`, owner-gated), exit 0:
  `deploy OK: 4b5f95c2960b -> design-bakery-web:4b5f95c2960b-20261012T181318Z`, the re-exec
  fired ("re-executing the checked-out revision's deploy script"), and the incoming
  revision's own smoke passed every line — `ok 200 /`, `ok 200 /version-2`,
  `ok body has "/version-2/assets/" at /version-2`, `ok body has "Fullstack Design
  Engineer" at /`.
  From the public edge: `/` → 200 serving the shell
  (`<title>Design Baker | Fullstack Design Engineer & AI Workflow Systems</title>`),
  `/version-2` → 200 serving the journey (`<title>Design Bakery — AI Engineer</title>`)
  with `/version-2/assets/index-Bw0C0Ji8.js` + `index-CU4Xgei0.css`,
  `/version-2/plate-arrival.png` → 200, `/healthz` → 200.

## Next

**Done.** The homepage is the shell again and the journey is live additively at
`https://www.design-bakery.com/version-2`, verified from the public edge. What remains is
not this task's work:

- The re-exec fix is what made this deploy safe (the outgoing revision's smoke expected
  `/version-2` 200, which this change restores) — it is recorded in TASK-DB-0084 and now
  load-bearing on every deploy.
- The Mac's auto-deploy scheduler, open here, landed the same day as
  [TASK-DB-0086](TASK-DB-0086-mac-autodeploy.md) — the hand run this task needed is now the
  exception rather than the rule.
- Still open, not this task's work: the Mac's octo has no design-bakery workspace (the 136
  content rows remain only in gravebuster's `octo_ws_design_bakery_c192afbc`; the site serves
  the committed 7-post snapshot).
