# Project guide

## Home profile

One home profile is active: **`endtoend-engineer`** (public home `/`, admin `/admin` and `/admin/endtoend-engineer`, CMS collection prefix `ete__`). The earlier profiles (`default`, `ai-engineer`, `legal-workflow-engineer`, `forward-deployed-engineer`) and the `PortfolioHub` page were removed in TASK-DB-0049; recover them from git history if ever needed.

**Blogs** are shared (one `blog_posts` collection).

Registry: [`frontend/src/app/portfolios/registry.ts`](../../frontend/src/app/portfolios/registry.ts)

## Routes

See **[routes.md](./routes.md)** for the full route reference: every public URL, admin editor path, in-page `#anchors`, navbar targets, and unused components.

## How content is loaded

1. **Public engineering sections** — `contentHooks` return static repo JSON via `portfolioDefaults.ts` (no CMS reads on the public homepage; enforced by `pnpm test:homepage-content`).
2. **JSON sources** — `frontend/src/app/portfolios/endtoend-engineer/engineering/` (hero, about, projects, relevant-experience subtitle + `relevant-experience-rendered-list.json`) and `modules/engineering/EngineeringSkills/skill-categories.json`.
3. **Admin** — editors write `ete__*` collections through the Express CMS API; "Push repo defaults" seeds them from the JSON above.

## Key files

| Area | Files |
|------|--------|
| Routing | [`src/app/App.tsx`](../src/app/App.tsx) |
| Portfolio context | [`PortfolioContext.tsx`](../src/app/portfolios/PortfolioContext.tsx), [`PortfolioPublicLayout.tsx`](../src/app/portfolios/PortfolioPublicLayout.tsx) |
| Nav | [`Navigation.tsx`](../src/app/components/Navigation.tsx) |
| Engineering page | [`EngineeringHome.tsx`](../src/app/modules/engineering/EngineeringHome/EngineeringHome.tsx) |
| Data API | [`adminContentService.ts`](../src/app/lib/adminContentService.ts), [`contentHooks.ts`](../src/app/lib/contentHooks.ts) |
| Admin shell | [`AdminLayoutShell.tsx`](../src/app/modules/admin/AdminLayoutShell.tsx), [`AdminLayout.tsx`](../src/app/modules/admin/AdminLayout.tsx) |
| Admin routes | [`adminRoutes.tsx`](../src/app/modules/admin/adminRoutes.tsx) |

## Environment

See `frontend/.env.example` and `backend/.env.example` ([env.md](./env.md)). For normal admin + Firestore use, **disable** content sync (`VITE_FIREBASE_ENABLE_CONTENT_SYNC=false` or omit).
