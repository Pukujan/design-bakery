-- Cover Studio tool library (separate from site media_assets)
create table if not exists cover_studio_assets (
  id uuid primary key default gen_random_uuid(),
  filename text not null default '',
  slug text,
  meta_tags jsonb not null default '[]'::jsonb,
  storage_path text not null,
  url text not null,
  content_type text not null default 'image/png',
  byte_size integer,
  alt_text text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cover_studio_assets_created_at_idx on cover_studio_assets (created_at desc);
create index if not exists cover_studio_assets_meta_tags_gin on cover_studio_assets using gin (meta_tags);

alter table cover_studio_assets enable row level security;

create policy "cover_studio_assets_public_read" on cover_studio_assets
  for select using (true);

create policy "cover_studio_assets_admin_write" on cover_studio_assets
  for all using (auth.role() = 'authenticated');
