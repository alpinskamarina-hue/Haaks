-- «Предложить себя» in «Фирмы рядом»: the builder sends a firm a ready Dutch intro through their own
-- WhatsApp or e-mail. Haaks keeps a mark per firm (sent, outcome) and reminds after 5 days without an answer.

-- E-mail found on the firm's website (looked up once by the server account).
alter table public.nearby_firms
  add column if not exists email text check (email is null or char_length(email) <= 200),
  add column if not exists email_checked_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'nearby_firms' and policyname = 'server updates firms') then
    create policy "server updates firms" on public.nearby_firms for update to authenticated
      using (public.is_haaks_server()) with check (public.is_haaks_server());
  end if;
end $$;

create table if not exists public.firm_offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  firm_id uuid not null references public.nearby_firms (id) on delete cascade,
  channel text not null check (channel in ('whatsapp', 'email', 'copy')),
  sent_at timestamptz not null default now(),
  outcome text check (outcome in ('work', 'no')),
  outcome_at timestamptz,
  reminded_at timestamptz,
  unique (user_id, firm_id)
);

alter table public.firm_offers enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'firm_offers' and policyname = 'own firm offers') then
    create policy "own firm offers" on public.firm_offers for all to authenticated
      using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end $$;

-- Daily: offers without an answer for 5 days, once per offer (a new send starts the wait again).
create or replace function public.take_firm_reminders()
returns table (offer_id uuid, user_id uuid, firm_id uuid, firm_name text, channel text, has_phone boolean)
language sql
security definer
set search_path = ''
as $$
  with due as (
    update public.firm_offers o
       set reminded_at = now()
      from public.nearby_firms f
     where public.is_haaks_server()
       and f.id = o.firm_id
       and o.outcome is null
       and o.reminded_at is null
       and o.sent_at < now() - interval '5 days'
       and o.sent_at > now() - interval '30 days'
    returning o.id, o.user_id, o.firm_id, f.name, o.channel, f.phone is not null
  )
  select * from due;
$$;
revoke all on function public.take_firm_reminders() from public, anon;
grant execute on function public.take_firm_reminders() to authenticated;
