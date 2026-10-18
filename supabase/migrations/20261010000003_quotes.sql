-- Quotes (offertes) for clients. Applied after the previous migration.

-- Business contact details printed on the quote.
alter table public.profiles add column if not exists business_address text;
alter table public.profiles add column if not exists business_email text;
-- Last hourly rate used, prefilled in the next quote.
alter table public.profiles add column if not exists hourly_rate numeric(8,2);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  order_id uuid references public.orders on delete set null,
  number text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined')),
  title text not null,
  client_name text,
  client_address text,
  -- Dutch texts shown to the client
  intro text,
  terms text,
  -- [{ "kind": "labour" | "material" | "other", "description": "...", "quantity": 1, "unit": "uur", "unit_price": 45.00, "vat_rate": 21 }]
  lines jsonb not null default '[]',
  -- What the worker described and photographed, kept for regenerating the draft
  work_description text,
  photo_paths text[] not null default '{}',
  -- Notes for the worker in their own language: assumptions and open questions from the draft
  ai_notes text[] not null default '{}',
  valid_until date,
  public_token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  accepted_at timestamptz,
  accepted_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quotes_user_id_idx on public.quotes (user_id, created_at desc);
create index if not exists quotes_order_id_idx on public.quotes (order_id);

alter table public.quotes enable row level security;

create policy "own quotes" on public.quotes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
