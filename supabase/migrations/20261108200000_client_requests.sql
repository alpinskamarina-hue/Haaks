-- «Vakman gezocht» (Nasim, 2026-11-08): Dutch clients post a job on a public page without an
-- account. Haaks checks it, then it goes into the feed for fitting builders (source 'client').
-- Builders reply (at most 5 per request); the client picks one, and only then both see each
-- other's phone and e-mail. The client reaches the request through a secret link (token).
-- No drop statements except the source checks (the MCP apply hangs on others).

alter table public.feed_items drop constraint if exists feed_items_source_check;
alter table public.feed_items add constraint feed_items_source_check
  check (source in ('telegram', 'bekendmakingen', 'email', 'tenderned', 'haaks', 'facebook', 'googlejobs', 'client'));

alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads add constraint leads_source_check
  check (source in ('manual', 'telegram', 'email', 'bekendmakingen', 'tenderned', 'haaks', 'facebook', 'googlejobs', 'client'));

create table if not exists public.client_requests (
  id uuid primary key default gen_random_uuid(),
  -- The client's secret link /klus/<token>.
  token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  -- pending: waits for Haaks · published: in the feed · rejected · closed: client chose or stopped
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'closed')),
  work_type text not null,
  trades text[] not null check (cardinality(trades) between 1 and 5),
  size text check (length(size) <= 120),
  description text not null check (length(description) between 10 and 2000),
  postcode text not null check (length(postcode) <= 10),
  city text,
  lat double precision,
  lng double precision,
  timing text not null check (timing in ('asap', 'weeks', 'months', 'price')),
  budget text check (length(budget) <= 60),
  name text not null check (length(name) between 2 and 80),
  email text not null check (length(email) <= 160),
  phone text check (length(phone) <= 30),
  lang text not null default 'nl' check (lang in ('nl', 'en')),
  -- Storage paths in the documents bucket (folder of the Haaks server account).
  photos text[] not null default '{}',
  reject_reason text,
  feed_item_id uuid references public.feed_items on delete set null,
  chosen_reply_id uuid,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  expires_at timestamptz
);
create index if not exists client_requests_status_idx on public.client_requests (status, created_at);
create index if not exists client_requests_email_idx on public.client_requests (lower(email), created_at desc);

create table if not exists public.client_replies (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.client_requests on delete cascade,
  worker_id uuid not null references auth.users on delete cascade,
  -- Ready phrases the builder ticked (keys, shown to the client in Dutch/English).
  phrases text[] not null default '{}',
  message text check (length(message) <= 1000),
  -- sent · chosen: contacts open on both sides · not_chosen: the client chose someone else
  status text not null default 'sent' check (status in ('sent', 'chosen', 'not_chosen')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (request_id, worker_id)
);
create index if not exists client_replies_worker_idx on public.client_replies (worker_id, created_at desc);

alter table public.client_requests enable row level security;
alter table public.client_replies enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'client_requests' and policyname = 'server manages client requests') then
    create policy "server manages client requests" on public.client_requests
      for all using (public.is_haaks_server()) with check (public.is_haaks_server());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'client_replies' and policyname = 'own client replies read') then
    create policy "own client replies read" on public.client_replies for select using (auth.uid() = worker_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'client_replies' and policyname = 'server manages client replies') then
    create policy "server manages client replies" on public.client_replies
      for all using (public.is_haaks_server()) with check (public.is_haaks_server());
  end if;
end $$;

