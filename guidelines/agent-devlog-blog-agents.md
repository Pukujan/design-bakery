# Agent devlog — Blog agents module

**For Cursor agents.** Read before editing `src/app/modules/agent/`, Functions, or admin blog-agents routes.

**Contract & phases:** [`agent-devlog-contract.md`](agent-devlog-contract.md) · **Index:** [`agent-devlog-index.md`](agent-devlog-index.md)

---

## Module boundaries (strict)

- **No imports** from `@/modules/agent/*` into `blogData`, `BlogDetailPage`, `BlogListPage`, or Mermaid code.
- **Reads** blogs via `agentBlogAdapter.toAgentBlogPayload()` only.
- **Writes** to `blog_posts` only through existing `saveBlog()` in admin — never from public routes.
- **Public meta** via `BlogPostHead` in `src/app/modules/engineering/BlogDetailPage/` only (not agent module).
- **OpenRouter** only in `functions/` — never `VITE_OPENROUTER_*`.

## Delivery slices

| Slice | Ships | Visible outcome |
|-------|--------|-----------------|
| **1** | Contact FAB | Bottom-right speed-dial on blog detail |
| **2** | SEO rules + public meta | Admin SEO audit + page title / meta tags |
| **3** | Functions + promo | `VITE_ENABLE_BLOG_AGENTS=true` → Promo panel |
| **4** | Council + memory (optional) | `VITE_ENABLE_AGENT_COUNCIL` |

## Feature flags

| Env | Default | Effect |
|-----|---------|--------|
| `VITE_ENABLE_BLOG_AGENTS` | off | Shows **Promo agent** panel |
| `VITE_USE_FUNCTIONS_EMULATOR` | off | Points callables at `127.0.0.1:5001` |
| `VITE_ENABLE_AGENT_COUNCIL` | off | Council (Slice 4) |

SEO rules admin UI is **always on** (no flag).

## Auth

Firebase admin login only (`/admin/login`). Callable `invokeBlogAgent` requires `request.auth`.

Optional allowlist: Functions env `ALLOWED_ADMIN_EMAILS` (comma-separated).

## SEO (Slice 2)

- **Rules:** `src/app/modules/agent/seo/seoRules.ts`
- **Admin:** `BlogSeoPanel` on `/admin/.../blog-agents`
- **Fields:** `blog_posts.seo` — `{ metaTitle?, metaDescription?, ogImage? }`
- **Public:** `BlogPostHead`

## Promo / OpenRouter (Slice 3)

### Deploy

```bash
cd functions && npm install && npm run build
firebase functions:secrets:set OPENROUTER_API_KEY
firebase deploy --only functions:invokeBlogAgent
```

Local emulator:

```bash
# functions/.env — OPENROUTER_API_KEY + OPENROUTER_MODEL=qwen/qwen-2.5-7b-instruct
pnpm run functions:serve
# .env: VITE_ENABLE_BLOG_AGENTS=true VITE_USE_FUNCTIONS_EMULATOR=true
```

### Callable

- **Name:** `invokeBlogAgent` (region `us-central1`)
- **Client:** `invokeBlogAgent()` in `src/app/modules/agent/agentClient.ts`
- **Actions:** `promo` (live), `seo_ai` / `council` (501 until Slice 4)

### Firestore (written by Functions only)

- `agent_usage/{uid}` — daily call/token counters
- `agent_audit` — append-only invoke log

### Test URLs (port 5300)

- Admin agents: `http://localhost:5300/admin/blog-agents` (or `/admin/endtoend-engineer/blog-agents`)
- Blog detail + FAB: `http://localhost:5300/endtoend-engineer/blogs/1`

## API version

`AGENT_API_VERSION` in client `config.ts` and `functions/src/types.ts` — bump both on breaking changes.
