-- «Для бухгалтера», step 2 (Nasim, 2026-11-06): a link for the accountant without an account,
-- and the accountant's questions about receipts and invoices.

create table if not exists public.accountant_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  quarter text not null check (quarter ~ '^\d{4}-[1-4]$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '60 days',
  revoked_at timestamptz,
  opened_at timestamptz,
  open_count integer not null default 0,
  unique (user_id, quarter)
);

alter table public.accountant_shares enable row level security;

create policy "own accountant shares" on public.accountant_shares
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "server reads accountant shares" on public.accountant_shares
  for select using (public.is_haaks_server());

create table if not exists public.accountant_questions (
  id uuid primary key default gen_random_uuid(),
  share_id uuid not null references public.accountant_shares on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  receipt_id uuid references public.receipts on delete cascade,
  invoice_id uuid references public.invoices on delete cascade,
  kind text not null check (kind in ('business', 'what', 'unreadable', 'company', 'paid', 'other')),
  body text check (char_length(body) <= 500),
  answer_kind text check (answer_kind in ('work', 'private', 'newphoto', 'paid', 'other')),
  answer text check (char_length(answer) <= 500),
  answered_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists accountant_questions_share_idx on public.accountant_questions (share_id, created_at);
create index if not exists accountant_questions_user_idx on public.accountant_questions (user_id, answered_at);

alter table public.accountant_questions enable row level security;

create policy "own accountant questions read" on public.accountant_questions
  for select using (user_id = auth.uid());

create policy "own accountant questions answer" on public.accountant_questions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "server reads accountant questions" on public.accountant_questions
  for select using (public.is_haaks_server());

-- The accountant opens the link: count it.
create or replace function public.accountant_share_opened(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.accountant_shares
     set opened_at = now(), open_count = open_count + 1
   where token = p_token and revoked_at is null and expires_at > now() and public.is_haaks_server();
$$;

-- The accountant asks about a receipt or an invoice of that quarter's builder.
create or replace function public.ask_accountant_question(p_token text, p_receipt uuid, p_invoice uuid, p_kind text, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.accountant_shares;
  new_id uuid;
begin
  if not public.is_haaks_server() then
    raise exception 'not allowed';
  end if;
  select * into s from public.accountant_shares where token = p_token and revoked_at is null and expires_at > now();
  if s.id is null then
    raise exception 'link closed';
  end if;
  if p_receipt is not null and not exists (select 1 from public.receipts where id = p_receipt and user_id = s.user_id) then
    raise exception 'not found';
  end if;
  if p_invoice is not null and not exists (select 1 from public.invoices where id = p_invoice and user_id = s.user_id) then
    raise exception 'not found';
  end if;
  if (select count(*) from public.accountant_questions where share_id = s.id and created_at > now() - interval '1 day') >= 50 then
    raise exception 'too many';
  end if;
  insert into public.accountant_questions (share_id, user_id, receipt_id, invoice_id, kind, body)
  values (s.id, s.user_id, p_receipt, p_invoice, p_kind, nullif(trim(p_body), ''))
  returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.accountant_share_opened(text) from public, anon;
revoke all on function public.ask_accountant_question(text, uuid, uuid, text, text) from public, anon;
grant execute on function public.accountant_share_opened(text) to authenticated;
grant execute on function public.ask_accountant_question(text, uuid, uuid, text, text) to authenticated;

-- The accountant's page shows the receipts and the km log of the shared quarter.
create policy "server reads receipts" on public.receipts
  for select using (public.is_haaks_server());

create policy "server reads trips" on public.trips
  for select using (public.is_haaks_server());
