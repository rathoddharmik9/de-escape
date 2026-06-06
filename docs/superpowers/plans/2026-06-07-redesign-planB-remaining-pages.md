# Redesign Plan B — Remaining Public Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the light game-style motion system (built in Plan A) and the green/cream palette to every remaining public page so the whole public site is consistent and on-brand.

**Architecture:** Reuse Plan A's primitives — `PublicShell` (scene + cursor + smooth-scroll + Nav/Footer), `Reveal`, `MagneticButton`, `TiltCard`, and `useScene().setScene` for per-page scene selection. Each page swaps its old `AmbientMesh/Nav/Footer` chrome for `PublicShell` with the right `initialScene`, then gets re-tokenized to the light palette. No backend/logic changes.

**Tech Stack:** Same as Plan A. No new dependencies.

---

## ⚠️ SESSION KICKOFF PROTOCOL (read first)

**Plan A MUST be complete before starting Plan B.** Verify:

1. **Check Plan A landed:** these files must exist —
   `src/components/layout/PublicShell.tsx`, `src/components/motion/{SceneProvider,SceneCanvas,SmoothScroll,CustomCursor,Reveal,MagneticButton,TiltCard}.tsx`, `src/lib/motion/scenes.ts`. If any is missing, STOP — run Plan A first.
2. **Read the spec:** `docs/superpowers/specs/2026-06-07-game-style-redesign-design.md` §8 (per-page treatment) is the per-page brief.
3. **Read Plan A** (`...planA-motion-foundation.md`) to learn the exact prop signatures of `PublicShell` (`initialScene`, `footer`), `Reveal` (`y`, `delay`, `className`), `MagneticButton` (`strength`), `TiltCard` (`max`), and the light tokens introduced in `globals.css`/`tailwind.config.ts`.
4. **Read each page before converting it** — they currently import `AmbientMesh`, `Nav`, `Footer` and use old tokens (`--ink`, `--coral`, `--peach`, `--violet`, `--teal`, `--amber`, `.glass`).
5. **No clarifying questions unless a page's content is ambiguous** vs the spec.

**Light-token cheat-sheet (from Plan A):**
| Old | New |
|---|---|
| `var(--bg)` / dark base | `var(--cream)` |
| `var(--ink)` (light text) | `var(--green-ink)` |
| `var(--ink-2)` | `var(--ink-dim)` |
| `var(--ink-3)` | `var(--ink-mute)` |
| `var(--coral)` (primary accent) | `var(--green)` |
| `var(--peach)` (hover) | `var(--lime-deep)` or `var(--green-deep)` |
| `var(--violet)/(--teal)/(--amber)` | green/lime family per context |
| `.glass` | `.surface` |
| `border var(--glass-border)` | `border var(--surface-border)` |
| `#1a0e08` (text on accent) | `var(--cream)` on green, or `var(--green-ink)` on lime |
| `font-serif` | `font-display` (Fredoka) |

**Verification per task:** run dev server, view the page in browser, confirm light palette + scene + motion + clean console. No unit tests for visual work.

**Scene assignments (spec §6/§8):**
| Page | initialScene |
|---|---|
| `/events` | `trail` |
| `/events/[slug]` | `deep` |
| `/events/[slug]/register` | `deep` |
| `/events/[slug]/success` | `pulse` |
| `/p/[pass_code]` | `deep` |
| `/about` | `deep` |
| `/find-pass` | `deep` |
| `/contact` (if exists) | `deep` |
| legal (`/privacy`,`/terms`,`/refund-policy`) | `deep` |
| `404` (`not-found`) | `pulse` |

---

## File Structure

