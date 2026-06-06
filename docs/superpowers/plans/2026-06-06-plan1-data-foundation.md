# Plan 1 — Data Foundation & Public Read Path

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock-data layer of the public site with a real Supabase Postgres backend, so events come from a real database while every existing page keeps rendering identically.

**Architecture:** Supabase (Postgres + RLS + Storage) sits behind Next.js 14 App Router. A thin data-access layer (`src/lib/data/events.ts`) becomes the single place pages read events from. Public pages call it as server components. RLS allows anonymous read of published events only. A denormalized `registered_count` column keeps capacity math working without needing the registrations table yet (that table arrives in Plan 2).

**Tech Stack:** Next.js 14, TypeScript, `@supabase/supabase-js`, `@supabase/ssr`, Supabase CLI (local migrations), Postgres 15.

**Why this is the right first chunk:** Everything else (registration submit, admin CRUD, comms) depends on the schema and the read path existing. This plan is independently shippable — at the end, the public site renders real DB data and nothing is half-wired.

---

## ⚠️ SESSION KICKOFF PROTOCOL (read first, do not skip)

This plan is written to be executed in a **fresh session** with no memory of the build. Before writing any code:

1. **Read these files to load context** (in this order):
   - `/Users/dharmikrathod/Documents/Claude/Projects/De-escape/SPEC.md` — §5 (data model), §1 (lock-in decisions). This is the source of truth.
   - `src/lib/types.ts` — current TypeScript types.
   - `src/lib/mock-data.ts` — current mock data + helper functions (`formatPrice`, `formatDate`, `seatsLeft`, etc.). These helpers MUST survive.
   - `src/app/page.tsx`, `src/app/events/page.tsx`, `src/app/events/[slug]/page.tsx` — the three consumers of mock data on the public site.
   - `src/components/events/EventCard.tsx` — the card component that reads an `Event`.

2. **Confirm the environment is ready.** Check that the "What I need from you" checklist below is satisfied. If any item is missing, STOP and ask the user for it before proceeding.

3. **Ask clarifying questions BEFORE coding.** Use the AskUserQuestion tool. Likely questions are pre-listed in the "Open questions for the user" section — ask the ones that are still genuinely unresolved after reading the files. Do not assume; confirm.

4. **Only after the user answers, begin Task 1.**

---

## 🙋 WHAT I NEED FROM YOU (user action items)

Gather these before or at the start of the session. The agent will ask if missing.

| # | Item | Why | How to get it |
|---|------|-----|---------------|
| 1 | **Supabase account** | Hosts the database | Sign up free at supabase.com |
| 2 | **Supabase project created in region `ap-south-1` (Mumbai)** | Low latency per SPEC §6.2 | New project → pick South Asia (Mumbai). Save the DB password. |
| 3 | **Project URL** (`https://xxxx.supabase.co`) | Client connection | Project Settings → API → Project URL |
| 4 | **Anon public key** | Public client (browser-safe) | Project Settings → API → `anon` `public` key |
| 5 | **Service role key** | Server-only writes/seed (SECRET) | Project Settings → API → `service_role` key. ⚠️ Never commit; goes in `.env.local` only. |
| 6 | **Project ref + DB password** (optional, for CLI) | Running migrations via Supabase CLI | Project Settings → General → Reference ID; password set at creation. |
| 7 | **Decision: CLI vs Dashboard SQL** | How migrations get applied | See Open Question Q1. |
| 8 | **Confirm event categories** | DB enum / category coloring | Current set: `sound_bath, supper, run, book_circle, cycling, other`. Add/remove? |
| 9 | **First real event content (optional)** | Seed data | Either reuse the seeded "Midnight Cycling" event, or hand over real title/date/venue/price/image. |

**Security note for the user:** The `service_role` key bypasses all row-level security. It must only ever live in `.env.local` (gitignored) and on the server. Never paste it into client code, a browser, or a public channel. If it leaks, rotate it immediately in the Supabase dashboard.

---

## ❓ Open questions for the user (ask at kickoff)

- **Q1 — Migration method:** Run schema via the **Supabase CLI** (versioned migration files in `supabase/migrations/`, reproducible — recommended) or paste **SQL into the dashboard SQL editor** (faster, no local Docker)? CLI needs Docker Desktop for local dev; dashboard does not.
- **Q2 — Local Supabase vs hosted-only:** Develop against a **local Supabase stack** (`supabase start`, needs Docker) or point dev directly at the **hosted project**? Hosted-only is simpler for a solo build; local is safer for destructive testing.
- **Q3 — Keep mock data as fallback?** Should `mock-data.ts` be deleted once reads are migrated, or kept as a seed source + offline fallback? (Recommended: keep the seed array, move it to a seed script, delete the runtime imports.)
- **Q4 — Categories final?** Confirm the six-category set (Q item 8).
- **Q5 — Seed content:** Reuse the six mock events as seed rows, or seed only the one real event?

