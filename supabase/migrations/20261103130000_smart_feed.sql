-- Smart feed: jobs collected every day from official sources (permit publications on
-- officielebekendmakingen.nl, TenderNed) get a place on the map, so each worker sees
-- the jobs within their travel radius, nearest first.
-- No drop statements here on purpose (the MCP apply hangs on them).

alter table public.feed_items add column if not exists lat double precision;
alter table public.feed_items add column if not exists lng double precision;
alter table public.feed_items add column if not exists postcode text;
-- Municipality the job is in (gemeente), for the "all jobs" city filter.
alter table public.feed_items add column if not exists region text;

-- The daily collector writes with the server account and removes jobs older than 30 days.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'feed_items' and policyname = 'server writes feed') then
    create policy "server writes feed" on public.feed_items for insert with check (public.is_haaks_server());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'feed_items' and policyname = 'server cleans feed') then
    create policy "server cleans feed" on public.feed_items for delete using (public.is_haaks_server());
  end if;
end $$;

-- Where each job in the worker's feed is: a separate call, so feed_for_me() keeps its columns.
create or replace function public.feed_places()
returns table (id uuid, lat double precision, lng double precision, region text)
language sql
stable
security definer
set search_path = ''
as $$
  select f.id, f.lat, f.lng, f.region
  from public.feed_items f
  where auth.uid() is not null
    and (f.lat is not null or f.region is not null)
    and (f.expires_at is null or f.expires_at > now())
    and coalesce(f.published_at, now() - f.demo_age) > now() - interval '30 days';
$$;

revoke execute on function public.feed_places() from public, anon;
grant execute on function public.feed_places() to authenticated;
