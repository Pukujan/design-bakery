# Agent devlog — CodeGraph in design-bakery

| Field | Value |
|-------|-------|
| **Document date** | 2026-05-20 |
| **Created** | 2026-05-20 |
| **Last updated** | 2026-05-22 |

**For Cursor agents.** Use CodeGraph for **navigation and impact analysis**; use **topic devlogs** for conventions and “do not break” rules.

### Revision history

| Date | Notes |
|------|--------|
| 2026-05-20 | Init + MCP workflow in contract |
| 2026-05-21 | Index stats after BlogDetailPage move |
| 2026-05-22 | `predev` quiet sync; documented in AGENTS.md |

**Upstream:** https://github.com/colbymchenry/codegraph  
**Contract:** [`agent-devlog-contract.md`](agent-devlog-contract.md)

---

## Is this project initialized?

Look for `.codegraph/codegraph.db` (gitignored). If missing, ask the user before running:

```bash
codegraph init -i
# or: npm run codegraph:init
```

Config template is committed at `.codegraph/config.json`.

---

## MCP tools (when server is running)

| Tool | Use for |
|------|---------|
| `codegraph_search` | Find symbols by name (`BlogPageMotion`, `useBlogData`, …) |
| `codegraph_callers` / `codegraph_callees` | Who calls what before refactors |
| `codegraph_impact` | Blast radius before edits |
| `codegraph_context` | Task-focused code bundle (prefer in Explore subagent for large pulls) |
| `codegraph_node` | One symbol detail |
| `codegraph_files` | Indexed tree (faster than blind glob) |
| `codegraph_status` | Index health |

Per upstream guidance: **heavy exploration** (`codegraph_explore` / large `codegraph_context`) → subagent; main session uses lightweight search/callers/impact for targeted edits.

---

## CLI (terminal)

```bash
npm run codegraph:status   # stats
npm run codegraph:sync     # after big refactors
npm run codegraph:query -- BlogPageDecor
```

### Auto sync (this repo)

| Trigger | What runs |
|---------|-----------|
| `pnpm run dev` / `npm run dev` | **`predev`** → `node scripts/codegraph-sync.mjs` (incremental sync before Vite) |
| Cursor **agent session start** | `.cursor/hooks/codegraph-sync.sh` (background sync, non-blocking) |
| Cursor **CodeGraph MCP** | File watcher (~500ms debounce) while MCP server is connected |

Manual sync still useful after large moves: `npm run codegraph:sync`.

---

## What CodeGraph indexes here

- **Languages:** TypeScript / JavaScript (see `.codegraph/config.json`)
- **Excluded:** `node_modules`, `dist`, large presentation extras under `extras/Create Presentation Case Study/`
- **Included:** `src/` (blog detail lives in `src/app/modules/engineering/BlogDetailPage/`)
- **Excluded (reference only):** `archive/` (legacy Figma exports)

Re-run `codegraph sync` after moving modules between `src`, `extras`, and `archive`.

**2026-05-21 index:** ~274 files, ~2,719 nodes — after blog detail + `MermaidDiagram` under `src/app/modules/engineering/BlogDetailPage/`.

---

## What CodeGraph does *not* replace

| Question | Read instead |
|----------|----------------|
| Why did Mermaid break? | [agent-devlog-mermaid.md](agent-devlog-mermaid.md) |
| How do blog floats work? | [agent-devlog-blog-motion.md](agent-devlog-blog-motion.md) |
| What shipped on a date? | [dev-log-YYYY-MM-DD.md](dev-log-2026-05-20.md) |

---

## Troubleshooting

- **Not initialized** → `codegraph init -i`
- **Stale symbols** → `codegraph sync` or wait ~2s after save (watcher)
- **Slow / locked DB** → `codegraph status`; prefer native SQLite backend over WASM (see upstream README)
