# Agent devlog — Blog publish kit

| Field | Value |
|-------|-------|
| **Document date** | 2026-05-22 |
| **Created** | 2026-05-22 |
| **Last updated** | 2026-05-22 (workflow test) |

**Branch:** `test/blog-publish-kit` (not on `main` until reviewed).

### Revision history

| Date | Notes |
|------|--------|
| 2026-05-22 | Initial publish kit; hybrid AI; preview → apply → `commit_visual`; Vite proxy; prompt v0.2; quiet `pnpm run dev` |
| 2026-05-22 | Auto **tags** (`tags`, `meta_and_tags`); admin comma tags max **5**; `BlogCoverImage` on list + detail; social HTTPS notes |
| 2026-05-22 | `commit_visual` → `thumbnailImageUrl` + `seo.ogImageThumbUrl`; cover loading skeleton; **block Save** when emulator leaves `data:` URLs |
| 2026-05-22 | **Unified hero v0.3** — one 1:1 AI image → cover 1200×800 + OG 1200×630 + square thumbs; scaled overlay text |
| 2026-05-22 | **meta_and_tags apply** — single `applyPublishKitSeoToPost` (tags no longer overwrite meta); excerpt backfill when blank |
| 2026-05-22 | **`generateMeta` excerpt** — LLM returns `excerpt` (~200 chars) + meta fields; applied with SEO text + tags |

## Purpose

Admin **Publish kit** in Blog Posts edit dialog: LLM SEO meta + OG/cover PNGs (**hybrid AI hero** by default, template fallback). Separate from legacy `invokeBlogAgent` (promo only).

## Enable locally

```env
VITE_ENABLE_BLOG_PUBLISH_KIT=true
# or VITE_ENABLE_BLOG_AGENTS=true
VITE_USE_FUNCTIONS_EMULATOR=true
```

Functions: `OPENROUTER_API_KEY` in `functions/.env`. Optional `OPENROUTER_IMAGE_MODEL` (default `google/gemini-2.5-flash-image`), `PUBLISH_KIT_VISUAL_MODE=hybrid|template|ai`.

**Dev:** `pnpm run dev` — frees port **5300**, starts Vite + Functions. Open the URL Vite prints (must be **5300** — not an old tab). Terminal must show `[functions] ready — invokeBlogPublishKit`. `pnpm run dev:verbose` for full logs. `pnpm run dev:web` — Vite only (no callables).

**404 on `invokeBlogPublishKit`:** Usually a stale Vite on 5300 without the proxy while the new dev server is on 5301 — restart `pnpm run dev` and use the URL from the terminal.

Deploy callable: `cd functions && npm run deploy` (includes `invokeBlogPublishKit`).

## API

- Callable: **`invokeBlogPublishKit`** (`functions/src/blog/publishKit/`)
- Fonts: `publishKit/fonts.ts` resolves WOFF via `require.resolve('@fontsource/inter/...')` (not relative to `lib/` — avoids ENOENT after `blog/publishKit/` move)
- Version: `PUBLISH_KIT_API_VERSION = 1`
- Actions: `meta` | `visual` | `visual_and_meta` | **`tags`** | **`meta_and_tags`** | **`commit_visual`**
- Request: `blogId`, `blogSnapshot`, `preferences`, optional `publicUrl`, optional `visualCommit` (for `commit_visual`)
- Response may include `tags: { tags: string[]; rationale? }` (max **5**, Title Case)

### Recommended admin workflow (UX)

| Step | What the editor does | Primary control |
|------|----------------------|-----------------|
| 1. Draft | Title, excerpt, markdown — **Save once** for numeric ID | Save post |
| 2. SEO text | Meta title, description, tags | **Generate SEO text + tags** |
| 3. Images | OG/cover previews | **Generate images** → **Apply to post** |
| 4. Publish | HTTPS URLs in Firestore | **Save post** (uploads `data:` previews) |

Do not start with “Generate meta” alone — use **Generate SEO text + tags** (step 2). Buttons stay disabled until title + content exist and the post is saved (`numericId > 0`). That action fills **Short summary (excerpt)**, **Meta title**, **Meta description**, and **tags** in one atomic update (`applyPublishKitSeoToPost`).

### Image workflow (current)

