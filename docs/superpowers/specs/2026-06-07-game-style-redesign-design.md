# De-escape — Game-Style Motion Redesign (Design Spec)

**Date:** 2026-06-07 · **Status:** Approved, pending spec review
**Supersedes:** the current dark + coral/violet/teal glassmorphic visual layer.

---

## 1. Problem

The current public site reads "too loud and simple." The founder wants a public-facing experience that feels like a **3D / motion-graphics game** — alive, attractive, animated backgrounds, movement — while staying premium and on-brand to the De-escape poster identity (forest-green + neon-yellow on near-black).

This is a **visual + motion layer swap**, not a rebuild. All page logic, routes, data props, and the (now Supabase-wired) data layer stay intact. Components get re-tokenized to the new palette and wrapped in reusable motion primitives.

---

## 2. Scope

**In scope:** all public pages — `/`, `/events`, `/events/[slug]`, `/events/[slug]/register`, `/events/[slug]/success`, `/p/[pass_code]`, `/find-pass`, `/about`, `/contact`, `/privacy`, `/terms`, `/refund-policy`, `404`. Shared nav, footer, cards, buttons, form controls.

**Out of scope (this pass):** admin panel (gets the new palette only, deeper motion later); backend/data wiring (handled by the data-foundation plans); sound design (explicitly excluded by the founder).

---

## 3. Direction (locked decisions)

- **Genre:** motion-graphics / shader-driven animated backgrounds with movement (not orbitable 3D models, not Lottie/video).
- **Background engine:** Canvas/WebGL shaders (lightweight, via OGL).
- **Theme:** **LIGHT** — warm cream base, green ink. Matches the logo (green-on-cream). This overrides the earlier dark-night direction.
- **Palette:** logo-accurate — emerald/kelly green ink + warm cream surfaces. Neon-lime (from the event poster) kept ONLY as a sparing energy accent on CTAs/highlights.
- **Fonts:** match the logo — **Fredoka** (rounded chunky, matches the "De-escape" wordmark) for display + **Poppins** (geometric, matches the tagline) for UI/body.
- **Coverage:** all public pages, consistent DNA.
- **Interactions:** custom cursor ✅, scroll-scene transitions ✅, physics micro-interactions ✅, sound ❌.

---

## 4. Palette & tokens (LIGHT, logo-accurate)

Light theme. Replaces the coral/violet/teal set. Green is the dominant brand color (from the logo); lime is a sparing energy accent (from the poster). Sampled from the logo asset (`IMG_1791.JPG`).

| Token | Hex | Use |
|---|---|---|
| `--cream` | `#F5ECCE` | Primary background (logo cream) |
| `--cream-soft` | `#FBF6E6` | Raised cards / lighter surfaces |
| `--cream-deep` | `#ECE0C0` | Recessed surfaces / hairline fills |
| `--green` | `#2C8A4B` | Logo green — primary brand, headlines, ink accents |
| `--green-deep` | `#1F6336` | Hover / pressed / deep text on cream |
| `--green-ink` | `#14331F` | Primary body text (dark green, AA on cream) |
| `--lime` | `#C8F135` | Energy accent — CTAs, highlights, sparingly |
| `--lime-deep` | `#A9CE1E` | Lime on light (text/borders) for contrast |
| `--ink-dim` | `#5C6B5E` | Secondary text |
| `--ink-mute` | `#8A9384` | Tertiary / muted |

