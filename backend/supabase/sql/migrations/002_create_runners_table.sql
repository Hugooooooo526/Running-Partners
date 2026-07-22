create table public.runners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  latitude numeric not null,
  longitude numeric not null,
  pace numeric,
  direction numeric default 0,
  is_active boolean default true,
  last_update timestamptz default now()
);

alter table public.runners enable row level security;

create policy "Anyone can view active runners"
  on public.runners for select
  using (is_active = true);

create policy "Users can insert own runner session"
  on public.runners for insert
  with check (auth.uid() = user_id);

create policy "Users can update own runner session"
  on public.runners for update
  using (auth.uid() = user_id);

create policy "Users can delete own runner session"
  on public.runners for delete
  using (auth.uid() = user_id);

create index idx_runners_active on public.runners (is_active) where is_active = true;
create index idx_runners_location on public.runners (latitude, longitude);
