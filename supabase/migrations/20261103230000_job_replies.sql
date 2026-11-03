-- Builders reply to company jobs ("Reply" button in the feed). The company sees the builder's
-- profile and passport link; phone numbers and e-mail addresses open on both sides only after
-- the company accepts the reply. Until then neither side sees the other's contacts.
-- No drop statements here on purpose (the MCP apply hangs on them).

create table if not exists public.job_replies (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.company_jobs on delete cascade,
  worker_id uuid not null references auth.users on delete cascade,
  -- sent: waits for the company · accepted: contacts open · declined
  status text not null default 'sent' check (status in ('sent', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (job_id, worker_id)
);
create index if not exists job_replies_worker_idx on public.job_replies (worker_id, created_at desc);

alter table public.job_replies enable row level security;
-- Rows are written only through the functions below.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'job_replies' and policyname = 'own job replies read') then
    create policy "own job replies read" on public.job_replies for select using (
      auth.uid() = worker_id
      or exists (select 1 from public.company_jobs j where j.id = job_id and j.company_id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where tablename = 'job_replies' and policyname = 'server reads job replies') then
    create policy "server reads job replies" on public.job_replies for select using (public.is_haaks_server());
  end if;
end $$;

-- Company jobs no longer show the company's contacts in the feed: contacts open after a reply
-- is accepted.
update public.feed_items f set contact = null
from public.company_jobs j
where j.feed_item_id = f.id and f.contact is not null;

-- A builder replies to the company job behind a feed card. The card must be open for them
-- (Pro, opened with a free open, or older than 24 hours), the same rule as the feed.
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
  if not (
    me.plan = 'pro'
    or exists (select 1 from public.feed_unlocks u where u.user_id = auth.uid() and u.item_id = p_item)
    or job.published_at < now() - interval '24 hours'
  ) then
    raise exception 'card_locked';
  end if;
  insert into public.job_replies (job_id, worker_id) values (job.id, auth.uid())
  on conflict (job_id, worker_id) do nothing
  returning id into reply_id;
  if reply_id is null then
    select id into reply_id from public.job_replies where job_id = job.id and worker_id = auth.uid();
  end if;
  return reply_id;
end;
$$;

-- The company accepts or declines a reply to its own job.
create or replace function public.decide_job_reply(p_reply uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.job_replies r
  set status = case when p_accept then 'accepted' else 'declined' end, decided_at = now()
  from public.company_jobs j
  where r.id = p_reply and j.id = r.job_id and j.company_id = auth.uid();
  if not found then
    raise exception 'not your job';
  end if;
end;
$$;

-- Replies to one of the company's jobs, with the builder's profile. Phone and e-mail only
-- for accepted replies.
create or replace function public.job_replies_for_company(p_job uuid)
returns table (
  id uuid,
  status text,
  created_at timestamptz,
  full_name text,
  city text,
  trades text[],
  languages text[],
  hourly_rate numeric,
  vehicle text,
  tools text,
  licences text[],
  kvk_number text,
  passport_token text,
  phone text,
  email text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.status,
    r.created_at,
    p.full_name,
    p.city,
    p.trades,
    p.languages,
    p.hourly_rate,
    p.vehicle,
    p.tools,
    p.licences,
    p.kvk_number,
    case when p.passport_enabled then p.passport_token end,
    case when r.status = 'accepted' then p.phone end,
    case when r.status = 'accepted' then coalesce(p.business_email, u.email) end
  from public.job_replies r
  join public.company_jobs j on j.id = r.job_id
  join public.profiles p on p.id = r.worker_id
  join auth.users u on u.id = r.worker_id
  where r.job_id = p_job and j.company_id = auth.uid()
  order by r.created_at desc;
$$;

-- The builder's own replies, with the company's contacts once accepted.
create or replace function public.my_job_replies()
returns table (
  id uuid,
  status text,
  created_at timestamptz,
  decided_at timestamptz,
  feed_item_id uuid,
  job_title text,
  job_city text,
  job_open boolean,
  company_name text,
  contact_name text,
  phone text,
  email text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.status,
    r.created_at,
    r.decided_at,
    j.feed_item_id,
    j.title,
    j.city,
    j.status = 'published' and (j.expires_at is null or j.expires_at > now()),
    c.company_name,
    case when r.status = 'accepted' then c.full_name end,
    case when r.status = 'accepted' then c.phone end,
    case when r.status = 'accepted' then coalesce(c.business_email, u.email) end
  from public.job_replies r
  join public.company_jobs j on j.id = r.job_id
  join public.profiles c on c.id = j.company_id
  join auth.users u on u.id = j.company_id
  where r.worker_id = auth.uid()
  order by r.created_at desc;
$$;

revoke execute on function public.reply_to_job(uuid) from public, anon;
revoke execute on function public.decide_job_reply(uuid, boolean) from public, anon;
revoke execute on function public.job_replies_for_company(uuid) from public, anon;
revoke execute on function public.my_job_replies() from public, anon;
grant execute on function public.reply_to_job(uuid) to authenticated;
grant execute on function public.decide_job_reply(uuid, boolean) to authenticated;
grant execute on function public.job_replies_for_company(uuid) to authenticated;
grant execute on function public.my_job_replies() to authenticated;
