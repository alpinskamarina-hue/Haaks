-- «О себе» on the profile (Nasim, 2026-11-05): experience, strengths and a Dutch text for clients.
alter table public.profiles
  add column if not exists about text check (char_length(about) <= 600),
  add column if not exists experience_years smallint check (experience_years in (1, 3, 5, 10)),
  add column if not exists strengths text[] not null default '{}' check (cardinality(strengths) <= 8);

-- One photo block: the old loose «Фото работ» become finished jobs in «Мои работы».
insert into public.works (user_id, title, photos_after)
select p.id, 'Werk', array[ph]
from public.profiles p, unnest(p.work_photos) with ordinality as x(ph, n)
where cardinality(p.work_photos) > 0
order by p.id, x.n;

update public.profiles set work_photos = '{}' where cardinality(work_photos) > 0;
