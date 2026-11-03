-- Test jobs from real sources (Rotterdam building permits, TenderNed) that only one account sees
-- until the owner decides to open them to everyone. NULL = everyone (as before).
alter table public.feed_items add column if not exists visible_to uuid references auth.users on delete cascade;

create or replace function public.feed_for_me()
returns table (
  id uuid,
  source text,
  source_name text,
  source_url text,
  kind text,
  title text,
  summary text,
  translations jsonb,
  trades text[],
  city text,
  timing text,
  budget text,
  contact text,
  published_at timestamptz,
  is_demo boolean,
  locked boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select coalesce((select p.plan from public.profiles p where p.id = auth.uid()), 'free') = 'pro' as pro
  ),
  items as (
    select f.*, coalesce(f.published_at, now() - f.demo_age) as published
    from public.feed_items f
    where auth.uid() is not null
      and (f.visible_to is null or f.visible_to = auth.uid())
      and (f.expires_at is null or f.expires_at > now())
      and coalesce(f.published_at, now() - f.demo_age) > now() - interval '30 days'
  )
  select
    i.id,
    case when l.locked then null else i.source end,
    case when l.locked then null else i.source_name end,
    case when me.pro then i.source_url end,
    i.kind,
    case when l.locked then null else i.title end,
    case when l.locked then null else i.summary end,
    case when l.locked then '{}'::jsonb else i.translations end,
    i.trades,
    i.city,
    case when l.locked then null else i.timing end,
    case when l.locked then null else i.budget end,
    case when me.pro then i.contact end,
    i.published,
    i.is_demo,
    l.locked
  from items i
  cross join me
  cross join lateral (select not me.pro and i.published > now() - interval '24 hours' as locked) l
  order by i.published desc
  limit 300;
$$;
