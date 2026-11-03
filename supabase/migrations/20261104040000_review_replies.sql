-- The builder can answer a review once, publicly, and report a review to Haaks moderation.
-- A report made before the review goes public (the first 48 hours) holds it back until
-- Haaks decides; a report on a review that is already public leaves it visible meanwhile.
alter table public.reviews add column if not exists reply text check (char_length(reply) <= 600);
alter table public.reviews add column if not exists reply_at timestamptz;
alter table public.reviews add column if not exists report_reason text
  check (report_reason in ('insult', 'personal', 'false', 'not_client', 'other'));
alter table public.reviews add column if not exists report_note text check (char_length(report_note) <= 500);
alter table public.reviews add column if not exists reported_at timestamptz;
alter table public.reviews add column if not exists held boolean not null default false;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'reviews' and policyname = 'server updates reviews') then
    create policy "server updates reviews" on public.reviews for update
      using (public.is_haaks_server()) with check (public.is_haaks_server());
  end if;
end $$;

create or replace function public.reply_to_review(p_id uuid, p_text text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(trim(p_text), '') = '' then
    raise exception 'empty';
  end if;
  update public.reviews
    set reply = left(trim(p_text), 600), reply_at = now()
    where id = p_id and worker_id = auth.uid() and status = 'submitted' and reply is null;
  if not found then
    raise exception 'not_allowed';
  end if;
end;
$$;

create or replace function public.report_review(p_id uuid, p_reason text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_reason not in ('insult', 'personal', 'false', 'not_client', 'other') then
    raise exception 'bad reason';
  end if;
  update public.reviews
    set report_reason = p_reason,
        report_note = nullif(left(trim(p_note), 500), ''),
        reported_at = now(),
        held = publish_at > now()
    where id = p_id and worker_id = auth.uid() and status = 'submitted' and reported_at is null;
  if not found then
    raise exception 'not_allowed';
  end if;
end;
$$;

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
  where r.status = 'submitted' and r.publish_at <= now() and not r.held
    and p.in_catalog
    and (p.catalog_until is null or p.catalog_until > now())
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.account_type = 'company')
  group by r.worker_id;
$$;

revoke execute on function public.reply_to_review(uuid, text) from public, anon;
revoke execute on function public.report_review(uuid, text, text) from public, anon;
grant execute on function public.reply_to_review(uuid, text) to authenticated;
grant execute on function public.report_review(uuid, text, text) to authenticated;
