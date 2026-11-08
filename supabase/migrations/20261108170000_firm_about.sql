-- «О компании» in «Фирмы рядом»: a short card about the firm, read once from its website by the server
-- account (facts + a summary per language written by AI) and shared by all builders.
alter table public.nearby_firms
  add column if not exists about jsonb,
  add column if not exists about_at timestamptz;