-- A builder replies to the client request behind a feed card. Same rules as company jobs:
-- the card must be open (paid plan, opened with a free open, or older than 24 hours), free
-- plans spend a «job_reply». At most 5 replies per request.
create or replace function public.reply_to_client_request(p_item uuid, p_phrases text[], p_message text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me public.profiles;
  req public.client_requests;
  reply_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  select * into me from public.profiles where id = auth.uid();
  if me.account_type is distinct from 'worker' then
    raise exception 'only builders reply';
  end if;
  select * into req from public.client_requests
  where feed_item_id = p_item and status = 'published' and (expires_at is null or expires_at > now())
  for update;
  if req.id is null then
    raise exception 'request_closed';
  end if;
  select id into reply_id from public.client_replies where request_id = req.id and worker_id = auth.uid();
  if reply_id is not null then
    return reply_id;
  end if;
  if not (
    public.plan_of(me.plan, me.plan_until) <> 'free'
    or exists (select 1 from public.feed_unlocks u where u.user_id = auth.uid() and u.item_id = p_item)
    or req.published_at < now() - interval '24 hours'
  ) then
    raise exception 'card_locked';
  end if;
  if (select count(*) from public.client_replies r where r.request_id = req.id) >= 5 then
    raise exception 'request_full';
  end if;
  perform public.use_free('job_reply', p_item::text);
  insert into public.client_replies (request_id, worker_id, phrases, message)
  values (
    req.id,
    auth.uid(),
    coalesce((select array_agg(x) from unnest(p_phrases) x where x ~ '^[a-z_]{2,20}$'), '{}'),
    nullif(left(trim(coalesce(p_message, '')), 1000), '')
  )
  returning id into reply_id;
  return reply_id;
end;
$$;

-- Per client card: how many builders replied, and my own reply with the client's contacts
-- once the client chose me (also after the request left the feed: «Мои отклики»).
create or replace function public.my_client_replies()
returns table (
  feed_item_id uuid,
  trades text[],
  city text,
  replied_at timestamptz,
  replies int,
  my_status text,
  request_open boolean,
  client_name text,
  client_phone text,
  client_email text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    q.feed_item_id,
    q.trades,
    q.city,
    r.created_at,
    (select count(*)::int from public.client_replies x where x.request_id = q.id),
    r.status,
    q.status = 'published' and (q.expires_at is null or q.expires_at > now()),
    case when r.status = 'chosen' then q.name end,
    case when r.status = 'chosen' then q.phone end,
    case when r.status = 'chosen' then q.email end
  from public.client_requests q
  left join public.client_replies r on r.request_id = q.id and r.worker_id = auth.uid()
  where q.feed_item_id is not null
    and (r.id is not null or (q.status = 'published' and (q.expires_at is null or q.expires_at > now())));
$$;

revoke execute on function public.reply_to_client_request(uuid, text[], text) from public, anon;
revoke execute on function public.my_client_replies() from public, anon;
grant execute on function public.reply_to_client_request(uuid, text[], text) to authenticated;
grant execute on function public.my_client_replies() to authenticated;

-- The replies to one request, with what the client may see of each builder. Phone and e-mail
-- only for the builder the client chose. Called by the server for the client's /klus page.
create or replace function public.client_request_replies(p_request uuid)
returns table (
  id uuid,
  status text,
  phrases text[],
  message text,
  created_at timestamptz,
  worker_id uuid,
  full_name text,
  avatar_path text,
  trades text[],
  city text,
  home_lat double precision,
  home_lng double precision,
  username text,
  passport_token text,
  has_kvk boolean,
  avg_stars numeric,
  reviews int,
  works int,
  phone text,
  email text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_haaks_server() then
    raise exception 'server only';
  end if;
  return query
  select
    r.id, r.status, r.phrases, r.message, r.created_at, r.worker_id,
    p.full_name, p.avatar_path, p.trades, p.city, p.home_lat, p.home_lng,
    case when p.passport_enabled then p.username end,
    case when p.passport_enabled then p.passport_token end,
    coalesce(p.kvk_number, '') <> '',
    (select round(avg(v.stars)::numeric, 1) from public.reviews v
      where v.worker_id = r.worker_id and v.status = 'submitted' and v.publish_at <= now() and not v.held),
    (select count(*)::int from public.reviews v
      where v.worker_id = r.worker_id and v.status = 'submitted' and v.publish_at <= now() and not v.held),
    (select count(*)::int from public.works w where w.user_id = r.worker_id),
    case when r.status = 'chosen' then p.phone end,
    case when r.status = 'chosen' then coalesce(p.business_email, u.email) end
  from public.client_replies r
  join public.profiles p on p.id = r.worker_id
  join auth.users u on u.id = r.worker_id
  where r.request_id = p_request
  order by r.created_at;
end;
$$;
revoke execute on function public.client_request_replies(uuid) from public, anon;
grant execute on function public.client_request_replies(uuid) to authenticated;
