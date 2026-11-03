# TASK-DB-0131 — Remove the last of Vercel

| Field | Value |
|-------|-------|
| **Created** | 2026-11-02 |
| **Branch** | `task/TASK-DB-0131-remove-vercel` (from `main`) |
| **Status** | In review |

## Goal
The Vercel project is deleted. Remove `vercel.json`, point the CI routing tests at the Caddyfile, and drop the docs and comments that treat Vercel as a host or rollback. This also stops the failing (rate-limited, non-required) "Vercel" check on PRs once the integration has nothing to build.

## Done
- Deleted `vercel.json` and `frontend/vercel.json`.
- `scripts/test-homepage-content-stability.mjs`, `scripts/test-ire-app.mjs`, `scripts/test-version-2-app.mjs` now assert against `deploy/gravebuster/Caddyfile`: `/studyos` and `/studyos/*` are 307 redirects to `study.design-bakery.com` (keeping the path), `/ire` and `/ire/` rewrite to the dashboard before the SPA fallback, `/ire/app[/]` is a 301 to `/ire/`, `/version-2[/]` rewrite before the fallback and is not redirected, the SPA fallback serves `/index.html`. Every rule already existed in the Caddyfile; none was vercel-only.
- Dropped the `/ai-for-good` 308 redirect and the `/ai-for-good/*` proxy to `ai-for-good-livid.vercel.app` (the upstream app is gone and the live path returns 404), plus its `deploy.sh` smoke check. No link to `/ai-for-good` exists in the frontend or content.
- Reworded Caddyfile, Dockerfile, deploy README, `deploy.sh`, `ogPreview.ts` and other source comments so the Caddyfile is the source of truth.
- Deleted `additionals/doc/deploy-vercel-railway.md`, `additionals/deploy/README.md` and the legacy `scripts/export-deploy-env.mjs` (+ `export:deploy-env`), which only produced Vercel/Railway env files; fixed links to them (AGENTS.md, READMEs, env docs, `.env.example`s).
- `docs/self-hosting.md`: added a "Vercel is gone" note, removed `/ai-for-good` from the live sections, marked the §2 parity and §5 cutover sections historical. Dev-logs, archive and old task files untouched.
- `backend/src/config/env.ts`: removed the `*.vercel.app` CORS allowance (nothing else needs it; `ALLOWED_ORIGINS` is unchanged).

## Evidence
`pnpm --dir backend run build`, `test:homepage-content`, `test:ire-app`, `test:version-2-app`, `test:og-routing`, `test:og-contract`, `find-orphans --strict`, `pnpm lint`, frontend `typecheck` all pass; `caddy validate` on the edited Caddyfile (caddy:2-alpine) says "Valid configuration".

## Next step
- Disconnect the Vercel GitHub app from the repo (account setting, not done here) so the "Vercel" check stops appearing.
- Not changed: third-party demo links to other `*.vercel.app` projects in the content (e.g. the InvestAI case study) are not this site's hosting.
