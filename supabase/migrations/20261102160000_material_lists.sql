-- Material lists: the worker collects products from shops (tiles, sanitary, glue)
-- and sends the client one link to see them, choose who buys, and press "Akkoord".
create table if not exists public.material_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  order_id uuid references public.orders on delete set null,
  title text not null,
  client_name text,
  -- [{ "id": "...", "url": "https://...", "title": "...", "image": "https://..." | null,
  --    "store": "Praxis", "unit_price": 29.99 (incl. btw), "quantity": 13.2, "unit": "m²" }]
  items jsonb not null default '[]',
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted')),
  -- Who buys: the worker (and puts it on the invoice) or the client themselves.
  buyer text check (buyer in ('worker', 'client')),
  public_token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  viewed_at timestamptz,
  accepted_at timestamptz,
  accepted_name text,
  invoice_id uuid references public.invoices on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists material_lists_user_idx on public.material_lists (user_id, created_at desc);
create index if not exists material_lists_order_idx on public.material_lists (order_id);

alter table public.material_lists enable row level security;

create policy "own material lists" on public.material_lists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "server reads material lists" on public.material_lists
  for select using (public.is_haaks_server());

-- The public link only marks a sent list as viewed or accepted.
create policy "server updates sent material lists" on public.material_lists
  for update using (public.is_haaks_server() and status = 'sent')
  with check (public.is_haaks_server() and status in ('sent', 'accepted'));
