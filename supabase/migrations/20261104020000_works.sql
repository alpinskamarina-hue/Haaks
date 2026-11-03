-- "Completed work": a builder's portfolio. Each work has a title, trade, town, month and
-- before/after photos (stored in the documents bucket under <uid>/work/). Shown in the
-- public passport and counted on catalog cards for companies. Reviews will attach to these later.
create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  order_id uuid references public.orders on delete set null,
  title text not null check (char_length(title) between 1 and 100),
  description text check (char_length(description) <= 600),
  trade text check (char_length(trade) <= 40),
  city text check (char_length(city) <= 80),
  done_on date,
  photos_before text[] not null default '{}' check (cardinality(photos_before) <= 3),
  photos_after text[] not null default '{}' check (cardinality(photos_after) <= 6),
  created_at timestamptz not null default now()
);
create index if not exists works_user_idx on public.works (user_id, done_on desc nulls last, created_at desc);

alter table public.works enable row level security;

-- Own rows only; photos must be the builder's own files; a linked order must be theirs.
create or replace function public.work_row_ok(w public.works)
returns boolean
language sql
stable
set search_path = ''
as $$
  select w.user_id = auth.uid()
    and not exists (
      select 1 from unnest(w.photos_before || w.photos_after) p
      where p not like auth.uid()::text || '/work/%' or p like '%..%'
    )
    and (w.order_id is null or exists (select 1 from public.orders o where o.id = w.order_id and o.user_id = auth.uid()));
$$;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'works' and policyname = 'own works read') then
    create policy "own works read" on public.works for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'works' and policyname = 'own works insert') then
    create policy "own works insert" on public.works for insert with check (public.work_row_ok(works));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'works' and policyname = 'own works update') then
    create policy "own works update" on public.works for update using (auth.uid() = user_id) with check (public.work_row_ok(works));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'works' and policyname = 'own works delete') then
    create policy "own works delete" on public.works for delete using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'works' and policyname = 'server reads works') then
    create policy "server reads works" on public.works for select using (public.is_haaks_server());
  end if;
end $$;

-- Number of works per builder in the catalog, for company accounts.
create or replace function public.catalog_work_counts()
returns table (worker_id uuid, n int)
language sql
stable
security definer
set search_path = ''
as $$
  select w.user_id, count(*)::int
  from public.works w
  join public.profiles p on p.id = w.user_id
  where p.in_catalog
    and (p.catalog_until is null or p.catalog_until > now())
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.account_type = 'company')
  group by w.user_id;
$$;

revoke execute on function public.catalog_work_counts() from public, anon;
grant execute on function public.catalog_work_counts() to authenticated;
