-- «Фраза дня» on the home screen: a 👍 per builder per day. The phrases themselves live in the code.
create table if not exists public.quote_likes (
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);
alter table public.quote_likes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'quote_likes' and policyname = 'own quote likes') then
    create policy "own quote likes" on public.quote_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- How many builders liked the phrase of a day (a number only, no names).
create or replace function public.quote_like_count(p_day date)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int from public.quote_likes where day = p_day;
$$;
revoke execute on function public.quote_like_count(date) from public, anon;
grant execute on function public.quote_like_count(date) to authenticated;
