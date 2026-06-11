# Dev log — 2026-05-20 (Blog agents)

| Field | Value |
|-------|-------|
| **Document date** | 2026-05-20 |
| **Created** | 2026-05-20 |
| **Last updated** | 2026-05-20 |

**Branches:** `feature/slice-3-ai-agents` · **`test/blog-agents-integration`** (integration test)  
**Latest commit:** `d0a2078` — promo quality + SEO change visibility  
**Build:** `pnpm run build` (client) · `cd functions && npm run build` (Functions)  
**Dev URL:** http://localhost:5300

---

## Human summary

We shipped an **admin Blog Agents hub**: free **SEO rule audit** (always on) with visible before/after when applying meta, and an optional **Promo agent** that calls **OpenRouter** via a **Firebase Callable** (keys never in the client). Local dev uses the **Functions emulator** on port 5001; Auth/Firestore stay on the cloud project. Promo copy was tuned for **longer, human posts** (DeepSeek, no emojis). A **test branch** bundles the full stack for review before merging to `main`.

---

## Delivery context (why “slices” not tiny phases)

Early “phase” branches had **no visible UI** until several pieces landed together. We merged work into **slices** so each branch/demo shows something testable:

| Slice | User-visible outcome | Status |
|-------|----------------------|--------|
| 0 | Contact FAB on blog detail | ✅ on `main` |
| 1 | Agent module scaffold + admin route | ✅ merged into SEO stack |
| 2 | SEO rules audit + `blog_posts.seo` + public `<meta>` | ✅ shipped |
| 3 | Functions + OpenRouter + Promo panel | ✅ shipped (local + test branch) |
| 4+ | AI SEO, council, chat/refine | 📋 planned — see [roadmap](agent-devlog-blog-agents-roadmap.md) |

**Full plan:** [`guidelines/agent-devlog-blog-agents-roadmap.md`](agent-devlog-blog-agents-roadmap.md)

---

## What shipped (this session / branch)

### SEO audit (rules, not LLM)

| Feature | Detail |
|---------|--------|
| Rule engine | `runSeoAudit()` — title, excerpt, meta lengths, tags, body depth |
| Admin UI | `BlogSeoPanel` — post picker, score, findings, meta fields, live preview |
| **Use suggestions** | Trims title/excerpt into meta fields (rule-based, not AI) |
| **Apply to post** | `saveBlog()` → `blog_posts.seo` |
| **Change log** | `SeoChangesSummary` — before/after per field (Added/Updated/Removed) |
| Findings | Quote actual meta text or fallback (no vague “meta added”) |
| Public head | `BlogPostHead` — `metaTitle`, `metaDescription`, `og:image` |

### Promo agent (OpenRouter via Functions)

| Feature | Detail |
|---------|--------|
| Callable | `invokeBlogAgent` — action `promo` only (`seo_ai`, `council` → 501) |
| Model default | `deepseek/deepseek-chat-v3.1` (`functions/.env` + `OPENROUTER_MODEL`) |
| Prompt | 1,500–2,400 char LinkedIn draft, no emojis, anti–AI-slop banned phrases |
| Sampling | `temperature: 0.55`, `max_tokens: 2800` |
| Client | `agentClient.ts` — 180s timeout, emulator flag |
| Payload | `blogSnapshot` from admin so emulator skips slow Firestore reads |
| Emulator | `isFunctionsEmulator()` skips usage/audit writes (avoids 120s hang) |

### UX / docs

| Item | Detail |
|------|--------|
| Guide | `BlogAgentsGuide` — two-column how-to |
| Tooltips | `FieldLabel` on post picker, meta fields, promo controls |
| Live preview | Yellow card — tab title, description, OG; full saved values in footer |
| CodeGraph | `pnpm run codegraph:sync` after agent module changes |

---

## Problems hit and fixes

| Symptom | Cause | Fix |
|---------|--------|-----|
| No Blog Agents UI | Wrong branch / flag off | Merge slices; `/admin/blog-agents`; SEO always visible |
| Callable `internal` | No `firebase-tools` / empty `functions/.env` | Root `devDependencies` + `functions/.env` template |
| `deadline-exceeded` ~120s | `assertWithinLimits` → Firestore in emulator | Skip rate-limit/audit paths when `FIREBASE_EMULATOR_HUB` set |
| Promo too short / emoji / “AI voice” | Qwen + loose prompt | DeepSeek + stricter prompt + emoji strip post-process |
| SEO “meta added” but invisible | Only char-count toast | `SeoChangesSummary` + findings with quoted values |
| CodeGraph stale symbols | Incremental sync lag | `codegraph sync` (full rebuild: `codegraph index`) |

