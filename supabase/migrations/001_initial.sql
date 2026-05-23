-- design-bakery — Supabase / PostgreSQL schema (Phase 3+)
-- Run in Supabase Dashboard → SQL Editor after creating project.
-- Supabase IS PostgreSQL — these are normal tables, not a separate product.

-- ── CMS documents (mirrors Firestore collection/data pattern) ──
create table if not exists cms_documents (
  portfolio_id text not null default 'default',
  collection_name text not null,
  document_id text not null default 'data',
  payload jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (portfolio_id, collection_name, document_id)
);

create index if not exists cms_documents_collection_idx
  on cms_documents (collection_name);

-- ── Blog posts ──
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  legacy_doc_id text unique,
  numeric_id integer unique not null,
  title text not null default '',
  excerpt text not null default '',
  content text not null default '',
  tags jsonb not null default '[]',
  category text not null default '',
  author text not null default '',
  color text,
  date text,
  read_time text,
  cover_image_url text,
  thumbnail_image_url text,
  seo jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_numeric_id_idx on blog_posts (numeric_id desc);

-- ── Agent quota + audit (backend only) ──
create table if not exists agent_usage (
  user_id uuid primary key,
  date_key text not null,
  calls integer not null default 0,
  tokens integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists agent_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text,
  blog_id integer,
  model text,
  usage jsonb,
  created_at timestamptz not null default now()
);

-- ── RLS (adjust before production) ──
alter table cms_documents enable row level security;
alter table blog_posts enable row level security;
alter table agent_usage enable row level security;
alter table agent_audit enable row level security;

-- Public read for published site (anon key)
create policy "blog_posts_public_read" on blog_posts
  for select using (true);

create policy "cms_documents_public_read" on cms_documents
  for select using (true);

-- Authenticated admin write (Phase 2 — after Supabase Auth)
create policy "blog_posts_admin_write" on blog_posts
  for all using (auth.role() = 'authenticated');

create policy "cms_documents_admin_write" on cms_documents
  for all using (auth.role() = 'authenticated');

-- Agent tables: no anon access (API uses service_role)
-- (service_role bypasses RLS)
