-- Permits from every municipality in the Netherlands (Nasim, 2026-11-04).
-- The shared feed grows to thousands of jobs, so each worker now gets only the permits near them
-- from the database, instead of the newest 300 of the whole country.

-- Publications the collector read that were no building work: not read again.
create table if not exists public.feed_skipped (
  fingerprint text primary key,
  created_at timestamptz not null default now()
);
alter table public.feed_skipped enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'feed_skipped' and policyname = 'server manages skipped publications') then
    create policy "server manages skipped publications" on public.feed_skipped
      for all using (public.is_haaks_server()) with check (public.is_haaks_server());
  end if;
end $$;

-- Is the job close enough for this worker? Permits (kind 'permit') only: other jobs are few and
-- the page sorts them. Close = within the travel radius + 15 km, or in one of the worker's places.
-- A worker without any place set, or with radius 0 (whole country), sees all.
create or replace function public.feed_near(
  p_kind text, p_lat double precision, p_lng double precision, p_city text, p_region text,
  p_home_lat double precision, p_home_lng double precision, p_travel_km int, p_places text[]
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    p_kind <> 'permit'
    or p_travel_km = 0
    or (p_home_lat is null and coalesce(array_length(p_places, 1), 0) = 0)
    or lower(coalesce(p_city, '')) = any (p_places)
    or lower(coalesce(p_region, '')) = any (p_places)
    or (
      p_lat is not null and p_home_lat is not null
      and 111.2 * sqrt(power(p_lat - p_home_lat, 2) + power((p_lng - p_home_lng) * cos(radians(p_home_lat)), 2))
        <= coalesce(p_travel_km, 30) + 15
    );
$$;

create or replace function public.feed_for_me()
returns table (id uuid, source text, source_name text, source_url text, kind text, title text, summary text, translations jsonb, trades text[], city text, timing text, budget text, contact text, published_at timestamptz, is_demo boolean, locked boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select public.my_plan() <> 'free' as pro,
      p.home_lat, p.home_lng, p.travel_km,
      array_remove(array[lower(nullif(trim(p.city), ''))] || coalesce((select array_agg(lower(trim(c))) from unnest(p.extra_cities) c), '{}'), null) as places
    from (select 1) one
    left join public.profiles p on p.id = auth.uid()
  ),
  items as (
    select f.*, coalesce(f.published_at, now() - f.demo_age) as published,
      exists (select 1 from public.feed_unlocks u where u.user_id = auth.uid() and u.item_id = f.id) as opened
    from public.feed_items f, me
    where auth.uid() is not null
      and (f.expires_at is null or f.expires_at > now())
      and coalesce(f.published_at, now() - f.demo_age) > now() - interval '30 days'
      and public.feed_near(f.kind, f.lat, f.lng, f.city, f.region, me.home_lat, me.home_lng, me.travel_km, me.places)
  )
  select
    i.id,
    case when l.locked then null else i.source end,
    case when l.locked then null else i.source_name end,
    case when me.pro or i.opened then i.source_url end,
    i.kind,
    case when l.locked then null else i.title end,
    case when l.locked then null else i.summary end,
    case when l.locked then '{}'::jsonb else i.translations end,
    i.trades,
    i.city,
    case when l.locked then null else i.timing end,
    case when l.locked then null else i.budget end,
    case when me.pro or i.opened then i.contact end,
    i.published,
    i.is_demo,
    l.locked
  from items i
  cross join me
  cross join lateral (select not me.pro and not i.opened and i.published > now() - interval '24 hours' as locked) l
  order by i.published desc
  limit 500;
$$;

-- Places of the same jobs as feed_for_me (not of the whole country).
create or replace function public.feed_details()
returns table (id uuid, lat double precision, lng double precision, region text, added_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select f.id, f.lat, f.lng, f.region, f.created_at
  from public.feed_items f
  where f.id in (select m.id from public.feed_for_me() m);
$$;
revoke execute on function public.feed_details() from public, anon;
grant execute on function public.feed_details() to authenticated;

create index if not exists feed_items_published_idx on public.feed_items (published_at desc);
