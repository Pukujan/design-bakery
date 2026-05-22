# Agent devlog contract — design-bakery

| Field | Value |
|-------|-------|
| **Document date** | 2026-05-20 |
| **Created** | 2026-05-20 |
| **Last updated** | 2026-05-22 |

**For Cursor agents and humans.** This is the **workflow contract** for preserving context across sessions: topic devlogs, session logs, CodeGraph, and in-repo pointers.

---

## 1. Two kinds of logs

| Type | Path pattern | When to write |
|------|----------------|---------------|
| **Topic agent devlog** | `guidelines/agent-devlog-<topic>.md` | Stable rules for a fragile or complex area (Mermaid, blog motion, auth, etc.) |
| **Session dev log** | `guidelines/dev-log-YYYY-MM-DD.md` | End of a focused work session: what shipped, files touched, URLs to test |

Topic devlogs are **normative** (“do / don’t”). Session logs are **historical** (“what we did that day”).

---

## 2. Topic agent devlog requirements

When adding or materially changing a **topic devlog**:

1. **Title** — `Agent devlog — <Topic> (<scope>)`
2. **Date metadata (required)** — immediately under the title:

```markdown
| Field | Value |
|-------|-------|
| **Document date** | YYYY-MM-DD |
| **Created** | YYYY-MM-DD |
| **Last updated** | YYYY-MM-DD [HH:MM optional, 24h local] |
```

- Set **Last updated** whenever rules or behavior change (same PR/session).
- Add a **Revision history** section (dated bullets) for non-trivial edits.
3. **Audience line** — “For Cursor agents. Read before …”
4. **In-repo pointers** — list files + `.cursor/rules/*.mdc` that point back to the doc
5. **Canonical paths** — single source of truth files
6. **Test URLs** — localhost; dev port is first free from **5300** (check `pnpm run dev` output)
7. **What works / what breaks** (or **safe / avoid** tables)
8. **Checklist** before merge (when regressions are costly)
9. **Link** from `guidelines/agent-devlog-index.md`

### In-repo pointers (required for fragile topics)

- **Comment** at top of main implementation file(s)
- **`.cursor/rules/<topic>.mdc`** with `globs` for those files + link to devlog
- Optional: one-line comment on re-export shims

---

## 3. Session dev log requirements

**Filename:** `guidelines/dev-log-YYYY-MM-DD.md` (date in filename must match **Document date**).

When the user asks for a dev log or a session ends with substantial changes:

```markdown
# Dev log — YYYY-MM-DD

| Field | Value |
|-------|-------|
| **Document date** | YYYY-MM-DD |
| **Created** | YYYY-MM-DD [HH:MM optional] |
| **Last updated** | YYYY-MM-DD [HH:MM optional] |

## Summary
(1–3 sentences)

## Changes Made
### 1. <area>
- bullets

## Files touched
| File | Notes |

## Local URLs
- App: http://localhost:5300 (or next free port — see Vite log)
- …

## Agent topic logs updated
- [agent-devlog-….md](…) — if applicable

## Next steps
- optional
```

Update **topic** devlogs when behavior/rules changed, not only the session log.

---

## 4. CodeGraph (local code intelligence)

[CodeGraph](https://github.com/colbymchenry/codegraph) indexes this repo into `.codegraph/codegraph.db` so agents can search symbols and trace callers with fewer file greps.

### One-time setup (human or agent)

```bash
npx @colbymchenry/codegraph
# choose Cursor, project-local or global

cd /path/to/design-bakery
codegraph init -i
# or: npm run codegraph:init
```

Restart Cursor after MCP install. `.cursor/rules/codegraph.mdc` reminds agents to use graph tools when `.codegraph/` exists.

### When to use CodeGraph vs devlogs

| Need | Use |
|------|-----|
| “Where is X implemented?” / call chain | `codegraph_search`, `codegraph_callers`, `codegraph_context` |
| “Don’t break Mermaid again” | `guidelines/agent-devlog-mermaid.md` |
| “How do blog animations work?” | `guidelines/agent-devlog-blog-motion.md` |
| “What did we ship last Tuesday?” | `guidelines/dev-log-YYYY-MM-DD.md` |

**Devlogs win for conventions and regressions.** CodeGraph wins for structure and navigation.

### After large refactors

```bash
codegraph sync
# or npm run codegraph:sync
```

### Config

Committed template: `.codegraph/config.json`. Database is **gitignored** (`.codegraph/codegraph.db`).

---

## 5. Agent session checklist

Before editing a known-fragle area:

- [ ] Read `guidelines/agent-devlog-index.md`
- [ ] Read the relevant `guidelines/agent-devlog-*.md`
- [ ] If `.codegraph/` exists, prefer `codegraph_search` for symbol location

After shipping:

- [ ] Update topic devlog if rules changed (**Last updated** date + revision history)
- [ ] Add/update session dev log if user wants history (metadata table + filename date)
- [ ] Add in-repo comments + cursor rule if new fragile topic

---

## 6. Index

See **`guidelines/agent-devlog-index.md`** for the full list of topic logs and rules.
