# Server & file copy list

Use **`pnpm run export:cover-studio`** to copy everything automatically into `export-bundle/`.

Manual copy: paths relative to design-bakery root. See also `export-manifest.json`.

## Client package

Copy entire folder:

```
packages/cover-studio-kit/
```

## Express routes (thin)

| File | Role |
|------|------|
| `backend/src/api/publishKit.ts` | `POST /api/publish-kit` |
| `backend/src/api/coverStudioLibrary.ts` | Cover Studio pack gallery |
| `backend/src/api/mediaLibrary.ts` | Site media library |
| `backend/src/middleware/auth.ts` | JWT admin (replace for public API) |
| `backend/src/middleware/httpErrors.ts` | JSON errors |
| `backend/src/config/env.ts` | OpenRouter + Supabase env |

## Services engine (`backend/services/src/`)

| Path | Role |
|------|------|
| `blog/publishKit/**` | Handler, visuals, OpenRouter, templates, hero cache, fonts |
| `blog/resolveBlogPost.ts` | Snapshot-only Cover Studio mode |
| `blog/agentJson.ts` | LLM JSON parse helper |
| `coverStudio/**` | Social pack render, gallery, suggestTags, normalizeCopy |
| `media/**` | Media library upload + storage |
| `openrouter.ts` | Text LLM |
| `openrouterImage.ts` | Image generation |
| `openrouterVision.ts` | OCR (optional) |
| `apiError.ts` | Domain errors |
| `supabaseClient.ts` | DB + Storage |

## Build assets

| Path | Role |
|------|------|
| `backend/services/package.json` | sharp, typescript, build script |
| `backend/services/tsconfig.json` | |
| `backend/services/scripts/copy-publish-kit-inter-ttf.mjs` | Inter fonts for SVG |
| `backend/services/src/blog/publishKit/inter-ttf/` | Inter variable font |

After copy: `cd backend/services && pnpm install && pnpm run build` → imports use `services/lib/…`.

## Supabase migrations (run in order)

| File |
|------|
| `003_publish_kit_hero_cache.sql` |
| `004_media_library.sql` |
| `005_media_library_tags_slug.sql` |
| `006_cover_studio_library.sql` |
| `007_cover_studio_format_platform.sql` |
| `008_cover_studio_pack_grouping.sql` |

## Env

See `README.md` § Environment variables and `export-bundle/backend/.env.example`.

## Mount helper

```ts
import { mountCoverStudioRoutes } from '@design-bakery/cover-studio-kit/server';
```

See `examples/standalone-server.ts`.
