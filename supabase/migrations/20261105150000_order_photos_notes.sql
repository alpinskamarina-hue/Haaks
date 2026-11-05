-- «Заказы = проекты», step 2 (Nasim, 2026-11-05): photos before / during / after and short notes
-- inside an order. Files live in the documents bucket under <uid>/orders/<order id>/.

create table if not exists public.order_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  order_id uuid not null references public.orders on delete cascade,
  path text not null,
  kind text not null default 'during' check (kind in ('before', 'during', 'after')),
  created_at timestamptz not null default now(),
  check (path like user_id::text || '/orders/%')
);
create index if not exists order_photos_order on public.order_photos (order_id, created_at);
alter table public.order_photos enable row level security;

create table if not exists public.order_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  order_id uuid not null references public.orders on delete cascade,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists order_notes_order on public.order_notes (order_id, created_at desc);
alter table public.order_notes enable row level security;

-- Only the owner, and only on their own orders.
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'order_photos' and policyname = 'own order photos') then
    create policy "own order photos" on public.order_photos for all
      using (user_id = auth.uid())
      with check (user_id = auth.uid() and exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'order_notes' and policyname = 'own order notes') then
    create policy "own order notes" on public.order_notes for all
      using (user_id = auth.uid())
      with check (user_id = auth.uid() and exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
  end if;
end $$;
