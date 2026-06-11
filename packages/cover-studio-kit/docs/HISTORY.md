# Cover Studio & Blog Publish Kit — audit log

Chronological record of how the blog creator and Cover Studio evolved inside **design-bakery**. Use this when exporting or auditing the module.

| Field | Value |
|-------|-------|
| **Created** | 2026-05-22 (publish kit) |
| **Cover Studio fork** | 2026-05-27 |
| **Source repo** | design-bakery — `packages/cover-studio-kit` |

---

## Phase 0 — Blog CMS without agents (pre-2026)

- Blog posts stored in Firebase Firestore; images as `data:` URLs in documents.
- **Failure mode:** Spark plan blocked Firebase Storage; Save pipeline could not upload heroes → posts stuck at ~1 MiB limit.
- Decision: migrate to **Supabase** (Postgres + Storage + Auth). See design-bakery `additionals/guidelines/agent-devlog-supabase-migration.md`.

---

## Phase 1 — Publish kit v1 (2026-05-22)

| Date | Change |
|------|--------|
| 2026-05-22 | **`invokeBlogPublishKit`** callable + Express `POST /api/publish-kit` |
| 2026-05-22 | Actions: `meta`, `visual`, `visual_and_meta`, `tags`, `meta_and_tags`, `commit_visual` |
| 2026-05-22 | **Hybrid default:** OpenRouter 1:1 hero (no text) + SVG scrim + title overlay via **sharp** |
| 2026-05-22 | **Template fallback** when image API fails |
| 2026-05-22 | Preview-only generate; **`commit_visual`** uploads on Save (no Storage on generate) |
| 2026-05-22 | Image prompt **v0.2** — vector / cute illustration (not stock photo) |
| 2026-05-22 | Admin UI: `BlogPublishKit` in blog editor dialog |

**Agents (LLM via OpenRouter):**

| Agent | File | Output |
|-------|------|--------|
| Meta | `meta.ts` | `metaTitle`, `metaDescription`, `excerpt` |
| Tags | `tags.ts` | 3–5 Title Case tags |
| Hero image | `openrouterImage.ts` + `imagePrompt.ts` | 1:1 PNG, no embedded text |
| Template icons | `templateIcons.ts` | Sticker IDs for template mode |

**Stack:** TypeScript, Express, sharp, SVG (Inter via fontconfig), OpenRouter (text + image models), Supabase Postgres + Storage.

---

## Phase 2 — Unified hero & fonts (2026-05-22 – 2026-05-25)

| Date | Change |
|------|--------|
| 2026-05-22 | **Unified hero v0.3** — one 1:1 AI canvas → cover 1200×800, OG 1200×630, square thumbs |
| 2026-05-22 | Prompt **v0.3** — cute vector illustration (`HERO_IMAGE_PROMPT_VERSION`) |
| 2026-05-23 | **Inter fontconfig** — bundled Inter TTF for sharp/librsvg on Linux/Railway |
| 2026-05-23 | Railway `fonts-dejavu-core` fallback |
| 2026-05-25 | **`pnpm run test:blog-workflow`** matrix (offline / live / storage) |
| 2026-05-25 | Social crawlers: repo `middleware.ts` OG HTML for blog URLs |

---

## Phase 3 — Hero cache (2026-05-25)

| Date | Change |
|------|--------|
| 2026-05-25 | Migration **`003_publish_kit_hero_cache.sql`** |
| 2026-05-25 | Text-free heroes in Storage `blog-publish/hero-cache/{uuid}.png` |
| 2026-05-25 | Lookup **before** OpenRouter: Jaccard on tag/category slugs + hard filters (`prompt_version`, `family`, `style_preset`) |
| 2026-05-25 | Env: `PUBLISH_KIT_HERO_CACHE`, `MIN_SCORE=0.55`, `MIN_TAGS=2` |
| 2026-05-25 | Files: `heroCacheSlugs.ts`, `heroCache.ts`, `resolveMasterHero.ts` |

---

## Phase 4 — Media library (2026-05)

| Date | Change |
|------|--------|
| — | Migrations **004**, **005** — `media_assets`, slug, `meta_tags` GIN |
| — | `uploadMediaAssets`, OCR rename via OpenRouter vision |
| — | Admin **Media Library** route |

---

## Phase 5 — Cover Studio fork (2026-05-27)

| Date | Change |
|------|--------|
| 2026-05-27 | **`packages/cover-studio-kit`** — exportable client package |
| 2026-05-27 | Standalone `blogId: 900001`, snapshot-only (no CMS post) |
| 2026-05-27 | **`renderCoverStudioSocialPack`** — 9 platform sizes per generation |
| 2026-05-27 | Migrations **006**, **007** — `cover_studio_assets`, `format_id`, `platform` |
| 2026-05-27 | Separate gallery API `/api/cover-studio-library` |
| 2026-05-27 | **`suggest_tags`** agent for visual theme tags |
| 2026-05-27 | **`normalizeCopy`** agent — light grammar fix + name capitalization |
| 2026-05-27 | Migration **008** — `pack_id`, `pack_title` (one card per generation) |
| 2026-05-27 | Pack detail page with `SocialAppPreview` grid + platform post links |
| 2026-05-27 | LinkedIn layouts: right-side scrim (faces visible) |
| 2026-05-27 | **`hideBranding`** — no “Cover Studio” pill on exports |
| 2026-05-27 | Auto-save: 9 sizes → Cover Studio gallery; text-free 1024×1024 hero → **Media Library** |
| 2026-05-27 | **`PublicCoverStudioApp`** — non-admin standalone UI |
| 2026-05-27 | **`gallerySave` / `mediaLibrarySave`** in API — no silent gallery failures |
| 2026-05-27 | Resilient DB insert (fallback if migration 008 not applied) |
| 2026-05-27 | **`pnpm run export:cover-studio`** — bundles client + server + migrations |

---

## Engineering decisions (audit)

| Decision | Rationale |
|----------|-----------|
| Snapshot-only API | Agentic tools site may have no blog CMS |
| Two galleries | Social pack (9 sizes) vs reusable text-free hero asset |
| Hybrid default | Cute AI art + readable typography on every size |
| Template fallback | Image API outage must not block export |
| Service role Supabase | RLS on tables; API holds secrets |
| sharp + SVG overlay | Deterministic typography at any aspect ratio |
| OpenRouter | Single vendor for text + image models |
| Export bundle | Copy `export-bundle/` to new repo; same UI without admin shell |

---

## Technical inventory (export)

| Layer | Technology |
|-------|------------|
| UI | React 19, Tailwind utility classes |
| API | Express 4, JSON 32mb limit |
| Render | sharp, SVG overlays, Inter TTF |
| AI text | OpenRouter chat (`OPENROUTER_MODEL`) |
| AI image | OpenRouter image (`OPENROUTER_IMAGE_MODEL`, default Gemini Flash Image) |
| DB | Supabase Postgres (JSONB tags, UUID packs) |
| Storage | Supabase public bucket |
| Auth (optional) | JWT admin or public no-op middleware |

---

## Related docs

- `README.md` — install & export guide
- `docs/ROADMAP.md` — cache-first tag/image matching plan
- `docs/ARCHITECTURE.md` — module boundaries
- design-bakery `additionals/guidelines/agent-devlog-blog-publish-kit.md` — normative publish kit
- `backend/services/src/blog/publishKit/imagePrompt.history.md` — prompt changelog
