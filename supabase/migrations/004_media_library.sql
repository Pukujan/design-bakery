-- Admin media library (uploads + metadata for gallery / OCR naming)
create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  filename text not null default '',
  storage_path text not null,
  url text not null,
  content_type text not null default 'image/png',
  byte_size integer,
  alt_text text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_assets_created_at_idx on media_assets (created_at desc);

alter table media_assets enable row level security;

-- Public read for hotlinking in CMS / blog content (anon key)
create policy "media_assets_public_read" on media_assets
  for select using (true);

-- Writes via service_role API only (same pattern as agent tables)
create policy "media_assets_admin_write" on media_assets
  for all using (auth.role() = 'authenticated');
