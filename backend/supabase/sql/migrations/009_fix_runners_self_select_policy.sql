-- The existing "Anyone can view active runners" policy only allows SELECT
-- when is_active = true, which means a user cannot see their own row once
-- it goes inactive. Since `upsert(..., { onConflict: 'user_id' })` compiles
-- to INSERT ... ON CONFLICT (user_id) DO UPDATE, Postgres must be able to
-- see the conflicting row under RLS to perform the update branch. Without
-- visibility, the upsert fails with "new row violates row-level security
-- policy for table \"runners\"" (42501) and the user can never sync their
-- location again.
create policy "Users can view own runner session"
  on public.runners for select
  using (auth.uid() = user_id);
