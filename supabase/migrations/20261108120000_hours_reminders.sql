-- Hours → invoice, step 3 (Nasim 2026-11-08): a Friday reminder «внесите часы за неделю» and the
-- urenstaat (hours list with the company's Akkoord) attached to the invoice the client opens.

-- One reminder per builder per week.
create table if not exists public.hours_reminders (
  user_id uuid not null references auth.users on delete cascade,
  week_start date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, week_start)
);
alter table public.hours_reminders enable row level security;

-- For the Friday run (server account only): open orders that had hours in the last 4 weeks but none yet
-- this week (Monday..today, Dutch time). One row per order; each builder is logged once per week before
-- returning, so a slow send is never repeated.
create or replace function public.take_hours_reminders()
returns table (user_id uuid, order_id uuid, title text)
language sql
security definer
set search_path = ''
as $$
  with today as (
    select d, d - ((extract(isodow from d)::int) - 1) as monday
      from (select (now() at time zone 'Europe/Amsterdam')::date as d) x
  ),
  due as (
    select o.user_id, o.id as order_id, o.title
      from public.orders o, today t
     where public.is_haaks_server()
       and o.status = 'open'
       and exists (select 1 from public.order_hours h where h.order_id = o.id and h.work_date >= t.monday - 28)
       and not exists (select 1 from public.order_hours h where h.order_id = o.id and h.work_date >= t.monday)
  ),
  logged as (
    insert into public.hours_reminders (user_id, week_start)
    select distinct d.user_id, t.monday from due d, today t
    on conflict do nothing
    returning hours_reminders.user_id
  )
  select d.user_id, d.order_id, d.title from due d join logged l on l.user_id = d.user_id;
$$;
revoke all on function public.take_hours_reminders() from public, anon;
grant execute on function public.take_hours_reminders() to authenticated;

-- The urenstaat for the client's invoice page: the hours that went into this invoice, with who gave
-- Akkoord and when (only approved requests count).
create or replace function public.invoice_urenstaat(p_token text)
returns table (work_date date, hours numeric, note text, approved_by text, approved_at timestamptz)
language sql
security definer
set search_path = ''
as $$
  select h.work_date, h.hours, h.note,
         case when a.status = 'approved' then a.decided_name end,
         case when a.status = 'approved' then a.decided_at end
    from public.invoices i
    join public.order_hours h on h.invoice_id = i.id
    left join public.hour_approvals a on a.id = h.approval_id
   where public.is_haaks_server() and i.public_token = p_token
   order by h.work_date, h.created_at;
$$;
revoke all on function public.invoice_urenstaat(text) from public, anon;
grant execute on function public.invoice_urenstaat(text) to authenticated;
