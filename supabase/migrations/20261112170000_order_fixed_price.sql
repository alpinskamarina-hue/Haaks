-- A fixed price for the whole job (aanneemsom). When set, «invoice from order» bills this amount
-- as one line instead of the hours; fixed_invoice_id marks that it is billed, so it is billed once.
alter table orders add column if not exists fixed_price numeric(12, 2)
  check (fixed_price is null or (fixed_price > 0 and fixed_price < 10000000));
alter table orders add column if not exists fixed_invoice_id uuid references invoices (id) on delete set null;
