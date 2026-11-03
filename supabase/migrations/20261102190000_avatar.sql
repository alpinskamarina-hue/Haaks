-- Profile photo of the worker, a path in the private "documents" bucket (<uid>/avatar/...).
alter table public.profiles add column if not exists avatar_path text;
