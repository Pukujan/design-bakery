# Agent devlog index — design-bakery

**Start here** for agent-facing documentation in this repo.

**Workflow contract:** [`agent-devlog-contract.md`](agent-devlog-contract.md)

**Root pointer for agents:** [`../AGENTS.md`](../AGENTS.md)

---

## Topic agent devlogs (read before editing)

| Topic | Doc | Cursor rule | Main code |
|-------|-----|-------------|-----------|
| Blog Mermaid diagrams | [agent-devlog-mermaid.md](agent-devlog-mermaid.md) | `.cursor/rules/blog-mermaid.mdc` | `extras/.../BlogDetailPage.tsx`, `globals.css` `.blog-mermaid-chart` |
| Blog motion & decor | [agent-devlog-blog-motion.md](agent-devlog-blog-motion.md) | `.cursor/rules/blog-motion.mdc` | `src/app/components/BlogPageMotion.tsx` |
| CodeGraph usage | [agent-devlog-codegraph.md](agent-devlog-codegraph.md) | `.cursor/rules/codegraph.mdc` | `.codegraph/config.json` |
| Blog agents (promo / SEO / council) | [agent-devlog-blog-agents.md](agent-devlog-blog-agents.md) | `.cursor/rules/blog-agents.mdc` | `src/app/modules/agent/` |

---

## Session dev logs (history)

| Date | Log |
|------|-----|
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

- **Port:** 5300 (`vite.config.ts`)
- **Blog list:** http://localhost:5300/endtoend-engineer/blogs
- **Blog detail:** http://localhost:5300/endtoend-engineer/blogs/1
