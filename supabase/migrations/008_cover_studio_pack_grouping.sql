-- Cover Studio: group nine exports per generation under one pack card
alter table cover_studio_assets
  add column if not exists pack_id uuid,
  add column if not exists pack_title text;

create index if not exists cover_studio_assets_pack_id_idx on cover_studio_assets (pack_id);
