-- Free plan (Nasim, 2026-11-04): functions that bring work or cost Haaks money can be used
-- 3 times per 24 hours, then the next use opens 24 hours after the earliest of those 3.
-- Pro has no limit. Own paperwork (profile, passport, quotes, invoices, orders) is not limited.
-- Feed cards keep their own counter (feed_unlocks); this one is for everything else:
--   job_reply    replying to a company job or a "need a helper" job
--   profile_view opening another builder's profile from search
--   ai           one AI call (reading a receipt or document, an AI quote draft, a lead analysis)
create table if not exists public.free_uses (
  id bigserial primary key,
  user_id uuid not null references auth.users on delete cascade,
  feature text not null check (feature in ('job_reply', 'profile_view', 'ai')),
  ref text check (char_length(ref) <= 100),
  created_at timestamptz not null default now()
);
create index if not exists free_uses_user_idx on public.free_uses (user_id, feature, created_at desc);

alter table public.free_uses enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'free_uses' and policyname = 'own free uses') then
    create policy "own free uses" on public.free_uses for select using (auth.uid() = user_id);
  end if;
end $$;

-- How many times a free account may use one function within 24 hours.
create or replace function public.free_limit()
returns int
language sql
immutable
as $$ select 3 $$;

-- What is left today for one function, and when the next use opens (null while some are left).
-- Pro: 999 left.
create or replace function public.free_uses_left(p_feature text)
returns table (uses_left int, next_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select coalesce((select p.plan from public.profiles p where p.id = auth.uid()), 'free') = 'pro' as pro
  ),
  recent as (
    select created_at from public.free_uses
    where user_id = auth.uid() and feature = p_feature and created_at > now() - interval '24 hours'
  )
  select
    case when me.pro then 999 else greatest(0, public.free_limit() - (select count(*)::int from recent)) end,
    case when me.pro or (select count(*) from recent) < public.free_limit() then null
      else (select min(created_at) from recent) + interval '24 hours' end
  from me;
$$;

-- Uses one function once. Returns how many are left; raises 'free_limit' when nothing is left.
-- The same ref (for example the same job) used again within 24 hours is not counted twice.
create or replace function public.use_free(p_feature text, p_ref text default null)
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
  if p_feature not in ('job_reply', 'profile_view', 'ai') then
    raise exception 'unknown feature';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid() and plan = 'pro') then
    return 999;
  end if;
  -- One use at a time per account, so two quick taps cannot pass the limit.
  perform pg_advisory_xact_lock(hashtext('free:' || auth.uid()::text));
  select count(*)::int into used from public.free_uses
  where user_id = auth.uid() and feature = p_feature and created_at > now() - interval '24 hours';
  if p_ref is not null and exists (
    select 1 from public.free_uses
    where user_id = auth.uid() and feature = p_feature and ref = p_ref and created_at > now() - interval '24 hours'
  ) then
    return greatest(0, public.free_limit() - used);
  end if;
  if used >= public.free_limit() then
    raise exception 'free_limit';
  end if;
  insert into public.free_uses (user_id, feature, ref) values (auth.uid(), p_feature, left(p_ref, 100));
  return public.free_limit() - used - 1;
end;
$$;

revoke execute on function public.free_uses_left(text) from public, anon;
grant execute on function public.free_uses_left(text) to authenticated;
revoke execute on function public.use_free(text, text) from public, anon;
grant execute on function public.use_free(text, text) to authenticated;

-- Replying to a job now counts toward the free limit (a repeat reply to the same job does not).
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
    me.plan = 'pro'
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

revoke execute on function public.reply_to_job(uuid) from public, anon;
grant execute on function public.reply_to_job(uuid) to authenticated;
