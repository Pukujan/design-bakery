# Supabase

Postgres schema for CMS + blog when `CONTENT_BACKEND=supabase`.

| Path | Purpose |
|------|---------|
| `migrations/001_initial.sql` | Core tables — run in Supabase SQL Editor |
| `migrations/002_agent_usage_text_id.sql` | Agent usage id type fix |
| `migrations/003_publish_kit_hero_cache.sql` | Text-free hero PNG cache for publish kit (slug match) |
| `migrations/004_media_library.sql` | Admin media library (`media_assets` table) |
| `migrations/005_media_library_tags_slug.sql` | Media slug + `meta_tags` for search/filtering |
| `migrations/006_cover_studio_library.sql` | Cover Studio gallery (`cover_studio_assets`) |
| `migrations/007_cover_studio_format_platform.sql` | Cover Studio format + platform columns |
| `migrations/008_cover_studio_pack_grouping.sql` | Cover Studio pack grouping (`pack_id`, `pack_title`) |

**One-time data copy:** `pnpm run migrate:firestore-to-supabase` (see [additionals/doc/supabase-migration.md](../additionals/doc/supabase-migration.md)).

Storage bucket `design-bakery` must be **public** for blog image previews.
