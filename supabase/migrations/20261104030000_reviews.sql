-- Client reviews. Only a real Haaks deal can be reviewed: the builder asks for a review from
-- a closed order or a sent/paid invoice, Haaks makes a one-time link, and the client fills
-- it in without an account. A review shows publicly 48 hours after it is written.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references auth.users on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  order_id uuid references public.orders on delete set null,
  invoice_id uuid references public.invoices on delete set null,
  work_id uuid references public.works on delete set null,
  job_title text not null check (char_length(job_title) between 1 and 120),
  client_name text check (char_length(client_name) <= 120),
  status text not null default 'requested' check (status in ('requested', 'submitted', 'hidden')),
  stars int check (stars between 1 and 5),
  quality int check (quality between 1 and 5),
  timing int check (timing between 1 and 5),
  communication int check (communication between 1 and 5),
  cleanliness int check (cleanliness between 1 and 5),
  body text check (char_length(body) <= 1000),
  reviewer_name text check (char_length(reviewer_name) <= 60),
  reviewer_city text check (char_length(reviewer_city) <= 60),
  submitted_at timestamptz,
  publish_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists reviews_order_uq on public.reviews (order_id) where order_id is not null;
create unique index if not exists reviews_invoice_uq on public.reviews (invoice_id) where invoice_id is not null;
create index if not exists reviews_worker_idx on public.reviews (worker_id, submitted_at desc);

alter table public.reviews enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'reviews' and policyname = 'own reviews read') then
    create policy "own reviews read" on public.reviews for select using (auth.uid() = worker_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'reviews' and policyname = 'server reads reviews') then
    create policy "server reads reviews" on public.reviews for select using (public.is_haaks_server());
  end if;
end $$;

-- The builder asks for a review of a closed order or a sent/paid invoice. Returns the review
-- id; asking again for the same order or invoice returns the same one.
create or replace function public.request_review(p_order uuid default null, p_invoice uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  rid uuid;
  v_title text;
  v_client text;
  v_order uuid := p_order;
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if p_invoice is not null then
    select coalesce(o.title, 'Factuur ' || i.number), i.client_name, coalesce(i.order_id, p_order)
      into v_title, v_client, v_order
      from public.invoices i left join public.orders o on o.id = i.order_id
      where i.id = p_invoice and i.user_id = auth.uid() and i.status in ('sent', 'paid');
    if v_title is null then
      raise exception 'not_allowed';
    end if;
  elsif p_order is not null then
    select o.title, o.client_name into v_title, v_client
      from public.orders o
      where o.id = p_order and o.user_id = auth.uid()
        and (o.status = 'closed'
             or exists (select 1 from public.invoices i where i.order_id = o.id and i.status in ('sent', 'paid'))
             or exists (select 1 from public.quotes q where q.order_id = o.id and q.status = 'accepted'));
    if v_title is null then
      raise exception 'not_allowed';
    end if;
  else
    raise exception 'not_allowed';
  end if;

  select id into rid from public.reviews
    where worker_id = auth.uid()
      and ((v_order is not null and order_id = v_order) or (p_invoice is not null and invoice_id = p_invoice))
    limit 1;
  if rid is not null then
    return rid;
  end if;

  insert into public.reviews (worker_id, order_id, invoice_id, work_id, job_title, client_name)
  values (
    auth.uid(), v_order, p_invoice,
    (select w.id from public.works w where w.order_id = v_order and w.user_id = auth.uid() limit 1),
    left(v_title, 120), left(v_client, 120)
  )
  returning id into rid;
  return rid;
end;
$$;

-- The client's form, called by the Haaks server for the /r/<token> page.
create or replace function public.submit_review(
  p_token text, p_stars int, p_quality int, p_timing int, p_communication int, p_cleanliness int,
  p_body text, p_name text, p_city text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  rid uuid;
begin
  if not public.is_haaks_server() then
    raise exception 'not allowed';
  end if;
  if p_stars is null or p_stars not between 1 and 5 or coalesce(trim(p_name), '') = '' then
    raise exception 'invalid';
  end if;
  update public.reviews set
    status = 'submitted',
    stars = p_stars,
    quality = case when p_quality between 1 and 5 then p_quality end,
    timing = case when p_timing between 1 and 5 then p_timing end,
    communication = case when p_communication between 1 and 5 then p_communication end,
    cleanliness = case when p_cleanliness between 1 and 5 then p_cleanliness end,
    body = nullif(left(trim(p_body), 1000), ''),
    reviewer_name = left(trim(p_name), 60),
    reviewer_city = nullif(left(trim(p_city), 60), ''),
    submitted_at = now(),
    publish_at = now() + interval '48 hours'
  where token = p_token and status = 'requested'
  returning id into rid;
  if rid is null then
    raise exception 'used';
  end if;
  return rid;
end;
$$;

-- Average stars and number of published reviews per builder in the catalog, for companies.
create or replace function public.catalog_ratings()
returns table (worker_id uuid, avg_stars numeric, n int)
language sql
stable
security definer
set search_path = ''
as $$
  select r.worker_id, round(avg(r.stars)::numeric, 1), count(*)::int
  from public.reviews r
  join public.profiles p on p.id = r.worker_id
  where r.status = 'submitted' and r.publish_at <= now()
    and p.in_catalog
    and (p.catalog_until is null or p.catalog_until > now())
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.account_type = 'company')
  group by r.worker_id;
$$;

revoke execute on function public.request_review(uuid, uuid) from public, anon;
revoke execute on function public.submit_review(text, int, int, int, int, int, text, text, text) from public, anon;
revoke execute on function public.catalog_ratings() from public, anon;
grant execute on function public.request_review(uuid, uuid) to authenticated;
grant execute on function public.submit_review(text, int, int, int, int, int, text, text, text) to authenticated;
grant execute on function public.catalog_ratings() to authenticated;