**Modified (one task each unless noted):**
- `src/components/events/EventsBrowser.tsx` — discovery feed (client). Recolor, magnetic filter chips, `Reveal` cards, lime skeleton/empty.
- `src/app/events/page.tsx` — wraps `EventsBrowser` in `PublicShell initialScene="trail"`.
- `src/app/events/[slug]/page.tsx` — event detail; `PublicShell initialScene="deep"`, parallax cover, magnetic sticky CTA.
- `src/app/events/[slug]/register/page.tsx` — form; recolor, lime focus glow, springy submit.
- `src/app/events/[slug]/success/page.tsx` — pulse scene, recolor success animation to lime/green.
- `src/app/p/[pass_code]/page.tsx` — pass; `TiltCard` holographic, recolor.
- `src/app/about/page.tsx` — editorial recolor, `Reveal` sections.
- `src/app/find-pass/page.tsx` — recolor, lime focus.
- `src/app/not-found.tsx` — pulse glitch 404, recolor.
- Any of `/contact`, `/privacy`, `/terms`, `/refund-policy` **if they exist** (grep first; if absent, note "not present — skipped").

**Possibly deleted:** `src/components/layout/AmbientMesh.tsx`, `HeroAnimator.tsx` if Plan A deferred deletion (after all pages converted).

---

## Task 1: Events discovery feed (`EventsBrowser` + page)

**Files:** `src/components/events/EventsBrowser.tsx`, `src/app/events/page.tsx`

- [ ] **Step 1: Wrap page in PublicShell**

`src/app/events/page.tsx` is an async server component fetching `getPublishedEvents()`. Update:

```tsx
import { getPublishedEvents } from "@/lib/data/events";
import EventsBrowser from "@/components/events/EventsBrowser";
import PublicShell from "@/components/layout/PublicShell";

export default async function EventsPage() {
  const events = await getPublishedEvents();
  return (
    <PublicShell initialScene="trail">
      <EventsBrowser events={events} />
    </PublicShell>
  );
}
```

- [ ] **Step 2: Recolor `EventsBrowser.tsx`** — it currently renders its own `AmbientMesh/Nav/Footer`; REMOVE those (now provided by PublicShell). Convert: header `font-display` `--green-ink` with `--green` eyebrow; sticky filter bar `.surface` with `border-[var(--surface-border)]` on cream; active chip `background var(--green)` text `--cream`, inactive `.surface` text `--ink-dim`; search input `.surface`, focus border `--green`. Replace all old tokens via the cheat-sheet.

- [ ] **Step 3: Magnetic filter chips** — wrap each chip button in `MagneticButton` (strength 0.2). Add `data-cursor="true"`.

- [ ] **Step 4: Card entrance + empty/loading** — cards already use the recolored `EventCard` (TiltCard from Plan A). Wrap the grid items in `Reveal` (stagger via incremental `delay={i*0.05}`). Recolor empty-state to green; skeletons use the green `.skeleton` class.

