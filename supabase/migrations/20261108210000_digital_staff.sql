-- «Цифровой сотрудник» (Ultra): the worker's own AI employee with a face, a name and a manner,
-- and the chat with it. Only the worker sees their chat.
alter table public.profiles
  add column if not exists staff_face smallint not null default 1 check (staff_face between 1 and 7),
  add column if not exists staff_name text check (char_length(staff_name) between 1 and 30),
  add column if not exists staff_formal boolean not null default false,
  add column if not exists staff_style text not null default 'short' check (staff_style in ('short', 'detailed', 'humor')),
  add column if not exists staff_lang text;

create table if not exists public.staff_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'staff')),
  body text not null check (char_length(body) <= 8000),
  image_path text,
  created_at timestamptz not null default now()
);

create index if not exists staff_messages_user_time on public.staff_messages (user_id, created_at desc);

alter table public.staff_messages enable row level security;

create policy "staff messages: own read" on public.staff_messages for select using (user_id = auth.uid());
create policy "staff messages: own insert" on public.staff_messages for insert with check (user_id = auth.uid());
create policy "staff messages: own delete" on public.staff_messages for delete using (user_id = auth.uid());

-- The Ultra trial is 3 days now (Nasim, 2026-11-08), still once per account and without a card.
create or replace function public.start_ultra_trial()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  me public.profiles;
  ends timestamptz := now() + interval '3 days';
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  select * into me from public.profiles where id = auth.uid() for update;
  if me.account_type is distinct from 'worker' then
    raise exception 'only builders';
  end if;
  if me.trial_started_at is not null then
    raise exception 'trial_used';
  end if;
  if public.plan_of(me.plan, me.plan_until) <> 'free' then
    raise exception 'already_paid';
  end if;
  perform set_config('haaks.plan_change', 'on', true);
  update public.profiles set plan = 'ultra', plan_until = ends, trial_started_at = now() where id = auth.uid();
  perform set_config('haaks.plan_change', 'off', true);
  return ends;
end;
$$;
