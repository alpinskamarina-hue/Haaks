-- Pin the search path of is_haaks_server (Supabase security advisor, lint 0011).
alter function public.is_haaks_server() set search_path = '';