---

## Files touched (canonical map)

### Client — `src/app/modules/agent/`

| Path | Role |
|------|------|
| `BlogAgentsPage.tsx` | Admin hub layout |
| `config.ts` | `BLOG_AGENTS_ENABLED`, `AGENT_API_VERSION` |
| `agentClient.ts` | Callable wrapper |
| `agentBlogAdapter.ts` | Blog → agent payload (read-only shape) |
| `seo/seoRules.ts` | Rule engine |
| `seo/seoChanges.ts` | Before/after diff builder |
| `seo/SeoChangesSummary.tsx` | Change log UI |
| `seo/BlogSeoPanel.tsx` | SEO admin panel |
| `seo/SeoLivePreview.tsx` | Effective meta preview |
| `promo/BlogPromoPanel.tsx` | Promo UI |
| `promo/promoTypes.ts` | Promo response types |
| `components/BlogAgentsGuide.tsx` | In-page guide |

### Engineering (public meta — not agent imports)

| Path | Role |
|------|------|
| `modules/engineering/blogSeo.ts` | Types + resolvers |
| `modules/engineering/BlogDetailPage/BlogPostHead.tsx` | Public `<title>` / meta / OG |

### Functions — `functions/src/`

| Path | Role |
|------|------|
| `index.ts` | `invokeBlogAgent` callable |
| `promo.ts` | Prompt + JSON parse |
| `openrouter.ts` | HTTP to OpenRouter |
| `blog.ts` | Resolve post for promo |
| `rateLimit.ts` | Daily quotas |
| `emulator.ts` | Emulator detection |
| `types.ts` | Request/response contracts |

### Config / infra

| Path | Role |
|------|------|
| `firebase.json` | Functions emulator |
| `package.json` | `functions:serve`, `codegraph:*` scripts |
| `functions/.env.example` | `OPENROUTER_*` template (gitignored real `.env`) |
| `.cursor/rules/blog-agents.mdc` | Agent guardrails |
| `.env` (root) | `VITE_ENABLE_BLOG_AGENTS`, `VITE_USE_FUNCTIONS_EMULATOR` |

---

## Local dev checklist

**Terminal 1 — app**

```bash
pnpm run dev   # http://localhost:5300
```

**Terminal 2 — Functions emulator**

```bash
# functions/.env:
# OPENROUTER_API_KEY=sk-or-...
# OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1
pnpm run functions:serve
```

**Root `.env`**

```env
VITE_ENABLE_BLOG_AGENTS=true
VITE_USE_FUNCTIONS_EMULATOR=true
```

**URLs**

| Page | URL |
|------|-----|
| Blog agents admin | http://localhost:5300/admin/blog-agents |
| Engineering admin | http://localhost:5300/admin/endtoend-engineer/blog-agents |
| Public blog (verify meta) | http://localhost:5300/endtoend-engineer/blogs/1 |

**Verify SEO:** Use suggestions → review change log → Apply → Open public post → tab title + View Source meta tags.

**Verify promo:** Pick post → Generate → linkedInPost + hooks + hashtags; Regenerate with optional refine instructions.

---

## Git / branches

| Branch | Purpose |
|--------|---------|
| `main` | Contact FAB; no agents yet |
| `feature/blog-seo-stack` | SEO slice (superseded by slice-3 lineage) |
| `feature/slice-3-ai-agents` | Feature development |
| **`test/blog-agents-integration`** | **Full stack for QA / preview deploy** |

PR from test branch: https://github.com/Pukujan/design-bakery/pull/new/test/blog-agents-integration

---

## Agent topic logs updated

| Doc | Change |
|-----|--------|
| [agent-devlog-blog-agents.md](agent-devlog-blog-agents.md) | Current flags, models, SEO change UI |
| [agent-devlog-blog-agents-roadmap.md](agent-devlog-blog-agents-roadmap.md) | **New** — full plan through Slice 6 |
| [agent-devlog-index.md](agent-devlog-index.md) | Links to session log + roadmap |

---

## Next steps (ordered)

1. QA on `test/blog-agents-integration` (SEO apply + promo regenerate).
2. Deploy Functions + set `OPENROUTER_API_KEY` secret; smoke test without emulator.
3. PR test branch → `main` when satisfied.
4. Slice 4a: `seo_ai` action (LLM meta suggestions, still `saveBlog()` only).
5. Slice 4b: Promo refine thread / history (optional council later).

See roadmap for acceptance criteria and API versioning.
