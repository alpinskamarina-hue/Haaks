-- The feed shows only fresh jobs (Nasim, 2026-11-05):
--   permits and private jobs: the last 7 days;
--   tenders: until the closing date (expires_at), else 30 days;
--   company jobs: until they expire (expires_at), else 30 days.
-- Older rows stay in the table and are deleted by the collector after 30 days.

-- Tenders already in the feed get their closing date from timing ("inschrijven tot YYYY-MM-DD").
update public.feed_items
set expires_at = (substring(timing from '(\d{4}-\d{2}-\d{2})')::date + 1)::timestamp at time zone 'Europe/Amsterdam'
where kind = 'tender' and expires_at is null and timing ~ '\d{4}-\d{2}-\d{2}';

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
      and case
        when f.kind in ('permit', 'private') then coalesce(f.published_at, now() - f.demo_age) > now() - interval '7 days'
        when f.expires_at is not null then true
        else coalesce(f.published_at, now() - f.demo_age) > now() - interval '30 days'
      end
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
