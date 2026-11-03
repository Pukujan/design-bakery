-- AI Pujan's daily news list (TASK-DB-0128): filtered AI and tech stories the copilot
-- may mention in small talk. Apply to the Octo workspace with scripts/octo-query.mjs
-- (a write key; needs the owner's approval). The API reads and writes it through the
-- workspace role, so RLS stays on with no public policy.

create table if not exists public.copilot_news (
  id text primary key check (id ~ '^[0-9a-f]{32}$'),
  title text not null check (char_length(title) <= 200),
  summary text not null check (char_length(summary) <= 240),
  url text not null check (url ~ '^https?://'),
  source text not null check (char_length(source) <= 60),
  first_party boolean not null default false,
  item_date date not null,
  fetched_at timestamptz not null default now()
);
create index if not exists copilot_news_fetched_idx on public.copilot_news (fetched_at desc);

alter table public.copilot_news enable row level security;
revoke all on public.copilot_news from public;
