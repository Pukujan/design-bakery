# Agent devlog index — design-bakery

| Field | Value |
|-------|-------|
| **Document date** | 2026-05-22 |
| **Last updated** | 2026-05-22 |

**Start here** for agent-facing documentation in this repo.

**Workflow contract:** [`agent-devlog-contract.md`](agent-devlog-contract.md) — all topic and session logs require **Created** / **Last updated** dates (time optional).

**Root pointer for agents:** [`../AGENTS.md`](../AGENTS.md)

---

## Topic agent devlogs (read before editing)

| Topic | Doc | Cursor rule | Main code |
|-------|-----|-------------|-----------|
| Blog Mermaid diagrams | [agent-devlog-mermaid.md](agent-devlog-mermaid.md) | `.cursor/rules/blog-mermaid.mdc` | `src/app/modules/blog/render/`, `public/detail/`, `globals.css` |
| Engineering blog posts | [agent-devlog-engineering-blog-posts.md](agent-devlog-engineering-blog-posts.md) | — | `src/app/modules/blog/data/`, `content/posts/` |
| Blog motion & decor | [agent-devlog-blog-motion.md](agent-devlog-blog-motion.md) | `.cursor/rules/blog-motion.mdc` | `src/app/modules/blog/shared/BlogPageMotion.tsx` |
| CodeGraph usage | [agent-devlog-codegraph.md](agent-devlog-codegraph.md) | `.cursor/rules/codegraph.mdc` | `.codegraph/config.json` |
| Blog publish kit | [agent-devlog-blog-publish-kit.md](agent-devlog-blog-publish-kit.md) | — | `src/app/modules/blog/studio/`, `functions/src/blog/publishKit/` |
| Blog agents roadmap | [agent-devlog-blog-agents-roadmap.md](agent-devlog-blog-agents-roadmap.md) | — | `src/app/modules/blog/agents/` |

---

## Session dev logs (history)

Filenames are ISO dates (`dev-log-YYYY-MM-DD.md`). Each file has a **Created** / **Last updated** table at the top.

| Date | Log |
|------|-----|
| 2026-05-22 | [dev-log-2026-05-22.md](dev-log-2026-05-22.md) — publish kit Tier 2, inline blog editor, agents nav |
| 2026-05-21 | [dev-log-2026-05-21.md](dev-log-2026-05-21.md) |
| 2026-05-20 | [dev-log-2026-05-20-regulatory-blog-investai.md](dev-log-2026-05-20-regulatory-blog-investai.md) — post id 8, InvestAI scroll fixes |
| 2026-05-20 | [dev-log-2026-05-20-blog-agents.md](dev-log-2026-05-20-blog-agents.md) — Blog agents hub, OpenRouter, SEO audit |
| 2026-05-20 | [dev-log-2026-05-20.md](dev-log-2026-05-20.md) — blog detail v2, port 5300, sort, skeleton |
| 2026-05-18 | [dev-log-2026-05-18.md](dev-log-2026-05-18.md) |
| 2026-05-11 | [dev-log-2026-05-11.md](dev-log-2026-05-11.md) |
| 2026-05-06 | [dev-log-2026-05-06.md](dev-log-2026-05-06.md) |

---

## CodeGraph

- Upstream: https://github.com/colbymchenry/codegraph
- Init: `npx @colbymchenry/codegraph` then `codegraph init -i` (or `npm run codegraph:init`)
- Project config: `.codegraph/config.json`

---

## Local dev

- **Port:** first free from **5300** (`scripts/resolve-dev-port.mjs`); see Vite startup log for the URL
- **Blog list:** http://localhost:5300/endtoend-engineer/blogs (or next free port)
- **Blog detail:** http://localhost:5300/endtoend-engineer/blogs/1
