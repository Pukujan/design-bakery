-- The per-visitor song limit (TASK-DB-0160) also counts the visitor's address, so a new visitor pass (cleared site data,
-- another browser) does not reset it. `ip` is an HMAC of the address, never the address. Apply with scripts/octo-query.mjs.

alter table public.copilot_songs add column if not exists ip text check (char_length(ip) <= 64);
create index if not exists copilot_songs_ip_idx on public.copilot_songs (ip, created_at desc);
