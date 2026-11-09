# Project guide

## Home profile

One home profile is active: **`endtoend-engineer`** (public home `/`, admin `/admin` and `/admin/endtoend-engineer`, CMS collection prefix `ete__`). The earlier profiles (`default`, `ai-engineer`, `legal-workflow-engineer`, `forward-deployed-engineer`) and the `PortfolioHub` page were removed in TASK-DB-0049; recover them from git history if ever needed.

**Blogs** are shared (one `blog_posts` collection).

Registry: [`frontend/src/app/portfolios/registry.ts`](../../frontend/src/app/portfolios/registry.ts)

## Routes

See **[routes.md](./routes.md)** for the full route reference: every public URL, admin editor path, in-page `#anchors`, navbar targets, and unused components.

## How content is loaded

1. **Public engineering sections** — the live page reads each document from Octo (`cms_documents`, portfolio `endtoend-engineer`, keys `ete__*`) through `GET /api/public/portfolio/<collection>` (`lib/portfolioDocs.ts`); the repo JSON below is the fallback. A change to that JSON reaches the live site only after the same document is written to Octo.
2. **JSON sources** — `frontend/src/app/portfolios/endtoend-engineer/engineering/` (hero, about, projects, relevant-experience subtitle + `relevant-experience-rendered-list.json`) and `modules/engineering/EngineeringSkills/skill-categories.json`.
3. **Admin** — editors write `ete__*` collections through the Express CMS API; "Push repo defaults" seeds them from the JSON above.

## Numbers on the site (TASK-DB-0161)

Every figure on the site must trace to a source; never invent one.

- `about.json` `impact` and `aiSection`: the "What I can do with AI" section on the home page (`LabCapabilities` in `modules/lab/LabStory.tsx`). The 100M+ reach (the owner's own figure) is its first tile; the owner did not want it as a line under the hero title (2026-11-09).
- `projects.json` `outcome` (optional): one measured outcome line, shown as "Outcome" on `/work/<slug>`.
- `researchPapers.ts` `result` (optional): the paper's headline measured result, shown on `/research` and the paper page. Papers that report no original result get none.
- The copilot's site brief (`backend/src/copilot/knowledge.ts`) carries all four.
- Where each number comes from: `tasks/TASK-DB-0161-reach-and-impact.md`.

## Key files

| Area | Files |
|------|--------|
| Routing | [`src/app/App.tsx`](../../frontend/src/app/App.tsx) |
| Portfolio context | [`PortfolioContext.tsx`](../../frontend/src/app/portfolios/PortfolioContext.tsx), `PortfolioPublicLayout.tsx` |
| Nav | `Navigation.tsx` |
| Engineering page | `EngineeringHome.tsx` |
| Data API | [`adminContentService.ts`](../../frontend/src/app/lib/adminContentService.ts), [`contentHooks.ts`](../../frontend/src/app/lib/contentHooks.ts) |
| Admin shell | [`AdminLayoutShell.tsx`](../../frontend/src/app/modules/admin/AdminLayoutShell.tsx), [`AdminLayout.tsx`](../../frontend/src/app/modules/admin/AdminLayout.tsx) |
| Admin routes | [`adminRoutes.tsx`](../../frontend/src/app/modules/admin/adminRoutes.tsx) |

## Environment

See `frontend/.env.example` and `backend/.env.example` ([env.md](./env.md)). For normal admin + Firestore use, **disable** content sync (`VITE_FIREBASE_ENABLE_CONTENT_SYNC=false` or omit).