**Contrast note:** pure `--lime` (#C8F135) fails AA as text on cream — use `--lime-deep` or `--green-ink` for any lime-adjacent text; reserve bright `--lime` for fills/CTA backgrounds (with `--green-ink` text on it) and glows.

**Category colors** = tints within the green→lime family (not a rainbow): cycling = lime, run = green, sound_bath = cool green tint, supper = lime-warm, book_circle = green-deep, other = ink-mute. Finalized in implementation; must stay in-family.

**Shader gradient stops (light):** `--cream` → `--green` (soft) → `--lime` (sparse), low-opacity drifting over the cream base — texture, not a dark wash.

Implementation: update `src/app/globals.css` `:root` vars + `tailwind.config.ts` `colors.brand`. Old token names (`--coral`, `--violet`, `--ink`, `--bg`, etc.) removed; every component re-pointed. `<html>` is light (no dark base); ensure `color-scheme: light`.

---

## 5. Typography (logo-matched)

- **Fredoka** — rounded chunky display matching the "De-escape" wordmark. Used for hero, section titles, event titles, big numbers. Weights 500–700. Via `next/font/google`, exposed as `--font-display`.
- **Poppins** — geometric sans matching the tagline ("DISCOVER WHAT'S AROUND YOU"). Used for body, UI, labels (uppercase + tracked for eyebrows/tags). Weights 300–600. `--font-sans`.
- **Dropped:** Anton, Instrument Serif, Inter — replaced for full logo cohesion.

Big type-scale contrast retained: large rounded Fredoka headlines, comfortable Poppins body. Tags/eyebrows = Poppins uppercase, letter-spaced, mirroring the tagline lockup.

---

## 6. Shader scene system

One persistent OGL fullscreen canvas behind all content, driven by scroll progress through named "scenes" (game levels). Scene state lives in a React context; GSAP tweens the shader uniforms as ScrollTrigger crosses section/route boundaries — always a smooth morph, never a hard cut.

All scenes render on the **cream** base — shaders add soft green/lime motion texture, never darken into a night wash (light theme).

| Scene | Where | Shader state |
|---|---|---|
| **Dawn** | Hero | Slow green→lime fluid drifting over cream; mouse pushes the flow (cursor ripple) |
| **Trail** | Events / discovery | Soft green particle streaks (motion trails) on cream |
| **Deep** | Event detail, register, pass, about, legal | Calmer, denser green mist, slow drift — focus mode (still light) |
| **Pulse** | CTAs, success, 404 | Lime energy bloom over cream; reacts to clicks |

**Uniforms tweened:** `uColorA`, `uColorB`, `uColorC`, `uSpeed`, `uDensity`, `uMouse`, `uScroll`, `uTime`. Base/`uColorC` stays cream so the field never goes dark.

**Layer stack (back → front):** cream page bg → shader canvas (soft, blend over cream) → grain overlay → page content → custom cursor.

---

## 7. Motion system (named, reusable)

- **Smooth scroll:** Lenis, raf-synced to GSAP ScrollTrigger.
- **Scene transitions:** sections pin + content stacks/morphs at boundaries; shader morphs in parallel via uniform tweens.
- **Page-load reveal:** per-word mask reveal on headlines, staggered; eyebrow/subline/CTA fade-up after.
- **Custom cursor (desktop only):** dot + trailing ring; grows + magnetizes over interactive elements; shows contextual label ("View", "Reserve", "Drag"). Touch devices use native.
- **Physics micro-interactions:** magnetic CTAs, springy button press, parallax tilt on cards, throwable/draggable event cards in the discovery rail.
- **Route transitions:** shader scene morph + content fade/wipe between pages.

**Accessibility / fallback (hard requirement):**
- `prefers-reduced-motion: reduce` → shader replaced by a static brand gradient, custom cursor off (native), all transitions instant, smooth-scroll off.
- Low-GPU device tier (detected) → shader at reduced resolution or static gradient fallback.
- WCAG AA contrast maintained for all text on shader backgrounds (content sits on subtle scrims where needed).

---

## 8. Per-page treatment

| Page | Treatment |
|---|---|
| **Home `/`** | Dawn scene. Anton headline mask-reveal. Featured event = floating tilt-card with depth. "What's on" = draggable/throwable horizontal rail. Lime marquee ticker. Scroll morphs Dawn→Trail. |
| **Events `/events`** | Trail scene. Filter chips = magnetic pills. Cards enter staggered + parallax tilt; throwable rail on mobile. Lime skeleton shimmer for loading; themed empty state. |
| **Event detail `/events/[slug]`** | Deep scene. Cinematic cover with parallax depth. Sticky magnetic "Reserve" CTA. Scroll-reveal sections. Capacity bar animates lime fill. |
| **Register** | Deep scene, calmer. Fields focus-glow lime. Springy submit. Pulse bloom on success transition. UPI/Razorpay/free variants keep current logic. |
| **Success** | Pulse scene. Lime energy bloom + checkmark draw + restrained particle burst. |
| **Pass `/p/[code]`** | Deep scene. Pass card = 3D tilt, holographic sheen, lime code glow. Screenshot-friendly (motion settles to a clean still). |
| **About / Find-pass / Contact** | Deep scene, low motion. Editorial, readable. |
| **Legal (privacy/terms/refund)** | Deep scene, near-static (perf + reading comfort). |
| **404** | Pulse glitch scene; "you wandered off the map"; magnetic home CTA. |

---

## 9. Architecture

```
src/components/motion/
  SceneCanvas.tsx     — OGL fullscreen shader; reads scene state from context; device-tier + reduced-motion fallback
  SceneProvider.tsx   — scroll→scene mapping; GSAP uniform tweens; exposes setScene()
  SmoothScroll.tsx    — Lenis wrapper, raf-synced to ScrollTrigger
  CustomCursor.tsx    — dot + ring, magnetic, contextual label; desktop-only
  Reveal.tsx          — mask/stagger reveal primitive
  MagneticButton.tsx  — reusable magnetic + spring press
  TiltCard.tsx        — parallax tilt wrapper
  shaders/
    base.vert
    dawn.frag / trail.frag / deep.frag / pulse.frag  (or one parametric frag driven by uniforms)
```

- **New deps:** `ogl`, `lenis` (`gsap` already present). ~60kb added.
- **Mounting:** `SceneProvider` + `SceneCanvas` + `SmoothScroll` + `CustomCursor` wrap the public layout (a shared `(public)` route group layout or the existing per-page `Nav/Footer` composition). Canvas mounts **after first paint** so it never blocks LCP.
- **Re-tokenization:** `globals.css` + `tailwind.config.ts` new palette; sweep every component replacing old color vars.
- **Fonts:** add Anton in `layout.tsx` via `next/font/google`, expose `--font-display`.
- **Existing logic untouched:** pages keep their data fetching (`getPublishedEvents`, `getEventBySlug`, etc.), form handlers, and props. Components are wrapped/re-skinned, not re-architected.

**Each motion unit is independently testable:** `MagneticButton`, `TiltCard`, `Reveal` are pure wrappers usable in isolation; `SceneCanvas` renders standalone given a scene prop; `SceneProvider` maps scroll→scene with no knowledge of page internals.

---

## 10. Performance budget

- Shader ≤ 2ms/frame on mid mobile; 60fps target.
- LCP not blocked — canvas lazy-mounts post-paint; headline text is real DOM (not canvas).
- First-load JS stays under ~250kb.
- Mobile is the hero device (most traffic via Instagram/WhatsApp) — every effect must degrade gracefully on it.

---

## 11. Success criteria

- Founder judges the home page as "game-like / alive / not loud" on first load.
- All public pages share the new palette + scene DNA consistently.
- 60fps on a mid-range Android; graceful fallback on low-end + reduced-motion.
- No regression in existing functionality (data reads, forms, navigation) — verified by running the app.
- `npm run build` passes; bundle within budget.

---

## 12. Rollout (informs the implementation plan split)

Likely 2 plans:
- **Plan A — Motion foundation + Home:** palette/tokens, fonts, motion primitives (`SceneCanvas`, `SceneProvider`, `SmoothScroll`, `CustomCursor`, `Reveal`, `MagneticButton`, `TiltCard`), and the Home page fully converted (Dawn→Trail). Independently shippable — proves the direction.
- **Plan B — Remaining public pages:** apply scenes + primitives to events, detail, register, success, pass, about, find-pass, contact, legal, 404.

(Admin re-palette is a small follow-up, not a motion effort.)
