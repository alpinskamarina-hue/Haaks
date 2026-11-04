-- Plans Free, Pro and Ultra (Nasim, 2026-11-04). Spec: Claude Doc «Тарифы Haaks: Free, Pro и Ultra».
-- profiles.plan is the plan; plan_until ends it (7-day Ultra trial now, paid periods later).
-- plan_of() is the plan in force right now; every check uses it, so an ended trial needs no job.

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('free', 'pro', 'ultra'));
alter table public.profiles add column if not exists plan_until timestamptz;
alter table public.profiles add column if not exists trial_started_at timestamptz;
alter table public.profiles add column if not exists founder_at timestamptz;

create or replace function public.plan_of(p_plan text, p_until timestamptz)
returns text
language sql
stable
set search_path = ''
as $$
  select case when p_plan in ('pro', 'ultra') and (p_until is null or p_until > now()) then p_plan else 'free' end;
$$;

-- Plan of the signed-in person.
create or replace function public.my_plan()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select public.plan_of(p.plan, p.plan_until) from public.profiles p where p.id = auth.uid()), 'free');
$$;
grant execute on function public.my_plan() to authenticated;

-- Plan fields are set by Haaks only: the server account, or Haaks functions that switch
-- haaks.plan_change on for their own transaction (start_ultra_trial).
create or replace function public.protect_profile_plan()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_haaks_server() then
    if tg_op = 'INSERT' then
      new.plan := 'free';
      new.plan_until := null;
      new.trial_started_at := null;
      new.founder_at := null;
      new.telegram_chat_id := null;
      new.company_verified := false;
      new.is_admin := false;
    else
      if coalesce(current_setting('haaks.plan_change', true), '') <> 'on' and (
        new.plan is distinct from old.plan
        or new.plan_until is distinct from old.plan_until
        or new.trial_started_at is distinct from old.trial_started_at
        or new.founder_at is distinct from old.founder_at
      ) then
        raise exception 'The plan is changed by Haaks only';
      end if;
      if new.telegram_chat_id is not null and new.telegram_chat_id is distinct from old.telegram_chat_id then
        raise exception 'Telegram is linked by the Haaks bot only';
      end if;
      if new.company_verified is distinct from old.company_verified or new.is_admin is distinct from old.is_admin then
        raise exception 'Set by Haaks only';
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- 7 days of Ultra, once per account, without a card. Only for builders on Free.
create or replace function public.start_ultra_trial()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  me public.profiles;
  ends timestamptz := now() + interval '7 days';
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  select * into me from public.profiles where id = auth.uid() for update;
  if me.account_type is distinct from 'worker' then
    raise exception 'only builders';
  end if;
  if me.trial_started_at is not null then
    raise exception 'trial_used';
  end if;
  if public.plan_of(me.plan, me.plan_until) <> 'free' then
    raise exception 'already_paid';
  end if;
  perform set_config('haaks.plan_change', 'on', true);
  update public.profiles set plan = 'ultra', plan_until = ends, trial_started_at = now() where id = auth.uid();
  perform set_config('haaks.plan_change', 'off', true);
  return ends;
end;
$$;
grant execute on function public.start_ultra_trial() to authenticated;

-- Founder price: Pro 19 € and Ultra 59 € for life, for whoever pays in the first month after
-- payments open, or until 100 founders, whichever comes first. payments_from stays empty until
-- payments are switched on.
create table if not exists public.pricing_settings (
  id boolean primary key default true check (id),
  payments_from timestamptz,
  founder_days int not null default 30,
  founder_limit int not null default 100
);
insert into public.pricing_settings (id) values (true) on conflict do nothing;
alter table public.pricing_settings enable row level security;

create or replace function public.founder_offer()
returns table (open boolean, ends_at timestamptz, founders int, places_left int, founder_limit int)
language sql
stable
security definer
set search_path = ''
as $$
  with s as (select * from public.pricing_settings where id),
  f as (select count(*)::int as n from public.profiles where founder_at is not null)
  select
    s.payments_from is not null and now() < s.payments_from + make_interval(days => s.founder_days) and f.n < s.founder_limit,
    case when s.payments_from is not null then s.payments_from + make_interval(days => s.founder_days) end,
    f.n,
    greatest(0, s.founder_limit - f.n),
    s.founder_limit
  from s, f;
$$;
grant execute on function public.founder_offer() to anon, authenticated;

