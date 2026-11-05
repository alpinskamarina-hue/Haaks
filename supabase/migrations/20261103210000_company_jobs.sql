-- Companies (BV) post jobs for ZZP builders. A company's first jobs wait for Haaks to check
-- them; once one is approved the company is trusted and later jobs go online at once.
-- Online jobs become rows in feed_items (section "Companies looking"), so the feed, the
-- matching and the alerts work for them unchanged.

-- Who the account is: chosen at sign-up ("I'm a builder" / "I'm a company").
alter table public.profiles add column if not exists account_type text not null default 'worker'
  check (account_type in ('worker', 'company'));
-- Set by Haaks only (see protect_profile_plan below).
alter table public.profiles add column if not exists company_verified boolean not null default false;
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- The sign-up form passes account_type in the user metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, account_type)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'account_type' = 'company' then 'company' else 'worker' end
  )
  on conflict do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Same guard as before, now also for company_verified and is_admin.
create or replace function public.protect_profile_plan()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_haaks_server() then
    if tg_op = 'INSERT' then
      new.plan := 'free';
      new.telegram_chat_id := null;
      new.company_verified := false;
      new.is_admin := false;
    else
      if new.plan is distinct from old.plan then
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

-- Moderation marks a company as trusted.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'server verifies companies') then
    create policy "server verifies companies" on public.profiles
      for update using (public.is_haaks_server()) with check (public.is_haaks_server());
  end if;
end $$;

create table if not exists public.company_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references auth.users on delete cascade,
  -- pending: waits for Haaks · published: in the feed · rejected · closed: found people or expired
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'closed')),
  title text not null check (length(title) between 3 and 120),
  description text not null default '' check (length(description) <= 2000),
  -- Dutch trade keys, as in feed_items.trades
  trades text[] not null check (cardinality(trades) between 1 and 5),
  city text not null,
  postcode text,
  start_date date,
  weeks int check (weeks between 1 and 104),
  people int not null default 1 check (people between 1 and 50),
  rate_type text not null default 'hour' check (rate_type in ('hour', 'fixed', 'ask')),
  rate numeric(10, 2) check (rate is null or rate > 0),
  -- vca, tools, transport, avb, language
  requirements text[] not null default '{}',
  -- "This is an assignment (opdracht) for a self-employed contractor, not employment."
  opdracht_confirmed boolean not null check (opdracht_confirmed),
  reject_reason text,
  feed_item_id uuid references public.feed_items on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  expires_at timestamptz
);
create index if not exists company_jobs_company_idx on public.company_jobs (company_id, created_at desc);
create index if not exists company_jobs_pending_idx on public.company_jobs (status) where status = 'pending';

alter table public.company_jobs enable row level security;
-- A company sees and posts its own jobs; publishing, rejecting and closing go through the
-- server (moderation and the "found people" button).
create policy "own company jobs read" on public.company_jobs
  for select using (auth.uid() = company_id);
create policy "own company jobs post" on public.company_jobs
  for insert with check (
    auth.uid() = company_id
    and status = 'pending'
    and feed_item_id is null
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.account_type = 'company')
  );
create policy "server manages company jobs" on public.company_jobs
  for all using (public.is_haaks_server()) with check (public.is_haaks_server());

-- Free plan for companies: at most 3 jobs waiting or online at the same time.
create or replace function public.company_jobs_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.company_id::text));
  if (
    select count(*) from public.company_jobs j
    where j.company_id = new.company_id
      and (j.status = 'pending' or (j.status = 'published' and (j.expires_at is null or j.expires_at > now())))
  ) >= 3 then
    raise exception 'company_jobs_limit';
  end if;
  return new;
end;
$$;

-- No drop statements in this file on purpose (the MCP apply hangs on them).
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'company_jobs_limit') then
    create trigger company_jobs_limit
      before insert on public.company_jobs
      for each row execute function public.company_jobs_limit();
  end if;
  -- Closing a job takes it out of the feed.
  if not exists (select 1 from pg_policies where tablename = 'feed_items' and policyname = 'server updates feed') then
    create policy "server updates feed" on public.feed_items
      for update using (public.is_haaks_server()) with check (public.is_haaks_server());
  end if;
end $$;
