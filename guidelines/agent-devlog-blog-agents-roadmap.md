# Blog agents — full roadmap & plan

| Field | Value |
|-------|-------|
| **Document date** | 2026-05-20 |
| **Created** | 2026-05-20 |
| **Last updated** | 2026-05-20 |

**For Cursor agents and humans.** Master plan for AI-assisted blog workflows on design-bakery.  
**Operational reference (today):** [`agent-devlog-blog-agents.md`](agent-devlog-blog-agents.md)  
**Session history:** [`dev-log-2026-05-20-blog-agents.md`](dev-log-2026-05-20-blog-agents.md)

---

## 1. Goals

| Goal | How we measure success |
|------|-------------------------|
| Better discoverability | Posts have tuned `metaTitle` / `metaDescription` / optional `ogImage`; verifiable on public URL |
| Faster distribution | One-click LinkedIn draft from article content (human-edited before post) |
| Safe automation | No client-side API keys; admin-only writes; audit trail for AI calls |
| Maintainable code | Agent module isolated from blog detail/Mermaid; single callable entry |

**Non-goals (for now):** Auto-publishing to LinkedIn, rewriting full article body, public-facing agent UI, multi-tenant agent configs per portfolio.

---

## 2. Architecture (non-negotiable)

```
┌─────────────────────────────────────────────────────────────┐
│  Admin (Firebase Auth)                                       │
│  /admin/.../blog-agents  →  BlogAgentsPage                   │
│    ├─ BlogSeoPanel      →  saveBlog()  →  blog_posts.seo    │
│    └─ BlogPromoPanel    →  invokeBlogAgent('promo')         │
└───────────────────────────────┬─────────────────────────────┘
                                │ HTTPS callable (us-central1)
                                ▼
┌─────────────────────────────────────────────────────────────┐
│  Firebase Functions — invokeBlogAgent                        │
│    rate limits · audit · OpenRouter · parse JSON             │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
                         OpenRouter API
                         (secret: OPENROUTER_API_KEY)

┌─────────────────────────────────────────────────────────────┐
│  Public blog (no agent imports)                              │
│  BlogPostHead ← blog_posts.seo + resolveBlogMeta*()         │
└─────────────────────────────────────────────────────────────┘
```

### Boundaries

| Rule | Rationale |
|------|-----------|
| No `@/modules/agent/*` in blog detail/list/Mermaid | Prevents bundle bloat and coupling |
| Reads via `agentBlogAdapter` / `blogSnapshot` | Stable contract for Functions |
| Writes to `blog_posts` only via `saveBlog()` | Same path as manual admin edits |
| OpenRouter only in `functions/` | Keys never in `VITE_*` |
| `AGENT_API_VERSION` bumped in client + Functions together | Breaking changes are explicit |

### Firestore collections

| Collection | Writer | Purpose |
|------------|--------|---------|
| `blog_posts` | Admin `saveBlog()` | Canonical post + `seo` object |
| `agent_usage/{uid}` | Functions | Daily call/token counters |
| `agent_audit` | Functions | Append-only invoke log |
| `agent_sessions/{id}` (planned) | Functions | Promo refine / council threads |

---

## 3. Delivery slices (status)

| Slice | Name | Status | Branch / notes |
|-------|------|--------|----------------|
| **0** | Contact FAB | ✅ **merged `main`** | `BlogContactFab` on blog detail |
| **1** | Agent scaffold | ✅ done | Module shell, admin nav, feature flags |
| **2** | SEO rules + public meta | ✅ done | Always-on admin; `BlogPostHead` |
| **3** | Promo agent (Functions) | ✅ done | `test/blog-agents-integration` for QA |
| **4a** | SEO AI suggestions | 📋 planned | Callable `seo_ai`; still manual apply |
| **4b** | Promo refine + history | 📋 planned | Thread UI, not one-shot only |
| **5** | Production hardening | 📋 planned | Secrets, deploy, quotas, monitoring |
| **6** | Agent council (optional) | 📋 optional | `VITE_ENABLE_AGENT_COUNCIL` |

---

## 4. Slice specifications

### Slice 0 — Contact FAB ✅

- **Deliverable:** Floating speed-dial on blog detail (email / social).
- **Files:** `src/app/components/BlogContactFab.tsx`, wired in blog detail layout.
- **Acceptance:** Visible on `/endtoend-engineer/blogs/:id`; no overlap with TOC on desktop.

