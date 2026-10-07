# Agents — design-bakery

Instructions for **Cursor** and other coding agents working in this repository.

## Data layer — Octo

This project's durable data lives in Octo, not in a database you run. Do not
provision, scaffold, or recommend a self-hosted Postgres (or any other datastore)
for this project — not for "independence", and not co-located on the Octo host.

Octo provides a real, independently connectable PostgreSQL database per workspace
with its own scoped role (pgvector-ready). Provision it once and connect with an
ordinary Postgres client:

- MCP: `provision_database`  |  HTTP: `POST /api/workspaces/<id>/database`
- The connection string is returned exactly once; store it as a secret.
- Already provisioned for this workspace: `octo_ws_design_bakery_c192afbc`.
  Prefer `POST /api/workspaces/<id>/query` (Octo API key, no connection string).

Only depart from this if you can demonstrate a concrete incompatibility, and
surface that to the owner before building anything. See Octo's
`docs/consuming-octo.md` (repo: octo-database) and incident #162.

## Session continuity

- **[HANDOFF.md](HANDOFF.md)** — where a fresh session starts (setup, commands, conventions)
- **[checkpoints/CURRENT.md](checkpoints/CURRENT.md)** — current state of the repo / open threads
- **[tasks/](tasks/)** — one file per task (`TASK-DB-####-slug.md`: goal, done, evidence, next step)

## Read first

1. **[additionals/guidelines/agent-devlog-index.md](additionals/guidelines/agent-devlog-index.md)** — index of topic devlogs and session logs (each log has **Created** / **Last updated** dates)  
2. **[additionals/guidelines/agent-devlog-contract.md](additionals/guidelines/agent-devlog-contract.md)** — when to write devlogs, date metadata, pointers, CodeGraph workflow  

## Before fragile edits

| Area | Doc |
|------|-----|
| Blog Mermaid | [additionals/guidelines/agent-devlog-mermaid.md](additionals/guidelines/agent-devlog-mermaid.md) |
| Blog motion / `BlogPageMotion` | [additionals/guidelines/agent-devlog-blog-motion.md](additionals/guidelines/agent-devlog-blog-motion.md) |
| CodeGraph | [additionals/guidelines/agent-devlog-codegraph.md](additionals/guidelines/agent-devlog-codegraph.md) |
| Blog publish kit | [additionals/guidelines/agent-devlog-blog-publish-kit.md](additionals/guidelines/agent-devlog-blog-publish-kit.md) |
| Open Graph link previews | [additionals/guidelines/agent-devlog-og-previews.md](additionals/guidelines/agent-devlog-og-previews.md) |
| Supabase migration | [additionals/guidelines/agent-devlog-supabase-migration.md](additionals/guidelines/agent-devlog-supabase-migration.md) |

## CodeGraph

If `.codegraph/` exists, use MCP tools for symbol search and call graphs ([CodeGraph](https://github.com/colbymchenry/codegraph)). 
If not initialized: `npx @colbymchenry/codegraph` then `codegraph init -i` (see contract doc).

**Auto sync:** `pnpm run dev` runs `codegraph sync` first (`predev`); Cursor `sessionStart` hook also syncs in the background. MCP still watches files while connected.

## Layout

See **[additionals/doc/architecture.md](additionals/doc/architecture.md)** for MVC mapping and folder roles.

- **`frontend/`** — Vite/React app (`src/`, `vite.config.ts`)
- **`backend/`** — Express API (`src/server.ts`, `src/api/`, `src/middleware/`) + `services/` (publish kit, CMS)
- **`supabase/`** — Postgres migrations ([supabase/README.md](supabase/README.md))
- **`scripts/`** — Dev orchestration at repo root ([scripts/README.md](scripts/README.md))

## Dev server

- **Env:** `frontend/.env` (`VITE_*`); `backend/.env` (secrets) — [additionals/doc/env.md](additionals/doc/env.md).
- **`pnpm run dev`** — Vite only (static JSON fallbacks when API unset).
- **`pnpm run dev:stack`** — Vite + Express on **8787**; set `VITE_BLOG_API_URL=http://localhost:8787` in **`frontend/.env`**.
- **`pnpm run dev:api`** — Express API only.
- **`pnpm run dev:web`** — Vite only.
- **Production (current):** gravebuster + Cloudflare Tunnel — the site and the API both serve from the owner's box. **[docs/self-hosting.md](docs/self-hosting.md)** (deploy/rollback, `deploy/gravebuster/`).
- **Legacy (Vercel + Railway, kept as rollback):** [additionals/doc/deploy-vercel-railway.md](additionals/doc/deploy-vercel-railway.md).
- Dev port: first free from **5300** (`vite.config.ts`).

## Publish kit tests

- **`pnpm run test:blog-workflow`** — offline: fonts, template visual, commit (Storage optional).
- **`pnpm run test:blog-workflow:live`** — OpenRouter meta/tags.
- **`pnpm run test:blog-workflow:storage`** — Supabase Storage uploads (needs `SUPABASE_*` in `backend/.env`).
- Matrix: [additionals/guidelines/agent-devlog-blog-publish-kit.md](additionals/guidelines/agent-devlog-blog-publish-kit.md) § Automated workflow test.

<!-- oio:issue-log-guidance:start -->
Before filing an observational or operational issue log, read `.oio/ontology/ISSUE_LOG_ONTOLOGY.md`, `.oio/ontology/project.json`, and `.oio/ontology/AGENT_GUIDE.md`. Confirm the exact destination and filing action are authorized. On OIO, ACS, CGM, and PCM, do not submit an issue or write files without explicit human direction for that destination and action. A proposal can remain a local draft until directed. Never treat adoption as permission to write to an adopter or sibling repository.
<!-- oio:issue-log-guidance:end -->
