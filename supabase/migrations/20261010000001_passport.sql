-- ZZP Paspoort: database schema for Supabase.
-- Applied by `supabase db push` (see README). Project in an EU region.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  company_name text,
  trade text,
  city text,
  phone text,
  kvk_number text,
  btw_number text,
  language text not null default 'pl',
  passport_token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  passport_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  doc_type text not null check (doc_type in ('kvk_extract', 'vca', 'avb', 'car', 'other')),
  file_path text not null,
  file_name text not null,
  mime_type text not null,
  document_number text,
  holder_name text,
  issued_on date,
  expires_on date,
  insurer text,
  coverage_amount text,
  ai_summary text,
  ai_warnings text[] not null default '{}',
  ai_status text not null default 'pending' check (ai_status in ('pending', 'done', 'failed', 'skipped')),
  show_in_passport boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists documents_user_id_idx on public.documents (user_id);

create table if not exists public.passport_views (
  id bigserial primary key,
  profile_id uuid not null references public.profiles on delete cascade,
  viewed_at timestamptz not null default now(),
  user_agent text
);

create index if not exists passport_views_profile_id_idx on public.passport_views (profile_id, viewed_at desc);

-- Row level security: every worker sees only their own rows.
-- The public passport page reads through the service role on the server.
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.passport_views enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own documents" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own passport views" on public.passport_views
  for select using (auth.uid() = profile_id);

-- Create an empty profile for every new user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Private storage bucket. Files live under "<user id>/<file>".
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "own files read" on storage.objects
  for select using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "own files write" on storage.objects
  for insert with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "own files delete" on storage.objects
  for delete using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
