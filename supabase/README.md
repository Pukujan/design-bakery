# Supabase

Postgres schema for CMS + blog when `CONTENT_BACKEND=supabase`.

| Path | Purpose |
|------|---------|
| `migrations/001_initial.sql` | Core tables — run in Supabase SQL Editor |
| `migrations/002_agent_usage_text_id.sql` | Agent usage id type fix |
| `migrations/003_publish_kit_hero_cache.sql` | Text-free hero PNG cache for publish kit (slug match) |

**One-time data copy:** `pnpm run migrate:firestore-to-supabase` (see [doc/supabase-migration.md](../doc/supabase-migration.md)).

Storage bucket `design-bakery` must be **public** for blog image previews.