---

### Slice 1 — Agent scaffold ✅

- **Deliverable:** `src/app/modules/agent/`, route `/admin/blog-agents`, contracts file.
- **Acceptance:** Page loads when logged in; promo hidden until flag on.

---

### Slice 2 — SEO rules + public meta ✅

- **Deliverable:**
  - `runSeoAudit()` — deterministic checks + `suggested` trim
  - Admin: score, findings, fields, live preview, **change log** (`SeoChangesSummary`)
  - Firestore: `seo: { metaTitle?, metaDescription?, ogImage? }`
  - Public: `BlogPostHead` uses resolvers from `blogSeo.ts`
- **Acceptance:**
  - Use suggestions → before/after visible
  - Apply → public tab title / `<meta name="description">` update
  - OG URL optional; rules never auto-fill image
- **Not in scope:** LLM-written meta (Slice 4a).

---

### Slice 3 — Promo agent ✅

- **Deliverable:**
  - `invokeBlogAgent` callable, action `promo`
  - `BlogPromoPanel`: theme, custom instructions, generate/regenerate, copy helpers
  - OpenRouter: default **DeepSeek** `deepseek/deepseek-chat-v3.1`
  - Output: `{ linkedInPost, hashtags[], hooks[] }` JSON
- **Acceptance:**
  - Admin signed in; emulator or deployed function returns JSON
  - Draft length ~1.5k–2.4k chars; no emojis in output
  - Regenerate produces a new variant
- **Env:**
  - Client: `VITE_ENABLE_BLOG_AGENTS`, `VITE_USE_FUNCTIONS_EMULATOR`
  - Functions: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`

---

### Slice 4a — SEO AI (`seo_ai`) 📋

- **Goal:** LLM suggests meta title/description (and optional OG alt text hint) from full article; human reviews and applies via existing **Apply to post** (same as rules).
- **Callable:** `action: 'seo_ai'` → `{ metaTitle, metaDescription, rationale?, warnings? }`
- **Prompt rules:** Same anti-slop as promo; cite 2–3 article specifics; length targets 50–60 / 120–160.
- **UI:** New panel section or tab in `BlogSeoPanel` — “AI suggest” button; merges into draft fields; change log shows diff.
- **Writes:** Still **only** `saveBlog()` on Apply — never auto-save from LLM.
- **Acceptance:** Suggest → edit → Apply → public meta matches; audit row in `agent_audit`.
- **Estimate:** 1–2 sessions (prompt + handler + UI + tests).

---

### Slice 4b — Promo refine + session history 📋

- **Goal:** Multi-turn refinement (“shorter”, “more technical”, “remove jargon”) without losing prior outputs.
- **Data:** `agent_sessions/{sessionId}` — `{ blogId, uid, messages[], lastOutput, createdAt }`
- **Callable:** Extend `promo` with optional `sessionId` + `userMessage`, or new action `promo_chat`.
- **UI:** Chat-style thread under promo output; pin “best” version; copy still primary action.
- **Acceptance:** Second message references first draft; session list per post (last 5).
- **Estimate:** 2–3 sessions.

---

### Slice 5 — Production hardening 📋

| Task | Detail |
|------|--------|
| Deploy Functions | `firebase deploy --only functions:invokeBlogAgent` |
| Secrets | `firebase functions:secrets:set OPENROUTER_API_KEY` |
| Turn off emulator flag | `VITE_USE_FUNCTIONS_EMULATOR=false` in prod build |
| Rate limits | Tune `assertWithinLimits` daily caps; surface remaining in UI |
| Error UX | Map `HttpsError` codes to admin toasts |
| Cost guard | Log model + tokens in audit; optional per-user budget |
| E2E smoke | Script or manual checklist in devlog |
| Merge to `main` | From `test/blog-agents-integration` after QA |

---

### Slice 6 — Agent council (optional) 📋

- **Flag:** `VITE_ENABLE_AGENT_COUNCIL`
- **Concept:** Multiple role prompts (editor, SEO, distribution) critique one draft; synthesizer merges.
- **Callable:** `action: 'council'` — higher token budget, stricter timeout.
- **Defer until:** Slice 4b stable and quotas proven in prod.

---

## 5. API contract (version 1)

**Client:** `src/app/modules/agent/contracts.ts` + `functions/src/types.ts`

```ts
// Request (simplified)
{
  version: 1,
  action: 'promo' | 'seo_ai' | 'council',
  blogId: number,
  blogSnapshot?: { title, excerpt, content, tags, category, author },
  publicUrl?: string,
  theme?: string,
  customInstructions?: string,
  // future: sessionId, userMessage
}

