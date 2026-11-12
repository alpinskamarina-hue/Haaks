-- Long memory of the digital employee (Nasim, 2026-11-12, plan step 4).
-- After each talk a small model keeps 0-3 lasting facts ("client Jansen always pays late",
-- "my rate is 45 €/h"). The worker sees the list in the employee settings and can delete
-- any fact or all of them. Passwords, card numbers and BSN are filtered out before saving.
create table if not exists public.staff_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fact text not null check (char_length(fact) between 3 and 300),
  created_at timestamptz not null default now()
);

create index if not exists staff_memory_user on public.staff_memory (user_id, created_at desc);

alter table public.staff_memory enable row level security;

create policy "staff memory: own read" on public.staff_memory for select using (user_id = auth.uid());
create policy "staff memory: own delete" on public.staff_memory for delete using (user_id = auth.uid());
-- Facts are written after the answer, in the background, through the server account.
create policy "staff memory: server read" on public.staff_memory for select using (public.is_haaks_server());
create policy "staff memory: server insert" on public.staff_memory for insert with check (public.is_haaks_server());
create policy "staff memory: server delete" on public.staff_memory for delete using (public.is_haaks_server());
