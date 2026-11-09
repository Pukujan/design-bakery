# TASK-DB-0159: SEO for the project pages

**Goal.** The owner asked to update the SEO. The 18 `/work/<slug>` project pages, now the main portfolio, were missing from the sitemap, had a one-line description and no image, and every shared project link previewed as the generic site card.

**Done.**
- Sitemap (`scripts/generate-sitemap.mjs`): adds every `/work/<slug>` from `projects.json`, `/research`, the listed research papers and `/contact` (53 URLs, was 22).
- Project pages (`WorkPage.tsx`): description is the tagline plus the start of the description (~155 characters); own share image `/og/projects/<slug>.jpg` (1200×630, cut from each cover); image alt; `og:type` article.
- Link previews: `/work/<slug>` is routed to the og-preview router (both Caddy matchers, `WORK_RE`, `handleWork`, `backend/src/og/projectShareMeta.ts`), so a crawler gets the project's title, description and image. Unknown slugs still get the shell.
- Home description names the projects that now lead (Maybe, Riley, NYC Map Agent, Octo) in `index.html` and `siteSeoDefaults.ts`.
- Tests: `test-og-routing.mjs` (+7 `/work` paths), `test-og-canonical.mjs` (crawler gets the Riley card). Devlog `agent-devlog-og-previews.md` updated.

**Evidence.** og-routing 43 paths, og-contract, og-canonical, homepage-content, backend build and frontend tsc pass locally.

**Next.** A new project needs its `/og/projects/<slug>.jpg`; otherwise its card points at a missing image.
