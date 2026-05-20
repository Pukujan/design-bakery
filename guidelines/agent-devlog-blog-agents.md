# Agent devlog — Blog agents module

**For Cursor agents.** Read before editing `src/app/modules/agent/`, Functions, or admin blog-agents routes.

**Contract & phases:** [`agent-devlog-contract.md`](agent-devlog-contract.md) · **Index:** [`agent-devlog-index.md`](agent-devlog-index.md)

---

## Module boundaries (strict)

- **No imports** from `@/modules/agent/*` into `blogData`, `BlogDetailPage`, `BlogListPage`, or Mermaid code.
- **Reads** blogs via `agentBlogAdapter.toAgentBlogPayload()` only.
- **Writes** to `blog_posts` only through existing `saveBlog()` in admin — never from public routes.
- **Public meta** via `BlogPostHead` in `src/app/modules/engineering/BlogDetailPage/` only (not agent module).
- **OpenRouter** only in Firebase Functions (Slice 3+) — never `VITE_OPENROUTER_*`.

## Delivery slices (merged phases)

| Slice | Ships | Visible outcome |
|-------|--------|-----------------|
| **1** | Contact FAB | Bottom-right speed-dial on blog detail |
| **2** | Scaffold + SEO rules + public meta | Admin SEO audit + Apply; page title / meta tags on detail |
| **3** | Functions + OpenRouter + promo | `VITE_ENABLE_BLOG_AGENTS=true` |
| **4** | Council + memory (optional) | `VITE_ENABLE_AGENT_COUNCIL` |

## Feature flags

| Env | Default | Effect |
|-----|---------|--------|
| `VITE_ENABLE_BLOG_AGENTS` | off | AI promo / LLM SEO (Slice 3) |
| `VITE_ENABLE_AGENT_COUNCIL` | off | Council orchestrator (Slice 4) |

SEO rules admin UI is **always on** at `/admin/blog-agents` (no flag).

## Auth

Firebase admin login only (`/admin/login`). No separate agent login dialog.

## SEO (Slice 2)

- **Rules:** `src/app/modules/agent/seo/seoRules.ts` — `runSeoAudit()`
- **Admin UI:** `BlogSeoPanel` on `BlogAgentsPage`
- **Fields:** `blog_posts.seo` — `{ metaTitle?, metaDescription?, ogImage? }`
- **Public:** `BlogPostHead` sets `document.title`, `description`, Open Graph

### Test URLs (port 5300)

- Blog detail + FAB: `http://localhost:5300/endtoend-engineer/blogs/1`
- Admin SEO: `http://localhost:5300/admin/blog-agents` (engineering portfolio admin)

## API version

`AGENT_API_VERSION` in [`contracts.ts`](../src/app/modules/agent/contracts.ts) — bump on breaking request/response changes.
