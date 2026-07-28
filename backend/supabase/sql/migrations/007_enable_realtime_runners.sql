-- Enable Realtime replication for the runners table so clients can
-- subscribe to postgres_changes instead of relying on a one-shot fetch.
alter publication supabase_realtime add table public.runners;

-- Ensure UPDATE/DELETE change payloads include the full old row (in
-- particular user_id, not just the internal id PK) so clients can
-- reconcile which runner disappeared/went offline.
alter table public.runners replica identity full;
