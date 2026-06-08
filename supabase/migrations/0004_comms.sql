-- 0004_comms.sql

-- 1. message_log Table
create table message_log (
  id                  uuid primary key default gen_random_uuid(),
  registration_id     uuid references registrations(id) on delete cascade,
  event_id            uuid references events(id) on delete cascade,
  channel             text not null, -- 'whatsapp' | 'email'
  template_key        text not null,
  recipient           text not null,
  payload             jsonb not null default '{}'::jsonb,
  provider_message_id text,
  status              text not null default 'queued', -- 'queued' | 'sent' | 'delivered' | 'read' | 'failed'
  error               text,
  sent_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz
);

create index message_log_registration_id_idx on message_log (registration_id);
create index message_log_template_status_idx on message_log (template_key, status);

create trigger message_log_set_updated_at
  before update on message_log
  for each row execute function set_updated_at();

-- 2. whatsapp_inbox Table
create table whatsapp_inbox (
  id            uuid primary key default gen_random_uuid(),
  phone         text not null,
  body          text not null,
  received_at   timestamptz not null default now(),
  handled       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

create index whatsapp_inbox_phone_idx on whatsapp_inbox (phone);

create trigger whatsapp_inbox_set_updated_at
  before update on whatsapp_inbox
  for each row execute function set_updated_at();

-- 3. broadcasts Table
create table broadcasts (
  id                    uuid primary key default gen_random_uuid(),
  event_id              uuid references events(id) on delete set null,
  filter                jsonb not null default '{}'::jsonb,
  channels              text[] not null, -- e.g. ['whatsapp', 'email']
  whatsapp_template_key text,
  email_subject         text,
  email_body_html       text,
  sent_count            int not null default 0,
  sent_at               timestamptz not null default now(),
  sent_by               uuid references auth.users(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz
);

create trigger broadcasts_set_updated_at
  before update on broadcasts
  for each row execute function set_updated_at();

-- 4. whatsapp_templates Table
create table whatsapp_templates (
  id                  uuid primary key default gen_random_uuid(),
  template_key        text not null unique,
  meta_template_name  text not null,
  body_text           text not null,
  variables           text[] not null,
  status              text not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  approved_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz
);

create trigger whatsapp_templates_set_updated_at
  before update on whatsapp_templates
  for each row execute function set_updated_at();

-- 5. reminder_queue Table
create table reminder_queue (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations(id) on delete cascade,
  send_at         timestamptz not null,
  kind            text not null, -- 't_24h' | 't_2h' | 'post_event'
  sent            boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz
);

create index reminder_queue_send_at_sent_idx on reminder_queue (send_at, sent) where sent = false;

create trigger reminder_queue_set_updated_at
  before update on reminder_queue
  for each row execute function set_updated_at();

-- 6. app_settings Table
create table app_settings (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  value       text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create trigger app_settings_set_updated_at
  before update on app_settings
  for each row execute function set_updated_at();

-- RLS: Enable security
alter table message_log enable row level security;
alter table whatsapp_inbox enable row level security;
alter table broadcasts enable row level security;
alter table whatsapp_templates enable row level security;
alter table reminder_queue enable row level security;
alter table app_settings enable row level security;

-- Admin and Service Role access policies
create policy "service role has full access on message_log"
  on message_log to service_role using (true) with check (true);

create policy "service role has full access on whatsapp_inbox"
  on whatsapp_inbox to service_role using (true) with check (true);

create policy "service role has full access on broadcasts"
  on broadcasts to service_role using (true) with check (true);

create policy "service role has full access on whatsapp_templates"
  on whatsapp_templates to service_role using (true) with check (true);

create policy "service role has full access on reminder_queue"
  on reminder_queue to service_role using (true) with check (true);

create policy "service role has full access on app_settings"
  on app_settings to service_role using (true) with check (true);

-- Authenticated admins policies
create policy "admins can perform all actions on message_log"
  on message_log for all to authenticated
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

create policy "admins can perform all actions on whatsapp_inbox"
  on whatsapp_inbox for all to authenticated
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

create policy "admins can perform all actions on broadcasts"
  on broadcasts for all to authenticated
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

create policy "admins can perform all actions on whatsapp_templates"
  on whatsapp_templates for all to authenticated
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

create policy "admins can perform all actions on reminder_queue"
  on reminder_queue for all to authenticated
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));

create policy "admins can perform all actions on app_settings"
  on app_settings for all to authenticated
  using (exists (select 1 from public.admins where user_id = auth.uid()))
  with check (exists (select 1 from public.admins where user_id = auth.uid()));
