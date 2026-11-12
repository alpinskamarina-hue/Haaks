-- Step 5c of the digital employee (Nasim, 2026-11-12): «напомни в пятницу позвонить Jansen».
-- The employee saves a reminder; the hourly staff cron sends it by push / Telegram and into the chat.
create table if not exists public.staff_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 300),
  due_at timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists staff_reminders_due on public.staff_reminders (due_at) where sent_at is null;
create index if not exists staff_reminders_user on public.staff_reminders (user_id, due_at);

alter table public.staff_reminders enable row level security;

create policy "staff reminders: own read" on public.staff_reminders for select using (user_id = auth.uid());
create policy "staff reminders: own insert" on public.staff_reminders for insert with check (user_id = auth.uid());
create policy "staff reminders: own delete" on public.staff_reminders for delete using (user_id = auth.uid());
create policy "staff reminders: server read" on public.staff_reminders for select using (public.is_haaks_server());
create policy "staff reminders: server update" on public.staff_reminders for update using (public.is_haaks_server()) with check (public.is_haaks_server());
