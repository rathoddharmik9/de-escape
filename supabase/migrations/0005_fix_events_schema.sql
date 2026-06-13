-- 0005_fix_events_schema.sql

ALTER TABLE events
  ADD COLUMN custom_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN community_group_invite text,
  ADD COLUMN cancelled_reason text,
  ADD COLUMN upi_qr_image_url text;
