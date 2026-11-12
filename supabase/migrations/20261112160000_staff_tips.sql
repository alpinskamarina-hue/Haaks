-- Step 5 of «Сотрудник сам заполняет данные»: once a day the employee suggests what to do
-- (missing passport documents, unbilled hours, overdue invoices, missing invoice details).

alter table public.profiles add column if not exists staff_tips boolean not null default true;

-- Which suggestion went to whom, so the same one is not repeated within a week.
create table if not exists public.staff_tips_sent (
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null check (char_length(key) between 1 and 120),
  sent_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table public.staff_tips_sent enable row level security;
create policy "staff tips: own read" on public.staff_tips_sent for select using (user_id = auth.uid());
create policy "staff tips: server read" on public.staff_tips_sent for select using (public.is_haaks_server());
create policy "staff tips: server insert" on public.staff_tips_sent for insert with check (public.is_haaks_server());
create policy "staff tips: server update" on public.staff_tips_sent for update using (public.is_haaks_server()) with check (public.is_haaks_server());

-- The daily check reads orders and their hours with the server account.
create policy "server reads orders" on public.orders for select using (public.is_haaks_server());
create policy "server reads order hours" on public.order_hours for select using (public.is_haaks_server());
