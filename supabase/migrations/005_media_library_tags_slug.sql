-- Media library metadata for search + mini-categorization
alter table media_assets
  add column if not exists slug text,
  add column if not exists meta_tags jsonb not null default '[]'::jsonb;

update media_assets
set slug = coalesce(
  nullif(slug, ''),
  regexp_replace(lower(regexp_replace(filename, '\.[^.]+$', '')), '[^a-z0-9]+', '-', 'g')
)
where slug is null or slug = '';

create index if not exists media_assets_slug_idx on media_assets (slug);
create index if not exists media_assets_meta_tags_gin_idx on media_assets using gin (meta_tags);
