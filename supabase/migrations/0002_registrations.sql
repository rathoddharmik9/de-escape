-- 0002_registrations.sql

-- Enums
create type registration_status as enum (
  'pending',
  'awaiting_payment',
  'awaiting_verification',
  'approved',
  'rejected',
  'refunded',
  'attended',
  'no_show'
);

-- blocked_contacts table
create table blocked_contacts (
  id          uuid primary key default gen_random_uuid(),
  phone       text,
  email       text,
  reason      text not null,
  added_by    uuid, -- admin ID (when auth is set up)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create unique index blocked_contacts_phone_idx on blocked_contacts (phone) where phone is not null;
create unique index blocked_contacts_email_idx on blocked_contacts (email) where email is not null;

create trigger blocked_contacts_set_updated_at
  before update on blocked_contacts
  for each row execute function set_updated_at();

-- registrations table
create table registrations (
  id                  uuid primary key default gen_random_uuid(),
  event_id            uuid not null references events(id) on delete cascade,
  pass_code           text not null,
  full_name           text not null,
  phone               text not null,
  email               text not null,
  age                 int not null,
  city                text not null,
  instagram           text,
  heard_from          text,
  notes               text,
  custom_answers      jsonb default '{}'::jsonb,
  payment_mode        payment_mode not null,
  razorpay_order_id   text,
  razorpay_payment_id text,
  razorpay_signature  text,
  amount_paise        int not null default 0,
  screenshot_url      text, -- Supabase Storage private bucket path
  status              registration_status not null default 'pending',
  consent_whatsapp    boolean not null default true,
  rejected_reason     text,
  approved_at         timestamptz,
  approved_by         uuid,
  attended_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz
);

create trigger registrations_set_updated_at
  before update on registrations
  for each row execute function set_updated_at();

-- Indexes for performance
create index registrations_event_id_status_idx on registrations (event_id, status);
create index registrations_phone_idx on registrations (phone);
create index registrations_email_idx on registrations (email);
create unique index registrations_pass_code_event_id_idx on registrations (pass_code, event_id);

-- RLS: Enable row level security on both tables
alter table registrations enable row level security;
alter table blocked_contacts enable row level security;

-- Policies for registrations
create policy "service role has full access on registrations"
  on registrations to service_role using (true) with check (true);

-- Policies for blocked_contacts
create policy "service role has full access on blocked_contacts"
  on blocked_contacts to service_role using (true) with check (true);

-- Setup payment proofs storage bucket
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

create policy "allow_anon_uploads_payment_proofs"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'payment-proofs');

create policy "allow_service_role_all_payment_proofs"
  on storage.objects for all
  to service_role
  using (bucket_id = 'payment-proofs')
  with check (bucket_id = 'payment-proofs');
