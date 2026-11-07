-- Invoices step 2 (Nasim 2026-11-07): a sent invoice is corrected with a credit note (creditfactuur)
-- and a new invoice, as Dutch rules require, instead of being edited.
-- credit_for: on the credit note, the invoice it cancels. credited_by: on that invoice, its credit note.
-- replaces: on the new invoice, the invoice it replaces.

alter table public.invoices add column if not exists credit_for uuid references public.invoices on delete restrict;
alter table public.invoices add column if not exists credited_by uuid references public.invoices on delete set null;
alter table public.invoices add column if not exists replaces uuid references public.invoices on delete set null;
