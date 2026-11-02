-- Order feed (лента заказов): jobs the agent collects from open sources, shared by all workers.
-- Spec: plans/lenta-zakazov-tz.md in the project files.
-- Free workers see a job 24 hours after it was published and without contact or link;
-- Pro workers see it at once. That rule lives in feed_for_me(), not in the page.

-- Plan: set by Haaks (for now by hand in the SQL editor), never by the worker.
alter table public.profiles add column if not exists plan text not null default 'free' check (plan in ('free', 'pro'));
-- E-mail alerts about new jobs: off, a daily digest, or at once (Pro).
alter table public.profiles add column if not exists feed_email text not null default 'off' check (feed_email in ('off', 'daily', 'instant'));
alter table public.profiles add column if not exists notify_email text;

-- auth.uid() is set for requests from the site; the SQL editor and migrations have none.
create or replace function public.protect_profile_plan()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_haaks_server() then
    if tg_op = 'INSERT' then
      new.plan := 'free';
    elsif new.plan is distinct from old.plan then
      raise exception 'The plan is changed by Haaks only';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_plan on public.profiles;
create trigger protect_profile_plan
  before insert or update on public.profiles
  for each row execute function public.protect_profile_plan();

create table if not exists public.feed_items (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('telegram', 'bekendmakingen', 'email', 'tenderned', 'haaks')),
  source_name text,
  source_url text,
  kind text not null default 'private' check (kind in ('private', 'business', 'permit', 'tender')),
  -- Short summary in Dutch written by the agent, never the full post (AVG, copyright).
  title text not null,
  summary text not null,
  -- {"ru": {"title": "...", "summary": "..."}, "pl": {...}, ...}
  translations jsonb not null default '{}',
  -- Dutch trade keys: tegelzetter, timmerman, stukadoor, schilder, loodgieter, elektricien,
  -- metselaar, dakdekker, aannemer, klusjesman
  trades text[] not null default '{}',
  city text,
  timing text,
  budget text,
  -- Only a contact the author published in the post.
  contact text,
  published_at timestamptz,
  -- Example jobs: their age stays the same, so the feed always shows fresh and old ones.
  -- Removed when the real sources are connected.
  is_demo boolean not null default false,
  demo_age interval,
  expires_at timestamptz,
  -- For merging the same post published in several groups.
  fingerprint text unique,
  created_at timestamptz not null default now(),
  check (published_at is not null or demo_age is not null)
);

create index if not exists feed_items_published_idx on public.feed_items (published_at desc);

alter table public.feed_items enable row level security;
-- Workers read the feed only through feed_for_me().
create policy "server reads feed" on public.feed_items
  for select using (public.is_haaks_server());

