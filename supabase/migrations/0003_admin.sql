-- 0003_admin.sql

-- Admins Table
create table admins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  email       text not null unique,
  role        text not null default 'super_admin',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create unique index admins_user_id_idx on admins (user_id);

create trigger admins_set_updated_at
  before update on admins
  for each row execute function set_updated_at();

-- Audit Log Table
create table audit_log (
  id            uuid primary key default gen_random_uuid(),
  actor_id      uuid not null,
  action        text not null,
  target_table  text not null,
  target_id     uuid,
  before        jsonb,
  after         jsonb,
  ip            text,
  created_at    timestamptz not null default now()
);

create index audit_log_target_idx on audit_log (target_table, target_id, created_at desc);

-- RLS: Enable security
alter table admins enable row level security;
alter table audit_log enable row level security;

-- Admin policies
create policy "service role has full access on admins"
  on admins to service_role using (true) with check (true);

create policy "service role has full access on audit_log"
  on audit_log to service_role using (true) with check (true);

-- Authenticated admins select policy (for checking roles)
create policy "admins can read admins table"
  on admins for select
  to authenticated
  using (exists (select 1 from admins where user_id = auth.uid()));

create policy "admins can read audit_log"
  on audit_log for select
  to authenticated
  using (exists (select 1 from admins where user_id = auth.uid()));

-- Update RLS policies for events and registrations to allow admins write access
create policy "admins can perform all actions on events"
  on events for all
  to authenticated
  using (exists (select 1 from admins where user_id = auth.uid()))
  with check (exists (select 1 from admins where user_id = auth.uid()));

create policy "admins can perform all actions on registrations"
  on registrations for all
  to authenticated
  using (exists (select 1 from admins where user_id = auth.uid()))
  with check (exists (select 1 from admins where user_id = auth.uid()));

-- Trigger to automatically create admin record when specific email signs up
create or replace function public.handle_admin_signup()
returns trigger as $$
begin
  -- promote admin emails
  if new.email in (
    'dharmik@de-escape.in',
    'dharmikrathod@example.com',
    'dharmikrathod98@gmail.com',
    'rathoddharmik9@gmail.com'
  ) then
    insert into public.admins (user_id, email, role)
    values (new.id, new.email, 'super_admin')
    on conflict (email) do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_admin_signup();

-- Setup public event-media bucket if not exists
insert into storage.buckets (id, name, public)
values ('event-media', 'event-media', true)
on conflict (id) do nothing;

create policy "allow_anon_select_event_media"
  on storage.objects for select
  to anon
  using (bucket_id = 'event-media');

create policy "allow_admin_all_event_media"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'event-media' and exists (select 1 from public.admins where user_id = auth.uid()))
  with check (bucket_id = 'event-media' and exists (select 1 from public.admins where user_id = auth.uid()));
