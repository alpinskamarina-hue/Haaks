-- From a job to an accepted offer in one line: lead -> quote -> order.
-- "Make offer" on a lead creates a quote filled from the job and links it here.
-- The quote's status then moves the lead along by itself:
--   sent -> "quoted", accepted -> "won" (and an order is opened), declined -> "dismissed".

alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads add constraint leads_status_check
  check (status in ('new', 'replied', 'quoted', 'won', 'dismissed'));
alter table public.leads add column if not exists quote_id uuid references public.quotes on delete set null;
create index if not exists leads_quote_id_idx on public.leads (quote_id);

-- Runs for the worker's own status buttons and for the client's "Akkoord" on /q/<token>
-- (the server account), so it is security definer and only touches rows of the quote's owner.
create or replace function public.quote_status_follow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_order uuid;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'accepted' and new.order_id is null then
    insert into public.orders (user_id, title, client_name, address)
    values (new.user_id, new.title, new.client_name, new.client_address)
    returning id into new_order;
    new.order_id := new_order;
  end if;

  update public.leads
  set status = case new.status
      when 'sent' then 'quoted'
      when 'accepted' then 'won'
      when 'declined' then 'dismissed'
      else 'replied'
    end,
    order_id = coalesce(new.order_id, order_id)
  where quote_id = new.id and user_id = new.user_id;

  return new;
end;
$$;

create or replace trigger quote_status_follow
  before update of status on public.quotes
  for each row execute function public.quote_status_follow();
