-- Step 5b of the digital employee (Nasim, 2026-11-12): the employee prepares a draft invoice
-- or quote as a card under its answer. Nothing is created until the worker presses «Создать».
alter table public.staff_messages
  add column if not exists action jsonb,
  add column if not exists action_status text check (action_status in ('done')),
  add column if not exists action_ref uuid;