- [ ] **Step 5: Verify** — `/events`: trail scene, cream base, magnetic chips, cards reveal + tilt, filter/search still work, empty state on a no-match filter. Console clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/events/EventsBrowser.tsx src/app/events/page.tsx
git commit -m "feat: events feed converted to light motion (trail scene)"
```

---

## Task 2: Event detail page

**Files:** `src/app/events/[slug]/page.tsx`

- [ ] **Step 1: Swap chrome** — remove `<AmbientMesh/><Nav/>` and the trailing `<Footer/>`; wrap the page body in `<PublicShell initialScene="deep">`. Keep `getEventBySlug`, `generateStaticParams`, `generateMetadata`, `notFound()` exactly as they are.

- [ ] **Step 2: Recolor the cinematic cover** — the gradient overlays currently fade to `var(--bg)` (dark). Change to fade to `var(--cream)` so the cover blends into the light page:

```tsx
<div className="absolute inset-0 bg-gradient-to-t from-[var(--cream)] via-[var(--cream)]/30 to-transparent" />
<div className="absolute inset-0 bg-gradient-to-r from-[var(--cream)]/50 to-transparent" />
```

Title `font-display` `--green-ink`; category badge uses the recolored `CATEGORY_COLORS`; tagline `--ink-dim`.

- [ ] **Step 3: Parallax cover** — add a small `"use client"` parallax: wrap the cover image so it translates on scroll (GSAP ScrollTrigger scrub, `yPercent: 15`). Create `src/components/events/CoverParallax.tsx` accepting `children`; apply scrub only when not reduced-motion.

```tsx
// src/components/events/CoverParallax.tsx
"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
export default function CoverParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const el = ref.current; if (!el) return;
    const tw = gsap.to(el, { yPercent: 15, ease: "none",
      scrollTrigger: { trigger: el.parentElement!, start: "top top", end: "bottom top", scrub: true } });
    return () => { tw.scrollTrigger?.kill(); tw.kill(); };
  }, []);
  return <div ref={ref} className="absolute inset-0">{children}</div>;
}
```
Wrap the `<Image>`/poster fallback in `<CoverParallax>`.

- [ ] **Step 4: Magnetic sticky CTA + reveals** — wrap the "Reserve your seat" CTA in `MagneticButton`, recolor to `background var(--green)` text `--cream`, `data-cursor="Reserve"`. Recolor the sticky sidebar `.surface`; capacity bar fill `--green` (or `--lime-deep` when almost full). Wrap meta strip / description / refund blocks in `Reveal`.

- [ ] **Step 5: Recolor remaining** — meta strip `.surface`, share buttons `.surface`, prose colors to `--green-ink`/`--ink-dim`. Replace all old tokens.

- [ ] **Step 6: Verify** — `/events/midnight-cycling-scavenger-hunt`: deep scene, cream, parallax cover blends to cream, magnetic reserve CTA, reveals on scroll. Console clean.

- [ ] **Step 7: Commit**

```bash
git add "src/app/events/[slug]/page.tsx" src/components/events/CoverParallax.tsx
git commit -m "feat: event detail converted to light motion (deep scene + parallax)"
```

---

## Task 3: Registration form

**Files:** `src/app/events/[slug]/register/page.tsx`

- [ ] **Step 1: Swap chrome** — remove `AmbientMesh/Nav`; wrap in `<PublicShell initialScene="deep" footer={false}>`. Keep ALL form state, validation, payment-mode logic, `useRouter` push unchanged.

- [ ] **Step 2: Recolor inputs + focus glow** — input base `.surface` border `--surface-border`; focus → border `--green` + a soft lime ring: `box-shadow: 0 0 0 3px rgba(200,241,53,0.25)`. Error state border `--green-deep`/red-free (use `--green-deep` + a warning tint `rgba(169,206,30,...)`? No — errors need to read as errors; use a dedicated `--error: #C2410C` token added to `globals.css`, or reuse a muted brown). Add `--error: #B4541E;` to `:root` in `globals.css` and use it for invalid borders + error text. Labels Poppins uppercase `--ink-mute`; required `*` in `--green`.

- [ ] **Step 3: UPI/Razorpay/free blocks recolor** — UPI info box `.surface` with `--green` accent (was teal); Razorpay step box `.surface` `--green` accent (was coral); screenshot dropzone border-dashed `--surface-border`, hover `--green`, filled state `--lime-deep`.

- [ ] **Step 4: Springy submit** — wrap submit button in `MagneticButton`, `background var(--green)` text `--cream`, `data-cursor="Reserve"`; on press add a quick scale via GSAP (or CSS `active:scale-95`). Consent checkbox checked state `background var(--green)`.

- [ ] **Step 5: Verify** — `/events/midnight-cycling-scavenger-hunt/register`: deep scene, cream, lime focus glow, validation still fires, submit routes to success. Test invalid submit shows error styling. Console clean.

- [ ] **Step 6: Commit**

```bash
git add "src/app/events/[slug]/register/page.tsx" src/app/globals.css
git commit -m "feat: registration form converted to light motion (deep scene)"
```

---

## Task 4: Success page (pulse)

**Files:** `src/app/events/[slug]/success/page.tsx`

- [ ] **Step 1: Swap chrome** — remove `AmbientMesh/Nav`; wrap in `<PublicShell initialScene="pulse" footer={false}>`. Keep the `Suspense` + `useSearchParams` reg-id logic.

- [ ] **Step 2: Recolor success animation** — checkmark circle stroke `--green` (was teal); checkmark draw `--green`; eyebrow `--green`; headline `font-display` `--green-ink`. Reg-ID box `.surface`, mono code `--green-ink`. Next-step number badges `background var(--lime)` text `--green-ink`.

