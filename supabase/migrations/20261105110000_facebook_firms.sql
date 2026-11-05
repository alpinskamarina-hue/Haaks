-- Test of two Treg sources (Nasim, 2026-11-05):
--   public Facebook posts become feed jobs with source 'facebook';
--   construction firms from Google Maps go to their own list «Фирмы рядом».

alter table public.feed_items drop constraint if exists feed_items_source_check;
alter table public.feed_items add constraint feed_items_source_check
  check (source in ('telegram', 'bekendmakingen', 'email', 'tenderned', 'haaks', 'facebook'));

-- Taking a Facebook job makes a lead with that source.
alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads add constraint leads_source_check
  check (source in ('manual', 'telegram', 'email', 'bekendmakingen', 'tenderned', 'haaks', 'facebook'));

create table if not exists public.nearby_firms (
  id uuid primary key default gen_random_uuid(),
  place_id text not null unique,
  name text not null,
  address text,
  city text,
  phone text,
  website text,
  rating numeric,
  review_count integer,
  categories text[] not null default '{}',
  lat double precision,
  lng double precision,
  maps_url text,
  query text,
  created_at timestamptz not null default now()
);

alter table public.nearby_firms enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'nearby_firms' and policyname = 'signed in read firms') then
    create policy "signed in read firms" on public.nearby_firms for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'nearby_firms' and policyname = 'server writes firms') then
    create policy "server writes firms" on public.nearby_firms for insert to authenticated with check (public.is_haaks_server());
  end if;
end $$;
