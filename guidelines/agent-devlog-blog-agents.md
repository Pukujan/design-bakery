# Agent devlog — Blog agents module

**For Cursor agents.** Read before editing `src/app/modules/agent/`, Functions, or admin blog-agents routes.

**Contract & phases:** [`agent-devlog-contract.md`](agent-devlog-contract.md) · **Index:** [`agent-devlog-index.md`](agent-devlog-index.md)

---

## Module boundaries (strict)

- **No imports** from `@/modules/agent/*` into `blogData`, `BlogDetailPage`, `BlogListPage`, or Mermaid code.
- **Reads** blogs via `agentBlogAdapter.toAgentBlogPayload()` only.
- **Writes** to `blog_posts` only through existing `saveBlog()` in admin — never from public routes.
- **OpenRouter** only in Firebase Functions (Phase 4+) — never `VITE_OPENROUTER_*`.

## Feature flags

| Env | Default | Effect |
|-----|---------|--------|
| `VITE_ENABLE_BLOG_AGENTS` | off | `/admin/.../blog-agents` shows “coming soon” |
| `VITE_ENABLE_AGENT_COUNCIL` | off | Council orchestrator (Phase 7) |

## Auth

Firebase admin login only (`/admin/login`). No separate agent login dialog.

## Phased delivery

0. Contact FAB · 1. Scaffold (this doc) · 2. SEO rules · 3. Public meta · 4. Functions + promo · 5–7. AI SEO, memory, Council

## API version

`AGENT_API_VERSION` in [`contracts.ts`](../src/app/modules/agent/contracts.ts) — bump on breaking request/response changes.
