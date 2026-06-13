# Codebase and Database Discovery Report

This report summarizes findings from the codebase and database discovery for the `de-escape-app` project.

---

## 1. Database Table Schemas
The database schemas are defined in SQL migration files located under `supabase/migrations/`. Below are the detailed structures of the `admins`, `events`, `registrations`, and `audit_log` tables.

### A. `admins` Table (defined in `0003_admin.sql`)
This table manages administrative users who have write access to the system.
* **Columns**:
  * `id` (`uuid`, Primary Key, default `gen_random_uuid()`)
  * `user_id` (`uuid`, Not Null, Foreign Key references `auth.users(id)` on delete cascade)
  * `email` (`text`, Not Null, Unique)
  * `role` (`text`, Not Null, default `'super_admin'`)
  * `created_at` (`timestamptz`, Not Null, default `now()`)
  * `updated_at` (`timestamptz`)
* **Indexes**:
  * Unique index `admins_user_id_idx` on `(user_id)`
* **RLS Policies**:
  * Enable Row Level Security.
  * Policy `service role has full access on admins`: Allows `service_role` full access (`using (true) with check (true)`).
  * Policy `admins can read admins table`: Allows authenticated users to select from the table if they exist in `admins` with a matching `user_id` (using `exists (select 1 from admins where user_id = auth.uid())`).

### B. `events` Table (defined in `0001_events.sql` & modified in `0005_fix_events_schema.sql`)
This table stores details about all hosted events (e.g. sound baths, suppers, runs).
* **Columns**:
  * `id` (`uuid`, Primary Key, default `gen_random_uuid()`)
  * `slug` (`text`, Unique, Not Null)
  * `title` (`text`, Not Null)
  * `tagline` (`text`, Nullable)
  * `description` (`text`, Nullable)
  * `cover_image_url` (`text`, Nullable)
  * `category` (`event_category` enum, Not Null, default `'other'`. Valid values: `'sound_bath'`, `'supper'`, `'run'`, `'book_circle'`, `'cycling'`, `'other'`)
  * `start_at` (`timestamptz`, Not Null)
  * `end_at` (`timestamptz`, Not Null)
  * `venue_name` (`text`, Nullable)
  * `venue_address` (`text`, Nullable)
  * `venue_map_url` (`text`, Nullable)
  * `capacity` (`int`, Not Null, default `0`)
  * `registered_count` (`int`, Not Null, default `0`)
  * `price_paise` (`int`, Not Null, default `0`)
  * `payment_mode` (`payment_mode` enum, Not Null, default `'free'`. Valid values: `'razorpay'`, `'manual_upi'`, `'free'`)
  * `upi_id` (`text`, Nullable)
  * `refund_policy` (`text`, Nullable)
  * `status` (`event_status` enum, Not Null, default `'draft'`. Valid values: `'draft'`, `'published'`, `'sold_out'`, `'cancelled'`, `'past'`)
  * `created_at` (`timestamptz`, Not Null, default `now()`)
  * `updated_at` (`timestamptz`, Nullable)
  * `custom_fields` (`jsonb`, Not Null, default `'[]'::jsonb` - added in `0005_fix_events_schema.sql`)
  * `community_group_invite` (`text`, Nullable - added in `0005_fix_events_schema.sql`)
  * `cancelled_reason` (`text`, Nullable - added in `0005_fix_events_schema.sql`)
  * `upi_qr_image_url` (`text`, Nullable - added in `0005_fix_events_schema.sql`)
* **Indexes**:
  * Index `events_status_start_idx` on `(status, start_at desc)`
  * Index `events_slug_idx` on `(slug)`
* **RLS Policies**:
  * Enable Row Level Security.
  * Policy `public can read visible events`: Allows `anon` and `authenticated` users to select events where status is in `'published'`, `'sold_out'`, or `'past'`.
  * Policy `admins can perform all actions on events`: Allows authenticated users in the `admins` table full CRUD capability (`all` operations, with check constraints).