---

## File Structure (created/modified by this plan)

- Create: `src/lib/supabase/client.ts` — browser Supabase client.
- Create: `src/lib/supabase/server.ts` — server Supabase client (cookies-aware via `@supabase/ssr`).
- Create: `src/lib/supabase/admin.ts` — service-role client (server-only, for seed/admin scripts).
- Create: `src/lib/data/events.ts` — data-access layer: `getPublishedEvents()`, `getEventBySlug()`, `getFeaturedEvent()`.
- Create: `supabase/migrations/0001_events.sql` — events table + enums + indexes + RLS.
- Create: `scripts/seed.ts` — seeds events from the existing mock array.
- Modify: `src/lib/types.ts` — align `Event` type with DB columns (add `registered_count`, keep API stable).
- Modify: `src/lib/mock-data.ts` — keep helpers, export the array for the seed script, remove it as the page data source.
- Modify: `src/app/page.tsx` — read from `getPublishedEvents()` / `getFeaturedEvent()`.
- Modify: `src/app/events/page.tsx` — read from `getPublishedEvents()` (note: currently a client component with filters — see Task 7 for the server/client split).
- Modify: `src/app/events/[slug]/page.tsx` — read from `getEventBySlug()`, update `generateStaticParams`.
- Modify: `.env.local` (create) + `.env.example` (create, committed) — env var names.
- Modify: `.gitignore` — ensure `.env.local` ignored (Next.js default already does; verify).

---

## Task 1: Install dependencies & env scaffolding

**Files:**
- Modify: `package.json` (via install)
- Create: `.env.local`, `.env.example`

- [ ] **Step 1: Install Supabase packages**

```bash
cd /Users/dharmikrathod/Documents/Claude/Projects/de-escape-app
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Create `.env.example` (committed, no secrets)**

```bash
# .env.example
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 3: Create `.env.local` with the real values the user provided**

Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from the user's items 3–5.

- [ ] **Step 4: Verify `.env.local` is gitignored**

Run: `git check-ignore .env.local`
Expected: prints `.env.local` (means it is ignored). If nothing prints, add `.env.local` to `.gitignore`.

- [ ] **Step 5: Commit**

```bash
git add .env.example package.json package-lock.json
git commit -m "chore: add supabase deps and env scaffolding"
```

---

## Task 2: Events schema migration

**Files:**
- Create: `supabase/migrations/0001_events.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
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
  description       text,                       -- HTML/rich text for v1
  cover_image_url   text,
  category          event_category not null default 'other',
  start_at          timestamptz not null,
  end_at            timestamptz not null,
  venue_name        text,
  venue_address     text,
  venue_map_url     text,
  capacity          int not null default 0,
  registered_count  int not null default 0,     -- denormalized; Plan 2 keeps it in sync
  price_paise       int not null default 0,      -- 0 = free
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
```

- [ ] **Step 2: Apply the migration**

If CLI chosen (Q1): `supabase db push` (or `supabase migration up` for local).
If dashboard chosen: paste the SQL into the SQL editor and run.

- [ ] **Step 3: Verify the table exists**

Run a query in the dashboard or via psql:
```sql
select column_name, data_type from information_schema.columns where table_name = 'events' order by ordinal_position;
```
Expected: all columns above listed.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_events.sql
git commit -m "feat: events table schema with RLS"
```

---

## Task 3: Supabase client helpers

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/admin.ts`

- [ ] **Step 1: Browser client**

```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Server client (cookies-aware)**

```ts
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* called from a Server Component; safe to ignore */ }
        },
      },
    }
  );
}
```

- [ ] **Step 3: Service-role client (server-only)**

```ts
// src/lib/supabase/admin.ts
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
```

- [ ] **Step 4: Install `server-only` guard package**

```bash
npm install server-only
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase package.json package-lock.json
git commit -m "feat: supabase client helpers (browser, server, admin)"
```

---

## Task 4: Data-access layer

**Files:**
- Create: `src/lib/data/events.ts`
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Update the `Event` type to match DB**

In `src/lib/types.ts`, change the `Event` interface's `registered: number` field name to `registered_count: number` (DB column name), and make `upi_id` / optional fields nullable to match Postgres. Keep all other field names identical so components don't break. Update `seatsLeft()` in `mock-data.ts` accordingly (Task 6).

```ts
// src/lib/types.ts — Event interface, replace `registered` line:
  registered_count: number;
