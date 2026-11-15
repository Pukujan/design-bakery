# Adding a project to the portfolio (agent guide)

**Created:** 2026-11-14 · **Last updated:** 2026-11-14

The one checklist for putting a project on the home page and `/work/<slug>`. The rules here were spread across task notes (DB-0117, DB-0120, DB-0156, DB-0157, DB-0159); follow this page instead of rediscovering them.

## 1. The entry

- Add it to `frontend/src/app/portfolios/endtoend-engineer/engineering/projects.json`, keeping the file's own formatting (one-line `tech`, `stats` and `links` items; do not re-dump the JSON).
- `id`: the next free id. `slug`: kebab-case, stable (it is the URL).
- `category`: `shipped | systems | research | experiments | client`.
- `startedAt`: the repo creation date in US Eastern, with the evidence in `startedAtSource`.
- `stats`: three, icons from `Users | TrendingUp | Award | Sparkles`. `outcome` (optional): one measured line. Every number must trace to a source (see `additionals/doc/project-guide.md`, "Numbers on the site").
- Copy: take it from the project's own README or brand docs, plain and short. Never link a private repo.

## 2. The cover picture (must be space themed)

Every tile is a painted space cover from one series, never a screenshot of the product (the owner rejected screenshots in DB-0157).

- Art direction (DB-0120): near-black deep space, one central subject that shows what the project does, one accent colour taken from the entry's `accentColor`, soft cinematic light, no text, logos or UI.
- Make it with the Codex CLI image tool and attach two existing covers as the style reference, for example:
  `codex exec --skip-git-repo-check -i frontend/public/lab/projects/octo.webp -i frontend/public/lab/projects/nyc-map-agent.webp < prompt.txt`
  (the prompt goes on stdin: `-i` takes several values and swallows a prompt placed after it).
- Save `frontend/public/lab/projects/<slug>.webp` at 1400×1050, and cut `frontend/public/og/projects/<slug>.jpg` at 1200×630 from the same cover.
- Set `color` / `accentColor` to match the cover.

## 3. Wiring

- `frontend/src/app/modules/lab/LabWork.tsx` `PROJECT_MEDIA`: `<id>: '<slug>'`.
- Order: `frontend/src/app/lib/projectOrder.ts` and `backend/src/copilot/projectOrder.ts` must match (`ALL_LEAD_TITLES`, `WITHIN_CATEGORY`).
- `scripts/test-homepage-content-stability.mjs`: update the expected order and check the new entry; run `pnpm test:homepage-content`.
- The sitemap picks up `/work/<slug>` by itself.
- Write a task note `tasks/TASK-DB-####-<slug>.md` with the next free number.

## 4. Going live

The live list is the Octo `cms_documents` row (`portfolio_id='endtoend-engineer'`, `collection_name='engineering_projects'`, `document_id='data'`, `payload.items`). The repo JSON is only the fallback.

1. Merge the PR; Komodo deploys `main`.
2. Read the live row, append (or update) only your entry in `payload.items`, write it back. Do not use the admin's "Push repo defaults" unless the live row equals the repo file: it overwrites the whole list.
3. Check `GET https://design-bakery.com/api/public/portfolio/engineering_projects` and `/work/<slug>`.

## 5. Search index (RAG)

The site workspace's document index holds each project page as `site:/work/<slug>#what-it-is`, `#highlights`, `#built-with` and `#go-deeper` (text `"<Title>: <Section>\n\n..."`), ingested with `POST /api/rag/documents` on Octo. Add the four for a new project, and optionally the project's README as `repo:<owner>/<repo>/README.md`. Long documents can outlast Cloudflare's 100 s limit (524) while the ingest still completes; list the documents to confirm.
