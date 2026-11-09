-- Flow Music makes two takes of every song (TASK-DB-0160); the song maker saves both and the player switches between them.
-- `takes` is how many were saved (1 for songs made before this). Apply to the Octo workspace with scripts/octo-query.mjs.

alter table public.copilot_songs add column if not exists takes smallint not null default 1 check (takes between 1 and 2);