### C. `registrations` Table (defined in `0002_registrations.sql`)
This table manages registrations/passes of attendees for various events.
* **Columns**:
  * `id` (`uuid`, Primary Key, default `gen_random_uuid()`)
  * `event_id` (`uuid`, Not Null, foreign key references `events(id)` on delete cascade)
  * `pass_code` (`text`, Not Null)
  * `full_name` (`text`, Not Null)
  * `phone` (`text`, Not Null)
  * `email` (`text`, Not Null)
  * `age` (`int`, Not Null)
  * `city` (`text`, Not Null)
  * `instagram` (`text`, Nullable)
  * `heard_from` (`text`, Nullable)
  * `notes` (`text`, Nullable)
  * `custom_answers` (`jsonb`, default `'{}'::jsonb`)
  * `payment_mode` (`payment_mode` enum, Not Null)
  * `razorpay_order_id` (`text`, Nullable)
  * `razorpay_payment_id` (`text`, Nullable)
  * `razorpay_signature` (`text`, Nullable)
  * `amount_paise` (`int`, Not Null, default `0`)
  * `screenshot_url` (`text`, Nullable) - stores Supabase Storage private bucket path
  * `status` (`registration_status` enum, Not Null, default `'pending'`. Valid values: `'pending'`, `'awaiting_payment'`, `'awaiting_verification'`, `'approved'`, `'rejected'`, `'refunded'`, `'attended'`, `'no_show'`)
  * `consent_whatsapp` (`boolean`, Not Null, default `true`)
  * `rejected_reason` (`text`, Nullable)
  * `approved_at` (`timestamptz`, Nullable)
  * `approved_by` (`uuid`, Nullable)
  * `attended_at` (`timestamptz`, Nullable)
  * `created_at` (`timestamptz`, Not Null, default `now()`)
  * `updated_at` (`timestamptz`, Nullable)
* **Indexes**:
  * Index `registrations_event_id_status_idx` on `(event_id, status)`
  * Index `registrations_phone_idx` on `(phone)`
  * Index `registrations_email_idx` on `(email)`
  * Unique index `registrations_pass_code_event_id_idx` on `(pass_code, event_id)`
* **RLS Policies**:
  * Enable Row Level Security.
  * Policy `service role has full access on registrations`: Full access to `service_role`.
  * Policy `admins can perform all actions on registrations`: Allows authenticated users in the `admins` table full CRUD capability (`all` operations).

### D. `audit_log` Table (defined in `0003_admin.sql`)
This table records administrative actions for security tracking.
* **Columns**:
  * `id` (`uuid`, Primary Key, default `gen_random_uuid()`)
  * `actor_id` (`uuid`, Not Null) - the admin user ID performing the action
  * `action` (`text`, Not Null) - e.g. `event.create`, `event.publish`
  * `target_table` (`text`, Not Null) - e.g. `events`, `registrations`
  * `target_id` (`uuid`, Nullable)
  * `before` (`jsonb`, Nullable) - snapshot of data before mutation
  * `after` (`jsonb`, Nullable) - snapshot of data after mutation
  * `ip` (`text`, Nullable)
  * `created_at` (`timestamptz`, Not Null, default `now()`)
* **Indexes**:
  * Index `audit_log_target_idx` on `(target_table, target_id, created_at desc)`
* **RLS Policies**:
  * Enable Row Level Security.
  * Policy `service role has full access on audit_log`: Full access to `service_role`.
  * Policy `admins can read audit_log`: Allows authenticated admins to read audit logs.

---

## 2. Database Triggers and Functions
Database triggers are used to automate data synchronization and handle user access promotion.

