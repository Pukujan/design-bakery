# TASK-DB-0081 — the IRE dashboard becomes the `/ire` page, and the box deploys itself

| Field | Value |
|-------|-------|
| **Created** | 2026-10-07 |
| **Issues** | [#60](https://github.com/Pukujan/design-bakery/issues/60) (the IRE page design work order), [#52](https://github.com/Pukujan/design-bakery/issues/52) (self-host on gravebuster) |
| **Branch** | `task/TASK-DB-0081-ire-canonical-and-autodeploy` |
| **Status** | Merged and deployed; the timer is enabled on gravebuster |

## Goal

Two open owner decisions, taken together.

TASK-DB-0080 shipped a React dashboard at `/ire/app/` and left the older hand-written
HTML page owning `/ire`. The owner picked `/ire/` for the dashboard, so the dashboard
moved and the static page retired. Retiring it is not a deletion: the static page was a
full HTML document, and the dashboard renders its own DOM in the browser, so every SEO
tag, the social preview and the JSON-LD had to move with it or link unfurlers would see
an empty shell.

The second decision is issue #52's last unmet "Done when" — *merging to main deploys
automatically*. The pull-based systemd timer already existed but was never enabled,
because merging and deploying were separate acts and nothing stopped two people from
deploying at once. That is not hypothetical: when the dashboard first shipped, a hand-run
deploy and a second session's deploy interleaved their container swaps and left the API
container in `Created`, so `/api/*` answered 502 on the live site. The timer therefore
ships behind a deploy lock, in the same change.

## What changed

### The dashboard moved to `/ire/`

- `frontend/ire-app/vite.config.ts` builds with `base: "/ire/"`; `src/App.tsx` carries
  `basename="/ire"`. Without the matching basename the router sees `/ire/` where its
  route is `/`, matches the catch-all and renders "404 — Oops! Page not found".
- `scripts/build-ire-app.mjs` copies the build to `frontend/dist/ire`, so the shell is
  `dist/ire/index.html` with `dist/ire/assets/*` and `dist/ire/og-image.png` beside it.
- `/ire/app` and `/ire/app/` are now permanent redirects to `/ire/`, in `vercel.json`
  (a `redirects` entry with `permanent: true`) and in the Caddyfile
  (`redir @ireAppLegacy /ire/ 301`). In `vercel.json` the redirect wins because Vercel
  evaluates redirects before the filesystem; in Caddy the rule sits after the filesystem
  handlers and before the SPA fallback, inside a `route` block where written order is
  evaluated order.

### The retired page's head moved into the app shell

`frontend/ire-app/index.html` now carries what `frontend/public/ire/index.html` used to:
a 54-character title, a 155-character description, `robots index, follow`, the canonical
URL, `theme-color`, the full `og:*` and `twitter:*` sets with a 1200×630 PNG, and a
JSON-LD `@graph` of a `WebPage` about a `Dataset` whose `distribution` points at the live
feed. A non-JS crawler now reads the app shell's head, which is the same head the static
page served.

The og-image is a standalone dark brand card, not a screenshot of the light dashboard.
Its source, `scripts/ire-og-image/og-image.html`, used to link the retired `theme.css`;
the tokens it actually used are inlined there instead. The committed PNG is byte-for-byte
unchanged, so it was not regenerated.

`frontend/src/app/modules/ire/IrePageRedirect.tsx` stays. The portfolio card renders
`/ire` as a react-router `<Link>`, so that navigation is client-side and no host rewrite
runs. The stub now warns and does nothing under `import.meta.env.DEV`, because the site's
dev server has no `/ire` proxy and the redirect would loop on itself.

### The deploy lock

`deploy.sh` and `rollback.sh` each take an exclusive lock as their first action after the
environment guards:

```bash
exec 9>"$LOCK_FILE"
flock -n 9 || die "another deploy or rollback is running (lock: $LOCK_FILE)"
```

`LOCK_FILE=${DEPLOY_LOCK_FILE:-$SCRIPT_DIR/.deploy.lock}`, and the lock file is
git-ignored. Non-blocking on purpose: the loser exits 1 at once with that message instead
of queueing behind a deploy that may run for the full thirty-minute timeout. The timer
retries on its next tick, five minutes later.

### The timer

`deploy/gravebuster/systemd/design-bakery-autodeploy.{service,timer}` were copied to
`/etc/systemd/system/` and enabled. It polls `origin/main` every five minutes
(`OnCalendar=*:0/5`, `RandomizedDelaySec=90`), compares the remote SHA with the deployed
`SHA` in `.deploy-state`, and calls `deploy.sh --no-pull --ref <sha>` only when it moved.
The lock ships in the same change, so the timer was never live without it.

## Evidence

Run against the real tree in `D:\development\design-bakery.com`, on the branch.

| Check | Result |
|---|---|
| `pnpm lint` | clean |
| `pnpm --dir frontend run typecheck` | clean |
| `pnpm --dir frontend/ire-app run typecheck` | clean |
| `pnpm run build` | exit 0 — site + `dist/ire` (index.html 5966 B, one JS + one CSS asset) + feed refresh |
| `node scripts/test-ire-app.mjs` | "IRE dashboard static checks passed." — wiring, SEO head, og image, feed fixture, credentials, routing, portfolio card |
| `pnpm test:ire-app:browser` | "IRE React dashboard browser checks passed." |
| `pnpm test:og-routing` | 36 paths agree |
| `pnpm test:og-contract` | copies match |
| `pnpm test:agent-posts` | all validation checks passed |
| `pnpm test:homepage-content` | passed |
| `pnpm test:icon-coverage` | 9 names, 8 allowlisted |
| `node scripts/find-orphans.mjs --strict` | no unexpected orphaned files |
| `pnpm --dir backend run build` | clean |
| `python …/check_manifest.py --manifest stack-manifest.json` | agrees with release train `current` (4 components) |
| `bash -n` on `deploy.sh`, `rollback.sh`, `autodeploy.sh` | all three parse |

`pnpm --dir backend/services run test:publish-kit-fonts` **fails locally** and passed in
CI before this change. It is not caused by this work: the script's first act is
`spawnSync('npm', ['run', 'build'])`, which returns `ENOENT` here because Node's
`spawnSync` on Windows does not resolve the `npm` shim. Running the diagnostics body
directly (`logPublishKitFontsForContext('cli test-publish-kit-fonts', {runSvgProbe:true})`)
prints the full report and the SVG probe succeeds with a 4991-byte PNG. CI runs on Linux
where the shim resolves.

### Routing, proven through a real Caddy

The Caddyfile was validated and exercised with `caddy:2-alpine` in Docker against the
built `frontend/dist`, not by reading it:

```
/                    -> 200
/healthz             -> 200
/robots.txt          -> 200
/ire                 -> 200   <title>Today's open-weight model picks on InferHub | IRE</title>
/ire/                -> 200   same title; og:image https://www.design-bakery.com/ire/og-image.png
/ire/og-image.png    -> 200 image/png 111910 bytes
/ire/assets/index-9Sm33WSZ.js -> 200 application/javascript; charset=utf-8
/ire/app             -> 301 http://127.0.0.1:18085/ire/
/ire/app/            -> 301 http://127.0.0.1:18085/ire/
/ire/app/assets/index-9Sm33WSZ.js -> 200 text/html 1973   (SPA fallback, not the asset)
/ai-for-good         -> 308
/studyos             -> 307
/case-studies/cortex -> 200   (regression check on the shared filesystem handlers)
/case-studies/cortex/a -> 200
```

`caddy validate` reports `Valid configuration`. The lock was verified separately without
`flock` on Windows, by running the same block under a shim: the first caller acquires,
the second prints `ERROR: another deploy or rollback is running (lock: …)` and exits 1,
and `DEPLOY_LOCK_FILE` overrides the path.

### Deployed

The timer is enabled on gravebuster (`systemctl is-enabled design-bakery-autodeploy.timer`
→ `enabled`), and the deploy of this change is the first one it ran on its own. The
`autodeploy.log` line is the proof:

```
[2026-10-07T23:25:59Z] new commit on origin/main: 260008f4dfc2 (deployed: 4335435b04a2)
```

The service finished at 23:29:28Z with `deploy OK: 260008f4dfc2 ->
design-bakery-web:260008f4dfc2-20261007T232559Z`, both containers `healthy` on the new tag,
and its own smoke test logged `ok` for `/`, `/ire`, `/ire/app` (301), `/ai-for-good` (308),
`/studyos` (307) and `/api/public/blogs` (the Caddy proxy plus the data layer). Checked
again from outside, on the public hostname: `/ire` and `/ire/` 200 with
`<title>Today's open-weight model picks on InferHub | IRE</title>` and
`og:image https://www.design-bakery.com/ire/og-image.png`, `/ire/app` and `/ire/app/`
**301 → `https://www.design-bakery.com/ire/`**, `/ire/og-image.png` 200 image/png,
`/ire/assets/index-9Sm33WSZ.js` 200 application/javascript, and `/api/public/blogs` 200
JSON.

Rollback is one command if this needs undoing: `deploy/gravebuster/rollback.sh` puts
`14bc3fce3f3a-…` back on both containers.

## Boundaries and non-goals

- **The dashboard is client-rendered.** Link previews are covered by the ported `og:*`
  tags and Googlebot renders JS, but a crawler that neither reads `og:*` nor runs JS sees
  an empty body. The static page did not have that gap; this is the cost of the move.
- **`/ire/app/assets/*` serves the SPA shell, not the asset.** Only `/ire/app` and
  `/ire/app/` redirect; a request for an asset *under* `/ire/app/` misses the redirect
  rule, misses the filesystem (there is no `dist/ire/app/` any more) and falls through to
  the SPA fallback, which answers **200 text/html** with the site's app shell. So a stale
  bookmark of an old hashed asset gets HTML, not a 404 and not a redirect — it was already
  broken by the hash change, and this is how the site has always answered an unknown
  non-`.html` path. Measured through `caddy:2-alpine` against the built `dist`, and again
  live after the deploy.
- **The site's dev server still has no `/ire` proxy.** The app is developed on its own
  (`pnpm --dir frontend/ire-app dev`); `IrePageRedirect` warns instead of redirecting.
- **Not touched:** the `/srv` hosting-convention move (issue #98), the Vercel project
  deletion, the octo workspace-key `delete` scope, and the 38.4 MB tracked video. All
  four remain owner-gated.
- **Not fixed:** the stray `deploy/gravebuster/Caddyfile;C/` directory on `main`. It is
  not from this work.

## Next step

None for this change. The next merge to `main` should deploy itself within about five
minutes; `systemctl list-timers design-bakery-autodeploy.timer` and
`deploy/gravebuster/autodeploy.log` are where to confirm it did.
