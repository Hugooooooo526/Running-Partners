-- Turn a completed run_invite (status = 'accepted', ended_at set) into a run
-- history record: the recorded GPS path plus the distance/duration computed
-- from it. These columns are written by whichever participant ends the
-- session, alongside `ended_at` — the existing "Participants can end an
-- accepted session" policy (010) already permits both sender and receiver to
-- update any column while status = 'accepted' and ended_at is null, so no new
-- RLS policy is needed here. The existing "Users can view their own invites"
-- policy (008) has no status/ended_at filter, so both participants can also
-- read their completed run history through the same policy.
alter table public.run_invites
  add column path jsonb not null default '[]'::jsonb,
  add column distance_km numeric,
  add column duration_minutes integer;

-- Keep users.total_runs / users.total_miles in sync whenever a session ends,
-- regardless of which participant's client performs the update.
create function public.handle_run_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.ended_at is not null and old.ended_at is null then
    update public.users
    set total_runs = total_runs + 1,
        total_miles = total_miles + coalesce(new.distance_km, 0) * 0.621371
    where id in (new.sender_id, new.receiver_id);
  end if;
  return new;
end;
$$;

create trigger on_run_invite_ended
  after update on public.run_invites
  for each row execute procedure public.handle_run_completed();