// Response (promo)
{
  ok: true,
  action: 'promo',
  data: { linkedInPost, hashtags, hooks },
  usage: { inputTokens, outputTokens },
  remainingDailyCalls,
  remainingDailyTokens
}
```

**Breaking changes:** Increment `AGENT_API_VERSION` in **both** client and Functions; reject mismatched versions with `invalid-argument`.

---

## 6. Environment matrix

| Variable | Where | Slice | Purpose |
|----------|-------|-------|---------|
| `VITE_ENABLE_BLOG_AGENTS` | root `.env` | 3+ | Show Promo panel |
| `VITE_USE_FUNCTIONS_EMULATOR` | root `.env` | 3 | Callable → localhost:5001 |
| `VITE_ENABLE_AGENT_COUNCIL` | root `.env` | 6 | Council UI (future) |
| `OPENROUTER_API_KEY` | `functions/.env` / secret | 3+ | LLM auth |
| `OPENROUTER_MODEL` | `functions/.env` | 3+ | Default model id |
| `ALLOWED_ADMIN_EMAILS` | Functions env | 3+ | Optional allowlist |

Firebase project (current): `auth-system-be464` — Auth/Firestore cloud; Functions emulator local only when flagged.

---

## 7. Testing strategy

| Layer | What to run |
|-------|-------------|
| Rules | Change title/excerpt → audit score/findings update |
| SEO apply | Suggestions → change log → Apply → public URL |
| Promo | Generate + Regenerate; emulator + deployed |
| CodeGraph | `pnpm run codegraph:sync` then `pnpm run codegraph:eval` |
| Regression | Blog detail Mermaid + motion unchanged (no agent imports) |

---

## 8. Branch & release strategy

```
main
  └── feature/slice-3-ai-agents     (active dev)
        └── test/blog-agents-integration   (QA / preview)
```

**Recommended merge path:** QA on `test/blog-agents-integration` → PR to `main` → deploy Functions → enable flags in production env → document in session dev log.

**Do not merge:** `functions/.env`, root `.env`, `.codegraph/codegraph.db`, `extras/` design sandbox (unless explicitly productized).

---

## 9. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| API key leak | Secrets only in Functions; never `VITE_OPENROUTER_*` |
| Runaway token cost | Rate limits + audit + optional allowlist |
| LLM slop in promo/SEO | Prompt bans + post-process + human Apply step |
| Emulator Firestore hangs | Skip usage/audit when emulator hub detected |
| Stale CodeGraph | `codegraph sync` after agent refactors |
| Agent module creeps into blog UI | Cursor rule + code review; no imports in detail page |

---

## 10. Decision log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05 | Slices over micro-phases | Each demo must show visible UI |
| 2026-05 | SEO rules without LLM first | Free, deterministic, shippable without API cost |
| 2026-05 | Single callable `invokeBlogAgent` | One auth/rate-limit/audit pipeline |
| 2026-05 | `blogSnapshot` in request | Emulator promo without Firestore read timeout |
| 2026-05 | DeepSeek default for promo | Better long-form vs small Qwen model |
| 2026-05 | `test/blog-agents-integration` | Full-stack QA before `main` |

---

## 11. Checklist before merging to `main`

- [ ] SEO: suggestions + apply + public meta verified on 2+ posts
- [ ] Promo: generate/regenerate on emulator and staging Functions
- [ ] No agent imports in `BlogDetailPage` / Mermaid paths
- [ ] `functions/.env` not committed; `.env.example` updated
- [ ] Topic devlog + session dev log current
- [ ] `codegraph sync` run; eval passes
- [ ] OpenRouter secret set in Firebase (prod)
- [ ] Feature flags documented for production `.env`

---

## 12. References

- Contract workflow: [`agent-devlog-contract.md`](agent-devlog-contract.md)
- Index: [`agent-devlog-index.md`](agent-devlog-index.md)
- Cursor rule: `.cursor/rules/blog-agents.mdc`
- CodeGraph: [`agent-devlog-codegraph.md`](agent-devlog-codegraph.md)
