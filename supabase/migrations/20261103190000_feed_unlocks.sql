-- Free plan: a worker can open 3 cards per 24 hours; the next ones open 24 hours after the
-- earliest of those 3. An opened card shows everything a Pro
-- worker sees (text at once, contact, link to the source, "Reply"). The limit lives here,
-- not in the page, so it cannot be skipped.
create table if not exists public.feed_unlocks (
  user_id uuid not null references auth.users on delete cascade,
  item_id uuid not null references public.feed_items on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.feed_unlocks enable row level security;
-- Workers only read their own; cards are opened through unlock_feed_item().
create policy "own feed unlocks" on public.feed_unlocks
  for select using (auth.uid() = user_id);

-- How many cards a free worker may open within 24 hours.
create or replace function public.feed_unlock_limit()
returns int
language sql
immutable
as $$ select 3 $$;

create or replace function public.feed_unlocks_used()
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int
  from public.feed_unlocks u
  where u.user_id = auth.uid()
    and u.created_at > now() - interval '24 hours';
$$;

-- Opens one card. Returns how many are left; raises 'feed_unlock_limit' when nothing is left.
create or replace function public.unlock_feed_item(p_item uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  used int;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if exists (select 1 from public.feed_unlocks where user_id = auth.uid() and item_id = p_item) then
    return public.feed_unlock_limit() - public.feed_unlocks_used();
  end if;
  if not exists (select 1 from public.feed_items where id = p_item) then
    raise exception 'unknown job';
  end if;
  -- One open at a time per worker, so two quick taps cannot pass the limit.
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  used := public.feed_unlocks_used();
  if used >= public.feed_unlock_limit() then
    raise exception 'feed_unlock_limit';
  end if;
  insert into public.feed_unlocks (user_id, item_id) values (auth.uid(), p_item) on conflict do nothing;
  return public.feed_unlock_limit() - used - 1;
end;
$$;

revoke execute on function public.feed_unlocks_used() from public, anon;
grant execute on function public.feed_unlocks_used() to authenticated;
revoke execute on function public.unlock_feed_item(uuid) from public, anon;
grant execute on function public.unlock_feed_item(uuid) to authenticated;

-- Same as before, but an opened card is shown in full, like for Pro.
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
    select f.*, coalesce(f.published_at, now() - f.demo_age) as published,
      exists (select 1 from public.feed_unlocks u where u.user_id = auth.uid() and u.item_id = f.id) as opened
    from public.feed_items f
    where auth.uid() is not null
      and (f.expires_at is null or f.expires_at > now())
      and coalesce(f.published_at, now() - f.demo_age) > now() - interval '30 days'
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
  limit 300;
$$;
