-- Social-style profiles (Nasim, 2026-11-04): every builder can pick a unique @nick.
-- The public page lives at /@nick and shows the same things as the passport, without contacts.
-- 3-30 characters: latin letters, digits, dot and underscore; starts and ends with a letter or digit.
alter table public.profiles add column if not exists username text
  check (username ~ '^[a-z0-9][a-z0-9._]{1,28}[a-z0-9]$');
create unique index if not exists profiles_username_key on public.profiles (username);
