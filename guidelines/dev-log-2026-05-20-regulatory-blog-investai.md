# Dev log — 2026-05-20 (regulatory blog + InvestAI nav)

**Branch:** `main`  
**Build:** `pnpm run build` — passed  
**Dev URL:** http://localhost:5300

---

## Human summary

Two updates shipped on `main`:

1. **New engineering blog post** — *Understanding the Database Architecture: Postgres, Qdrant, and Neo4j* (id **7**, category **Architecture**). It documents the regulatory impact demo: why three databases, how `/analyze` uses them, setup pitfalls, and phase roadmap. All Mermaid diagrams use **top-down** layout so they render cleanly on the blog detail page.

2. **InvestAI case study navigation fixes** — In-page scrolling no longer relies on `href="#"` (which breaks inside the parent React Router shell). Hero “Read Case Study”, header logo, tab strip, and bottom bar use shared scroll helpers; sections have scroll margin for the fixed header/footer.

---

## What shipped

| Area | What changed |
|------|----------------|
| **Blog** | Post id 7 in `blog-data.json`; source markdown in `posts/regulatory-impact-database-architecture.md`. |
| **Category** | `architecture` — shows under **Architecture** on `/endtoend-engineer/blogs`. |
| **Mermaid** | All charts in the post use `flowchart TD` or `sequenceDiagram` (no `graph LR`). |
| **InvestAI** | `scroll.ts`, `App.tsx`, `Header`, `Hero`, `TabIndicator`, `BottomTabBar`, `Section` (`scroll-mt` / `scroll-mb`). |

---

## How to view

| Page | URL |
|------|-----|
| Blog list (Architecture filter) | http://localhost:5300/endtoend-engineer/blogs |
| New post | http://localhost:5300/endtoend-engineer/blogs/7 |
| InvestAI case study | http://localhost:5300/case-studies/invest-ai |

---

## For agents

| Topic | Doc |
|-------|-----|
| **Index** | `guidelines/agent-devlog-index.md` |
| **Adding blog posts** | `guidelines/agent-devlog-engineering-blog-posts.md` |
| **Mermaid on detail page** | `guidelines/agent-devlog-mermaid.md` |

**After editing post id 7 or `blog-data.json`:** open `/endtoend-engineer/blogs/7` and confirm every diagram renders.

**Firestore note:** Local seed is `blog-data.json`. If production uses Firestore `blog_posts`, sync the same `numericId: 7` document there or the live site may not show the new article.

---

## Key files

- `src/app/modules/engineering/blog-data.json`
- `src/app/modules/engineering/posts/regulatory-impact-database-architecture.md`
- `extras/invest-ai-case-study/src/app/components/investai/scroll.ts`
- `extras/invest-ai-case-study/src/app/App.tsx`
- `extras/invest-ai-case-study/src/app/components/investai/{Header,Hero,BottomTabBar,TabIndicator,Section}.tsx`

---

## Not in this commit

- `.env`, `functions/.env`, `.DS_Store`, `firebase-debug.log`
- Blog agents UI (`/admin/blog-agents`) — lives on `test/blog-agents-integration` / `feature/slice-3-ai-agents`, not `main`
