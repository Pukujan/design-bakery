# Agents — design-bakery

Instructions for **Cursor** and other coding agents working in this repository.

## Read first

1. **[guidelines/agent-devlog-index.md](guidelines/agent-devlog-index.md)** — index of topic devlogs and session logs (each log has **Created** / **Last updated** dates)  
2. **[guidelines/agent-devlog-contract.md](guidelines/agent-devlog-contract.md)** — when to write devlogs, date metadata, pointers, CodeGraph workflow  

## Before fragile edits

| Area | Doc |
|------|-----|
| Blog Mermaid | [guidelines/agent-devlog-mermaid.md](guidelines/agent-devlog-mermaid.md) |
| Blog motion / `BlogPageMotion` | [guidelines/agent-devlog-blog-motion.md](guidelines/agent-devlog-blog-motion.md) |
| CodeGraph | [guidelines/agent-devlog-codegraph.md](guidelines/agent-devlog-codegraph.md) |
| Blog publish kit | [guidelines/agent-devlog-blog-publish-kit.md](guidelines/agent-devlog-blog-publish-kit.md) |
| Supabase migration | [guidelines/agent-devlog-supabase-migration.md](guidelines/agent-devlog-supabase-migration.md) |

## CodeGraph

If `.codegraph/` exists, use MCP tools for symbol search and call graphs ([CodeGraph](https://github.com/colbymchenry/codegraph)). 
If not initialized: `npx @colbymchenry/codegraph` then `codegraph init -i` (see contract doc).

**Auto sync:** `pnpm run dev` runs `codegraph sync` first (`predev`); Cursor `sessionStart` hook also syncs in the background. MCP still watches files while connected.

## Layout

See **[doc/architecture.md](doc/architecture.md)** for MVC mapping and folder roles.

- **`frontend/`** — Vite/React app (`src/`, `vite.config.ts`)
- **`backend/`** — Express API (`src/server.ts`, `src/api/`, `src/middleware/`) + `services/` (publish kit, agents, CMS)
- **`firebase/`** — Optional Firebase CLI config, Storage rules, CORS ([firebase/README.md](firebase/README.md))
- **`supabase/`** — Postgres migrations ([supabase/README.md](supabase/README.md))
- **`scripts/`** — Dev orchestration at repo root ([scripts/README.md](scripts/README.md))

## Dev server

- **Env:** `frontend/.env` (`VITE_*`); `backend/.env` (secrets) — [doc/env.md](doc/env.md).
- **`pnpm run dev`** — Vite + Functions emulator when `OPENROUTER_API_KEY` is in **`backend/.env`** and **`VITE_BLOG_API_URL` is unset** in `frontend/.env`.
- **`pnpm run dev:api`** / **`pnpm run dev:stack`** — Express on **8787**; `VITE_BLOG_API_URL=http://localhost:8787` in **`frontend/.env`**.
- **`pnpm run dev:web`** — Vite only (no AI backend).
- **Production AI backend:** Railway Express + `VITE_BLOG_API_URL` on Vercel — **[doc/deploy-vercel-railway.md](doc/deploy-vercel-railway.md)**. Optional: Firebase callables — `firebase deploy --config firebase/firebase.json` (Blaze).
- Dev port: first free from **5300** (`vite.config.ts`). With callables, confirm `[functions] ready — invokeBlogPublishKit` in the terminal.

## Blog agents tests

- **`pnpm run test:blog-workflow`** — offline: fonts, template visual, promo JSON parse, commit (Storage optional).
- **`pnpm run test:blog-workflow:live`** — OpenRouter meta/tags/promo.
- **`pnpm run test:blog-workflow:storage`** — requires `gcloud auth application-default login`.
- Matrix: [guidelines/agent-devlog-blog-publish-kit.md](guidelines/agent-devlog-blog-publish-kit.md) § Automated workflow test.
