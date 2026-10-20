-- Two quotes or invoices of the same worker must never share a number
-- (a double tap on a slow connection could create them).
alter table public.invoices add constraint invoices_user_number_key unique (user_id, number);
alter table public.quotes add constraint quotes_user_number_key unique (user_id, number);
