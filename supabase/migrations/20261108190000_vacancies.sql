-- ZZP vacancies (Nasim, 2026-11-08): construction jobs for freelancers from Google Jobs
-- (via Treg) go to the feed section «Компании ищут» with source 'googlejobs'.
alter table public.feed_items drop constraint if exists feed_items_source_check;
alter table public.feed_items add constraint feed_items_source_check
  check (source in ('telegram', 'bekendmakingen', 'email', 'tenderned', 'haaks', 'facebook', 'googlejobs'));

alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads add constraint leads_source_check
  check (source in ('manual', 'telegram', 'email', 'bekendmakingen', 'tenderned', 'haaks', 'facebook', 'googlejobs'));
