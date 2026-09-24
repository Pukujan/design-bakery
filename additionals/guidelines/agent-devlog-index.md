# Agent devlog index — design-bakery

| Field | Value |
|-------|-------|
| **Document date** | 2026-05-22 |
| **Last updated** | 2026-09-24 (TASK-DB-0049 repo cleanup: pruned May + superseded fluffy session logs) |

**Start here** for agent-facing documentation in this repo.

**Workflow contract:** [`agent-devlog-contract.md`](agent-devlog-contract.md) — all topic and session logs require **Created** / **Last updated** dates (time optional).

**Root pointer for agents:** [`../../AGENTS.md`](../../AGENTS.md) · fresh session: [`../../HANDOFF.md`](../../HANDOFF.md)

---

## Topic agent devlogs (read before editing)

| Topic | Doc | Cursor rule | Main code |
|-------|-----|-------------|-----------|
| Fluffy V4 visual rebuild | [agent-devlog-fluffy-v4-visual-rebuild.md](agent-devlog-fluffy-v4-visual-rebuild.md) | `.cursor/rules/fluffy-v4-visual-rebuild.mdc` | `frontend/public/experiments/fluffy-system-v4/` |
| Blog Mermaid diagrams | [agent-devlog-mermaid.md](agent-devlog-mermaid.md) | `.cursor/rules/blog-mermaid.mdc` | `src/app/modules/blog/render/`, `public/detail/`, `globals.css` |
| Engineering blog posts | [agent-devlog-engineering-blog-posts.md](agent-devlog-engineering-blog-posts.md) | — | `src/app/modules/blog/data/`, `content/posts/` |
| Blog motion & decor | [agent-devlog-blog-motion.md](agent-devlog-blog-motion.md) | `.cursor/rules/blog-motion.mdc` | `src/app/modules/blog/shared/BlogPageMotion.tsx` |
| CodeGraph usage | [agent-devlog-codegraph.md](agent-devlog-codegraph.md) | `.cursor/rules/codegraph.mdc` | `.codegraph/config.json` |
| Blog publish kit | [agent-devlog-blog-publish-kit.md](agent-devlog-blog-publish-kit.md) | — | `src/app/modules/blog/studio/`, `backend/services/src/blog/publishKit/` |
| Cover Studio (exportable) | [packages/cover-studio-kit/README.md](../../packages/cover-studio-kit/README.md) | [docs/HISTORY.md](../../packages/cover-studio-kit/docs/HISTORY.md) | `packages/cover-studio-kit/`, `pnpm run export:cover-studio` |
| Supabase migration (Firebase exit) | [agent-devlog-supabase-migration.md](agent-devlog-supabase-migration.md) | `.cursor/rules/supabase-migration.mdc` | `supabase/migrations/`, `backend/services/src/supabaseClient.ts`, `adminContentService.ts` |
| Blog agents roadmap | [agent-devlog-blog-agents-roadmap.md](agent-devlog-blog-agents-roadmap.md) | — | **Archived** (archive README removed in TASK-DB-0049; see git history) |

---

## Session dev logs (history)

Filenames are ISO dates (`dev-log-YYYY-MM-DD.md`). Each file has a **Created** / **Last updated** table at the top.

| Date | Log |
|------|-----|
| 2026-09-23 | [dev-log-2026-09-23.md](dev-log-2026-09-23.md) - DB-R-2026-010 comparative rewrite, live chart verification, CI follow-up |
| 2026-09-22 | [dev-log-2026-09-22.md](dev-log-2026-09-22.md) - Consolidated Eval Lab benchmark-comparison paper added to the Research module |
| 2026-09-08 | [dev-log-2026-09-08-fluffy-system.md](dev-log-2026-09-08-fluffy-system.md) - Fluffy System hidden creative gallery, PAM/Research Assurance candidate bakeoff, Three.js variants |
| 2026-09-03 | [dev-log-2026-09-03-study-os.md](dev-log-2026-09-03-study-os.md) - Study OS marketing case study, presentation, evidence ledger, homepage integration |
| 2026-09-03 | [dev-log-2026-09-03.md](dev-log-2026-09-03.md) - FOSSIL problem-framing case study, presentation, evidence ledger |
| 2026-07-20 | [dev-log-2026-07-20.md](dev-log-2026-07-20.md) - Cortex case-study redesign and composition-status corrections |

Pruned in TASK-DB-0049 (recover from git history): all May 2026 session logs (05-06 … 05-22) and the superseded Fluffy round-2 / round-3 / v2 / v3 logs (replaced by the Fluffy V4 topic devlog + handoff).

---

## CodeGraph

- Upstream: https://github.com/colbymchenry/codegraph
- Init: `npx @colbymchenry/codegraph` then `codegraph init -i` (or `npm run codegraph:init`)
- Project config: `.codegraph/config.json`.

---

## Local dev

- **Port:** first free from **5300** (`scripts/resolve-dev-port.mjs`); see Vite startup log for the URL
- **Blog list:** http://localhost:5300/blogs (or next free port)
- **Blog detail:** http://localhost:5300/blogs/1
