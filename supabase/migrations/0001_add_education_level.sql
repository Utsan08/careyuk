-- Adds the volunteer's education level to the student profile.
--
-- Used by the matcher's level gate (lib/matching.ts → passesLevelGate): an
-- event that wants med students won't be shown to a high schooler. The app
-- degrades gracefully until this runs (signup saves everything except this
-- field, and matching treats everyone as eligible), so it's safe to apply
-- whenever. Idempotent.
--
-- Run in the Supabase SQL editor (or `supabase db push`).

alter table public.student
  add column if not exists education_level text;

-- Optional: keep the column to the four values the UI offers.
-- alter table public.student
--   drop constraint if exists student_education_level_check;
-- alter table public.student
--   add constraint student_education_level_check
--   check (education_level is null or education_level in ('highschool','undergrad','med_student','none'));
