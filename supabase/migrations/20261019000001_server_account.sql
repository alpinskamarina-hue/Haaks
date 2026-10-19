-- The public pages (/p, /q, /f) read data without a signed-in worker. Instead of the
-- service role key they sign in as one service account whose app_metadata.role is
-- "haaks_server" (set in auth.users, not changeable by users themselves). These
-- policies give that account only what the public pages need.

create or replace function public.is_haaks_server()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'haaks_server', false);
$$;

create policy "server reads profiles" on public.profiles
  for select using (public.is_haaks_server());

create policy "server reads documents" on public.documents
  for select using (public.is_haaks_server());

create policy "server logs passport views" on public.passport_views
  for insert with check (public.is_haaks_server());

create policy "server reads quotes" on public.quotes
  for select using (public.is_haaks_server());

-- Only the "Akkoord" step: a sent quote becomes accepted.
create policy "server accepts quotes" on public.quotes
  for update using (public.is_haaks_server() and status = 'sent')
  with check (public.is_haaks_server() and status = 'accepted');

create policy "server reads invoices" on public.invoices
  for select using (public.is_haaks_server());

-- Signed links to passport files.
create policy "server reads files" on storage.objects
  for select using (bucket_id = 'documents' and public.is_haaks_server());
