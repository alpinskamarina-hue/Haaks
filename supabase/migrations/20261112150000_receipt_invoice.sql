-- Step 4 of «Сотрудник заполняет данные»: a receipt billed on an invoice (as materials) is marked,
-- so the next invoice from the same order does not bill it again.
alter table public.receipts add column if not exists invoice_id uuid references public.invoices on delete set null;
create index if not exists receipts_invoice on public.receipts (invoice_id) where invoice_id is not null;
