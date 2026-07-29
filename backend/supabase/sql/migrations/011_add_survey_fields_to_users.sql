-- New users fill out a short survey right after sign-up (average jogging
-- time, distance, pace); these two columns hold the parts `avg_pace` didn't
-- already cover. Jog time is stored as total minutes (hours*60 + minutes)
-- rather than separate hour/minute columns since it's always read/written
-- as one duration. `avg_pace` (from 001_create_users_table.sql) is reused
-- as-is for the survey's "average pace (km/h)" value — it was never
-- populated by anything before this, so no migration of existing data is
-- needed.
alter table public.users
  add column avg_jog_minutes integer,
  add column avg_distance_km numeric;
