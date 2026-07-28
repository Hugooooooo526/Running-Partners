-- Add route start/end coordinates so an invite can carry the jog route the
-- sender picked, and an ended_at marker so either participant can end an
-- active (accepted) session without touching the pending/accepted/declined
-- handshake semantics of `status`. An "active session" = status = 'accepted'
-- and ended_at is null.
alter table public.run_invites
  add column start_latitude numeric,
  add column start_longitude numeric,
  add column end_latitude numeric,
  add column end_longitude numeric,
  add column ended_at timestamptz;

-- Postgres RLS policies for the same command are OR'd together (permissive
-- by default), so this is additive to "Receivers can respond to invites",
-- not a replacement. It's what lets the SENDER end a session (the sender
-- otherwise has no UPDATE policy at all); the receiver's existing blanket
-- policy already covers ending too. The with check still requires status
-- to remain 'accepted', so this policy can't be used to hijack the row's
-- status/sender/receiver.
create policy "Participants can end an accepted session"
  on public.run_invites for update
  using (
    auth.uid() in (sender_id, receiver_id)
    and status = 'accepted'
    and ended_at is null
  )
  with check (
    auth.uid() in (sender_id, receiver_id)
    and status = 'accepted'
  );
