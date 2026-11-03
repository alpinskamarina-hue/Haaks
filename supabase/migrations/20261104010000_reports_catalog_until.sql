-- Order in the board: complaints about jobs and builder cards, and the "looking for work"
-- card switches itself off after 30 days unless the builder extends it.
-- No drop statements here on purpose (the MCP apply hangs on them).

-- "Looking for work" is shown to companies until this moment; the builder extends it.
alter table public.profiles add column if not exists catalog_until timestamptz;
update public.profiles set catalog_until = now() + interval '30 days' where in_catalog and catalog_until is null;

-- The catalog and invitations only see builders whose card has not run out.
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
    and (p.catalog_until is null or p.catalog_until > now())
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
  if not exists (select 1 from public.profiles where id = p_worker and in_catalog and account_type = 'worker'
                 and (catalog_until is null or catalog_until > now())) then
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

-- Complaints: a builder about a job in the feed, a company about a builder card.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users on delete cascade,
  target_kind text not null check (target_kind in ('job', 'worker')),
  -- job: the feed item id; worker: the builder's user id.
  target_id uuid not null,
  reason text not null check (reason in ('scam', 'employment', 'contacts', 'fake', 'other')),
  created_at timestamptz not null default now(),
  unique (reporter_id, target_kind, target_id)
);
create index if not exists reports_target_idx on public.reports (target_kind, target_id);

alter table public.reports enable row level security;
-- Rows are written only through report(); Haaks moderation reads and clears them.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'reports' and policyname = 'own reports read') then
    create policy "own reports read" on public.reports for select using (auth.uid() = reporter_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'reports' and policyname = 'server manages reports') then
    create policy "server manages reports" on public.reports
      for all using (public.is_haaks_server()) with check (public.is_haaks_server());
  end if;
end $$;

create or replace function public.report(p_kind text, p_target uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if p_kind = 'job' then
    -- Only jobs posted on Haaks, and not one's own.
    if not exists (select 1 from public.company_jobs where feed_item_id = p_target and company_id <> auth.uid()) then
      raise exception 'not a job';
    end if;
  elsif p_kind = 'worker' then
    -- Only companies, about builders in the catalog.
    if not exists (select 1 from public.profiles where id = auth.uid() and account_type = 'company')
       or not exists (select 1 from public.profiles where id = p_target and in_catalog and account_type = 'worker') then
      raise exception 'not allowed';
    end if;
  else
    raise exception 'bad kind';
  end if;
  insert into public.reports (reporter_id, target_kind, target_id, reason)
  values (auth.uid(), p_kind, p_target, p_reason)
  on conflict (reporter_id, target_kind, target_id) do update set reason = excluded.reason, created_at = now();
end;
$$;

revoke execute on function public.worker_catalog() from public, anon;
revoke execute on function public.invite_worker(uuid, uuid) from public, anon;
revoke execute on function public.report(text, uuid, text) from public, anon;
grant execute on function public.worker_catalog() to authenticated;
grant execute on function public.invite_worker(uuid, uuid) to authenticated;
grant execute on function public.report(text, uuid, text) to authenticated;
