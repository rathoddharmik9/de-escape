# TODO: Plan 3 — Admin Auth & CRUD

Track the progress of backend integrations for Admin Auth & CRUD.

## Tasks Checklist

- [/] **Task 1: Schema Migration (Admin & Logs)**
  - [x] Step 1: Create `supabase/migrations/0003_admin.sql` with tables, triggers, and RLS policies
  - [ ] Step 2: Deploy migrations to the Supabase instance

- [x] **Task 2: Auth Guards & Middleware**
  - [x] Step 1: Create `src/middleware.ts` for route interception
  - [x] Step 2: Create callback route `src/app/auth/callback/route.ts`
  - [x] Step 3: Implement auth action and wire admin login page `src/app/admin/login/page.tsx`

- [x] **Task 3: Admin CRUD Server Actions**
  - [x] Step 1: Implement event actions in `src/lib/actions/admin-events.ts`
  - [x] Step 2: Implement registration review actions in `src/lib/actions/admin-registrations.ts`

- [x] **Task 4: Rewire Dashboard & Pages**
  - [x] Step 1: Wire Dashboard Home `src/app/admin/page.tsx`
  - [x] Step 2: Wire Events list page `src/app/admin/events/page.tsx`
  - [x] Step 3: Create Event Creator page `src/app/admin/events/new/page.tsx`
  - [x] Step 4: Create Event Details page `src/app/admin/events/[id]/page.tsx`
  - [x] Step 5: Wire Registrations browser `src/app/admin/registrations/page.tsx`
  - [x] Step 6: Create Registration Details page `src/app/admin/registrations/[id]/page.tsx`
  - [x] Step 7: Create Audit Log view page `src/app/admin/audit-log/page.tsx`

- [x] **Task 5: Production verification**
  - [x] Step 1: Test compiler build using `npm run build`

