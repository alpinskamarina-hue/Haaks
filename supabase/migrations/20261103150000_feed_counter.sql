-- Counter of new jobs in the feed: how many fitting jobs came in since the worker last
-- opened the feed. feed_seen_at moves on every visit (the badge counts from it);
-- feed_last_visit is the start of the visit before, so the cards keep their "new" mark
-- while the worker clicks through the sections.
alter table public.profiles add column if not exists feed_seen_at timestamptz;
alter table public.profiles add column if not exists feed_last_visit timestamptz;

-- Place of each job and when it came into the feed (permits carry the date they were
-- published, which can be a day before the collector picked them up).
create or replace function public.feed_details()
returns table (id uuid, lat double precision, lng double precision, region text, added_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select f.id, f.lat, f.lng, f.region, f.created_at
  from public.feed_items f
  where auth.uid() is not null
    and (f.expires_at is null or f.expires_at > now())
    and coalesce(f.published_at, now() - f.demo_age) > now() - interval '30 days';
$$;

revoke execute on function public.feed_details() from public, anon;
grant execute on function public.feed_details() to authenticated;