```

- [ ] **Step 2: Write the data-access functions**

```ts
// src/lib/data/events.ts
import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/lib/types";

export async function getPublishedEvents(): Promise<Event[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .in("status", ["published", "sold_out"])
    .order("start_at", { ascending: true });
  if (error) throw new Error(`getPublishedEvents: ${error.message}`);
  return (data ?? []) as Event[];
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null; // no rows
    throw new Error(`getEventBySlug: ${error.message}`);
  }
  return data as Event;
}

export async function getFeaturedEvent(): Promise<Event | null> {
  const events = await getPublishedEvents();
  return events[0] ?? null;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/events.ts src/lib/types.ts
git commit -m "feat: events data-access layer"
```

---

## Task 5: Seed script

**Files:**
- Create: `scripts/seed.ts`
- Modify: `package.json` (add a `seed` script + `tsx` dev dep)

- [ ] **Step 1: Add tsx runner**

```bash
npm install -D tsx dotenv
```

- [ ] **Step 2: Write the seed script**

It imports the existing `EVENTS` array from `mock-data.ts`, maps `registered` → `registered_count`, and upserts into Supabase using the admin client. Load `.env.local` via dotenv.

```ts
// scripts/seed.ts
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { EVENTS } from "../src/lib/mock-data";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const rows = EVENTS.map((e) => ({
    slug: e.slug,
    title: e.title,
    tagline: e.tagline,
    description: e.description,
    cover_image_url: e.cover_image_url || null,
    category: e.category,
    start_at: e.start_at,
    end_at: e.end_at,
    venue_name: e.venue_name,
    venue_address: e.venue_address,
    venue_map_url: e.venue_map_url,
    capacity: e.capacity,
    registered_count: (e as unknown as { registered: number }).registered,
    price_paise: e.price_paise,
    payment_mode: e.payment_mode,
    upi_id: e.upi_id ?? null,
    refund_policy: e.refund_policy,
    status: e.status,
  }));

  const { error } = await supabase.from("events").upsert(rows, { onConflict: "slug" });
  if (error) { console.error(error); process.exit(1); }
  console.log(`Seeded ${rows.length} events.`);
}

main();
```

- [ ] **Step 3: Add npm script**

In `package.json` scripts: `"seed": "tsx scripts/seed.ts"`.

- [ ] **Step 4: Run it**

Run: `npm run seed`
Expected: `Seeded 6 events.`

- [ ] **Step 5: Verify in DB**

```sql
select slug, title, status, registered_count from events order by start_at;
```
Expected: 6 rows.

- [ ] **Step 6: Commit**

```bash
git add scripts/seed.ts package.json package-lock.json
git commit -m "feat: events seed script"
```

---

## Task 6: Keep helpers, decouple mock array from pages

**Files:**
- Modify: `src/lib/mock-data.ts`

- [ ] **Step 1: Update `seatsLeft` to use `registered_count`**

```ts
export function seatsLeft(event: Event): number {
  return event.capacity - event.registered_count;
}
```

- [ ] **Step 2: Keep `EVENTS` exported** (the seed script imports it) but stop importing `EVENTS` in page files (done in Tasks 7–8). Keep `CATEGORY_LABELS`, `CATEGORY_COLORS`, `POSTER_GRADIENTS`, `formatPrice`, `formatDate`, `formatTime` — all still imported by components.

- [ ] **Step 3: Commit**

```bash
git add src/lib/mock-data.ts
git commit -m "refactor: seatsLeft uses registered_count"
```

---

## Task 7: Rewire `/` and `/events/[slug]` (server components)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/events/[slug]/page.tsx`

- [ ] **Step 1: Home page reads from DB**

In `src/app/page.tsx` replace `import { EVENTS, ... }` with the data layer. Make the component `async`:

```tsx
import { getPublishedEvents, getFeaturedEvent } from "@/lib/data/events";
// ...
export default async function HomePage() {
  const upcoming = await getPublishedEvents();
  const featuredEvent = await getFeaturedEvent();
  if (!featuredEvent) {
    // empty state — no events yet
  }
  // use upcoming.slice(0,6) and featuredEvent in JSX (was the module-level const)
}
```
Move the `featuredEvent` module constant into the function body. Handle the null case with a simple empty state if no events.

