-- Unpaid invoices (Nasim 2026-11-08, step 1 of «оплата по ссылке»): 7 and 14 days after the due date
-- Haaks reminds the builder (push, Telegram) to send a reminder to the client. Plus the builder's own
-- payment link (bunq.me, Tikkie, bank «betaalverzoek»), shown on the client's invoice page.

alter table public.profiles add column if not exists pay_link text
  check (pay_link is null or (pay_link ~ '^https://' and char_length(pay_link) <= 300));

-- One row per invoice and stage, so each reminder goes out once.
create table if not exists public.invoice_reminders (
  invoice_id uuid not null references public.invoices on delete cascade,
  stage int not null check (stage in (7, 14)),
  sent_at timestamptz not null default now(),
  primary key (invoice_id, stage)
);
alter table public.invoice_reminders enable row level security;

-- For the daily run (server account only): sent, unpaid invoices 7..45 days past the due date that
-- have not had this stage yet. Logs the stage before returning, so a slow send is never repeated.
-- A builder who reminded the client by hand in the last 4 days is left alone for now.
create or replace function public.take_invoice_reminders()
returns table (invoice_id uuid, user_id uuid, number text, client_name text, lines jsonb, vat_mode text, overdue int, stage int)
language sql
security definer
set search_path = ''
as $$
  with today as (select (now() at time zone 'Europe/Amsterdam')::date as d),
  due as (
    select i.id, i.user_id, i.number, i.client_name, i.lines, i.vat_mode,
           (t.d - i.due_date) as overdue,
           case when t.d - i.due_date >= 14 then 14 else 7 end as stage
      from public.invoices i, today t
     where public.is_haaks_server()
       and i.status = 'sent'
       and i.credit_for is null
       and i.credited_by is null
       and i.due_date is not null
       and t.d - i.due_date between 7 and 45
       and (i.reminded_at is null or i.reminded_at < now() - interval '4 days')
  ),
  logged as (
    insert into public.invoice_reminders (invoice_id, stage)
    select d.id, d.stage from due d
    on conflict do nothing
    returning invoice_reminders.invoice_id, invoice_reminders.stage
  )
  select d.id, d.user_id, d.number, d.client_name, d.lines, d.vat_mode, d.overdue, d.stage
    from due d
    join logged l on l.invoice_id = d.id and l.stage = d.stage;
$$;
revoke all on function public.take_invoice_reminders() from public, anon;
grant execute on function public.take_invoice_reminders() to authenticated;
