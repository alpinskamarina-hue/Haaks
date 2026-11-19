-- Own site analytics for the admin page «Аналитика»: no cookies, no IP or names.
-- A visitor is a daily hash (IP + browser + date + secret) made on the server, so the same
-- person cannot be followed from one day to the next.
create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  path text not null,
  visitor text not null,
  entry boolean not null default false,
  source text,
  ref_host text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  first_source text,
  first_campaign text,
  country text,
  lang text,
  device text,
  user_id uuid references auth.users (id) on delete set null
);
create index if not exists page_views_at on public.page_views (at);
create index if not exists page_views_user on public.page_views (user_id, at) where user_id is not null;
alter table public.page_views enable row level security;
revoke all on public.page_views from anon, authenticated;

-- Called by /api/t (the site's own tracker). The signed-in worker is taken from the session.
create or replace function public.track_view(p jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t text := left(coalesce(p->>'path', ''), 200);
begin
  if t = '' or left(t, 1) <> '/' or coalesce(p->>'visitor', '') !~ '^[0-9a-f]{16}$' then
    return;
  end if;
  insert into page_views (path, visitor, entry, source, ref_host, utm_source, utm_medium, utm_campaign, first_source, first_campaign, country, lang, device, user_id)
  values (
    t,
    p->>'visitor',
    coalesce((p->>'entry')::boolean, false),
    left(p->>'source', 40),
    left(p->>'ref_host', 120),
    left(p->>'utm_source', 60),
    left(p->>'utm_medium', 60),
    left(p->>'utm_campaign', 80),
    left(p->>'first_source', 40),
    left(p->>'first_campaign', 80),
    left(p->>'country', 2),
    left(p->>'lang', 5),
    left(p->>'device', 10),
    auth.uid()
  );
end;
$$;
revoke all on function public.track_view(jsonb) from public;
grant execute on function public.track_view(jsonb) to anon, authenticated;

-- Everything the admin page shows, for one period. Only for Haaks admins.
create or replace function public.admin_analytics(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  len interval := p_to - p_from;
  result jsonb;
begin
  if not exists (select 1 from profiles where id = auth.uid() and is_admin) then
    raise exception 'not allowed';
  end if;

  with v as (
    select * from page_views where at >= p_from and at < p_to
  ),
  pv as (
    select * from page_views where at >= p_from - len and at < p_from
  ),
  site as (
    select * from v where path not like '/dashboard%' and path not like '/company%'
  ),
  newp as (
    select p.*,
      (select coalesce(w.first_source, w.source) from page_views w where w.user_id = p.id order by w.at limit 1) as src,
      (select w.first_campaign from page_views w where w.user_id = p.id and w.first_campaign is not null order by w.at limit 1) as camp
    from profiles p where p.created_at >= p_from and p.created_at < p_to
  )
  select jsonb_build_object(
    'visitors', (select count(distinct visitor || at::date) from v),
    'visitors_prev', (select count(distinct visitor || at::date) from pv),
    'views', (select count(*) from site),
    'views_prev', (select count(*) from pv where path not like '/dashboard%' and path not like '/company%'),
    'signups', (select count(*) from newp),
    'signups_prev', (select count(*) from profiles where created_at >= p_from - len and created_at < p_from),
    'live', (select count(distinct visitor) from page_views where at > now() - interval '5 minutes'),
    'live_list', coalesce((select jsonb_agg(x) from (
        select distinct on (visitor) country, path, at from page_views where at > now() - interval '5 minutes' order by visitor, at desc limit 8
      ) x), '[]'::jsonb),
    'days', coalesce((select jsonb_agg(d order by d.day) from (
        select g.day::date as day,
          (select count(distinct visitor) from v where (v.at at time zone 'Europe/Amsterdam')::date = g.day::date) as visitors,
          (select count(*) from newp where (newp.created_at at time zone 'Europe/Amsterdam')::date = g.day::date) as signups
        from generate_series((p_from at time zone 'Europe/Amsterdam')::date, ((p_to - interval '1 second') at time zone 'Europe/Amsterdam')::date, interval '1 day') g(day)
      ) d), '[]'::jsonb),
    'sources', coalesce((select jsonb_agg(s order by s.visitors desc) from (
        select a.source, a.visitors, (select count(*) from newp where coalesce(newp.src, 'direct') = a.source) as signups
        from (select coalesce(e.source, 'direct') as source, count(distinct e.visitor || e.at::date) as visitors from v e where e.entry group by 1) a
      ) s), '[]'::jsonb),
    'campaigns', coalesce((select jsonb_agg(c order by c.visitors desc) from (
        select a.campaign, a.visitors, (select count(*) from newp where newp.camp = a.campaign) as signups
        from (select e.utm_campaign as campaign, count(distinct e.visitor || e.at::date) as visitors from v e where e.entry and e.utm_campaign is not null group by 1 order by 2 desc limit 30) a
      ) c), '[]'::jsonb),
    'refs', coalesce((select jsonb_agg(r order by r.visitors desc) from (
        select ref_host, count(distinct visitor || at::date) as visitors from v where entry and ref_host is not null group by 1 order by 2 desc limit 15
      ) r), '[]'::jsonb),
    'countries', coalesce((select jsonb_agg(c order by c.visitors desc) from (
        select coalesce(country, '??') as country, count(distinct visitor || at::date) as visitors from v group by 1 order by 2 desc limit 12
      ) c), '[]'::jsonb),
    'langs', coalesce((select jsonb_agg(c order by c.visitors desc) from (
        select coalesce(lang, '??') as lang, count(distinct visitor || at::date) as visitors from v group by 1 order by 2 desc limit 12
      ) c), '[]'::jsonb),
    'devices', coalesce((select jsonb_agg(c order by c.visitors desc) from (
        select coalesce(device, '??') as device, count(distinct visitor || at::date) as visitors from v group by 1
      ) c), '[]'::jsonb),
    'pages', coalesce((select jsonb_agg(c order by c.views desc) from (
        select path, count(*) as views, count(distinct visitor || at::date) as visitors, count(*) filter (where entry) as entries
        from site group by 1 order by 2 desc limit 25
      ) c), '[]'::jsonb),
    'cabinet_pages', coalesce((select jsonb_agg(c order by c.views desc) from (
        select path, count(*) as views, count(distinct user_id) as users
        from v where path like '/dashboard%' group by 1 order by 2 desc limit 15
      ) c), '[]'::jsonb),
    'funnel', jsonb_build_object(
      'visitors', (select count(distinct visitor || at::date) from v),
      'signups', (select count(*) from newp),
      'profile', (select count(*) from newp where onboarded_at is not null),
      'first_doc', (select count(*) from newp where exists (select 1 from invoices i where i.user_id = newp.id) or exists (select 1 from quotes q where q.user_id = newp.id)),
      'trial', (select count(*) from newp where trial_started_at is not null),
      'paid', (select count(*) from newp where founder_at is not null)
    ),
    'actions', jsonb_build_object(
      'feed_opens', (select count(*) from v where path like '/dashboard/leads/feed%'),
      'replies', (select count(*) from job_replies where created_at >= p_from and created_at < p_to),
      'quotes', (select count(*) from quotes where created_at >= p_from and created_at < p_to),
      'invoices', (select count(*) from invoices where created_at >= p_from and created_at < p_to),
      'orders', (select count(*) from orders where created_at >= p_from and created_at < p_to),
      'staff', (select count(*) from staff_messages where role = 'user' and created_at >= p_from and created_at < p_to),
      'active_users', (select count(distinct user_id) from v where user_id is not null)
    ),
    'people', coalesce((select jsonb_agg(x order by x.created_at desc) from (
        select created_at, full_name, language, trades, city, plan, account_type, onboarded_at is not null as onboarded, src
        from newp order by created_at desc limit 50
      ) x), '[]'::jsonb),
    'total_users', (select count(*) from profiles),
    'people_langs', coalesce((select jsonb_agg(x order by x.n desc) from (
        select coalesce(language, '??') as lang, count(*) as n from profiles group by 1
      ) x), '[]'::jsonb),
    'people_trades', coalesce((select jsonb_agg(x order by x.n desc) from (
        select t as trade, count(*) as n from profiles, unnest(coalesce(trades, '{}')) t group by 1 order by 2 desc limit 15
      ) x), '[]'::jsonb),
    'people_cities', coalesce((select jsonb_agg(x order by x.n desc) from (
        select city, count(*) as n from profiles where city is not null and city <> '' group by 1 order by 2 desc limit 15
      ) x), '[]'::jsonb),
    'since', (select min(at) from page_views)
  ) into result;
  return result;
end;
$$;
revoke all on function public.admin_analytics(timestamptz, timestamptz) from public;
grant execute on function public.admin_analytics(timestamptz, timestamptz) to authenticated;
