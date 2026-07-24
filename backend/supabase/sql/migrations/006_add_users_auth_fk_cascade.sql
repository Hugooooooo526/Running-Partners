alter table public.users
  add constraint users_id_fkey foreign key (id) references auth.users (id) on delete cascade;
