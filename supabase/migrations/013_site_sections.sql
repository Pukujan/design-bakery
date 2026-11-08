-- The copilot's index of page sections (TASK-DB-0142). One row per section indexed in Octo's RAG
-- (document title `site:<path>#<anchor>`), so a search hit maps by document id to the page move
-- {path, anchor, heading}, the sync diffs the site against what is indexed, and lists and counts
-- can be answered from rows instead of search. Octo's RAG documents carry only a title, so this
-- is where the metadata lives. Written by scripts/sync-copilot-rag.mjs; read by the API through
-- the workspace role (RLS on, no public policy). Apply with scripts/octo-query.mjs.

create table if not exists public.site_sections (
  path text not null check (path ~ '^/'),
  -- '' for a page indexed whole (/contact), so the pair stays unique.
  anchor text not null default '',
  heading text not null default '',
  kind text not null check (kind in ('project', 'paper', 'post', 'experience', 'about', 'skills', 'contact')),
  item_title text not null,
  content_hash text not null,
  octo_document_id text,
  updated_at timestamptz not null default now(),
  primary key (path, anchor)
);
create unique index if not exists site_sections_document_idx on public.site_sections (octo_document_id) where octo_document_id is not null;
create index if not exists site_sections_kind_idx on public.site_sections (kind);

alter table public.site_sections enable row level security;
revoke all on public.site_sections from public;