### A. Auto-setting `updated_at` (defined in `0001_events.sql` and used globally)
A plpgsql helper function sets the `updated_at` timestamp to the current time before any update:
```sql
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
```
This is bound to the following tables via `BEFORE UPDATE` triggers:
* `events` (trigger `events_set_updated_at` in `0001_events.sql`)
* `blocked_contacts` (trigger `blocked_contacts_set_updated_at` in `0002_registrations.sql`)
* `registrations` (trigger `registrations_set_updated_at` in `0002_registrations.sql`)
* `admins` (trigger `admins_set_updated_at` in `0003_admin.sql`)
* `message_log` (trigger `message_log_set_updated_at` in `0004_comms.sql`)
* `whatsapp_inbox` (trigger `whatsapp_inbox_set_updated_at` in `0004_comms.sql`)
* `broadcasts` (trigger `broadcasts_set_updated_at` in `0004_comms.sql`)
* `whatsapp_templates` (trigger `whatsapp_templates_set_updated_at` in `0004_comms.sql`)
* `reminder_queue` (trigger `reminder_queue_set_updated_at` in `0004_comms.sql`)
* `app_settings` (trigger `app_settings_set_updated_at` in `0004_comms.sql`)

### B. Admin Signup Trigger (defined in `0003_admin.sql`)
A special trigger automatically promotes newly signed-up auth users to administrators if their email is part of a pre-approved list.
* **Function**: `public.handle_admin_signup()`
  ```sql
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
  ```
* **Trigger Binding**: `on_auth_user_created` runs `AFTER INSERT` on `auth.users`. It is declared with `security definer` to bypass Row Level Security constraints (since the new user does not yet have select/insert permissions on public tables).

---

## 3. Next.js Middleware and Callback Routes

### A. Next.js Middleware (`src/middleware.ts`)
The middleware runs on all paths matching `["/admin/:path*"]`.
* **Auth Session Retrieval**: Uses `@supabase/ssr` to build a server client and fetch the user session via `supabase.auth.getUser()`.
* **RLS Circular Policy Bypass**: The `admins` table RLS policy requires a user to be an admin to select from the `admins` table. Consequently, a user's own session token cannot read the `admins` table if they aren't authorized yet. To resolve this circular dependency, the middleware instantiates a separate service-role client (`createServiceClient`) using `SUPABASE_SERVICE_ROLE_KEY` to verify whether the logged-in user is a registered administrator.
* **Authorization Logic**:
  * For requests to `/admin/*` (excluding `/admin/login`):
    * If there is no authenticated user session, it redirects the user to `/admin/login`.
    * If a session exists but the user's `id` is not present in the `admins` table, the middleware calls `supabase.auth.signOut()` and redirects to `/admin/login?error=unauthorized`.
  * For requests to exactly `/admin/login`:
    * If a session exists and the user is verified as an admin, it redirects them to `/admin`.

### B. Callback Route (`src/app/auth/callback/route.ts`)
This route handles the authorization code exchange after an admin clicks their magic link.
* **Route Method**: `GET`
* **Session Exchange**: Calls `supabase.auth.exchangeCodeForSession(code)` with the `code` parameter.
* **Authorization Check**:
  * Fetches the user session via `supabase.auth.getSession()`.
  * If a user is logged in, it queries the `admins` table using the service-role client (to bypass circular RLS).
  * If the user is not found in the `admins` table, it calls `supabase.auth.signOut()` and redirects to `/admin/login?error=unauthorized`.
  * Otherwise, it redirects to the path specified in the `next` search parameter (defaulting to `/admin`).

---

## 4. Admin Login Interface and Authentication
* **Structure**: The page is located at `src/app/admin/login/page.tsx` and uses Next.js Client Components. It includes a `Suspense` wrapper to handle search parameters (`useSearchParams()`), display errors like `unauthorized` or `auth-failed`, and capture user input (email).
* **Process**:
  1. The user inputs their email address.
  2. Clicking "Send magic link" invokes the `signInWithMagicLink(email)` Server Action (defined in `src/lib/actions/auth.ts`).
  3. The Server Action calls Supabase's `auth.signInWithOtp` with the lowercase, trimmed email and redirects to `${siteUrl}/auth/callback`.
  4. The screen updates to show a confirmation ("Check your email" box) stating that a magic link has been sent.

---

## 5. Key Server Actions
Server actions are organized under `src/lib/actions/`. Below are the primary actions used in the application:

### A. Event Management (`src/lib/actions/admin-events.ts`)
* `createEvent(rawInput: unknown)`: Validates event input against `eventInputSchema` (Zod), checks slug uniqueness, generates a UUID, inserts the draft event, and writes a log to `audit_log`.
* `updateEvent(eventId: string, rawInput: unknown)`: Validates input, gets the old event data, updates the event record, and registers an `event.update` audit log.
* `publishEvent(eventId: string)`: Updates the event status to `'published'` and records a log.
* `cancelEvent(eventId: string, reason: string)`: Updates the event status to `'cancelled'`, appends the cancellation reason to the description, and logs the event.
  * **Code Quality Note / Bug**: In `cancelEvent` line 236, the code appends `event.status` (a string such as `'published'`) to the description instead of the original description:
    ```typescript
    .update({ status: "cancelled", description: `[CANCELLED: ${reason}] \n\n` + event.status })
    ```
    This causes the previous description to be overwritten by the previous status text.
* `updateCustomFields(eventId: string, customFields: unknown[])`: Updates the event's JSONB `custom_fields` column.

### B. Registrations Review (`src/lib/actions/admin-registrations.ts`)
* `approveRegistration(registrationId: string)`: Validates the admin session, fetches the registration and corresponding event, updates status to `'approved'`, decrements capacity/updates counts, sends confirmation email and WhatsApp template alerts, and writes to `audit_log`.
* `rejectRegistration(registrationId: string, reason: string)`: Marks status as `'rejected'`, sets `rejected_reason`, and logs to audit feed.
* `refundRegistration(registrationId: string)`: Marks status as `'refunded'` and logs to audit feed.
* `markAttendance(registrationId: string, attended: boolean)`: Marks status as `'attended'` or `'no_show'` depending on the boolean flag.

### C. Communications Management (`src/lib/actions/admin-comms.ts`)
* `sendBroadcast(rawInput: unknown)`: Triggers email/WhatsApp broadcasts.
* `replyToWhatsApp(phone: string, text: string)`: Responds to inbox queries.
* `markInboxHandled(phone: string)`: Marks an inbox entry as processed.
* `syncWhatsAppTemplates()`: Fetches templates from Meta and syncs them.
* `updateWhatsAppTemplate(...)`: Updates template values.

### D. Settings Management (`src/lib/actions/admin-settings.ts`)
* `updateAppSettings(settings: Record<string, string>)`: Mutates global application preferences.
* `addBlockedContact(phone, email, reason)`: Blacklists a phone/email contact.
* `removeBlockedContact(id)`: Removes a contact from the blacklist.

---

## 6. End-to-End Tests and Scripts
* **Automated Tests**: There are no automated testing configurations or test suites (such as Jest, Vitest, Playwright, or Cypress) in the codebase.
* **Scripts** (located in `scripts/`):
  * `scripts/check-tables.ts`: Executes a lightweight query against the `registrations` table using a service-role client to verify database connection and schema initialization.
  * `scripts/seed.ts`: Seeds the database with the initial mock events defined in `src/lib/mock-data.ts`. Run via `npm run seed`.

---

## 7. Database Accessibility and Seed/Migration Commands
* **Accessibility**: Verified successfully. Running `npx tsx scripts/check-tables.ts` establishes a connection and returns `Registrations table exists! First row: []`, confirming the database is accessible and migrations are successfully applied.
* **Applying Migrations**:
  * There is no local Supabase CLI installation/command configured in the `package.json` scripts.
  * To apply schema changes, migrations under `supabase/migrations/` must be manually copied and executed in the **Supabase Dashboard SQL Editor**, or applied from a system containing a configured Supabase CLI via `supabase db push`.
* **Seeding the Database**:
  * The database can be seeded using the following command:
    ```bash
    npm run seed
    ```
    This maps to `tsx scripts/seed.ts` and inserts 6 default events into the database. Running this command confirms successful seeding:
    ```
    Seeded 6 events.
    ```