- [ ] **Step 2: Event detail reads from DB**

In `src/app/events/[slug]/page.tsx`:
```tsx
import { getEventBySlug, getPublishedEvents } from "@/lib/data/events";

export async function generateStaticParams() {
  const events = await getPublishedEvents();
  return events.map((e) => ({ slug: e.slug }));
}

export default async function EventDetailPage({ params }: Props) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();
  // rest unchanged
}
```
Also update `generateMetadata` to `await getEventBySlug`.

- [ ] **Step 3: Verify both render**

Run: `npm run dev`, visit `/` and `/events/midnight-cycling-scavenger-hunt`.
Expected: same visuals, now from DB. Check terminal for no Supabase errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx "src/app/events/[slug]/page.tsx"
git commit -m "feat: home and event detail read from supabase"
```

---

## Task 8: Rewire `/events` (client component → server wrapper)

**Files:**
- Modify: `src/app/events/page.tsx`
- Create: `src/components/events/EventsBrowser.tsx`

The discovery page is currently a **client component** (it holds filter/search state) and imports `EVENTS` directly. Client components can't be `async` server data readers, so split it:

- [ ] **Step 1: Create the client browser component**

Move all current interactive JSX/state from `src/app/events/page.tsx` into a new `"use client"` component `src/components/events/EventsBrowser.tsx` that accepts `events: Event[]` as a prop instead of importing `EVENTS`.

- [ ] **Step 2: Make the page a server component**

```tsx
// src/app/events/page.tsx
import { getPublishedEvents } from "@/lib/data/events";
import EventsBrowser from "@/components/events/EventsBrowser";

export default async function EventsPage() {
  const events = await getPublishedEvents();
  return <EventsBrowser events={events} />;
}
```

- [ ] **Step 3: Verify**

Run dev server, visit `/events`. Filters + search still work; data is from DB.

- [ ] **Step 4: Commit**

```bash
git add src/app/events/page.tsx src/components/events/EventsBrowser.tsx
git commit -m "feat: discovery feed reads from supabase via server wrapper"
```

---

## Task 9: Production build verification

- [ ] **Step 1: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, all routes generated, no type errors. Note: `/`, `/events`, `/events/[slug]` may shift from static to dynamic (server-rendered) — that is expected and fine.

- [ ] **Step 2: Smoke test the built app**

Run: `npm run start`, curl `/`, `/events`, `/events/<slug>` → all `200`.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: plan 1 data foundation complete"
```

---

## Self-Review checklist (run before declaring done)

- [ ] Public site renders identically to the mock version (compare against screenshots in the De-escape project folder).
- [ ] No page imports `EVENTS` at runtime anymore (only `scripts/seed.ts` does). Verify: `grep -rn "EVENTS" src/app`.
- [ ] `service_role` key only referenced in `src/lib/supabase/admin.ts` and `scripts/seed.ts`. Verify: `grep -rn "SERVICE_ROLE" src`.
- [ ] RLS confirmed: querying events as `anon` returns only published/sold_out/past rows. Test by temporarily setting an event to `draft` and confirming it disappears from `/events`.
- [ ] `npm run build` passes clean.

---

## What this plan deliberately does NOT cover (future plans)

| Plan | Scope | Depends on |
|------|-------|-----------|
| **Plan 2 — Registration & Payments** | `registrations` table, server action for form submit, Turnstile verify, Razorpay order+webhook, UPI screenshot upload to private bucket, free flow, pass-code generation, `registered_count` increment, success page real reg ID, `/p/[pass_code]` real lookup, `/find-pass` real resend. | Plan 1 |
| **Plan 3 — Admin Auth & CRUD** | Supabase magic-link auth, `admins` table + admin RLS, middleware route protection, events create/edit/publish/cancel, registrations approve/reject/refund/attend, audit log. | Plan 1, 2 |
| **Plan 4 — Comms** | AWS SES + React Email, Meta WhatsApp Cloud API, 10 templates, `.ics` endpoint, `pg_cron` reminder scheduler, inbox, broadcasts. | Plan 2, 3 |
| **Plan 5 — Analytics, PWA, Polish** | Chart.js analytics, `event_views`, block list, settings, screenshot-retention cron, `next-pwa`, Sentry/PostHog, E2E tests. | All |

Each future plan is independently shippable and will get its own kickoff protocol + "what I need from you" list.
