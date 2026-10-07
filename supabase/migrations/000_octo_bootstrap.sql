-- design-bakery — bootstrap for the Octo-provisioned workspace database.
--
-- The 001–010 migrations were written for Supabase, which pre-installs an `auth`
-- schema and its helper functions in every project database. Octo's provisioned
-- database is plain PostgreSQL, so those helpers are absent and four policies
-- (`*_admin_write`) fail to create without them.
--
-- This file defines just the helpers the migrations reference. It does NOT create
-- the `anon` / `authenticated` roles: they are cluster-wide objects and the
-- workspace role is NOCREATEROLE by design. They are not needed — `auth.role()`
-- is only ever called as a text comparison inside a policy expression.
--
-- The backend connects as the workspace role, which OWNS these tables, so RLS is
-- bypassed for it exactly as `service_role` bypasses RLS on Supabase. The
-- policies below are therefore inert for the application; they are kept so the
-- migration files apply unchanged and a future non-owner reader role is fenced.
--
-- Apply this file BEFORE 001_initial.sql.

create schema if not exists auth;

-- Mirrors Supabase's auth.role(): reads the role claim a PostgREST-style caller
-- would set. With no such caller it returns 'anon', so the admin-write policies
-- simply never match — the intended outcome for a database with no end-user auth.
create or replace function auth.role() returns text
language sql stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon');
$$;

create or replace function auth.uid() returns uuid
language sql stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