-- What a worker did with a job: hid it or took it into their own leads.
create table if not exists public.feed_actions (
  user_id uuid not null references auth.users on delete cascade,
  item_id uuid not null references public.feed_items on delete cascade,
  action text not null check (action in ('hidden', 'taken')),
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.feed_actions enable row level security;
create policy "own feed actions" on public.feed_actions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "server reads feed actions" on public.feed_actions
  for select using (public.is_haaks_server());

-- Which job was sent to whom, so nobody gets the same job twice.
create table if not exists public.feed_notifications (
  user_id uuid not null references auth.users on delete cascade,
  item_id uuid not null references public.feed_items on delete cascade,
  channel text not null check (channel in ('email', 'telegram', 'whatsapp')),
  sent_at timestamptz not null default now(),
  primary key (user_id, item_id, channel)
);

alter table public.feed_notifications enable row level security;
create policy "server reads notifications" on public.feed_notifications
  for select using (public.is_haaks_server());
create policy "server logs notifications" on public.feed_notifications
  for insert with check (public.is_haaks_server());

-- Taking a job from the feed makes a lead; remember which job it came from.
alter table public.leads drop constraint if exists leads_source_check;
alter table public.leads add constraint leads_source_check
  check (source in ('manual', 'telegram', 'email', 'bekendmakingen', 'tenderned', 'haaks'));
alter table public.leads add column if not exists feed_item_id uuid references public.feed_items on delete set null;
create unique index if not exists leads_feed_item_idx on public.leads (user_id, feed_item_id);

-- The feed as the signed-in worker may see it. "locked" jobs are newer than 24 hours
-- for a free worker: only the city and trades are given, to show that they exist.
create or replace function public.feed_for_me()
returns table (
  id uuid,
  source text,
  source_name text,
  source_url text,
  kind text,
  title text,
  summary text,
  translations jsonb,
  trades text[],
  city text,
  timing text,
  budget text,
  contact text,
  published_at timestamptz,
  is_demo boolean,
  locked boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select coalesce((select p.plan from public.profiles p where p.id = auth.uid()), 'free') = 'pro' as pro
  ),
  items as (
    select f.*, coalesce(f.published_at, now() - f.demo_age) as published
    from public.feed_items f
    where auth.uid() is not null
      and (f.expires_at is null or f.expires_at > now())
      and coalesce(f.published_at, now() - f.demo_age) > now() - interval '30 days'
  )
  select
    i.id,
    case when l.locked then null else i.source end,
    case when l.locked then null else i.source_name end,
    case when me.pro then i.source_url end,
    i.kind,
    case when l.locked then null else i.title end,
    case when l.locked then null else i.summary end,
    case when l.locked then '{}'::jsonb else i.translations end,
    i.trades,
    i.city,
    case when l.locked then null else i.timing end,
    case when l.locked then null else i.budget end,
    case when me.pro then i.contact end,
    i.published,
    i.is_demo,
    l.locked
  from items i
  cross join me
  cross join lateral (select not me.pro and i.published > now() - interval '24 hours' as locked) l
  order by i.published desc
  limit 300;
$$;

revoke execute on function public.feed_for_me() from public, anon;
grant execute on function public.feed_for_me() to authenticated;

-- Example jobs for trying the feed before the sources are connected.
insert into public.feed_items (source, source_name, kind, title, summary, translations, trades, city, timing, budget, contact, is_demo, demo_age, fingerprint)
values
(
  'telegram', 'Praca Holandia', 'private',
  'Tegels in badkamer en toilet, Utrecht (Leidsche Rijn)',
  'Badkamer van ongeveer 7 m² (vloer en wanden tot het plafond) en een toilet van 2 m². De tegels zijn al gekocht. De klant wil foto''s van eerder werk zien.',
  '{
    "en": {"title": "Tiles in bathroom and toilet, Utrecht (Leidsche Rijn)", "summary": "Bathroom of about 7 m² (floor and walls up to the ceiling) and a 2 m² toilet. The tiles are already bought. The client wants photos of earlier work."},
    "ru": {"title": "Плитка в ванной и туалете, Utrecht (Leidsche Rijn)", "summary": "Ванная около 7 м² (пол и стены до потолка) и туалет 2 м². Плитку заказчик уже купил. Просит фото прошлых работ."},
    "pl": {"title": "Płytki w łazience i WC, Utrecht (Leidsche Rijn)", "summary": "Łazienka ok. 7 m² (podłoga i ściany do sufitu) i WC 2 m². Płytki są już kupione. Klient chce zobaczyć zdjęcia wcześniejszych prac."},
    "uk": {"title": "Плитка у ванній і туалеті, Utrecht (Leidsche Rijn)", "summary": "Ванна близько 7 м² (підлога і стіни до стелі) і туалет 2 м². Плитку замовник уже купив. Просить фото попередніх робіт."},
    "ro": {"title": "Faianță în baie și toaletă, Utrecht (Leidsche Rijn)", "summary": "Baie de aproximativ 7 m² (pardoseală și pereți până la tavan) și o toaletă de 2 m². Plăcile sunt deja cumpărate. Clientul vrea poze cu lucrări anterioare."}
  }',
  '{tegelzetter}', 'Utrecht', 'volgende week', '~ €2.500', 'demo-klant@example.com', true, interval '12 minutes', 'demo-1'
),
(
  'haaks', 'Bouwbedrijf (voorbeeld) BV', 'business',
  '2 tegelzetters gezocht voor nieuwbouw, Amersfoort',
  '24 appartementen, badkamers en keukens. VCA en een eigen AVB-verzekering zijn verplicht. Betaling elke 2 weken op factuur.',
  '{
    "en": {"title": "2 tilers needed for new-build, Amersfoort", "summary": "24 apartments, bathrooms and kitchens. VCA and your own AVB insurance are required. Paid every 2 weeks on invoice."},
    "ru": {"title": "Нужны 2 плиточника на новостройку, Amersfoort", "summary": "24 квартиры, санузлы и кухни. Нужны VCA и своя страховка AVB. Оплата раз в 2 недели по счёту."},
    "pl": {"title": "Potrzebnych 2 glazurników na nową budowę, Amersfoort", "summary": "24 mieszkania, łazienki i kuchnie. Wymagane VCA i własne ubezpieczenie AVB. Płatność co 2 tygodnie na fakturę."},
    "uk": {"title": "Потрібні 2 плиточники на новобудову, Amersfoort", "summary": "24 квартири, санвузли та кухні. Потрібні VCA і власна страховка AVB. Оплата раз на 2 тижні за рахунком."},
    "ro": {"title": "2 faianțari căutați pentru construcție nouă, Amersfoort", "summary": "24 de apartamente, băi și bucătării. Sunt obligatorii VCA și propria asigurare AVB. Plata la fiecare 2 săptămâni pe factură."}
  }',
  '{tegelzetter}', 'Amersfoort', '6 weken, vanaf 17 november', '€38–42 per uur', 'planning@example.com', true, interval '1 hour', 'demo-2'
),
(
  'bekendmakingen', 'Omgevingsvergunning · Zeist', 'permit',
  'Aanbouw met nieuwe badkamer, Zeist',
  'De eigenaren vroegen een vergunning aan voor een aanbouw van 18 m² met een badkamer op de begane grond. Na goedkeuring zijn er bouwers en afwerking nodig.',
  '{
    "en": {"title": "Extension with a new bathroom, Zeist", "summary": "The owners applied for a permit for an 18 m² extension with a ground-floor bathroom. Once approved they will need builders and finishing work."},
    "ru": {"title": "Пристройка к дому и новая ванная, Zeist", "summary": "Хозяева подали заявку на пристройку 18 м² с ванной на первом этаже. После одобрения им понадобятся строители и отделка."},
    "pl": {"title": "Dobudowa z nową łazienką, Zeist", "summary": "Właściciele złożyli wniosek o pozwolenie na dobudowę 18 m² z łazienką na parterze. Po zatwierdzeniu będą potrzebni budowlańcy i wykończenie."},
    "uk": {"title": "Прибудова з новою ванною, Zeist", "summary": "Власники подали заявку на прибудову 18 м² з ванною на першому поверсі. Після схвалення їм знадобляться будівельники та оздоблення."},
    "ro": {"title": "Extindere cu baie nouă, Zeist", "summary": "Proprietarii au cerut autorizație pentru o extindere de 18 m² cu baie la parter. După aprobare vor avea nevoie de constructori și finisaje."}
  }',
  '{aannemer,tegelzetter}', 'Zeist', 'over 2–3 maanden', null, null, true, interval '3 hours', 'demo-3'
),
(
  'telegram', 'Робота в Нідерландах', 'private',
  'Houten vloer en plinten, Amsterdam-Noord',
  'Laminaat leggen in woonkamer en twee slaapkamers, samen ongeveer 55 m², plus nieuwe plinten. Materiaal is er al.',
  '{
    "en": {"title": "Wooden floor and skirting, Amsterdam-Noord", "summary": "Laying laminate in the living room and two bedrooms, about 55 m² in total, plus new skirting boards. The material is already there."},
    "ru": {"title": "Ламинат и плинтусы, Amsterdam-Noord", "summary": "Уложить ламинат в гостиной и двух спальнях, всего около 55 м², и поставить новые плинтусы. Материал уже есть."},
    "pl": {"title": "Panele i listwy, Amsterdam-Noord", "summary": "Ułożenie paneli w salonie i dwóch sypialniach, razem ok. 55 m², plus nowe listwy. Materiał jest na miejscu."},
    "uk": {"title": "Ламінат і плінтуси, Amsterdam-Noord", "summary": "Покласти ламінат у вітальні та двох спальнях, разом близько 55 м², і поставити нові плінтуси. Матеріал уже є."},
    "ro": {"title": "Parchet laminat și plinte, Amsterdam-Noord", "summary": "Montaj laminat în sufragerie și două dormitoare, în total circa 55 m², plus plinte noi. Materialul există deja."}
  }',
  '{timmerman}', 'Amsterdam', 'deze maand', null, 'demo-vloer@example.com', true, interval '5 hours', 'demo-4'
),
(
  'email', 'Werkspot', 'private',
  'Tegelachterwand in keuken, Houten',
  'Nieuwe keuken: een achterwand van ongeveer 4 m² betegelen en uitsparingen voor stopcontacten maken. Materiaal is er.',
  '{
    "en": {"title": "Tiled backsplash in kitchen, Houten", "summary": "New kitchen: tile a backsplash of about 4 m² and cut out for the sockets. The material is there."},
    "ru": {"title": "Фартук из плитки на кухне, Houten", "summary": "Новая кухня, нужно выложить фартук около 4 м² и подрезать под розетки. Материал есть."},
    "pl": {"title": "Płytki nad blatem w kuchni, Houten", "summary": "Nowa kuchnia: ułożenie płytek nad blatem, ok. 4 m², z wycięciami na gniazdka. Materiał jest."},
    "uk": {"title": "Фартух з плитки на кухні, Houten", "summary": "Нова кухня, потрібно викласти фартух близько 4 м² і підрізати під розетки. Матеріал є."},
    "ro": {"title": "Faianță la bucătărie, Houten", "summary": "Bucătărie nouă: faianță pe circa 4 m² deasupra blatului, cu decupaje pentru prize. Materialul există."}
  }',
  '{tegelzetter}', 'Houten', 'binnen een maand', null, null, true, interval '26 hours', 'demo-5'
),
(
  'telegram', 'Praca Holandia', 'private',
  'Schilderwerk binnen, Rotterdam',
  'Een eengezinswoning van binnen schilderen: plafonds en muren in 5 kamers en het trappenhuis. Kleuren zijn gekozen.',
  '{
    "en": {"title": "Interior painting, Rotterdam", "summary": "Paint the inside of a family house: ceilings and walls in 5 rooms and the stairwell. The colours are chosen."},
    "ru": {"title": "Покраска внутри дома, Rotterdam", "summary": "Покрасить дом изнутри: потолки и стены в 5 комнатах и на лестнице. Цвета выбраны."},
    "pl": {"title": "Malowanie wnętrz, Rotterdam", "summary": "Malowanie domu w środku: sufity i ściany w 5 pokojach i na klatce schodowej. Kolory są wybrane."},
    "uk": {"title": "Фарбування всередині будинку, Rotterdam", "summary": "Пофарбувати будинок усередині: стелі та стіни в 5 кімнатах і на сходах. Кольори обрані."},
    "ro": {"title": "Zugrăveli interioare, Rotterdam", "summary": "Zugrăvirea unei case: tavane și pereți în 5 camere și casa scării. Culorile sunt alese."}
  }',
  '{schilder}', 'Rotterdam', 'december', null, null, true, interval '30 hours', 'demo-6'
),
(
  'tenderned', 'TenderNed', 'tender',
  'Renovatie sanitair in een school, Nieuwegein',
  'De gemeente zoekt een aannemer voor de renovatie van 6 toiletgroepen in de zomer van 2027. Geschikt voor een team van 2–3 mensen.',
  '{
    "en": {"title": "Renovating toilets in a school, Nieuwegein", "summary": "The municipality is looking for a contractor to renovate 6 toilet blocks in summer 2027. Suits a team of 2–3 people."},
    "ru": {"title": "Ремонт санузлов в школе, Nieuwegein", "summary": "Гемеенте ищет подрядчика на ремонт 6 санузлов летом 2027. Подходит для бригады из 2–3 человек."},
    "pl": {"title": "Remont toalet w szkole, Nieuwegein", "summary": "Gmina szuka wykonawcy do remontu 6 węzłów sanitarnych latem 2027. Dla ekipy 2–3 osób."},
    "uk": {"title": "Ремонт санвузлів у школі, Nieuwegein", "summary": "Громада шукає підрядника на ремонт 6 санвузлів улітку 2027. Підходить для бригади з 2–3 людей."},
    "ro": {"title": "Renovarea toaletelor unei școli, Nieuwegein", "summary": "Primăria caută un antreprenor pentru renovarea a 6 grupuri sanitare în vara lui 2027. Potrivit pentru o echipă de 2–3 persoane."}
  }',
  '{tegelzetter,loodgieter}', 'Nieuwegein', 'inschrijven vóór 20 november', null, null, true, interval '50 hours', 'demo-7'
)
on conflict (fingerprint) do nothing;
