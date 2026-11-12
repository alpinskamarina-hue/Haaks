-- Ratings of the digital employee's answers (Nasim, 2026-11-12, plan step 2).
-- The worker rates an answer: like / dislike, with an optional reason and comment.
-- A copy of the question and the answer is kept with the rating, so the Haaks team
-- sees only the conversations the worker chose to rate. Deleting the chat deletes the ratings.
create table if not exists public.staff_feedback (
  message_id uuid primary key references public.staff_messages (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  rating smallint not null check (rating in (1, -1)),
  reason text check (reason in ('wrong', 'unclear', 'language', 'long', 'other')),
  comment text check (char_length(comment) <= 500),
  question text check (char_length(question) <= 4000),
  answer text not null check (char_length(answer) <= 8000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_feedback_time on public.staff_feedback (created_at desc);

alter table public.staff_feedback enable row level security;

create policy "staff feedback: own read" on public.staff_feedback for select using (user_id = auth.uid());
create policy "staff feedback: own insert" on public.staff_feedback for insert with check (user_id = auth.uid());
create policy "staff feedback: own update" on public.staff_feedback for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "staff feedback: own delete" on public.staff_feedback for delete using (user_id = auth.uid());
-- The moderation page reads ratings through the server account (admin only in the app).
create policy "staff feedback: server read" on public.staff_feedback for select using (public.is_haaks_server());
