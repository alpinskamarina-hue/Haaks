-- "Need a helper": a builder (ZZP) posts a job for other builders, in the same table as
-- company jobs. Same moderation, limit (3 active) and reply flow.
-- No drop statements here on purpose (the MCP apply hangs on them).

-- Builders may post too, not only companies.
alter policy "own company jobs post" on public.company_jobs
  with check (auth.uid() = company_id and status = 'pending' and feed_item_id is null);

-- Replying: not to one's own job.
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
  insert into public.job_replies (job_id, worker_id) values (job.id, auth.uid())
  on conflict (job_id, worker_id) do nothing
  returning id into reply_id;
  if reply_id is null then
    select id into reply_id from public.job_replies where job_id = job.id and worker_id = auth.uid();
  end if;
  return reply_id;
end;
$$;

-- The builder's own replies: a builder who posted is shown as "ZZP · Ivan P.", not by company name.
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
    case when c.account_type = 'company' then c.company_name
      else 'ZZP · ' || coalesce(nullif(trim(split_part(coalesce(c.full_name, ''), ' ', 1) || ' ' ||
        left(split_part(coalesce(c.full_name, ''), ' ', 2), 1) ||
        case when split_part(coalesce(c.full_name, ''), ' ', 2) <> '' then '.' else '' end), ''), '?') end,
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
revoke execute on function public.my_job_replies() from public, anon;
grant execute on function public.reply_to_job(uuid) to authenticated;
grant execute on function public.my_job_replies() to authenticated;
