# Cover Studio Kit

**Exportable social image generator** extracted from [design-bakery](https://github.com/)’s blog publish kit. One title + description → **cute vector-style AI illustrations** (hybrid mode) composited with typography at **nine platform sizes**, plus a **text-free 1024×1024 hero** in your site Media Library.

Use it inside design-bakery (admin) or copy the export bundle into another repo as a **standalone agentic tool** with the same UI and no admin shell.

---

## Table of contents

1. [What you get](#what-you-get)
2. [Quick start (design-bakery)](#quick-start-design-bakery)
3. [Export to another repo](#export-to-another-repo)
4. [Public (non-admin) app](#public-non-admin-app)
5. [Architecture](#architecture)
6. [Agents & LLM calls](#agents--llm-calls)
7. [Visual pipeline](#visual-pipeline)
8. [Galleries & storage](#galleries--storage)
9. [API reference](#api-reference)
10. [Database migrations](#database-migrations)
11. [Environment variables](#environment-variables)
12. [History & audit log](#history--audit-log)
13. [Roadmap — cache-first matching](#roadmap--cache-first-matching)
14. [Tests](#tests)

---

## What you get

| Piece | Description |
|-------|-------------|
| **`CoverStudioPanel`** | React UI: title, description, tags, hybrid/template/AI mode, generate 9 sizes, in-app previews |
| **`PublicCoverStudioApp`** | Same experience without admin chrome — drop into any Vite/React app |
| **`CoverStudioPackGallery`** | Full-page grid of 9 `SocialAppPreview` cards + download + social post links |
| **`createCoverStudioClient`** | `POST /api/publish-kit` client |
| **`createGalleryClient`** | `GET/POST /api/cover-studio-library` client |
| **`mountCoverStudioRoutes`** | Express helper to wire API routes |
| **Server engine** | `backend/services` — sharp, SVG templates, OpenRouter image + text agents |
| **Export script** | `pnpm run export:cover-studio` → self-contained `export-bundle/` |

---

## Quick start (design-bakery)

```bash
pnpm run dev:stack   # Vite + Express :8787 — NOT pnpm run dev (Vite only)
```

1. Sign in to admin → **Cover Studio** (`/admin/.../cover-studio`)
2. Title + description → **Suggest tags** → **Generate 9 social sizes**
3. **Cover Studio gallery** — one card per pack; click for all sizes
4. **Media Library** — one text-free 1024×1024 hero per hybrid/AI run

Requires Supabase migrations **006–008** and `VITE_BLOG_API_URL=http://localhost:8787`.

---

## Export to another repo

### 1. Generate the bundle

From design-bakery root:

```bash
pnpm run export:cover-studio
```

Output: `packages/cover-studio-kit/export-bundle/`

Contains:

- `packages/cover-studio-kit/` — client + types + docs
- `backend/src/api/` — thin Express routes
- `backend/services/src/` — render engine, agents, Supabase clients
- `supabase/migrations/` — 003–008
- `backend/.env.example`, `frontend/.env.example`

Copy the whole `export-bundle/` into your new repo (or cherry-pick paths from `export-manifest.json`).

### 2. Wire the server

```bash
cd backend/services && pnpm install && pnpm run build
cd ../.. && pnpm exec tsx packages/cover-studio-kit/examples/standalone-server.ts
```

Or mount in your existing Express app:

```ts
import { mountCoverStudioRoutes } from '@design-bakery/cover-studio-kit/server';
import { publishKitRouter } from './api/publishKit.js';
import { coverStudioLibraryRouter } from './api/coverStudioLibrary.js';
import { mediaLibraryRouter } from './api/mediaLibrary.js';
import { requireAdmin } from './middleware/auth.js'; // or public rate-limit middleware

mountCoverStudioRoutes(app, {
  publishKitRouter,
  coverStudioLibraryRouter,
  mediaLibraryRouter,
  requireAuth: requireAdmin,
});
```

Replace `requireAdmin` with a no-op or API-key middleware for a **public** generator:

```ts
const publicOrAuth: RequestHandler = (req, res, next) => next();
```

### 3. Wire the client

```tsx
import { PublicCoverStudioApp } from '@design-bakery/cover-studio-kit/client';

export default function StudioPage() {
  return (
    <PublicCoverStudioApp
      apiBaseUrl={import.meta.env.VITE_API_URL}
      getAuthHeaders={async () => ({ Authorization: `Bearer ${token}` })}
    />
  );
}
```

Vite alias (if not using workspaces):

```ts
resolve: {
  alias: {
    '@design-bakery/cover-studio-kit': path.resolve(__dirname, '../packages/cover-studio-kit/src'),
  },
},
```

Tailwind: scan `packages/cover-studio-kit/**/*.tsx`.

### 4. Run migrations

In Supabase SQL editor, in order:

| Migration | Purpose |
|-----------|---------|
| `003_publish_kit_hero_cache.sql` | Text-free hero reuse (optional but recommended) |
| `004_media_library.sql` | Site media gallery |
| `005_media_library_tags_slug.sql` | Tags + slug on media |
| `006_cover_studio_library.sql` | Cover Studio gallery table |
| `007_cover_studio_format_platform.sql` | Format + platform columns |
| `008_cover_studio_pack_grouping.sql` | One card per generation |

Create a **public** Storage bucket (e.g. `design-bakery`) with public read for image URLs.

---

## Public (non-admin) app

`PublicCoverStudioApp` includes:

- Same indigo **CoverStudioPanel** styling as admin
- Pack gallery grid (no admin nav)
- In-app pack detail (no modal) via `CoverStudioPackGallery`

See `examples/public-vite-app/App.example.tsx`.

**Auth:** inject `getAuthHeaders` or omit for an open API (add rate limiting server-side).

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  React (cover-studio-kit/client)                            │
│  CoverStudioPanel → createCoverStudioClient                 │
│                   → createGalleryClient                     │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS JSON
┌──────────────────────────▼──────────────────────────────────┐
│  Express (backend/src/api)                                  │
│  POST /api/publish-kit                                      │
│  GET  /api/cover-studio-library                             │
│  POST /api/media-library/upload                             │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Services (backend/services/src)                            │
│  handler.ts → renderCoverStudioSocialPack                   │
│            → normalizeCoverStudioCopy / suggestCoverStudioTags│
│            → saveCoverStudioPackFromBuffers                 │
│            → uploadMediaAssetsFromBuffers (text-free hero)  │
│  resolveMasterHeroPng → heroCache? → openrouterImage        │
│  compositeCover + renderOverlay (sharp + SVG)               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Supabase                                                   │
│  Postgres: cover_studio_assets, media_assets, hero_cache    │
│  Storage: cover-studio-library/*, media/*, hero-cache/*     │
└─────────────────────────────────────────────────────────────┘
```

**Standalone mode:** `blogId: 900001`, `coverStudioMode: true`, `blogSnapshot` in every request — no CMS row required (`resolveBlogPost.ts`).

---

## Agents & LLM calls

All text/image LLMs go through **OpenRouter**.

| Agent | Trigger | File | Model env |
|-------|---------|------|-----------|
| **Visual theme tags** | “Suggest tags” | `coverStudio/suggestTags.ts` | `OPENROUTER_MODEL` |
| **Copy normalize** | Every generate | `coverStudio/normalizeCopy.ts` | `OPENROUTER_MODEL` |
| **Hero image** | Hybrid / AI (cache miss) | `publishKit/openrouterImage.ts` | `OPENROUTER_IMAGE_MODEL` |
| **SEO meta** | Blog kit only | `publishKit/meta.ts` | `OPENROUTER_MODEL` |
| **Blog tags** | Blog kit only | `publishKit/tags.ts` | `OPENROUTER_MODEL` |

Default image model: **`google/gemini-2.5-flash-image`** (cute illustration prompt v0.3 in `imagePrompt.ts`).

Cover Studio does **not** call meta/tags agents on generate unless you invoke those actions separately.

---

## Visual pipeline

### Modes (`visualMode`)

| Mode | Behavior |
|------|----------|
| **`hybrid`** (default) | 1:1 AI hero (no text) + per-size SVG overlay (title/excerpt) |
| **`template`** | SVG gradient + stickers only — fast, no image API |
| **`ai`** | Hero resized per format, no typography |

### Nine exports

Defined in `coverStudio/socialFormats.ts`:

Instagram post/portrait/story, LinkedIn post/cover, Facebook post/cover, TikTok, X — each with layout hints and right-side scrim on wide formats so faces stay visible.

### Text-free hero → Media Library

After hybrid/AI generate, server saves **one** 1024×1024 PNG (`MASTER_HERO_SIZE`) via `normalizeTextFreeHero.ts` → `media_assets`.

---

## Galleries & storage

| Gallery | Table | Contents |
|---------|-------|----------|
| **Cover Studio** | `cover_studio_assets` | 9 sized exports per `pack_id` |
| **Media Library** | `media_assets` | 1 text-free hero per run |
| **Hero cache** | `publish_kit_hero_cache` | Reusable text-free 1:1 art (blog kit + Cover Studio) |

Storage paths:

- `cover-studio-library/{uuid}/…`
- `media-library/…` (via `mediaStorage.ts`)
- `blog-publish/hero-cache/{uuid}.png`

---

## API reference

### `POST /api/publish-kit`

```json
{
  "version": 1,
  "action": "visual",
  "blogId": 900001,
  "blogSnapshot": {
    "title": "Hi I'm Emily",
    "excerpt": "Friend youtuber",
    "content": "Friend youtuber",
    "tags": ["Friendly Streamer"],
    "color": "#6366f1",
    "coverStudioMode": true
  },
  "preferences": { "visualMode": "hybrid", "visualStyle": "auto" }
}
```

Response includes:

- `visual.socialVariants[]` — 9 previews as data URLs
- `normalizedCopy` — grammar/name fixes applied
- `gallerySave` — `{ ok, packId, assetCount, message? }`
- `mediaLibrarySave` — text-free hero status

Actions: `visual` | `suggest_tags`

### `GET /api/cover-studio-library`

Returns `{ ok: true, packs: GalleryPack[] }`.

### `POST /api/media-library/upload`

Used by manual re-save; auto-save happens server-side on generate.

---

## Database migrations

See [Export to another repo §4](#4-run-migrations). Full SQL lives in `supabase/migrations/` in the export bundle.

---

## Environment variables

```env
# Required
OPENROUTER_API_KEY=
OPENROUTER_IMAGE_MODEL=google/gemini-2.5-flash-image
OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=design-bakery

# Recommended
PUBLISH_KIT_VISUAL_MODE=hybrid
PUBLISH_KIT_HERO_CACHE=1
PUBLISH_KIT_HERO_CACHE_MIN_SCORE=0.55
PUBLISH_KIT_HERO_CACHE_MIN_TAGS=2

# Client
VITE_API_URL=http://localhost:8787

# Admin auth (optional for public tool)
ADMIN_JWT_SECRET=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

---

## History & audit log

Cover Studio is a **2026-05-27 fork** of the blog publish kit (2026-05-22). Full chronological audit:

→ **[docs/HISTORY.md](./docs/HISTORY.md)**

Normative publish kit behavior in design-bakery:

→ `guidelines/agent-devlog-blog-publish-kit.md`

---

## Roadmap — cache-first matching

Today: **hero cache** uses Jaccard slug matching before OpenRouter.

Planned: same layered approach for **tag suggestion** and **copy normalization** — regex gates, local slug profiles, optional pgvector, confidence formula — LLM only on low confidence.

→ **[docs/ROADMAP.md](./docs/ROADMAP.md)**

---

## Tests

From design-bakery root (requires `backend/.env`):

```bash
pnpm run test:blog-workflow              # offline template + fonts
pnpm run test:blog-workflow:live:ai      # hybrid hero via OpenRouter
pnpm run test:blog-workflow:storage      # Supabase uploads
```

---

## Package layout

```
packages/cover-studio-kit/
├── src/
│   ├── client/          # React UI + API clients
│   ├── server/          # mountCoverStudioRoutes
│   ├── types.ts
│   └── socialFormats.ts
├── docs/
│   ├── HISTORY.md
│   └── ROADMAP.md
├── examples/
├── export-manifest.json
├── EXPORT.md            # file-level copy list
└── README.md            # this file
```

---

## License

Same as design-bakery (UNLICENSED / private — adjust when open-sourcing).