- [ ] **Step 3: Restrained lime particle burst** — add a small one-shot GSAP burst of ~12 lime dots radiating from the checkmark on mount (skip if reduced-motion). Inline in the existing client component.

- [ ] **Step 4: Recolor CTAs** — primary `background var(--green)` text `--cream` (`MagneticButton`); secondary `.surface`. `data-cursor` labels.

- [ ] **Step 5: Verify** — visit `/events/midnight-cycling-scavenger-hunt/success?name=Priya`: pulse scene, checkmark draws, lime burst, reg id shows. Reduced-motion → no burst, still readable. Console clean.

- [ ] **Step 6: Commit**

```bash
git add "src/app/events/[slug]/success/page.tsx"
git commit -m "feat: success page converted to light pulse scene"
```

---

## Task 5: Public pass page (holographic tilt)

**Files:** `src/app/p/[pass_code]/page.tsx`

- [ ] **Step 1: Swap chrome** — remove `AmbientMesh/Nav`; wrap in `<PublicShell initialScene="deep" footer={false}>`. Keep the mock pass data + copy/clipboard handlers.

- [ ] **Step 2: Wrap pass card in `TiltCard`** (max 10) for a 3D feel. Add a holographic sheen overlay: an absolutely-positioned gradient `linear-gradient(120deg, transparent, rgba(200,241,53,0.25), transparent)` that shifts on tilt (simple: a static sheen is acceptable; animated optional).

- [ ] **Step 3: Recolor** — card `.surface` / `--cream-soft`; header band tint uses `CATEGORY_COLORS`; attendee + event titles `font-display` `--green-ink`; pass code box `background var(--cream-deep)`, mono code `--green` with a soft lime glow `text-shadow: 0 0 12px rgba(200,241,53,0.5)`. The two punch-out divider circles use `background var(--cream)` (page bg). Action buttons `.surface`, `data-cursor`.

- [ ] **Step 4: Screenshot-friendly** — ensure when the pointer leaves, the card settles flat (TiltCard already resets) so a screenshot looks clean.

- [ ] **Step 5: Verify** — `/p/MN7K2P`: deep scene, tilting holographic pass, glowing lime code, copy works. Console clean.

- [ ] **Step 6: Commit**

```bash
git add "src/app/p/[pass_code]/page.tsx"
git commit -m "feat: pass page converted to light holographic tilt"
```

---

## Task 6: About page

**Files:** `src/app/about/page.tsx`

- [ ] **Step 1: Swap chrome** — remove `AmbientMesh/Nav/Footer`; wrap in `<PublicShell initialScene="deep">`.

- [ ] **Step 2: Recolor + reveals** — hero headline `font-display` `--green-ink` with `--green` eyebrow; story paragraphs `--ink-dim`; pull-quote `font-display` `--green`; philosophy cards `.surface` with green/lime accent dots (recolor the per-card accent hexes to green family). Wrap story blocks + cards in `Reveal`. CTA `MagneticButton` green.

- [ ] **Step 3: Verify** — `/about`: deep scene, editorial light layout, reveals on scroll. Console clean.

