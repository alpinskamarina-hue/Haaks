-- Hours → invoice, step 1 (Nasim 2026-11-08): the builder logs worked hours per order (mostly work for a
-- contractor) and turns the hours not yet invoiced into a draft invoice, one line per week.

alter table public.orders add column if not exists hourly_rate numeric(8, 2) check (hourly_rate is null or (hourly_rate >= 0 and hourly_rate <= 1000));

create table if not exists public.order_hours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  order_id uuid not null references public.orders on delete cascade,
  work_date date not null,
  hours numeric(4, 2) not null check (hours > 0 and hours <= 24),
  note text check (note is null or char_length(note) <= 200),
  -- The invoice these hours went into; a deleted draft invoice frees them again.
  invoice_id uuid references public.invoices on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists order_hours_order on public.order_hours (order_id, work_date);
alter table public.order_hours enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'order_hours' and policyname = 'own order hours') then
    create policy "own order hours" on public.order_hours for all
      using (user_id = auth.uid())
      with check (user_id = auth.uid() and exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
  end if;
end $$;
