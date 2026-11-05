-- «Мои карты»: the builder's store discount cards (Gamma, Praxis, Bouwmaat…), shown as a barcode at the till.
-- store = a key from src/lib/store-cards.ts, or 'other' with the shop name in custom_name.
create table if not exists public.store_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  store text not null check (length(store) between 1 and 40),
  custom_name text check (custom_name is null or length(custom_name) <= 60),
  number text not null check (length(number) between 1 and 120),
  format text not null default 'code128' check (format in ('ean13', 'code128', 'qr')),
  photo_path text,
  created_at timestamptz not null default now()
);
create index if not exists store_cards_user on public.store_cards (user_id, created_at);
alter table public.store_cards enable row level security;
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'store_cards' and policyname = 'own store cards') then
    create policy "own store cards" on public.store_cards
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
