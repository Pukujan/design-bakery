-- Cover Studio: track which social format each export belongs to
alter table cover_studio_assets
  add column if not exists format_id text,
  add column if not exists platform text;

create index if not exists cover_studio_assets_format_id_idx on cover_studio_assets (format_id);
