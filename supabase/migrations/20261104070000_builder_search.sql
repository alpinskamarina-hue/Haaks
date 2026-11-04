-- Builder search (Nasim, 2026-11-04): find profiles by @nick, name, trade or town.
-- Only builders who switched on "show me in search" (and have a nick and a live passport) are found.
-- Opening a found profile counts toward the free limit (use_free('profile_view')), done by the app.
alter table public.profiles add column if not exists in_search boolean not null default false;

create or replace function public.search_builders(p_query text, p_trades text[] default '{}', p_trade text default null)
returns table (
  username text,
  full_name text,
  avatar_path text,
  trades text[],
  city text,
  works int,
  reviews int,
  avg_stars numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  with q as (
    select nullif(lower(trim(both '@ ' from coalesce(p_query, ''))), '') as t
  )
  select p.username, p.full_name, p.avatar_path, p.trades, p.city,
    (select count(*)::int from public.works w where w.user_id = p.id),
    (select count(*)::int from public.reviews r
      where r.worker_id = p.id and r.status = 'submitted' and not r.held and r.publish_at <= now()),
    (select round(avg(r.stars)::numeric, 1) from public.reviews r
      where r.worker_id = p.id and r.status = 'submitted' and not r.held and r.publish_at <= now())
  from public.profiles p, q
  where auth.uid() is not null
    and p.in_search
    and p.passport_enabled
    and p.username is not null
    and coalesce(p.account_type, 'worker') = 'worker'
    and (
      q.t is null
      or p.username like '%' || q.t || '%'
      or lower(coalesce(p.full_name, '')) like '%' || q.t || '%'
      or lower(coalesce(p.city, '')) like '%' || q.t || '%'
      or p.trades && coalesce(p_trades, '{}')
    )
    and (p_trade is null or p_trade = any(p.trades))
  order by (q.t is not null and p.username = q.t) desc, p.created_at desc
  limit 30;
$$;

revoke execute on function public.search_builders(text, text[], text) from public, anon;
grant execute on function public.search_builders(text, text[], text) to authenticated;
