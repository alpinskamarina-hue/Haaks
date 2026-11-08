-- «Я настоящий предприниматель» (Nasim 2026-11-08, research item 3): facts from the builder's own
-- administration in Haaks that show self-employment under Wet DBA (different clients, no single client
-- dominating, own quotes, invoices, materials). Only counts and percentages leave the database, never
-- client names. Readable by the builder (own id) and the server account (public passport).
create or replace function public.ondernemer_facts(p_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with since as (select (now() at time zone 'Europe/Amsterdam')::date - 365 as d),
  inv as (
    select lower(btrim(i.client_name)) as client,
           coalesce((select sum(coalesce((l->>'quantity')::numeric, 0) * coalesce((l->>'unit_price')::numeric, 0))
                       from jsonb_array_elements(i.lines) l), 0) as excl
      from public.invoices i, since s
     where i.user_id = p_user
       and i.status in ('sent', 'paid')
       and i.credit_for is null
       and i.credited_by is null
       and i.invoice_date >= s.d
  ),
  per_client as (
    select client, sum(excl) as excl from inv where client is not null and client <> '' group by client
  )
  select case when auth.uid() = p_user or public.is_haaks_server() then jsonb_build_object(
    'invoices', (select count(*) from inv),
    'clients', (select count(*) from per_client),
    'revenue', (select coalesce(sum(excl), 0) from per_client),
    'top_share', (select case when sum(excl) > 0 then round(100 * max(excl) / sum(excl)) end from per_client),
    'quotes', (select count(*) from public.quotes q, since s
                where q.user_id = p_user and q.status <> 'draft' and coalesce(q.sent_at, q.updated_at)::date >= s.d),
    'quotes_accepted', (select count(*) from public.quotes q, since s
                where q.user_id = p_user and q.status = 'accepted' and coalesce(q.accepted_at, q.updated_at)::date >= s.d),
    'receipts', (select count(*) from public.receipts r, since s
                where r.user_id = p_user and coalesce(r.purchased_on, r.created_at::date) >= s.d),
    'first_invoice', (select min(i.invoice_date) from public.invoices i
                where i.user_id = p_user and i.status in ('sent', 'paid') and i.credit_for is null)
  ) end;
$$;
revoke all on function public.ondernemer_facts(uuid) from public, anon;
grant execute on function public.ondernemer_facts(uuid) to authenticated;
