# Plan 3 — Admin Auth & CRUD

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement magic-link authentication, administrator authorization guards, route protection via Next.js Middleware, database-backed dashboards, CRUD pages and Server Actions for events, review action handlers for registrations (Approve, Reject, Refund, Attend), and audit logging.

---

## ⚠️ SESSION KICKOFF PROTOCOL (read first, do not skip)

Before writing any code:
1. **Read these files to load context** (in this order):
   - [SPEC.md](file:///Users/dharmikrathod/Documents/Claude/Projects/De-escape/SPEC.md) — §2.2 (admin auth), §5 (data model), §7 (admin flow), §11 (admin panel inventory).
   - [layout.tsx](file:///Users/dharmikrathod/Documents/Claude/Projects/de-escape-app/src/app/admin/layout.tsx) — current admin layout.
   - [page.tsx](file:///Users/dharmikrathod/Documents/Claude/Projects/de-escape-app/src/app/admin/page.tsx) — current admin dashboard home.
   - [page.tsx](file:///Users/dharmikrathod/Documents/Claude/Projects/de-escape-app/src/app/admin/events/page.tsx) — current admin events list.
   - [page.tsx](file:///Users/dharmikrathod/Documents/Claude/Projects/de-escape-app/src/app/admin/registrations/page.tsx) — current admin registrations list.
   - [page.tsx](file:///Users/dharmikrathod/Documents/Claude/Projects/de-escape-app/src/app/admin/login/page.tsx) — current admin login page.

2. **Confirm details.** Clarify the email address to auto-promote to `super_admin`.

---

## 🙋 WHAT I NEED FROM YOU (user action items)

| # | Item | Why | How to get it |
|---|------|-----|---------------|
| 1 | **Designated Admin Email** | Auto-promotion to admin on signup | Provide email address to promote (e.g. `dharmikrathod@example.com`) |
| 2 | **Confirm media upload bucket** | To store event cover images | Storage settings in dashboard (bucket `event-media` must be public) |

---

## File Structure (created/modified by this plan)

- Create: `supabase/migrations/0003_admin.sql` — admins, audit_log, auth triggers, RLS policies.
- Create: `src/middleware.ts` — cookies-aware auth check and path interceptor.
- Create: `src/app/auth/callback/route.ts` — auth callback route for magic-link code exchange.
- Create: `src/lib/actions/admin-events.ts` — server actions for creating, editing, publishing, and cancelling events.
- Create: `src/lib/actions/admin-registrations.ts` — server actions for reviewing attendee statuses.
- Create: `src/app/admin/events/new/page.tsx` — new event page.
- Create: `src/app/admin/events/[id]/page.tsx` — event details page.
- Create: `src/app/admin/registrations/[id]/page.tsx` — attendee registration details page.
- Create: `src/app/admin/audit-log/page.tsx` — audit log display feed.
- Modify: `src/app/admin/page.tsx` — wire KPI cards and actions feed to query Supabase.
- Modify: `src/app/admin/events/page.tsx` — wire events list table.
- Modify: `src/app/admin/registrations/page.tsx` — wire filterable registrations browser.
- Modify: `src/app/admin/login/page.tsx` — wire form submit to trigger magic-link action.

---

## Task 1: Schema Migration (Admin & Logs)

- [ ] **Step 1: Write SQL file `supabase/migrations/0003_admin.sql`**
  ```sql
  -- admins table
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

  -- audit_log table
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

  -- RLS
  alter table admins enable row level security;
  alter table audit_log enable row level security;

  create policy "service role has full access on admins"
    on admins to service_role using (true) with check (true);

  create policy "service role has full access on audit_log"
    on audit_log to service_role using (true) with check (true);

  create policy "admins can read admins table"
    on admins for select to authenticated
    using (exists (select 1 from admins where user_id = auth.uid()));

  -- Update RLS policies on events and registrations
  create policy "admins can perform all actions on events"
    on events for all to authenticated
    using (exists (select 1 from admins where user_id = auth.uid()))
    with check (exists (select 1 from admins where user_id = auth.uid()));

  create policy "admins can perform all actions on registrations"
    on registrations for all to authenticated
    using (exists (select 1 from admins where user_id = auth.uid()))
    with check (exists (select 1 from admins where user_id = auth.uid()));

  -- Trigger to auto-promote specific email signups (replace placeholders with user emails)
  create or replace function public.handle_admin_signup()
  returns trigger as $$
  begin
    if new.email = 'dharmik@de-escape.in' or new.email = 'dharmikrathod@example.com' then
      insert into public.admins (user_id, email, role)
      values (new.id, new.email, 'super_admin');
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

  create policy "allow_anon_select_event_media" on storage.objects
    for select to anon using (bucket_id = 'event-media');

  create policy "allow_admin_all_event_media" on storage.objects
    for all to authenticated using (bucket_id = 'event-media' and exists (select 1 from public.admins where user_id = auth.uid()));
  ```

- [ ] **Step 2: Apply SQL Migration**
  Paste and run in Supabase Dashboard SQL Editor.

---

## Task 2: Auth Guards & Middleware

- [ ] **Step 1: Create `src/middleware.ts`**
  Check cookies and redirect requests trying to access `/admin/*` without an active session or a matching record in the `admins` table.

- [ ] **Step 2: Create callback endpoint `src/app/auth/callback/route.ts`**
  Exchange the code, set cookies, and perform the post-auth admin privileges check.

- [ ] **Step 3: Wire login page actions**
  Create a Server Action in `src/lib/actions/auth.ts` to execute `signInWithOtp` magic link, and connect it to the login form component.

---

## Task 3: Admin CRUD Server Actions

- [ ] **Step 1: Implement Event CRUD Server Actions (`src/lib/actions/admin-events.ts`)**
  * `createEvent`, `updateEvent`, `publishEvent`, `cancelEvent`.
  * Make sure to write a helper `writeAuditLog(action, targetTable, targetId, before, after)` to write details to the `audit_log` table.

- [ ] **Step 2: Implement Registration Review Server Actions (`src/lib/actions/admin-registrations.ts`)**
  * `approveRegistration`, `rejectRegistration`, `refundRegistration`, `markAttendance`.
  * Ensure status updates write to the database and update audit logs.

---

## Task 4: Rewire Dashboard & Pages

- [ ] **Step 1: Wire admin dashboard (`src/app/admin/page.tsx`)**
  Query calculations from Supabase (KPI numbers, registration counters, revenue sums, and dynamic action history logs).

- [ ] **Step 2: Wire events list (`src/app/admin/events/page.tsx`)**
  Fetch active events list from Supabase.

- [ ] **Step 3: Create `/admin/events/new` event creation page**
  Build form fields, Cover Image upload input, and link submit button.

- [ ] **Step 4: Create `/admin/events/[id]` event detail view**
  Show listings of event details, registrations specific to this event, and custom-fields builder settings.

- [ ] **Step 5: Wire registrations browser (`src/app/admin/registrations/page.tsx`)**
  Fetch all registrations and map to filterable listing components.

- [ ] **Step 6: Create `/admin/registrations/[id]` details viewer**
  Show details, payment proofs preview (fetching signed URLs), and action buttons.

- [ ] **Step 7: Create `/admin/audit-log` logs feed**
  Query and render a time-sorted list of admin events.

---

## Task 5: Production verification

- [ ] **Step 1: Test compiler**
  Run: `npm run build`
  Verify routes compile clean.