| Step | What happens |
|------|----------------|
| **Generate** | Renders PNGs; returns **`ogPreviewDataUrl` / `coverPreviewDataUrl` only** (no Storage) |
| **Apply to post** | Copies previews into admin OG/cover fields (still `data:` URLs) |
| **Save post** | If fields are `data:` URLs → **`commit_visual`** uploads to Storage → HTTPS URLs saved to Firestore |

### Legacy workflow (superseded — do not reintroduce)

Documented so agents do not regress behavior.

| Old behavior | Problem | Replacement |
|--------------|---------|-------------|
| Upload to Storage on **generate** | Hit production bucket from emulator; huge URLs in form immediately | Preview-only generate + `commit_visual` on save |
| `onApplyVisual` right after generate + separate `setEditPost` | SEO field lost (stale React state) | Single `setEditPost` with `seo` + `coverImageUrl` |
| Client → **`http://localhost:5001`** directly | CORS preflight failures from Vite origin | **Vite proxy** + `connectFunctionsEmulator(host, vitePort)` |
| `VITE_FUNCTIONS_EMULATOR_HOST` / port **5001** on client | Cross-origin to dev server | Proxy path `/{projectId}/…` on Vite port (see `vite.config.ts`) |
| Hero prompt **v0.1** (photo/cinematic, “not cartoon”) | Felt generic / stock | **v0.2** — vector cartoon + line art ([`imagePrompt.history.md`](../functions/src/publishKit/imagePrompt.history.md)) |

## Hybrid visuals (default)

| Mode | Behavior |
|------|----------|
| `hybrid` | OpenRouter image model → hero PNG (no text in prompt) → SVG scrim + title overlay via **sharp** |
| `template` | SVG gradient hero only (`renderSvg.ts`) — fast, no image API |
| `ai` | Raw model output only (no typography overlay) |

Default image model: **`google/gemini-2.5-flash-image`**. Alternatives: `black-forest-labs/flux.2-klein-4b`.

**Prompt versions:** active **`0.3`** in `imagePrompt.ts` (bump `HERO_IMAGE_PROMPT_VERSION` on every prompt edit); history in `imagePrompt.history.md`.

Files: `openrouterImage.ts`, `imagePrompt.ts`, `visualRender.ts`, `compositeCover.ts`, `renderOverlay.ts`, `commitVisual.ts`.

On image API failure → **template fallback** (logged in Functions).

## Template visuals (Tier 2)

| Input | Effect |
|-------|--------|
| `category` + `categoryLabel` | Human label on card (e.g. "AI & ML") |
| `tags` | Up to 3 chips on card |
| `numericId` / `blogId` | Layout variant `a`–`d` + template **family** |
| `variationOffset` | Admin “Shuffle layout” |
| `color` | Accent + gradient; **panel** light/dark via WCAG check |
| `excerpt` / content lead | Card blurb (`resolveCardBlurb`) |

Render: Inter in SVG (`fonts.ts`) → PNG via **sharp**. Hybrid: two OpenRouter calls when OG/cover aspects differ; mirrored cover reuses one buffer.

**Cover style:** full-bleed hero, bottom **scrim**, white title/excerpt/author on image.

Dimensions: OG **1200×630**, cover **1200×800**.

## Meta agent

- Opening context: **first 3 paragraphs** (~1200 chars)
- No em dashes (prompt + `stripEmDash`)

## Tags agent

- Callable: `functions/src/publishKit/tags.ts` — OpenRouter JSON `{ tags: string[] }`, 3–5 tags, deduped, max **5**
- Admin: **Generate tags** / **Meta + tags** — applies directly to post (replaces tag list)
- Manual tags: comma-separated in [`parseBlogTags.ts`](../src/app/lib/parseBlogTags.ts); `mergeTags` respects max **5**

## Public cover + social

- **Detail:** [`BlogCoverImage.tsx`](../src/app/components/BlogCoverImage.tsx) — `resolveBlogCoverUrl`; shimmer + lazy load (`useInView`) like Mermaid
- **List:** `variant="card"` uses `resolveBlogThumbnailUrl` (640×360 `thumbnailImageUrl`, else cover)
- **Social meta:** [`BlogPostHead.tsx`](../src/app/modules/blog/public/detail/BlogPostHead.tsx) — full `seo.ogImageUrl` for `og:image` (HTTPS only in production)
- **Admin social preview:** `resolveBlogOgPreviewUrl` → `seo.ogImageThumbUrl` when set (800×420 from `commit_visual`)

