-- Invoices (facturen). Run after 003_quotes.sql.

-- Bank account printed on invoices.
alter table public.profiles add column if not exists iban text;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  order_id uuid references public.orders on delete set null,
  quote_id uuid references public.quotes on delete set null,
  number text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid')),
  -- normal: btw charged per line (21/9/0%)
  -- reverse: btw verlegd to the business client (construction subcontracting, art. 12 lid 5 Wet OB)
  -- kor: worker uses the kleineondernemersregeling and charges no btw
  vat_mode text not null default 'normal' check (vat_mode in ('normal', 'reverse', 'kor')),
  invoice_date date not null default current_date,
  due_date date,
  work_period text,
  project_address text,
  client_name text,
  client_address text,
  client_kvk text,
  client_btw text,
  -- same shape as quotes.lines
  lines jsonb not null default '[]',
  notes text,
  public_token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_user_id_idx on public.invoices (user_id, invoice_date desc);
create index if not exists invoices_order_id_idx on public.invoices (order_id);

alter table public.invoices enable row level security;

create policy "own invoices" on public.invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

