-- Orders (jobs) and purchase receipts. Run after schema.sql.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  client_name text,
  address text,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id, created_at desc);

-- Receipts go to this order unless the worker picks another one.
alter table public.profiles
  add column if not exists current_order_id uuid references public.orders on delete set null;

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  order_id uuid references public.orders on delete set null,
  file_path text not null,
  file_name text not null,
  mime_type text not null,
  store_name text,
  store_city text,
  receipt_number text,
  purchased_on date,
  total_incl_vat numeric(12, 2),
  total_excl_vat numeric(12, 2),
  vat_total numeric(12, 2),
  -- [{ "rate": 21, "base": 100.00, "vat": 21.00 }]
  vat_lines jsonb not null default '[]',
  -- [{ "description": "...", "quantity": 2, "total": 12.50 }]
  items jsonb not null default '[]',
  -- true when the receipt is an invoice made out to the worker's company (needed for VAT deduction above small amounts)
  addressed_to_company boolean,
  ai_summary text,
  ai_warnings text[] not null default '{}',
  ai_status text not null default 'pending' check (ai_status in ('pending', 'done', 'failed', 'skipped')),
  created_at timestamptz not null default now()
);

create index if not exists receipts_user_id_idx on public.receipts (user_id, created_at desc);
create index if not exists receipts_order_id_idx on public.receipts (order_id);

alter table public.orders enable row level security;
alter table public.receipts enable row level security;

create policy "own orders" on public.orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own receipts" on public.receipts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
