-- Reusable text-free hero art for publish kit (before SVG title overlay).
-- Matched by tag/category slugs + prompt_version / family / style_preset.

create table if not exists publish_kit_hero_cache (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  public_url text not null,
  prompt_version text not null,
  category_slug text not null default '',
  tag_slugs text[] not null default '{}',
  family text not null,
  style_preset text not null default 'auto',
  layout text not null default '',
  byte_size integer,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  use_count integer not null default 0
);

create index if not exists publish_kit_hero_cache_lookup_idx
  on publish_kit_hero_cache (prompt_version, family, style_preset);

create index if not exists publish_kit_hero_cache_tag_slugs_gin
  on publish_kit_hero_cache using gin (tag_slugs);

alter table publish_kit_hero_cache enable row level security;

-- No anon access; API uses service_role.
