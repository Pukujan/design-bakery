# Cover Studio — technical architecture

Module boundaries for export and future cache work.

## Client (`packages/cover-studio-kit/src/client`)

| Module | Responsibility |
|--------|----------------|
| `CoverStudioPanel.tsx` | Form, generate, staged previews |
| `PublicCoverStudioApp.tsx` | Standalone shell + gallery list |
| `CoverStudioPackGallery.tsx` | 9-size preview grid + downloads |
| `SocialAppPreview.tsx` | Platform chrome mockups |
| `api.ts` | Publish kit HTTP client |
| `galleryApi.ts` | Cover Studio library HTTP client |
| `readiness.ts` | Field validation before generate |

No server secrets in client. Auth via injectable `getAuthHeaders`.

## Server API (`backend/src/api`)

Thin Express routers — delegate to `services/lib`.

## Core handler (`blog/publishKit/handler.ts`)

Single entry `handlePublishKit`. Cover Studio branch:

1. `normalizeCoverStudioCopy` (optional LLM)
2. `renderCoverStudioSocialPack`
3. `saveCoverStudioPackFromBuffers` → `cover_studio_assets`
4. `uploadMediaAssetsFromBuffers` → text-free hero → `media_assets`

Returns `gallerySave` + `mediaLibrarySave` (never silent fail).

## Render (`coverStudio/renderSocialPack.ts`)

- Resolves master hero: `resolveMasterHeroPng` (cache → OpenRouter)
- For each of 9 formats: template | composite (hero + overlay)
- `hideBranding: true` on overlays
- Landscape/banner: right-side scrim (`renderOverlay.ts`)

## Hero cache (`publishKit/heroCache.ts`)

Deterministic pre-LLM path:

```
tags + category → slugifyHeroToken → buildHeroMatchSlugs
→ SQL filter (prompt_version, family, style_preset)
→ Jaccard score + min overlap
→ hit: download PNG | miss: OpenRouter → storeHeroCachePng
```

## Storage

| Helper | Bucket path |
|--------|-------------|
| `coverStudioStorage.ts` | `cover-studio-library/` |
| `mediaStorage.ts` | `media-library/` |
| `heroCache.ts` | `blog-publish/hero-cache/` |

## Types

Shared contract: `packages/cover-studio-kit/src/types.ts` ↔ `publishKit/types.ts` (`PUBLISH_KIT_API_VERSION = 1`).

## Future cache layers

See `ROADMAP.md` — tag profiles and vector layer sit **between** client request and existing agents, reusing `heroCacheSlugs.ts` scoring patterns.
