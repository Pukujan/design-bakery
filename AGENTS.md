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

## CodeGraph

If `.codegraph/` exists, use MCP tools for symbol search and call graphs ([CodeGraph](https://github.com/colbymchenry/codegraph)). 
If not initialized: `npx @colbymchenry/codegraph` then `codegraph init -i` (see contract doc).

**Auto sync:** `pnpm run dev` runs `codegraph sync` first (`predev`); Cursor `sessionStart` hook also syncs in the background. MCP still watches files while connected.

## Dev server

- **`pnpm run dev`** — Vite + Functions (quiet terminal). Callables proxied via Vite (no CORS). **`pnpm run dev:verbose`** for full Firebase logs.
- **`pnpm run dev:web`** — Vite only (no emulator).
- Publish kit history (old CORS/upload flow, prompt v0.1): [guidelines/agent-devlog-blog-publish-kit.md](guidelines/agent-devlog-blog-publish-kit.md)
- Dev port: first free from **5300** (`vite.config.ts`). Check terminal for the actual URL.

## Blog agents tests

- **`pnpm run test:blog-workflow`** — offline: fonts, template visual, promo JSON parse, commit (Storage optional).
- **`pnpm run test:blog-workflow:live`** — OpenRouter meta/tags/promo.
- **`pnpm run test:blog-workflow:storage`** — requires `gcloud auth application-default login`.
- Matrix: [guidelines/agent-devlog-blog-publish-kit.md](guidelines/agent-devlog-blog-publish-kit.md) § Automated workflow test.