### Unified visuals (v0.3)

One **1:1** AI hero (`unifiedVisual.ts`) → same artwork, different crops + **scaled** typography overlay:

| Output | Size | Use |
|--------|------|-----|
| Cover composite | **1200×800** (3:2) | Blog detail hero |
| OG composite | **1200×630** (~1.91:1) | Open Graph / Twitter (`seo.ogImageUrl`) |
| `thumbnailImageUrl` | **640×640** square | Blog list cards |
| `seo.ogImageThumbUrl` | **800×800** square | Admin social preview |

`commit_visual` derives square thumbs from cover/OG PNGs via `imageDerivatives.ts`.

### Local dev Storage

`pnpm run dev` runs **Functions emulator only** (no Java / Storage emulator required). `commit_visual` uploads PNGs to the **project Firebase Storage bucket** and returns public **https://** URLs.

Set `PUBLISH_KIT_SKIP_PRODUCTION_STORAGE=true` in `functions/.env` only if you must block bucket uploads from local.

Admin blocks Save if URLs are still `data:` (`assertImagesReadyForFirestore`).

### Debug upload (no admin UI)

```bash
pnpm run test:publish-kit-upload              # Admin SDK + commit_visual
pnpm run test:publish-kit-upload:emulator     # + HTTP to :5001 (needs pnpm run dev)
```

Script: `functions/scripts/test-publish-kit-upload.mjs` — prints pass/fail per step and Storage URLs.

Admin SDK needs an explicit bucket (`functions/src/firebaseApp.ts` reads `VITE_FIREBASE_STORAGE_BUCKET` from root `.env`).

### Automated workflow test

Script: `functions/scripts/test-blog-agents-workflow.mjs` (calls `handlePublishKit` + promo OpenRouter directly — no admin UI).

| Command | What it checks |
|---------|----------------|
| `pnpm run test:blog-workflow` | Build, Inter fonts, promo JSON parse, **template visual** generate, `commit_visual` (Storage optional) |
| `pnpm run test:blog-workflow:live` | Above + **meta_and_tags** + **promo LLM** via OpenRouter |
| `pnpm run test:blog-workflow:live:ai` | Live + **hybrid** hero (`OPENROUTER_IMAGE_MODEL`) |
| `pnpm run test:blog-workflow:storage` | Requires `gcloud auth application-default login` — asserts HTTPS from `uploadBlogImage` / `commit_visual` |
| `pnpm run test:blog-workflow:emulator` | HTTP probe `:5001` (expect unauthenticated unless you add a test token) |

Legacy upload-only debug: `pnpm run test:publish-kit-upload`.

### Social / cover test plan (manual)

1. Generate → Apply → **Save post** (deployed, or emulator with `commit_visual` returning HTTPS).
2. Open `/endtoend-engineer/blogs/{id}` — hero + list card thumbnail.
3. View page source — `og:image` and `twitter:image` match stored OG/cover URL.
4. [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) on **deployed** post URL only.

## Client

- `src/app/modules/blog/studio/` — `BlogPublishKit`, `publishKitImages.ts`, `publishKitClient.ts`
- Inline editor in `BlogEditor.tsx`
- `src/app/lib/functionsClient.ts` — emulator via **Vite proxy** (same origin)
- `vite.config.ts` — `^/{projectId}/` → `127.0.0.1:5001`

## Local dev logging

| Script | Output |
|--------|--------|
| `pnpm run dev` | Quiet: CodeGraph sync silent; Firebase `--log-verbosity QUIET`; one `[functions] ready` line |
| `pnpm run dev:verbose` | Full emulator + unhidden `[fn]` stream |
| `scripts/dev-functions.mjs` | Build + emulator wrapper |

## Do not

- Extend `invokeBlogAgent` for meta/images — use publish kit only.
- Default to Unsplash/random stock for OG art.
- Point the client at `:5001` without the Vite proxy (CORS).
- Upload to Storage on `visual` / `visual_and_meta` (use `commit_visual` on save).

## Follow-ups

- Storage public access / signed URLs
- Optional illustration slot per category (Tier 4)
- Rate limits / audit for publish kit
