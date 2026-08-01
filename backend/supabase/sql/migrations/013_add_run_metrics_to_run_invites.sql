-- Log the per-run performance metrics alongside the GPS path so they show up
-- in run history instead of being re-estimated on every dashboard render.
-- The client derives these from the recorded distance/duration (no heart rate
-- sensor is present, so bpm/calories are estimates — see runEstimates.ts) and
-- writes them at the same time it writes ended_at, which the "Participants
-- can end an accepted session" policy (010) already permits.
alter table public.run_invites
  add column avg_pace_kmh numeric,
  add column avg_heart_rate_bpm integer,
  add column calories_kcal numeric;
