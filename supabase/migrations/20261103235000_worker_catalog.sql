-- "Looking for work" catalog: builders who agree are listed for companies (BV). A company
-- invites a builder; phone numbers and e-mail addresses open on both sides only after the
-- builder accepts. No contacts in the catalog itself.
-- No drop statements here on purpose (the MCP apply hangs on them).

-- The builder's own choice; off by default.
alter table public.profiles add column if not exists in_catalog boolean not null default false;

create table if not exists public.company_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references auth.users on delete cascade,
  worker_id uuid not null references auth.users on delete cascade,
  -- Optional: the company job the invitation is about.
  job_id uuid references public.company_jobs on delete set null,
  status text not null default 'sent' check (status in ('sent', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (company_id, worker_id)
);
create index if not exists company_invites_worker_idx on public.company_invites (worker_id, created_at desc);

alter table public.company_invites enable row level security;
-- Rows are written only through the functions below.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'company_invites' and policyname = 'own invites read') then
    create policy "own invites read" on public.company_invites
      for select using (auth.uid() = worker_id or auth.uid() = company_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'company_invites' and policyname = 'server reads invites') then
    create policy "server reads invites" on public.company_invites for select using (public.is_haaks_server());
  end if;
end $$;

-- Invitations a company may send per 24 hours (free plan).
create or replace function public.invite_limit()
returns int
language sql
immutable
as $$ select 10 $$;

-- Builders in the catalog, for companies only. Short name (first name + initial), no contacts.
create or replace function public.worker_catalog()
returns table (
  id uuid,
  name text,
  city text,
  home_lat double precision,
  home_lng double precision,
  travel_km int,
  trades text[],
  languages text[],
  hourly_rate numeric,
  vehicle text,
  tools text,
  licences text[],
  available boolean,
  available_from date,
  has_kvk boolean,
  passport_token text,
  invite_status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    nullif(trim(split_part(coalesce(p.full_name, ''), ' ', 1) || ' ' || left(split_part(coalesce(p.full_name, ''), ' ', 2), 1) ||
      case when split_part(coalesce(p.full_name, ''), ' ', 2) <> '' then '.' else '' end), ''),
    p.city,
    p.home_lat,
    p.home_lng,
    p.travel_km,
    p.trades,
    p.languages,
    p.hourly_rate,
    p.vehicle,
    p.tools,
    p.licences,
    p.available,
    p.available_from,
    p.kvk_number is not null,
    case when p.passport_enabled then p.passport_token end,
    i.status
  from public.profiles p
  left join public.company_invites i on i.worker_id = p.id and i.company_id = auth.uid()
  where p.in_catalog
    and p.account_type = 'worker'
    and cardinality(p.trades) > 0
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.account_type = 'company')
  order by p.available desc, p.created_at desc
  limit 500;
$$;

-- A company invites a builder from the catalog. Returns the invitation id.
create or replace function public.invite_worker(p_worker uuid, p_job uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invite_id uuid;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and account_type = 'company') then
    raise exception 'only companies invite';
  end if;
  if not exists (select 1 from public.profiles where id = p_worker and in_catalog and account_type = 'worker') then
    raise exception 'not in catalog';
  end if;
  if p_job is not null and not exists (select 1 from public.company_jobs where id = p_job and company_id = auth.uid()) then
    raise exception 'not your job';
  end if;
  select id into invite_id from public.company_invites where company_id = auth.uid() and worker_id = p_worker;
  if invite_id is not null then
    return invite_id;
  end if;
  perform pg_advisory_xact_lock(hashtext('invite' || auth.uid()::text));
  if (select count(*) from public.company_invites where company_id = auth.uid() and created_at > now() - interval '24 hours')
     >= public.invite_limit() then
    raise exception 'invite_limit';
  end if;
  insert into public.company_invites (company_id, worker_id, job_id) values (auth.uid(), p_worker, p_job)
  returning id into invite_id;
  return invite_id;
end;
$$;

-- The builder accepts or declines an invitation.
create or replace function public.decide_invite(p_invite uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.company_invites
  set status = case when p_accept then 'accepted' else 'declined' end, decided_at = now()
  where id = p_invite and worker_id = auth.uid() and status = 'sent';
  if not found then
    raise exception 'not your invitation';
  end if;
end;
$$;

-- Invitations for the signed-in builder, with the company's contacts once accepted.
create or replace function public.my_invites()
returns table (
  id uuid,
  status text,
  created_at timestamptz,
  company_name text,
  kvk_number text,
  job_title text,
  job_city text,
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
    i.id,
    i.status,
    i.created_at,
    c.company_name,
    c.kvk_number,
    j.title,
    j.city,
    case when i.status = 'accepted' then c.full_name end,
    case when i.status = 'accepted' then c.phone end,
    case when i.status = 'accepted' then coalesce(c.business_email, u.email) end
  from public.company_invites i
  join public.profiles c on c.id = i.company_id
  join auth.users u on u.id = i.company_id
  left join public.company_jobs j on j.id = i.job_id
  where i.worker_id = auth.uid()
  order by i.created_at desc;
$$;

-- The company's invitations, with the builder's contacts once accepted.
create or replace function public.company_sent_invites()
returns table (
  id uuid,
  worker_id uuid,
  status text,
  created_at timestamptz,
  full_name text,
  trades text[],
  city text,
  job_title text,
  phone text,
  email text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    i.id,
    i.worker_id,
    i.status,
    i.created_at,
    case when i.status = 'accepted' then p.full_name
      else nullif(trim(split_part(coalesce(p.full_name, ''), ' ', 1)), '') end,
    p.trades,
    p.city,
    j.title,
    case when i.status = 'accepted' then p.phone end,
    case when i.status = 'accepted' then coalesce(p.business_email, u.email) end
  from public.company_invites i
  join public.profiles p on p.id = i.worker_id
  join auth.users u on u.id = i.worker_id
  left join public.company_jobs j on j.id = i.job_id
  where i.company_id = auth.uid()
  order by i.created_at desc;
$$;

revoke execute on function public.worker_catalog() from public, anon;
revoke execute on function public.invite_worker(uuid, uuid) from public, anon;
revoke execute on function public.decide_invite(uuid, boolean) from public, anon;
revoke execute on function public.my_invites() from public, anon;
revoke execute on function public.company_sent_invites() from public, anon;
grant execute on function public.worker_catalog() to authenticated;
grant execute on function public.invite_worker(uuid, uuid) to authenticated;
grant execute on function public.decide_invite(uuid, boolean) to authenticated;
grant execute on function public.my_invites() to authenticated;
grant execute on function public.company_sent_invites() to authenticated;
