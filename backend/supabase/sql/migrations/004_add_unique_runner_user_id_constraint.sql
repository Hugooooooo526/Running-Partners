alter table public.runners
  add constraint runners_user_id_key unique (user_id);
