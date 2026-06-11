# Project guide

## Multi-portfolio overview

One React app renders **multiple engineering portfolios** from the same section components. Each portfolio has its own URL prefix, navbar scope, Firestore collections, and admin area.

| Portfolio ID | Public home | Admin base | Blog list default category |
|--------------|-------------|------------|----------------------------|
| `default` | `/` | `/admin` | `all` |
| `legal-workflow-engineer` | `/legal-workflow-engineer` | `/admin/legal-workflow-engineer` | `systems` |

**Design portfolio** is not in the main navbar. It lives at `/nav/design` (and legacy `/design`).

**Blogs** are shared (one `blog_posts` Firestore collection). Each portfolio’s blog route only changes the **default category filter**.

Registry: [`src/app/portfolios/registry.ts`](../src/app/portfolios/registry.ts)

## Routes

See **[routes.md](./routes.md)** for the full route reference: every public URL, admin editor path, in-page `#anchors`, navbar targets, and unused components.

## How content is loaded

1. **Engineering sections** — `contentHooks` read `portfolioId` from `PortfolioContext` and call `adminContentService` with namespaced Firestore collections.
2. **Default portfolio** — uses legacy collection names (`engineering_projects`, etc.).
3. **LWE portfolio** — uses prefixed collections (`lwe__engineering_projects`, etc.).
4. **JSON fallbacks** — [`src/app/portfolios/{id}/engineering/`](../src/app/portfolios/default/engineering/) when Firestore is empty.
5. **Design** — global collections (not per portfolio).

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

## Adding a third portfolio

1. Add an entry to `PORTFOLIOS` in `registry.ts` (`basePath`, `collectionPrefix`, `defaultBlogCategory`).
2. Copy `src/app/portfolios/default/engineering/*.json` into `src/app/portfolios/{new-id}/engineering/`.
3. Add public routes in `App.tsx` under `PortfolioPublicLayout`.
4. Add `<Route path="/admin/{new-id}" element={<AdminLayoutShell />}>` with `buildAdminChildRoutes('{new-id}')`.
5. Extend `getPortfolioFromPathname` and `getPortfolioIdFromAdminPath`.
6. Add fallbacks in `adminContentService` for the new id.

## Environment

See `frontend/.env.example` and `backend/.env.example` ([env.md](./env.md)). For normal admin + Firestore use, **disable** content sync (`VITE_FIREBASE_ENABLE_CONTENT_SYNC=false` or omit).
