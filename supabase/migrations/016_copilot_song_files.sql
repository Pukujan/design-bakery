-- Song audio in Octo's file storage (TASK-DB-0160): once a song is done the API copies each take from the song maker's
-- volume to a public Octo file and keeps its URL here, so the player loads it from files.design-bakery.com and the
-- song outlives the VPS volume. Null until copied. Apply to the Octo workspace with scripts/octo-query.mjs.

alter table public.copilot_songs add column if not exists audio_url text check (char_length(audio_url) <= 300);
alter table public.copilot_songs add column if not exists audio2_url text check (char_length(audio2_url) <= 300);
