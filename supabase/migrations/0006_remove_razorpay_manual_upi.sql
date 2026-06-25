-- 0006_remove_razorpay_manual_upi.sql

-- Preserve existing paid records by moving the retired Razorpay mode to manual UPI.
update registrations
set payment_mode = 'manual_upi'
where payment_mode::text = 'razorpay';

update events
set payment_mode = 'manual_upi'
where payment_mode::text = 'razorpay';

alter table events alter column payment_mode drop default;

alter type payment_mode rename to payment_mode_old;
create type payment_mode as enum ('manual_upi', 'free');

alter table events
  alter column payment_mode type payment_mode
  using payment_mode::text::payment_mode,
  alter column payment_mode set default 'manual_upi';

alter table registrations
  alter column payment_mode type payment_mode
  using payment_mode::text::payment_mode;

drop type payment_mode_old;

alter table registrations
  drop column if exists razorpay_order_id,
  drop column if exists razorpay_payment_id,
  drop column if exists razorpay_signature;

alter table events
  add column if not exists show_on_home boolean not null default false;

create index if not exists events_show_on_home_start_idx
  on events (show_on_home, status, start_at)
  where show_on_home = true;