- [ ] **Step 4: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "feat: about page converted to light motion (deep scene)"
```

---

## Task 7: Find-pass page

**Files:** `src/app/find-pass/page.tsx`

- [ ] **Step 1: Swap chrome** — remove `AmbientMesh/Nav/Footer`; wrap in `<PublicShell initialScene="deep">`. Keep form + submitted-state logic.

- [ ] **Step 2: Recolor** — heading `font-display` `--green-ink`, eyebrow `--green`; inputs `.surface` + lime focus glow (same as Task 3); submit `MagneticButton` green `--cream`; submitted-state icon/text recolor to green. Error text uses `--error`.

- [ ] **Step 3: Verify** — `/find-pass`: deep scene, light form, submit shows the "check WhatsApp" state. Console clean.

- [ ] **Step 4: Commit**

```bash
git add src/app/find-pass/page.tsx
git commit -m "feat: find-pass converted to light motion"
```

---

## Task 8: 404 page (pulse glitch)

**Files:** `src/app/not-found.tsx`

- [ ] **Step 1: Swap chrome** — remove `AmbientMesh/Nav`; wrap in `<PublicShell initialScene="pulse" footer={false}>`.

- [ ] **Step 2: Recolor + glitch** — giant "404" `font-display` in a faint `rgba(44,138,75,0.12)`; headline `--green-ink`; body `--ink-dim`. Add a subtle CSS glitch/jitter animation on the "404" (skip on reduced-motion via the existing media query). Home CTA `MagneticButton` green `--cream`, `data-cursor="Home"`.

- [ ] **Step 3: Verify** — visit a bad URL e.g. `/zzz`: pulse scene, light 404, glitch on number, home CTA magnetic. Console clean.

- [ ] **Step 4: Commit**

```bash
git add src/app/not-found.tsx
git commit -m "feat: 404 converted to light pulse glitch"
```

---

## Task 9: Legal + contact pages (if present)

**Files:** `/privacy`, `/terms`, `/refund-policy`, `/contact` page files — **grep first**.

- [ ] **Step 1: Check existence**

Run: `ls src/app/privacy src/app/terms src/app/refund-policy src/app/contact 2>/dev/null`
If a directory is missing, note "not present — skipped" and move on. (These were referenced in nav/footer but may not be built yet.)

- [ ] **Step 2: For each that exists** — wrap in `<PublicShell initialScene="deep">`, recolor to light tokens, keep motion minimal (legal = readable, low motion per spec §8). Strong `font-display` headings, `--ink-dim` body, comfortable measure, anchor nav if present. Contact form inputs use the Task-3 input styling.

- [ ] **Step 3: Verify** each existing page renders light + readable. Console clean.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: legal/contact pages converted to light (where present)"
```

---

## Task 10: Cleanup + full build verification

- [ ] **Step 1: Delete retired chrome** — now that all pages use `PublicShell`:

Run: `grep -rn "AmbientMesh\|HeroAnimator" src`
If only self-references remain: `rm -f src/components/layout/AmbientMesh.tsx src/components/layout/HeroAnimator.tsx`.

- [ ] **Step 2: Hunt leftover old tokens**

Run: `grep -rn "var(--coral\|var(--violet\|var(--peach\|var(--teal\|var(--amber\|var(--ink)\|var(--ink-2)\|var(--ink-3)\|var(--bg)\|\.glass\b\|font-serif" src/app src/components`
Expected: no matches (all converted). Fix any stragglers inline, commit per file.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, no type errors, all routes generated.

- [ ] **Step 4: Smoke test built app**

Run: `npm run start`; curl each public route → all `200`:
`/`, `/events`, `/events/midnight-cycling-scavenger-hunt`, `/events/midnight-cycling-scavenger-hunt/register`, `/find-pass`, `/p/MN7K2P`, `/about`, and a 404 path.

- [ ] **Step 5: Cross-page consistency pass** — open each in the browser; confirm shared palette, Fredoka headings, scene per page, cursor, no console errors, mobile (resize to 390px) usable + 60fps.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "chore: plan B complete — all public pages on light motion system"
```

---

## Self-Review checklist

- [ ] Every public page in spec §8 converted with its assigned scene (table above).
- [ ] No old tokens / `.glass` / `font-serif` anywhere in `src/app` + `src/components` (grep clean).
- [ ] Reduced-motion + mobile verified on at least detail, register, success.
- [ ] AA contrast: no bright-lime text on cream; lime only fills/glows.
- [ ] `npm run build` passes; all routes 200 on `npm run start`.
- [ ] Admin pages NOT touched here (separate small follow-up) — confirm `/admin` still builds (it uses old dark tokens; acceptable, it's out of scope).

---

## Note on admin

Admin panel keeps the old dark tokens for now — out of scope per spec §2. A future small task re-palettes admin to a calm light version of the green DNA. If `npm run build` fails because admin references a deleted token, the safest fix is to keep the old token definitions present but unused, OR convert admin in that follow-up. Do not expand this plan to cover admin.
