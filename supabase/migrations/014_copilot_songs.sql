-- Songs the copilot made on the owner's Flow Music plan (TASK-DB-0160). The audio stays in the song maker's volume
-- (music-agent/); this row is the cache (a repeat request with the same key costs nothing) and the daily count the
-- per-visitor and site-wide limits read. `visitor` is an HMAC of the visitor pass, never the pass itself.
-- Apply to the Octo workspace with scripts/octo-query.mjs.

create table if not exists public.copilot_songs (
  id text primary key check (id ~ '^[0-9a-f]{16}$'),
  key text not null check (key ~ '^[0-9a-f]{64}$'),
  visitor text not null check (char_length(visitor) <= 64),
  prompt text not null check (char_length(prompt) <= 1200),
  state text not null default 'making' check (state in ('making', 'done', 'failed')),
  title text check (char_length(title) <= 120),
  lyrics text check (char_length(lyrics) <= 6000),
  seconds real,
  error text check (char_length(error) <= 300),
  created_at timestamptz not null default now(),
  done_at timestamptz
);
create index if not exists copilot_songs_key_idx on public.copilot_songs (key) where state = 'done';
create index if not exists copilot_songs_created_idx on public.copilot_songs (created_at desc);

alter table public.copilot_songs enable row level security;
revoke all on public.copilot_songs from public;
