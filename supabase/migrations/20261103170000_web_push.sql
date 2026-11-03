-- Push notifications on the worker's phone (Web Push, works when the site is added to the
-- home screen). One row per phone or browser; a worker can have several.
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- Which job was pushed to whom, so nobody gets the same job twice.
create table if not exists public.push_sent (
  user_id uuid not null references auth.users on delete cascade,
  item_id uuid not null references public.feed_items on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.push_sent enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'push_subscriptions' and policyname = 'own push subscriptions') then
    create policy "own push subscriptions" on public.push_subscriptions
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'push_subscriptions' and policyname = 'server reads push subscriptions') then
    create policy "server reads push subscriptions" on public.push_subscriptions
      for select using (public.is_haaks_server());
  end if;
  -- A phone that uninstalled the app or turned notifications off: the push service says so.
  if not exists (select 1 from pg_policies where tablename = 'push_subscriptions' and policyname = 'server removes dead push subscriptions') then
    create policy "server removes dead push subscriptions" on public.push_subscriptions
      for delete using (public.is_haaks_server());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'push_sent' and policyname = 'server reads push log') then
    create policy "server reads push log" on public.push_sent for select using (public.is_haaks_server());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'push_sent' and policyname = 'server logs pushes') then
    create policy "server logs pushes" on public.push_sent for insert with check (public.is_haaks_server());
  end if;
end $$;
