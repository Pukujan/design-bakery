-- Agent publishing tokens and draft visibility (TASK-DB-0060 Slice B).
--
-- agent_tokens: bearer tokens for the agent publishing API. Only the SHA-256 of
-- a random 32-byte token is stored; the plaintext never lands in the database.
-- Issuance and revocation are manual owner operations through the Supabase
-- dashboard: insert a row whose token_hash is the hex SHA-256 of the token.

create table if not exists agent_tokens (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  token_hash text not null unique,
  created_at timestamptz not null default now()
);

alter table agent_tokens enable row level security;
-- Deliberately no policies: the anon and authenticated roles cannot read this
-- table at all. The API reaches it with service_role, which bypasses RLS.

-- Draft visibility. published_at is the draft/published switch, and the anon key
-- is what the public site and the sitemap generator read blog_posts with, so the
-- rule belongs in RLS: an unpublished row is invisible to the public. The backend
-- uses service_role and filters drafts explicitly instead.
drop policy if exists "blog_posts_public_read" on blog_posts;
create policy "blog_posts_public_read" on blog_posts
  for select using (published_at is not null);
