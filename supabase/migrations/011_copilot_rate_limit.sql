-- Design Bakery copilot: durable rolling limits in the Octo workspace database.
-- Apply using the workspace's SQL API with a key that has write scope. No raw IP
-- addresses or visitor identifiers are stored: the API supplies keyed HMACs.

create table if not exists public.copilot_rate_events (
  id bigint generated always as identity primary key,
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  visitor_hash text not null check (visitor_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists copilot_rate_events_ip_time_idx
  on public.copilot_rate_events (ip_hash, created_at);
create index if not exists copilot_rate_events_visitor_time_idx
  on public.copilot_rate_events (visitor_hash, created_at);
create index if not exists copilot_rate_events_time_idx
  on public.copilot_rate_events (created_at);

alter table public.copilot_rate_events enable row level security;
revoke all on public.copilot_rate_events from public;

-- One call is one transaction. Taking both locks in numeric order avoids
-- deadlocks and serializes calls that share either IP or visitor across replicas.
-- This function is VOLATILE: its queries use fresh READ COMMITTED snapshots after
-- any lock wait. Octo executes a parameterized call as one autocommit statement.
create or replace function public.copilot_take_rate_slot(p_ip_hash text, p_visitor_hash text)
returns table (allowed boolean, retry_at timestamptz)
language plpgsql volatile security invoker
as $$
declare
  v_ip_lock bigint;
  v_visitor_lock bigint;
  v_now timestamptz;
  v_counts record;
  v_retry timestamptz;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$'
     or p_visitor_hash is null or p_visitor_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid copilot limiter identifier';
  end if;

  v_ip_lock := hashtextextended('copilot:ip:' || p_ip_hash, 0);
  v_visitor_lock := hashtextextended('copilot:visitor:' || p_visitor_hash, 0);
  perform pg_advisory_xact_lock(least(v_ip_lock, v_visitor_lock));
  if v_ip_lock <> v_visitor_lock then
    perform pg_advisory_xact_lock(greatest(v_ip_lock, v_visitor_lock));
  end if;
  v_now := clock_timestamp();

  select
    count(*) filter (where ip_hash = p_ip_hash and created_at > v_now - interval '2 hours') as ip_2h,
    count(*) filter (where ip_hash = p_ip_hash and created_at > v_now - interval '10 hours') as ip_10h,
    count(*) filter (where ip_hash = p_ip_hash) as ip_4d,
    count(*) filter (where visitor_hash = p_visitor_hash and created_at > v_now - interval '2 hours') as visitor_2h,
    count(*) filter (where visitor_hash = p_visitor_hash and created_at > v_now - interval '10 hours') as visitor_10h,
    count(*) filter (where visitor_hash = p_visitor_hash) as visitor_4d,
    min(created_at) filter (where ip_hash = p_ip_hash and created_at > v_now - interval '2 hours') as ip_first_2h,
    min(created_at) filter (where ip_hash = p_ip_hash and created_at > v_now - interval '10 hours') as ip_first_10h,
    min(created_at) filter (where ip_hash = p_ip_hash) as ip_first_4d,
    min(created_at) filter (where visitor_hash = p_visitor_hash and created_at > v_now - interval '2 hours') as visitor_first_2h,
    min(created_at) filter (where visitor_hash = p_visitor_hash and created_at > v_now - interval '10 hours') as visitor_first_10h,
    min(created_at) filter (where visitor_hash = p_visitor_hash) as visitor_first_4d
  into v_counts
  from public.copilot_rate_events
  where created_at > v_now - interval '4 days'
    and (ip_hash = p_ip_hash or visitor_hash = p_visitor_hash);

  if v_counts.ip_2h >= 50 then v_retry := greatest(v_retry, v_counts.ip_first_2h + interval '2 hours'); end if;
  if v_counts.ip_10h >= 100 then v_retry := greatest(v_retry, v_counts.ip_first_10h + interval '10 hours'); end if;
  if v_counts.ip_4d >= 200 then v_retry := greatest(v_retry, v_counts.ip_first_4d + interval '4 days'); end if;
  if v_counts.visitor_2h >= 50 then v_retry := greatest(v_retry, v_counts.visitor_first_2h + interval '2 hours'); end if;
  if v_counts.visitor_10h >= 100 then v_retry := greatest(v_retry, v_counts.visitor_first_10h + interval '10 hours'); end if;
  if v_counts.visitor_4d >= 200 then v_retry := greatest(v_retry, v_counts.visitor_first_4d + interval '4 days'); end if;
  if v_retry is not null then
    return query select false, v_retry;
    return;
  end if;

  insert into public.copilot_rate_events (ip_hash, visitor_hash, created_at)
    values (p_ip_hash, p_visitor_hash, v_now);

  -- Retain at least the full four-day window. A small random share of admitted
  -- requests removes expired rows without a dedicated background process.
  if random() < 0.01 then
    delete from public.copilot_rate_events where id in (
      select id from public.copilot_rate_events
      where created_at <= v_now - interval '4 days'
      order by created_at limit 1000 for update skip locked
    );
  end if;
  return query select true, null::timestamptz;
end;
$$;

revoke all on function public.copilot_take_rate_slot(text, text) from public;
