-- 0007_event_gallery_images.sql

create table if not exists event_gallery_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  alt_text text,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists event_gallery_images_event_idx
  on event_gallery_images (event_id, sort_order, created_at);

alter table event_gallery_images enable row level security;

create policy "public can read gallery for visible events"
  on event_gallery_images for select
  to anon, authenticated
  using (
    exists (
      select 1
      from events
      where events.id = event_gallery_images.event_id
        and events.status in ('published', 'sold_out', 'past')
    )
  );

create policy "admins can manage gallery"
  on event_gallery_images for all
  to authenticated
  using (exists (select 1 from admins where user_id = auth.uid()))
  with check (exists (select 1 from admins where user_id = auth.uid()));
