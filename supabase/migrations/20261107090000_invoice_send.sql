-- Invoices: send and remind from the app (step 1 of the invoices rework, Nasim 2026-11-07).
-- The client's e-mail, when the invoice was sent, first opened by the client, and the reminders.

alter table public.invoices add column if not exists client_email text check (char_length(client_email) <= 200);
alter table public.invoices add column if not exists sent_at timestamptz;
alter table public.invoices add column if not exists viewed_at timestamptz;
alter table public.invoices add column if not exists reminder_count integer not null default 0;
alter table public.invoices add column if not exists reminded_at timestamptz;

update public.invoices set sent_at = updated_at where sent_at is null and status <> 'draft';

-- Marks a sent invoice as opened by the client. Returns the invoice id only the first time,
-- so the builder gets one notification.
create or replace function public.invoice_viewed(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.is_haaks_server() then
    return null;
  end if;
  update public.invoices
     set viewed_at = now()
   where public_token = p_token
     and status = 'sent'
     and viewed_at is null
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.invoice_viewed(text) from public, anon;
grant execute on function public.invoice_viewed(text) to authenticated;
