-- Passport reminders (Nasim, 2026-11-05): a push and Telegram message 30 and 7 days before a
-- document expires and on the day it expires, plus «ваш паспорт открыли» when the link is opened.

-- One row per document and stage (30, 7, 0 days), so each reminder goes out once.
create table if not exists public.doc_reminders (
  document_id uuid not null references public.documents on delete cascade,
  stage int not null check (stage in (30, 7, 0)),
  sent_at timestamptz not null default now(),
  primary key (document_id, stage)
);
alter table public.doc_reminders enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'doc_reminders' and policyname = 'server reads doc reminders') then
    create policy "server reads doc reminders" on public.doc_reminders for select using (public.is_haaks_server());
  end if;
  if not exists (select 1 from pg_policies where tablename = 'doc_reminders' and policyname = 'server logs doc reminders') then
    create policy "server logs doc reminders" on public.doc_reminders for insert with check (public.is_haaks_server());
  end if;
  -- To tell the builder about an opening only after a quiet spell, the server looks at the last one.
  if not exists (select 1 from pg_policies where tablename = 'passport_views' and policyname = 'server reads passport views') then
    create policy "server reads passport views" on public.passport_views for select using (public.is_haaks_server());
  end if;
end $$;
