-- Hours → invoice, step 2 (Nasim 2026-11-08): the builder sends a week of hours to the company; the company
-- opens a Dutch page without an account and gives Akkoord (with a name) or not, with a comment.

create table if not exists public.hour_approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  order_id uuid not null references public.orders on delete cascade,
  token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  date_from date not null,
  date_to date not null,
  hours numeric(6, 2) not null check (hours > 0),
  -- What the company saw: [{work_date, hours, note}], so the page stays the same after changes.
  lines jsonb not null default '[]',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_name text check (decided_name is null or char_length(decided_name) <= 200),
  comment text check (comment is null or char_length(comment) <= 1000),
  viewed_at timestamptz,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists hour_approvals_order on public.hour_approvals (order_id, created_at desc);
alter table public.hour_approvals enable row level security;

alter table public.order_hours add column if not exists approval_id uuid references public.hour_approvals on delete set null;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'hour_approvals' and policyname = 'own hour approvals') then
    create policy "own hour approvals" on public.hour_approvals for all
      using (user_id = auth.uid())
      with check (user_id = auth.uid() and exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
  end if;
end $$;

-- The company's page (server account only): the request with the order and the builder's names.
create or replace function public.hour_approval_get(p_token text)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', a.id, 'user_id', a.user_id, 'order_id', a.order_id, 'status', a.status, 'date_from', a.date_from, 'date_to', a.date_to,
    'hours', a.hours, 'lines', a.lines, 'decided_name', a.decided_name, 'decided_at', a.decided_at,
    'comment', a.comment, 'order_title', o.title, 'address', o.address, 'client_name', o.client_name,
    'worker_name', p.full_name, 'company', p.company_name)
    from public.hour_approvals a
    join public.orders o on o.id = a.order_id
    join public.profiles p on p.id = a.user_id
   where public.is_haaks_server() and a.token = p_token;
$$;

-- First opening by the company.
create or replace function public.hour_approval_viewed(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.hour_approvals set viewed_at = now()
   where public.is_haaks_server() and token = p_token and viewed_at is null and status = 'pending';
$$;

-- Akkoord or not. Only a pending request can be decided, once. «Niet akkoord» frees the hours, so the
-- builder can correct them and send again. Returns the request id (for the builder's notification).
create or replace function public.hour_approval_decide(p_token text, p_ok boolean, p_name text, p_comment text)
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
  update public.hour_approvals
     set status = case when p_ok then 'approved' else 'rejected' end,
         decided_name = left(nullif(trim(p_name), ''), 200),
         comment = left(nullif(trim(p_comment), ''), 1000),
         decided_at = now()
   where token = p_token and status = 'pending'
   returning id into v_id;
  if v_id is not null and not p_ok then
    update public.order_hours set approval_id = null where approval_id = v_id;
  end if;
  return v_id;
end;
$$;

revoke all on function public.hour_approval_get(text) from public, anon;
revoke all on function public.hour_approval_viewed(text) from public, anon;
revoke all on function public.hour_approval_decide(text, boolean, text, text) from public, anon;
grant execute on function public.hour_approval_get(text) to authenticated;
grant execute on function public.hour_approval_viewed(text) to authenticated;
grant execute on function public.hour_approval_decide(text, boolean, text, text) to authenticated;