-- Limits per plan. null = no limit.
--   job_reply, profile_view: Free 3 per 24 hours; Pro and Ultra no limit.
--   ai: Free 3, Pro 20, Ultra 300 (fair use) per 30 days.
create or replace function public.plan_limit(p_feature text, p_plan text)
returns table (uses_limit int, period interval)
language sql
stable
set search_path = ''
as $$
  select
    case
      when p_feature = 'ai' then case p_plan when 'ultra' then 300 when 'pro' then 20 else public.free_limit() end
      when p_plan = 'free' then public.free_limit()
    end,
    case when p_feature = 'ai' then interval '30 days' else interval '24 hours' end;
$$;

-- What is left of one function for the signed-in person. uses_limit null = no limit.
create or replace function public.plan_uses_left(p_feature text)
returns table (uses_left int, uses_limit int, next_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  with l as (select * from public.plan_limit(p_feature, public.my_plan())),
  recent as (
    select u.created_at from public.free_uses u, l
    where u.user_id = auth.uid() and u.feature = p_feature and u.created_at > now() - l.period
  )
  select
    case when l.uses_limit is null then 999 else greatest(0, l.uses_limit - (select count(*)::int from recent)) end,
    l.uses_limit,
    case when l.uses_limit is null or (select count(*) from recent) < l.uses_limit then null
      else (select min(created_at) from recent) + l.period end
  from l;
$$;
grant execute on function public.plan_uses_left(text) to authenticated;

create or replace function public.free_uses_left(p_feature text)
returns table (uses_left integer, next_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select x.uses_left, x.next_at from public.plan_uses_left(p_feature) x;
$$;

create or replace function public.use_free(p_feature text, p_ref text default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  used int;
  lim int;
  win interval;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if p_feature not in ('job_reply', 'profile_view', 'ai') then
    raise exception 'unknown feature';
  end if;
  select l.uses_limit, l.period into lim, win from public.plan_limit(p_feature, public.my_plan()) l;
  if lim is null then
    return 999;
  end if;
  perform pg_advisory_xact_lock(hashtext('free:' || auth.uid()::text));
  select count(*)::int into used from public.free_uses
  where user_id = auth.uid() and feature = p_feature and created_at > now() - win;
  if p_ref is not null and exists (
    select 1 from public.free_uses
    where user_id = auth.uid() and feature = p_feature and ref = p_ref and created_at > now() - win
  ) then
    return greatest(0, lim - used);
  end if;
  if used >= lim then
    raise exception 'free_limit';
  end if;
  insert into public.free_uses (user_id, feature, ref) values (auth.uid(), p_feature, left(p_ref, 100));
  return lim - used - 1;
end;
$$;

create or replace function public.feed_for_me()
returns table (id uuid, source text, source_name text, source_url text, kind text, title text, summary text, translations jsonb, trades text[], city text, timing text, budget text, contact text, published_at timestamptz, is_demo boolean, locked boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select public.my_plan() <> 'free' as pro
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

create or replace function public.reply_to_job(p_item uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me public.profiles;
  job public.company_jobs;
  reply_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  select * into me from public.profiles where id = auth.uid();
  if me.account_type is distinct from 'worker' then
    raise exception 'only builders reply';
  end if;
  select * into job from public.company_jobs
  where feed_item_id = p_item and status = 'published' and (expires_at is null or expires_at > now());
  if job.id is null then
    raise exception 'job_closed';
  end if;
  if job.company_id = auth.uid() then
    raise exception 'own_job';
  end if;
  if not (
    public.plan_of(me.plan, me.plan_until) <> 'free'
    or exists (select 1 from public.feed_unlocks u where u.user_id = auth.uid() and u.item_id = p_item)
    or job.published_at < now() - interval '24 hours'
  ) then
    raise exception 'card_locked';
  end if;
  select id into reply_id from public.job_replies where job_id = job.id and worker_id = auth.uid();
  if reply_id is not null then
    return reply_id;
  end if;
  perform public.use_free('job_reply', p_item::text);
  insert into public.job_replies (job_id, worker_id) values (job.id, auth.uid())
  on conflict (job_id, worker_id) do nothing
  returning id into reply_id;
  if reply_id is null then
    select id into reply_id from public.job_replies where job_id = job.id and worker_id = auth.uid();
  end if;
  return reply_id;
end;
$$;
