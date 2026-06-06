-- 0001_events.sql

-- Enums
create type event_category as enum ('sound_bath','supper','run','book_circle','cycling','other');
create type event_status   as enum ('draft','published','sold_out','cancelled','past');
create type payment_mode   as enum ('razorpay','manual_upi','free');

-- updated_at trigger helper
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create table events (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  title             text not null,
  tagline           text,
  description       text,
  cover_image_url   text,
  category          event_category not null default 'other',
  start_at          timestamptz not null,
  end_at            timestamptz not null,
  venue_name        text,
  venue_address     text,
  venue_map_url     text,
  capacity          int not null default 0,
  registered_count  int not null default 0,
  price_paise       int not null default 0,
  payment_mode      payment_mode not null default 'free',
  upi_id            text,
  refund_policy     text,
  status            event_status not null default 'draft',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz
);

create index events_status_start_idx on events (status, start_at desc);
create index events_slug_idx on events (slug);

create trigger events_set_updated_at
  before update on events
  for each row execute function set_updated_at();

-- RLS: anon may read only publicly-visible events
alter table events enable row level security;

create policy "public can read visible events"
  on events for select
  to anon, authenticated
  using (status in ('published','sold_out','past'));
