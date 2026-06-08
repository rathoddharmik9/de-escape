# Plan 2 — Registration & Payments Flow

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the registration database tables, private storage bucket for screenshots, secure server actions for registration submissions (Razorpay, UPI manual upload, free), verify Cloudflare Turnstile tokens, capture Razorpay webhooks, and integrate public pass and find-pass lookups with Supabase.

---

## ⚠️ SESSION KICKOFF PROTOCOL (read first, do not skip)

Before writing any code:
1. **Read these files to load context** (in this order):
   - [SPEC.md](file:///Users/dharmikrathod/Documents/Claude/Projects/De-escape/SPEC.md) — §5 (data model), §9 (registration fields), §10 (payment flows).
   - [events.ts](file:///Users/dharmikrathod/Documents/Claude/Projects/de-escape-app/src/lib/data/events.ts) — current data access layer.
   - [page.tsx](file:///Users/dharmikrathod/Documents/Claude/Projects/de-escape-app/src/app/events/%5Bslug%5D/register/page.tsx) — current registration UI.
   - [page.tsx](file:///Users/dharmikrathod/Documents/Claude/Projects/de-escape-app/src/app/p/%5Bpass_code%5D/page.tsx) — current pass view page.
   - [page.tsx](file:///Users/dharmikrathod/Documents/Claude/Projects/de-escape-app/src/app/find-pass/page.tsx) — current lookup UI.

2. **Confirm the environment is ready.** Confirm the keys for Razorpay and Turnstile are ready in `.env.local`.

---

## 🙋 WHAT I NEED FROM YOU (user action items)

| # | Item | Why | How to get it |
|---|------|-----|---------------|
| 1 | **Razorpay API Credentials** | To create orders and verify payments | Razorpay Dashboard → Settings → API Keys |
| 2 | **Razorpay Webhook Secret** | Verifies signatures on incoming webhooks | Razorpay Dashboard → Webhooks → Add Endpoint (point to `/api/webhook/razorpay`) |
| 3 | **Cloudflare Turnstile Keys** | For anti-spam protection | Cloudflare Turnstile Dashboard → Add site |

---

## File Structure (created/modified by this plan)

- Create: `supabase/migrations/0002_registrations.sql` — registrations, blocked_contacts, storage bucket, RLS policies.
- Create: `src/lib/actions/register.ts` — server action handling form submissions and verification.
- Create: `src/app/api/webhook/razorpay/route.ts` — signature-verified webhook handler.
- Create: `src/components/events/RegistrationForm.tsx` — interactive client component registration form.
- Modify: `src/app/events/[slug]/register/page.tsx` — server wrapper querying database.
- Modify: `src/app/p/[pass_code]/page.tsx` — read real registration status and event details from Supabase.
- Modify: `src/app/find-pass/page.tsx` — wire submission to query database and mock recovery dispatch.
- Modify: `.env.local` + `.env.example` — add Razorpay and Turnstile environment variables.

---

## Task 1: Install dependencies & env scaffolding

- [ ] **Step 1: Install payment and validation libraries**
  ```bash
  npm install razorpay zod react-hook-form @hookform/resolvers @marsidev/react-turnstile
  ```

- [ ] **Step 2: Append env keys to `.env.example`**
  Add the following lines:
  ```env
  # Cloudflare Turnstile
  NEXT_PUBLIC_TURNSTILE_SITE_KEY=
  TURNSTILE_SECRET_KEY=

  # Razorpay
  NEXT_PUBLIC_RAZORPAY_KEY_ID=
  RAZORPAY_KEY_SECRET=
  RAZORPAY_WEBHOOK_SECRET=
  ```

- [ ] **Step 3: Update `.env.local`**
  Fill in the keys supplied by the user.

- [ ] **Step 4: Commit**
  ```bash
  git add package.json package-lock.json .env.example
  git commit -m "chore: add turnstile, razorpay, and form dependencies"
  ```

---

## Task 2: Schema Migration & Storage Bucket

- [ ] **Step 1: Write `supabase/migrations/0002_registrations.sql`**
  Create the registration enum and tables:
  ```sql
  -- registrations status enum
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

  -- block list
  create table blocked_contacts (
    id          uuid primary key default gen_random_uuid(),
    phone       text,
    email       text,
    reason      text not null,
    added_by    uuid,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz
  );

  create unique index blocked_contacts_phone_idx on blocked_contacts (phone) where phone is not null;
  create unique index blocked_contacts_email_idx on blocked_contacts (email) where email is not null;

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
    screenshot_url      text,
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

  create index registrations_event_id_status_idx on registrations (event_id, status);
  create index registrations_phone_idx on registrations (phone);
  create index registrations_email_idx on registrations (email);
  create unique index registrations_pass_code_event_id_idx on registrations (pass_code, event_id);

  -- Row Level Security (RLS)
  alter table registrations enable row level security;
  alter table blocked_contacts enable row level security;

  create policy "service role has full access on registrations"
    on registrations to service_role using (true) with check (true);

  create policy "service role has full access on blocked_contacts"
    on blocked_contacts to service_role using (true) with check (true);

  -- Setup payment proofs storage bucket
  insert into storage.buckets (id, name, public)
  values ('payment-proofs', 'payment-proofs', false)
  on conflict (id) do nothing;

  create policy "allow_anon_uploads_payment_proofs" on storage.objects
    for insert to anon with check (bucket_id = 'payment-proofs');

  create policy "allow_service_role_all_payment_proofs" on storage.objects
    for all to service_role using (bucket_id = 'payment-proofs') with check (bucket_id = 'payment-proofs');
  ```

- [ ] **Step 2: Push/apply migration SQL**
  Apply SQL locally or via the Supabase Dashboard SQL editor.

- [ ] **Step 3: Commit**
  ```bash
  git add supabase/migrations/0002_registrations.sql
  git commit -m "feat: add registrations and blocked_contacts schema, and payment proofs bucket"
  ```

---

## Task 3: Server Actions & verification layers

- [ ] **Step 1: Write Turnstile validation and unique pass-code helpers**
  * Turnstile API validator checks verification token with Cloudflare.
  * Pass code helper generates a random 6-character string of alphanumeric letters (excluding lookalikes like I, O, 1, 0) and ensures uniqueness within the event.

- [ ] **Step 2: Write registration Server Action in `src/lib/actions/register.ts`**
  Define a Zod validation schema for form data. The action must:
  1. Validate the Turnstile verification token.
  2. Query `blocked_contacts` table by phone or email. Silent reject if found.
  3. Verify the event status and capacity limits are not exceeded.
  4. Generate a unique `pass_code` for the registration.
  5. **Free Flow**: Status = `awaiting_verification`, insert row.
  6. **UPI Flow**: Handle screenshot base64 or file upload using the admin Supabase storage API, set `screenshot_url` to the file path, insert row with status `awaiting_verification`.
  7. **Razorpay Flow**: Initialize Razorpay SDK. Create a new order (`amount`, currency = `INR`, receipt = registration_id). Save registration row with status `awaiting_payment` and the `razorpay_order_id`. Return the order ID to the client.

- [ ] **Step 3: Commit**
  ```bash
  git add src/lib/actions/register.ts
  git commit -m "feat: add server action for registrations"
  ```

---

## Task 4: Razorpay Webhook Endpoint

- [ ] **Step 1: Write webhook routing in `src/app/api/webhook/razorpay/route.ts`**
  1. Verify the signature header using `crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)`.
  2. Parse the body. On event `payment.captured`:
     - Load `payload.payment.entity.order_id` (or payment details).
     - Query registrations by `razorpay_order_id`.
     - Update the registration status to `awaiting_verification`, recording the `razorpay_payment_id` and signature.
  3. Return a clean `200 OK` response.

- [ ] **Step 2: Commit**
  ```bash
  git add src/app/api/webhook/razorpay/route.ts
  git commit -m "feat: add Razorpay webhook verification route"
  ```

---

## Task 5: Rewire Registration UI & Components

- [ ] **Step 1: Convert register page route wrapper**
  Convert [page.tsx](file:///Users/dharmikrathod/Documents/Claude/Projects/de-escape-app/src/app/events/%5Bslug%5D/register/page.tsx) to query the event from Supabase on the server and render the client component form wrapper:
  ```tsx
  import { getEventBySlug } from "@/lib/data/events";
  import { notFound } from "next/navigation";
  import RegistrationForm from "@/components/events/RegistrationForm";

  export default async function RegisterPage({ params }: { params: { slug: string } }) {
    const event = await getEventBySlug(params.slug);
    if (!event) notFound();
    return <RegistrationForm event={event} />;
  }
  ```

- [ ] **Step 2: Create `src/components/events/RegistrationForm.tsx`**
  Move the interactive state and client rendering logic here.
  - Setup validation using Zod.
  - Integrate `@marsidev/react-turnstile` widget.
  - Integrate screenshot file-to-base64 reader for the UPI flow.
  - Integrate Razorpay Checkout handler:
    ```ts
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount_paise,
      currency: "INR",
      order_id: order.razorpay_order_id,
      handler: async function (response: any) {
        // verify client payment callback
        router.push(`/events/${event.slug}/success?reg=${order.id}`);
      }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
    ```

- [ ] **Step 3: Commit**
  ```bash
  git add src/components/events/RegistrationForm.tsx src/app/events/[slug]/register/page.tsx
  git commit -m "feat: connect registration form client component with Server Action"
  ```

---

## Task 6: Rewire Pass Page `/p/[pass_code]`

- [ ] **Step 1: Make pass code route a server component**
  In [page.tsx](file:///Users/dharmikrathod/Documents/Claude/Projects/de-escape-app/src/app/p/%5Bpass_code%5D/page.tsx):
  * Query the `registrations` table joined or referenced with `events`.
  * If the status is NOT `approved`, return a placeholder state message: *"We are still verifying your payment. Your ticket will activate once approved."*
  * If the status IS `approved`, show the full event details and pass card.

- [ ] **Step 2: Commit**
  ```bash
  git add src/app/p/[pass_code]/page.tsx
  git commit -m "feat: render live ticket information on pass code route"
  ```

---

## Task 7: Rewire Pass Lookup `/find-pass`

- [ ] **Step 1: Wire pass search to database**
  In [page.tsx](file:///Users/dharmikrathod/Documents/Claude/Projects/de-escape-app/src/app/find-pass/page.tsx), replace mock action with a query action checking registrations. Return status flag.

- [ ] **Step 2: Commit**
  ```bash
  git add src/app/find-pass/page.tsx
  git commit -m "feat: integrate lookup queries on find-pass page"
  ```

---

## Task 8: Production verification

- [ ] **Step 1: Build compilation test**
  Run: `npm run build`
  Verify that compiling compiles route endpoints successfully.
