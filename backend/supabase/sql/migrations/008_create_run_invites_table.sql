create table public.run_invites (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.users(id) on delete cascade not null,
  receiver_id uuid references public.users(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  responded_at timestamptz,
  constraint run_invites_not_self check (sender_id <> receiver_id)
);

-- Only one pending invite at a time between a given sender and receiver.
create unique index run_invites_pending_unique
  on public.run_invites (sender_id, receiver_id)
  where status = 'pending';

create index idx_run_invites_receiver on public.run_invites (receiver_id);
create index idx_run_invites_sender on public.run_invites (sender_id);

alter table public.run_invites enable row level security;

create policy "Users can view their own invites"
  on public.run_invites for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send invites"
  on public.run_invites for insert
  with check (auth.uid() = sender_id);

create policy "Receivers can respond to invites"
  on public.run_invites for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- Enable Realtime so senders/receivers see invite status changes live.
alter publication supabase_realtime add table public.run_invites;
alter table public.run_invites replica identity full;
