# Blog platform export

pnpm workspace packages for a standalone **blog creator + AI publish kit + preview**.

## Packages

| Package | Role |
|---------|------|
| `@design-bakery/blog-styles` | CSS tokens + `.blog-*` rules |
| `@design-bakery/blog-core` | Types, data hooks, admin API, `BlogHostProvider` |
| `@design-bakery/blog-ui` | Cover, motion, Mermaid |
| `@design-bakery/blog-preview` | Single-post viewer |
| `@design-bakery/blog-creator` | Editor + categories + publish kit UI |
| `@design-bakery/blog-agents` | OpenRouter agents (client + server mount) |
| `@design-bakery/blog-studio-app` | Reference Vite app |

## New repo checklist

1. Copy `packages/blog-*` into your repo’s `packages/` folder.
2. Add `pnpm-workspace.yaml` entries for each package.
3. Copy minimal backend from design-bakery:
   - `backend/src/api/publishKit.ts`, `content.ts`, `publicContent.ts`, `auth.ts`
   - `backend/services/` (publish kit + OpenRouter + `content/blogPosts.ts`)
   - Or call `mountBlogRoutes` from `@design-bakery/blog-agents/server`.
4. Copy Supabase migrations: `001_initial.sql` (blog_posts), `003_publish_kit_hero_cache.sql`, `009_blog_posts_published_at.sql`.
5. Copy env templates from `packages/blog-studio-app/templates/`.
6. Run `pnpm install` and `pnpm --filter @design-bakery/blog-studio-app dev`.

## Dev in design-bakery (feature branch)

```bash
pnpm install
pnpm run dev:stack          # API :8787 + main site
pnpm run dev:blog-studio    # Studio app :5310
```

## Optional later

- `@design-bakery/blog-list` — full list + carousel (not in v1 studio app).
