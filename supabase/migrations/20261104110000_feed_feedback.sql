-- Feed feedback (Nasim, 2026-11-04): why a job was hidden, saved jobs, and when the worker last
-- answered a feed tip (e.g. "make the radius smaller?").

alter table public.feed_actions add column if not exists reason text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'feed_actions_reason_check') then
    alter table public.feed_actions add constraint feed_actions_reason_check
      check (reason is null or reason in ('far', 'trade', 'price', 'busy', 'scam', 'other'));
  end if;
end $$;

create table if not exists public.feed_saved (
  user_id uuid not null references auth.users on delete cascade,
  item_id uuid not null references public.feed_items on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
alter table public.feed_saved enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'feed_saved' and policyname = 'own saved jobs') then
    create policy "own saved jobs" on public.feed_saved
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

alter table public.profiles add column if not exists feed_tip_at timestamptz;
