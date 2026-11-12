-- The worker can send up to 6 photos in one message to the digital employee (e.g. photos of a
-- finished job for «Мои работы»). image_path stays the first photo for older code.
alter table staff_messages add column if not exists image_paths text[] not null default '{}'
  check (cardinality(image_paths) <= 6);
