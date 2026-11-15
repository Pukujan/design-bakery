-- The copilot's spoken replies outside a call (TASK-DB-0165). Every reply the chat speaks is synthesised once by the shared
-- speech gateway (our own voice on the Pro) and kept as a public Octo file, keyed by a hash of its words, so the same words
-- play at once for every later visitor. Page-button summaries ("Summarise this for me." on a page) are kept too, so a
-- summary is the same words, and so the same saved clip, for everyone. Apply to the Octo workspace with scripts/octo-query.mjs.

create table if not exists public.copilot_speech (
  id text primary key check (id ~ '^[0-9a-f]{32}$'),
  words text not null check (char_length(words) <= 1200),
  audio_url text not null check (char_length(audio_url) <= 300),
  bytes integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.copilot_summaries (
  key text primary key check (char_length(key) <= 300),
  reply text not null check (char_length(reply) <= 20000),
  created_at timestamptz not null default now()
);
