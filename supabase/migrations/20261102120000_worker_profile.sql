-- Extended worker profile: what they do, where they work, languages, transport,
-- tools and availability. Plain columns and text arrays, so the order feed and a
-- future contractor catalogue can filter on them directly
-- (e.g. trades && array['tiler'], travel_km).
alter table public.profiles
  add column if not exists trades text[] not null default '{}',
  -- {"tiler": {"level": "master", "years": 8}}; level is beginner | experienced | master.
  add column if not exists trade_levels jsonb not null default '{}',
  -- profiles.city is the home city; coordinates come from the app's list of Dutch places.
  add column if not exists home_lat double precision,
  add column if not exists home_lng double precision,
  -- 0 means the whole country.
  add column if not exists travel_km integer check (travel_km is null or travel_km between 0 and 500),
  add column if not exists extra_cities text[] not null default '{}',
  add column if not exists languages text[] not null default '{}',
  -- {"nl": "basic"}; basic | fluent | native.
  add column if not exists language_levels jsonb not null default '{}',
  add column if not exists vehicle text check (vehicle in ('none', 'car', 'van')),
  add column if not exists licences text[] not null default '{}',
  add column if not exists tools text check (tools in ('none', 'hand', 'full')),
  add column if not exists equipment text[] not null default '{}',
  add column if not exists works_with text check (works_with in ('solo', 'team')),
  add column if not exists team_size integer check (team_size is null or team_size between 1 and 100),
  add column if not exists available boolean not null default false,
  add column if not exists available_from date,
  add column if not exists availability text check (availability in ('full', 'part')),
  add column if not exists work_photos text[] not null default '{}',
  add column if not exists onboarded_at timestamptz;

create index if not exists profiles_trades_idx on public.profiles using gin (trades);
