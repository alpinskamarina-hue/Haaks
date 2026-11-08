-- «KvK gecontroleerd» for companies (Nasim 2026-11-08, research item 5): Haaks checks by hand on kvk.nl
-- that the KvK number belongs to the company name, and builders see a badge on its jobs. Free: no paid
-- KvK API. Changing the KvK number removes the check.

alter table public.profiles add column if not exists kvk_checked_at timestamptz;
alter table public.profiles add column if not exists kvk_checked_name text check (kvk_checked_name is null or char_length(kvk_checked_name) <= 200);

-- Same guard as in 20261104090000_plans, plus the KvK check fields.
create or replace function public.protect_profile_plan()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_haaks_server() then
    if tg_op = 'INSERT' then
      new.plan := 'free';
      new.plan_until := null;
      new.trial_started_at := null;
      new.founder_at := null;
      new.telegram_chat_id := null;
      new.company_verified := false;
      new.is_admin := false;
      new.kvk_checked_at := null;
      new.kvk_checked_name := null;
    else
      if coalesce(current_setting('haaks.plan_change', true), '') <> 'on' and (
        new.plan is distinct from old.plan
        or new.plan_until is distinct from old.plan_until
        or new.trial_started_at is distinct from old.trial_started_at
        or new.founder_at is distinct from old.founder_at
      ) then
        raise exception 'The plan is changed by Haaks only';
      end if;
      if new.telegram_chat_id is not null and new.telegram_chat_id is distinct from old.telegram_chat_id then
        raise exception 'Telegram is linked by the Haaks bot only';
      end if;
      if new.company_verified is distinct from old.company_verified or new.is_admin is distinct from old.is_admin then
        raise exception 'Set by Haaks only';
      end if;
      -- A new KvK number needs a new check; otherwise the check is set by Haaks only.
      if new.kvk_number is distinct from old.kvk_number then
        new.kvk_checked_at := null;
        new.kvk_checked_name := null;
      elsif new.kvk_checked_at is distinct from old.kvk_checked_at or new.kvk_checked_name is distinct from old.kvk_checked_name then
        raise exception 'Set by Haaks only';
      end if;
    end if;
  end if;
  return new;
end;
$$;

-- Feed items of published jobs whose company passed the KvK check, for the badge in the feed.
create or replace function public.kvk_checked_items()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select cj.feed_item_id
    from public.company_jobs cj
    join public.profiles p on p.id = cj.company_id
   where cj.feed_item_id is not null
     and cj.status = 'published'
     and p.kvk_checked_at is not null;
$$;
revoke all on function public.kvk_checked_items() from public, anon;
grant execute on function public.kvk_checked_items() to authenticated;
