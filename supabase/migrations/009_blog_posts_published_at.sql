-- Hidden sort timestamp for blog list order (newest first). Display date stays in `date` text.
alter table blog_posts
  add column if not exists published_at timestamptz;

update blog_posts
set published_at = coalesce(published_at, created_at)
where published_at is null;

create index if not exists blog_posts_published_at_idx
  on blog_posts (published_at desc nulls last);
