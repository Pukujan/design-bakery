# Agent devlog — agent publishing API (agent tokens, drafts, `/api/agent/*`)

| Field | Value |
|-------|-------|
| **Document date** | 2026-10-05 |
| **Created** | 2026-10-05 |
| **Last updated** | 2026-10-05 |

**For Cursor agents. Read before changing the agent publishing routes, `agent_tokens`, or anything that reads `blog_posts` for the public site.**

## What this is

An agent can create and update blog posts with a bearer token instead of the admin editor. Two routes, one token table, and a draft rule that lives in row-level security. [TASK-DB-0060](../../tasks/TASK-DB-0060-agent-publishing-learning-series.md) and issue [#66](https://github.com/Pukujan/design-bakery/issues/66) own the scope.

## Canonical paths

| Concern | Path |
|---------|------|
| Routes | `backend/src/api/agentPosts.ts` (`/api/agent/posts`) |
| Token gate | `backend/src/middleware/agentAuth.ts` |
| Token hashing + lookup | `backend/src/auth/agentToken.ts` |
| Payload validation | `backend/services/src/content/agentPostPayload.ts` |
| Store (drafts, create) | `backend/services/src/content/blogPosts.ts` |
| Table + draft RLS | `supabase/migrations/010_agent_tokens_and_draft_visibility.sql` |
| Mount point | `backend/src/server.ts` (`app.use('/api/agent', requireAgentToken, agentPostsRouter)`) |

## Rules that break things if you forget them

1. **`published_at` is the only draft switch.** A post with `published_at` null is a draft. There is no status column and no approval workflow; do not add one.
2. **Drafts are hidden by row-level security, not just by query filters.** `blog_posts_public_read` is `using (published_at is not null)`. The anon key is what the public site and `scripts/generate-sitemap.mjs` read with, so an unpublished row is invisible to both. The backend reads with `service_role`, which bypasses RLS, so every backend read path has to filter drafts itself: `listBlogPosts({ publishedOnly: true })` for lists, and an explicit `publishedAt` check in `GET /api/public/blogs/:numericId`.
3. **Creating through `upsertBlogPost` publishes immediately.** Its insert path writes `published_at: publishedAt ?? now()`, because the admin editor relies on that. Agent creation therefore goes through `createBlogPost`, which writes `published_at` as given (null for a draft). If you route agent creates back through `upsertBlogPost`, drafts silently publish.
4. **`PUT` treats `publishedAt` by presence, not by value.** Omitted keeps the current value; an ISO string publishes; explicit `null` unpublishes (via `upsertBlogPost(dto, { unpublish: true })`). The update path's `delete updateRow.published_at` trick only works when `numericId` is 0, so a non-null `numericId` plus `unpublish` is what clears it.
5. **Only the SHA-256 of a token is stored.** `agent_tokens.token_hash` is the hex digest; the plaintext is never written. Lookup hashes the presented token and matches. There is no prefix or last-4 to display, so a lost token is reissued, not recovered.
6. **Agent tokens are not admin JWTs.** `requireAgentToken` checks an opaque random string against `agent_tokens` and attaches no roles. The routes it guards are create and update only; no delete, no publish kit, no media.
7. **Unknown top-level fields are rejected.** A typo like `readtime` fails the request instead of dropping the field. Add a field to `ALLOWED_FIELDS` and the payload type together.
8. **Category is matched against the CMS, not the hardcoded JSON.** `GET /api/public/blog-categories` reads the `blog_categories` document (seeded from `frontend/src/app/modules/blog/data/blog-categories.json`, ids `all`, `ai-ml`, `systems`, `product`, `architecture`). The route accepts any case and stores the canonical id.
9. **The server never fetches an agent-supplied URL.** `seo.ogImageUrl` / `ogImage` / `socialOgImageUrl` must be site-relative paths (`/...`). The OG builder only fetches absolute `http(s)` URLs, so a relative path means no outbound request — that closes the SSRF a token holder could otherwise trigger through `ensureSocialOgImageInSeo`. Absolute URLs stay an admin-only capability.
10. **Writes are recorded in `agent_audit`.** Each create and update logs `action`, `blog_id`, and the token name under `usage.agent_token`. The write is best-effort: a logging failure logs a warning and the publish still succeeds.
11. **No rate limiting yet.** Tokens are owner-issued and few, so a limiter is deferred. If you hand a token to an untrusted caller, add one on `/api/agent` first.

## Issuing a token (manual, by the owner)

There is no mint endpoint; issuance is a deliberate manual step.

```bash
# 1. mint a token
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
# 2. hash it
node -e "const c=require('node:crypto');console.log(c.createHash('sha256').update(process.argv[1],'utf8').digest('hex'))" "<token>"
```

Insert a row into `agent_tokens` (`name`, `token_hash`) through the Supabase dashboard. Revoke by deleting the row.

## Calling the routes

```bash
# create a draft
curl -X POST "$API/api/agent/posts" \
  -H "Authorization: Bearer $AGENT_TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"...","excerpt":"...","date":"2026-10-06","readTime":7,"tags":[],"category":"ai-ml","author":"design-bakery agent","content":"## Intro"}'
# publish it (numericId from the 201 response)
curl -X PUT "$API/api/agent/posts/42" \
  -H "Authorization: Bearer $AGENT_TOKEN" -H 'Content-Type: application/json' \
  -d '{...,"publishedAt":"2026-10-06T12:00:00Z"}'
```

## Safe / avoid

| Safe | Avoid |
|------|-------|
| `createBlogPost` for new agent posts | `upsertBlogPost` for a new post you want as a draft |
| `listBlogPosts({ publishedOnly: true })` on any public list | a public list with no draft filter |
| Explicit `publishedAt` check on the public detail route | returning a draft because the query has no filter |
| Adding fields to `ALLOWED_FIELDS` + the payload type together | accepting a field the validator drops |

## Checklist before merge

- [ ] `pnpm --dir backend run build` succeeds (the validator is type-checked).
- [ ] `pnpm test:agent-posts` passes.
- [ ] Any new public read of `blog_posts` filters `published_at is not null`.
- [ ] Migration `010` applied on the Supabase project; the draft RLS policy is live.
- [ ] No secret token in a commit; only hashes reach the database.

## Test URLs

- Local API: `http://localhost:8787` (`pnpm run dev:stack`).
- Public list: `GET /api/public/blogs` (drafts absent). Detail: `GET /api/public/blogs/:numericId` (404 for a draft).
