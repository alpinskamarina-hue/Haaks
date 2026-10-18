-- Client search (leads). Run after 004_invoices.sql.

-- Where the worker wants work, e.g. "Utrecht, Amersfoort, Zeist".
alter table public.profiles add column if not exists lead_regions text;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  -- manual: pasted by the worker; telegram / email / bekendmakingen: collected automatically later
  source text not null default 'manual' check (source in ('manual', 'telegram', 'email', 'bekendmakingen')),
  source_name text,
  source_url text,
  raw_text text not null,
  image_path text,
  -- Filled in by Claude
  ai_status text not null default 'pending' check (ai_status in ('pending', 'done', 'failed', 'skipped')),
  is_job boolean,
  title text,
  summary text,
  trade text,
  city text,
  client_name text,
  client_contact text,
  timing text,
  match_score int check (match_score between 0 and 100),
  match_reason text,
  reply_nl text,
  status text not null default 'new' check (status in ('new', 'replied', 'won', 'dismissed')),
  order_id uuid references public.orders on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists leads_user_id_idx on public.leads (user_id, created_at desc);

alter table public.leads enable row level security;

create policy "own leads" on public.leads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
