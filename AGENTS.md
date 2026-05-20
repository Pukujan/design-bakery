# Agents — design-bakery

Instructions for **Cursor** and other coding agents working in this repository.

## Read first

1. **[guidelines/agent-devlog-index.md](guidelines/agent-devlog-index.md)** — index of topic devlogs and session logs  
2. **[guidelines/agent-devlog-contract.md](guidelines/agent-devlog-contract.md)** — when to write devlogs, pointers, CodeGraph workflow  

## Before fragile edits

| Area | Doc |
|------|-----|
| Blog Mermaid | [guidelines/agent-devlog-mermaid.md](guidelines/agent-devlog-mermaid.md) |
| Blog motion / `BlogPageMotion` | [guidelines/agent-devlog-blog-motion.md](guidelines/agent-devlog-blog-motion.md) |
| CodeGraph | [guidelines/agent-devlog-codegraph.md](guidelines/agent-devlog-codegraph.md) |
| Blog agents | [guidelines/agent-devlog-blog-agents.md](guidelines/agent-devlog-blog-agents.md) |

## CodeGraph

If `.codegraph/` exists, use MCP tools for symbol search and call graphs ([CodeGraph](https://github.com/colbymchenry/codegraph)).  
If not initialized: `npx @colbymchenry/codegraph` then `codegraph init -i` (see contract doc).

## Dev server

- Port **5300** — http://localhost:5300
