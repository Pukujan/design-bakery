# Blog agents (archived)

Removed **2026-05**. LinkedIn promo agent, SEO rules hub, and `/admin/blog-agents` were superseded by **Publish kit** in the blog editor (`BlogEditor` → AI publish kit).

## What was removed

- `/api/blog-agent` Express route
- `invokeBlogAgent` Firebase callable
- Firestore `agent_usage` / `agent_audit` rate limits
- Frontend `src/app/modules/blog/agents/` (promo + rule-based SEO panels)

## Where the features live now

| Old | New |
|-----|-----|
| Promo / LinkedIn drafts | Not shipped — use publish kit meta or write manually |
| SEO meta generation | Publish kit → **Generate SEO text + tags** |
| Cover / OG images | Publish kit → **Generate images** |

## Git history

Search commits before 2026-05 for `BlogPromoPanel`, `invokeBlogAgent`, and `blog-agents` route.

## Docs (historical)

- `guidelines/agent-devlog-blog-agents.md`
- `guidelines/agent-devlog-blog-agents-roadmap.md`
