-- "Client opened it" for quotes: when the quote was sent and when the client first opened
-- the public link. The public page runs as the server account, which may not update quotes
-- freely, so the first view goes through one narrow function.

alter table public.quotes add column if not exists sent_at timestamptz;
alter table public.quotes add column if not exists viewed_at timestamptz;

update public.quotes set sent_at = updated_at where sent_at is null and status <> 'draft';

-- Marks a sent quote as opened. Returns the quote id only the first time, so the
-- builder gets one notification.
create or replace function public.quote_viewed(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_haaks_server() then
    return null;
  end if;
  update public.quotes
     set viewed_at = now()
   where public_token = p_token
     and status = 'sent'
     and viewed_at is null
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.quote_viewed(text) from public, anon;
grant execute on function public.quote_viewed(text) to authenticated;
