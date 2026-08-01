-- Switch the lifetime distance metric from miles to kilometres. The `users`
-- column was `total_miles`, populated by handle_run_completed() with
-- distance_km * 0.621371. Rename it to `total_km`, convert any existing
-- mileage to kilometres, and update the trigger to add distance_km directly
-- (no miles conversion).
alter table public.users
  rename column total_miles to total_km;

update public.users
  set total_km = round(total_km * 1.609344, 2);

create or replace function public.handle_run_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.ended_at is not null and old.ended_at is null then
    update public.users
    set total_runs = total_runs + 1,
        total_km = total_km + coalesce(new.distance_km, 0)
    where id in (new.sender_id, new.receiver_id);
  end if;
  return new;
end;
$$;
