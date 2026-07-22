create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  username text not null,
  avatar_url text,
  avg_pace numeric,
  total_runs integer default 0,
  total_miles numeric default 0,
  created_at timestamptz default now()
);

alter table public.users enable row level security;

create policy "Users can view all profiles"
  on public.users for select
  using (true);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);
