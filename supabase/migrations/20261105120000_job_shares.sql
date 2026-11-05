-- «Отправить в Haaks» (Nasim, 2026-11-05): a builder sends a feed job to another builder by @nick,
-- with a short note. The job lands in the receiver's feed tab «Мне прислали» and opens in full,
-- also on the free plan and also outside their radius. The receiver can switch receiving off.

-- Who may send me jobs: anyone by my nick, or nobody. (A crew-only choice comes later.)
alter table public.profiles add column if not exists share_from text not null default 'nick'
  constraint profiles_share_from_check check (share_from in ('nick', 'nobody'));

create table if not exists public.job_shares (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.feed_items on delete cascade,
  from_user uuid not null references auth.users on delete cascade,
  to_user uuid not null references auth.users on delete cascade,
  note text check (note is null or length(note) <= 200),
  created_at timestamptz not null default now(),
  seen_at timestamptz,
  thanked_at timestamptz,
  unique (item_id, from_user, to_user)
);
create index if not exists job_shares_to on public.job_shares (to_user, created_at desc);
create index if not exists job_shares_from on public.job_shares (from_user, created_at desc);
alter table public.job_shares enable row level security;

-- Sender and receiver see the row; only the functions below write it.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'job_shares' and policyname = 'own job shares') then
    create policy "own job shares" on public.job_shares for select using (auth.uid() in (from_user, to_user));
  end if;
end $$;

-- Send a job from my feed to a builder by nick. Only a job I see in full (Pro, opened with a free
-- open, or sent to me), so free opens cannot be multiplied by passing jobs around. 20 sends per 24 hours.
create or replace function public.share_job(p_item uuid, p_username text, p_note text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  nick text := lower(trim(leading '@' from trim(coalesce(p_username, ''))));
  target record;
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  select p.id, p.full_name, p.share_from, p.account_type into target
  from public.profiles p where p.username = nick;
  if target.id is null or coalesce(target.account_type, 'worker') = 'company' then
    return jsonb_build_object('ok', false, 'error', 'no_user');
  end if;
  if target.id = auth.uid() then
    return jsonb_build_object('ok', false, 'error', 'self');
  end if;
  if target.share_from = 'nobody' then
    return jsonb_build_object('ok', false, 'error', 'closed', 'name', target.full_name);
  end if;
  if not exists (select 1 from public.feed_for_me() m where m.id = p_item and not m.locked)
    or not (
      public.my_plan() <> 'free'
      or exists (select 1 from public.feed_unlocks u where u.user_id = auth.uid() and u.item_id = p_item)
      or exists (select 1 from public.job_shares s where s.to_user = auth.uid() and s.item_id = p_item)
    ) then
    return jsonb_build_object('ok', false, 'error', 'locked');
  end if;
  perform pg_advisory_xact_lock(hashtext('share:' || auth.uid()::text));
  if (select count(*) from public.job_shares s where s.from_user = auth.uid() and s.created_at > now() - interval '24 hours') >= 20 then
    return jsonb_build_object('ok', false, 'error', 'limit');
  end if;
  insert into public.job_shares (item_id, from_user, to_user, note)
  values (p_item, auth.uid(), target.id, nullif(left(trim(coalesce(p_note, '')), 200), ''))
  on conflict do nothing
  returning id into new_id;
  if new_id is null then
    return jsonb_build_object('ok', true, 'already', true, 'name', target.full_name);
  end if;
  return jsonb_build_object('ok', true, 'id', new_id, 'to_user', target.id, 'name', target.full_name);
end;
$$;
revoke execute on function public.share_job(uuid, text, text) from public, anon;
grant execute on function public.share_job(uuid, text, text) to authenticated;

-- Jobs sent to me, with who sent them (name and nick only, no contacts).
create or replace function public.my_shared_jobs()
returns table (id uuid, item_id uuid, note text, created_at timestamptz, seen_at timestamptz, thanked_at timestamptz, from_name text, from_username text)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.item_id, s.note, s.created_at, s.seen_at, s.thanked_at, p.full_name, p.username
  from public.job_shares s
  left join public.profiles p on p.id = s.from_user
  where s.to_user = auth.uid()
  order by s.created_at desc
  limit 100;
$$;
revoke execute on function public.my_shared_jobs() from public, anon;
grant execute on function public.my_shared_jobs() to authenticated;

-- The builders I sent jobs to lately, for one-tap chips in the share menu.
create or replace function public.my_share_targets()
returns table (username text, full_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.username, p.full_name
  from (
    select s.to_user, max(s.created_at) as last
    from public.job_shares s
    where s.from_user = auth.uid()
    group by s.to_user
  ) t
  join public.profiles p on p.id = t.to_user
  where p.username is not null and p.share_from <> 'nobody'
  order by t.last desc
  limit 6;
$$;
revoke execute on function public.my_share_targets() from public, anon;
grant execute on function public.my_share_targets() to authenticated;

create or replace function public.mark_shares_seen()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.job_shares set seen_at = now() where to_user = auth.uid() and seen_at is null;
$$;
revoke execute on function public.mark_shares_seen() from public, anon;
grant execute on function public.mark_shares_seen() to authenticated;

-- «Спасибо» once; returns who to tell.
create or replace function public.thank_share(p_id uuid)
returns uuid
language sql
security definer
set search_path = ''
as $$
  update public.job_shares set thanked_at = now()
  where id = p_id and to_user = auth.uid() and thanked_at is null
  returning from_user;
$$;
revoke execute on function public.thank_share(uuid) from public, anon;
grant execute on function public.thank_share(uuid) to authenticated;

-- The feed: a job sent to me is opened in full and shown even outside my radius.
create or replace function public.feed_for_me()
returns table (id uuid, source text, source_name text, source_url text, kind text, title text, summary text, translations jsonb, trades text[], city text, timing text, budget text, contact text, published_at timestamptz, is_demo boolean, locked boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select public.my_plan() <> 'free' as pro,
      p.home_lat, p.home_lng, p.travel_km,
      array_remove(array[lower(nullif(trim(p.city), ''))] || coalesce((select array_agg(lower(trim(c))) from unnest(p.extra_cities) c), '{}'), null) as places
    from (select 1) one
    left join public.profiles p on p.id = auth.uid()
  ),
  items as (
    select f.*, coalesce(f.published_at, now() - f.demo_age) as published,
      exists (select 1 from public.feed_unlocks u where u.user_id = auth.uid() and u.item_id = f.id)
        or exists (select 1 from public.job_shares s where s.to_user = auth.uid() and s.item_id = f.id) as opened,
      exists (select 1 from public.job_shares s where s.to_user = auth.uid() and s.item_id = f.id) as shared
    from public.feed_items f, me
    where auth.uid() is not null
      and (f.expires_at is null or f.expires_at > now())
      and case
        when f.kind in ('permit', 'private') then coalesce(f.published_at, now() - f.demo_age) > now() - interval '7 days'
        when f.expires_at is not null then true
        else coalesce(f.published_at, now() - f.demo_age) > now() - interval '30 days'
      end
      and (
        public.feed_near(f.kind, f.lat, f.lng, f.city, f.region, me.home_lat, me.home_lng, me.travel_km, me.places)
        or exists (select 1 from public.job_shares s where s.to_user = auth.uid() and s.item_id = f.id)
      )
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
  order by i.shared desc, i.published desc
  limit 500;
$$;
