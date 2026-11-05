-- «Поездки»: the builder's km log (rittenregistratie) for the tax office, filled in by hand (no GPS).
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  from_label text not null check (length(from_label) between 1 and 200),
  to_label text not null check (length(to_label) between 1 and 200),
  round_trip boolean not null default true,
  km numeric(7, 1) not null check (km >= 0 and km <= 5000),
  purpose text check (purpose is null or length(purpose) <= 200),
  order_id uuid references public.orders on delete set null,
  receipt_id uuid references public.receipts on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists trips_user_day on public.trips (user_id, day);
alter table public.trips enable row level security;

-- Odometer readings (photo + number), one or more a month.
create table if not exists public.odometer_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  read_on date not null,
  km integer not null check (km >= 0 and km < 10000000),
  photo_path text,
  created_at timestamptz not null default now()
);
create index if not exists odometer_user_day on public.odometer_readings (user_id, read_on);
alter table public.odometer_readings enable row level security;

-- Suggested trips the builder answered «Не ездил», so they are not offered again.
create table if not exists public.trip_hints_skipped (
  user_id uuid not null references auth.users on delete cascade,
  hint text not null check (length(hint) <= 120),
  created_at timestamptz not null default now(),
  primary key (user_id, hint)
);
alter table public.trip_hints_skipped enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'trips' and policyname = 'own trips') then
    create policy "own trips" on public.trips for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'odometer_readings' and policyname = 'own odometer') then
    create policy "own odometer" on public.odometer_readings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'trip_hints_skipped' and policyname = 'own skipped hints') then
    create policy "own skipped hints" on public.trip_hints_skipped for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- What car the builder drives (decides what the tax office needs), and where trips start.
alter table public.profiles add column if not exists car_type text check (car_type in ('private', 'business', 'van_no_private'));
alter table public.profiles add column if not exists trip_home text check (trip_home is null or length(trip_home) <= 200);
alter table public.profiles add column if not exists trip_home_lat double precision;
alter table public.profiles add column if not exists trip_home_lng double precision;
