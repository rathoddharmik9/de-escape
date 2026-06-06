# Redesign Plan A — Motion Foundation + Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the app to the light, logo-true palette (cream + green, lime accent) with Fredoka/Poppins fonts, build the reusable WebGL-shader + GSAP motion system, and fully convert the Home page to the game-style motion-graphics direction.

**Architecture:** A single persistent OGL shader canvas renders soft green/lime motion over a cream base, its uniforms tweened by a scene context as the user scrolls. Lenis drives smooth scroll synced to GSAP ScrollTrigger. Reusable motion primitives (`Reveal`, `MagneticButton`, `TiltCard`, `CustomCursor`) wrap existing components without changing their logic. Everything degrades gracefully on low-GPU/reduced-motion.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind, GSAP + ScrollTrigger (already installed), OGL (new), Lenis (new), `next/font/google` (Fredoka, Poppins).

---

## ⚠️ SESSION KICKOFF PROTOCOL (read first)

This plan runs in a fresh session. Before any code:

1. **Read the spec:** `docs/superpowers/specs/2026-06-07-game-style-redesign-design.md` — it is the source of truth for palette, fonts, scenes, motion, per-page treatment, perf budget. The logo asset is `/Users/dharmikrathod/Documents/Claude/Projects/De-escape/IMG_1791.JPG` (green-on-cream).
2. **Read current code to learn patterns:**
   - `src/app/globals.css`, `tailwind.config.ts` — current tokens (coral/violet/teal, dark). These get replaced.
   - `src/app/layout.tsx` — current fonts (Instrument Serif + Inter). These get replaced.
   - `src/app/page.tsx` — current Home (now reads from `getPublishedEvents`/`getFeaturedEvent` via Supabase data layer). Logic stays; visuals/motion change.
   - `src/components/layout/Nav.tsx`, `Footer.tsx`, `AmbientMesh.tsx`, `HeroAnimator.tsx`, `MarqueeTrack.tsx` — current motion/layout. `AmbientMesh` (the old blob bg) is replaced by `SceneCanvas`.
   - `src/components/events/EventCard.tsx` — card consumed by Home + events.
   - `src/lib/mock-data.ts` — `CATEGORY_COLORS`, `POSTER_GRADIENTS`, `formatPrice/Date/Time`, `seatsLeft`. Recolor `CATEGORY_COLORS`/`POSTER_GRADIENTS` to the green/lime family.
3. **Verify dev server runs:** `npm run dev` → open `http://localhost:3000`. Note: if port 3000 is occupied, free it first (`lsof -i :3000`).
4. **No clarifying questions needed unless the spec is ambiguous** — palette, fonts, theme are all locked. If something conflicts with current code, follow the spec and flag it.

**Verification method for every visual task:** run the dev server and look at the page in the browser (screenshots). There are no unit tests for visual/motion work — verification is "does it render correctly + 60fps + no console errors." Each task ends with a browser check, not a test run.

---

## File Structure

**New files:**
- `src/components/motion/SceneCanvas.tsx` — OGL fullscreen shader; reads scene from context; reduced-motion + low-GPU fallback to a static CSS gradient.
- `src/components/motion/SceneProvider.tsx` — React context holding current scene + target uniforms; exposes `useScene()` and `setScene()`; tweens uniforms via GSAP.
- `src/components/motion/SmoothScroll.tsx` — Lenis wrapper, raf-synced to ScrollTrigger.
- `src/components/motion/CustomCursor.tsx` — dot + ring, magnetic, contextual label; desktop-only.
- `src/components/motion/Reveal.tsx` — mask/stagger reveal primitive (client).
- `src/components/motion/MagneticButton.tsx` — magnetic + spring press wrapper.
- `src/components/motion/TiltCard.tsx` — parallax tilt wrapper.
- `src/components/motion/shaders.ts` — exported GLSL strings (`baseVert`, `fieldFrag`) + scene uniform presets.
- `src/lib/motion/scenes.ts` — `SceneName` type + `SCENE_PRESETS` (color/speed/density per scene). Single source of scene values.
- `src/app/(public)/layout.tsx` — shared public layout wrapping children in SceneProvider + SceneCanvas + SmoothScroll + CustomCursor + Nav + Footer. (See Task 9 note on route-group migration vs. per-page wrapper — this plan uses a lightweight `PublicShell` component to avoid moving route files.)
- `src/components/layout/PublicShell.tsx` — client shell composing the motion providers + Nav/Footer around `children` and accepting an `initialScene` prop.

**Modified files:**
- `tailwind.config.ts` — replace `colors.brand`, `fontFamily`, keep keyframes.
- `src/app/globals.css` — replace `:root` tokens, `.glass`→`.surface`, light theme.
- `src/app/layout.tsx` — Fredoka + Poppins fonts; light `color-scheme`.
- `src/lib/mock-data.ts` — recolor `CATEGORY_COLORS`, `POSTER_GRADIENTS` to green/lime family.
- `src/components/layout/Nav.tsx`, `Footer.tsx` — recolor + Fredoka wordmark.
- `src/components/events/EventCard.tsx` — recolor + wrap in `TiltCard`.
- `src/app/page.tsx` — convert to new shell + scenes + motion primitives (Dawn→Trail).
- Delete/retire: `src/components/layout/AmbientMesh.tsx`, `HeroAnimator.tsx` (logic folds into SceneCanvas/Reveal). Keep `MarqueeTrack.tsx`, recolor.

---

## Task 1: Install dependencies

**Files:** `package.json`

- [ ] **Step 1: Install OGL + Lenis**

```bash
cd /Users/dharmikrathod/Documents/Claude/Projects/de-escape-app
npm install ogl lenis
```

- [ ] **Step 2: Verify versions installed**

Run: `npm ls ogl lenis`
Expected: both listed with version numbers, no "missing" errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add ogl + lenis for motion system"
```

---

## Task 2: Fonts (Fredoka + Poppins)

**Files:** `src/app/layout.tsx`

- [ ] **Step 1: Replace font imports**

Replace the existing Instrument Serif + Inter setup in `src/app/layout.tsx` with:

```tsx
import { Fredoka, Poppins } from "next/font/google";

const fredoka = Fredoka({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const poppins = Poppins({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
```

- [ ] **Step 2: Apply variables + light color-scheme on `<html>`/`<body>`**

```tsx
return (
  <html lang="en" className={`${fredoka.variable} ${poppins.variable}`} style={{ colorScheme: "light" }}>
    <body className="font-sans antialiased">
      <div className="grain" aria-hidden="true" />
      {children}
    </body>
  </html>
);
```

- [ ] **Step 3: Update metadata** — leave the existing `metadata` export unchanged.

- [ ] **Step 4: Verify build of fonts**

Run: `npm run dev`, open `/`. Expect no font-loading errors in terminal (page may look unstyled until Task 3 — that's fine).

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: swap fonts to Fredoka + Poppins (logo match)"
```

---

## Task 3: Light palette tokens

**Files:** `src/app/globals.css`, `tailwind.config.ts`

- [ ] **Step 1: Replace `:root` in `globals.css`**

Replace the entire `:root { ... }` block and the dark `html, body` rules with:

```css
:root {
  --cream: #F5ECCE;
  --cream-soft: #FBF6E6;
  --cream-deep: #ECE0C0;
  --green: #2C8A4B;
  --green-deep: #1F6336;
  --green-ink: #14331F;
  --lime: #C8F135;
  --lime-deep: #A9CE1E;
  --ink-dim: #5C6B5E;
  --ink-mute: #8A9384;
  --surface-border: rgba(20, 51, 31, 0.12);
  --background: var(--cream);
  --foreground: var(--green-ink);
  --radius: 0.75rem;
}

html, body {
  background: var(--cream);
  color: var(--green-ink);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
  scroll-behavior: smooth;
}
```

- [ ] **Step 2: Replace `.glass` with `.surface` (light) and recolor selection/scrollbar/grain**

```css
.surface {
  background: var(--cream-soft);
  border: 1px solid var(--surface-border);
}
.surface-deep {
  background: var(--cream-deep);
  border: 1px solid var(--surface-border);
}
::selection { background: var(--lime); color: var(--green-ink); }
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--cream-deep); }
::-webkit-scrollbar-thumb { background: var(--green); border-radius: 3px; }
.grain { opacity: 0.04; } /* lighter on cream; keep existing svg url rule */
*:focus-visible { outline: 2px solid var(--green); outline-offset: 2px; border-radius: 4px; }
```

Keep the existing `@keyframes shimmer`, `.skeleton` (but change its gradient to green tints):

```css
.skeleton {
  background: linear-gradient(90deg, rgba(44,138,75,0.06) 25%, rgba(44,138,75,0.14) 50%, rgba(44,138,75,0.06) 75%);
  background-size: 1000px 100%;
  animation: shimmer 2s infinite linear;
}
```

- [ ] **Step 3: Update `tailwind.config.ts`** — replace `colors.brand` and `fontFamily`:

```ts
colors: {
  background: "var(--background)",
  foreground: "var(--foreground)",
  brand: {
    cream: "#F5ECCE",
    "cream-soft": "#FBF6E6",
    "cream-deep": "#ECE0C0",
    green: "#2C8A4B",
    "green-deep": "#1F6336",
    "green-ink": "#14331F",
    lime: "#C8F135",
    "lime-deep": "#A9CE1E",
    "ink-dim": "#5C6B5E",
    "ink-mute": "#8A9384",
  },
},
fontFamily: {
  display: ["var(--font-display)", "ui-rounded", "system-ui", "sans-serif"],
  sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
},
```

Set `darkMode: "class"` can stay; remove any old `--coral`/category dark vars block at the bottom of `globals.css`.

- [ ] **Step 4: Verify**

Run dev server, open `/`. Page background should now be cream; existing text may be mis-colored (uses old `var(--ink)` etc.) — that's expected, fixed as components are recolored in later tasks. Confirm no CSS build errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css tailwind.config.ts
git commit -m "feat: light cream + green palette tokens"
```

---

## Task 4: Scene presets (single source of truth)

**Files:** `src/lib/motion/scenes.ts`

- [ ] **Step 1: Define scene names + presets**

```ts
// src/lib/motion/scenes.ts
export type SceneName = "dawn" | "trail" | "deep" | "pulse";

export interface ScenePreset {
  colorA: [number, number, number]; // green motion color (0–1 rgb)
  colorB: [number, number, number]; // lime accent
  colorC: [number, number, number]; // cream base (keeps field light)
  speed: number;
  density: number;
}

const rgb = (r: number, g: number, b: number): [number, number, number] => [r / 255, g / 255, b / 255];

export const SCENE_PRESETS: Record<SceneName, ScenePreset> = {
  dawn:  { colorA: rgb(44, 138, 75), colorB: rgb(200, 241, 53), colorC: rgb(245, 236, 206), speed: 0.12, density: 0.55 },
  trail: { colorA: rgb(44, 138, 75), colorB: rgb(169, 206, 30), colorC: rgb(245, 236, 206), speed: 0.18, density: 0.7 },
  deep:  { colorA: rgb(31, 99, 54),  colorB: rgb(44, 138, 75),  colorC: rgb(236, 224, 192), speed: 0.07, density: 0.85 },
  pulse: { colorA: rgb(44, 138, 75), colorB: rgb(200, 241, 53), colorC: rgb(245, 236, 206), speed: 0.25, density: 0.6 },
};

export const DEFAULT_SCENE: SceneName = "dawn";
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/motion/scenes.ts
git commit -m "feat: scene presets for shader system"
```

---

## Task 5: Shaders (GLSL strings)

**Files:** `src/components/motion/shaders.ts`

- [ ] **Step 1: Write vertex + fragment GLSL**

A fullscreen-triangle vertex shader and a flowing-noise fragment that blends colorC (cream base) with green/lime flow, reacting to mouse + scroll.

```ts
// src/components/motion/shaders.ts
export const baseVert = /* glsl */ `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const fieldFrag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uDensity;
  uniform vec2  uMouse;
  uniform float uScroll;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform vec3  uColorC;
  uniform vec2  uRes;

  // simplex-ish value noise
  vec2 hash(vec2 p){ p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3))); return -1.0+2.0*fract(sin(p)*43758.5453123); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(dot(hash(i+vec2(0.0,0.0)),f-vec2(0.0,0.0)),
                   dot(hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),
               mix(dot(hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),
                   dot(hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);
  }

  void main(){
    vec2 uv = vUv;
    vec2 aspect = vec2(uRes.x/uRes.y, 1.0);
    vec2 p = (uv - 0.5) * aspect;
    float t = uTime * uSpeed;

    // mouse ripple
    float md = distance(uv, uMouse);
    float ripple = 0.15 / (md + 0.25);

    float n = 0.0;
    n += noise(p * (2.0 + uDensity*2.0) + vec2(t, t*0.6));
    n += 0.5 * noise(p * (4.0) - vec2(t*0.8, t));
    n += ripple * 0.4;
    n = n * 0.5 + 0.5;

    // light base: start from cream, layer green then lime sparingly
    vec3 col = uColorC;
    col = mix(col, uColorA, smoothstep(0.35, 0.75, n) * 0.5);
    col = mix(col, uColorB, smoothstep(0.7, 0.95, n) * 0.28);

    // subtle scroll-driven brightness drift
    col += (uScroll - 0.5) * 0.02;

    gl_FragColor = vec4(col, 1.0);
  }
`;
```

- [ ] **Step 2: Commit**

```bash
git add src/components/motion/shaders.ts
git commit -m "feat: light green/lime flow-field shaders"
```

---

## Task 6: SceneProvider context

**Files:** `src/components/motion/SceneProvider.tsx`

- [ ] **Step 1: Build the context that holds live uniform values + a setter**

The provider stores a mutable `uniformsRef` (the live values the canvas reads each frame) and a `setScene(name)` that GSAP-tweens those values toward the preset.

```tsx
"use client";

import { createContext, useContext, useRef, useCallback, useEffect } from "react";
import { gsap } from "gsap";
import { SCENE_PRESETS, DEFAULT_SCENE, type SceneName, type ScenePreset } from "@/lib/motion/scenes";

interface LiveUniforms {
  colorA: [number, number, number];
  colorB: [number, number, number];
  colorC: [number, number, number];
  speed: number;
  density: number;
}

interface SceneCtx {
  uniformsRef: React.MutableRefObject<LiveUniforms>;
  setScene: (name: SceneName) => void;
  currentRef: React.MutableRefObject<SceneName>;
}

const Ctx = createContext<SceneCtx | null>(null);

function presetToLive(p: ScenePreset): LiveUniforms {
  return { colorA: [...p.colorA], colorB: [...p.colorB], colorC: [...p.colorC], speed: p.speed, density: p.density };
}

export function SceneProvider({ children }: { children: React.ReactNode }) {
  const uniformsRef = useRef<LiveUniforms>(presetToLive(SCENE_PRESETS[DEFAULT_SCENE]));
  const currentRef = useRef<SceneName>(DEFAULT_SCENE);

  const setScene = useCallback((name: SceneName) => {
    if (currentRef.current === name) return;
    currentRef.current = name;
    const target = SCENE_PRESETS[name];
    const u = uniformsRef.current;
    gsap.to(u, { speed: target.speed, density: target.density, duration: 1.2, ease: "power2.inOut" });
    (["colorA", "colorB", "colorC"] as const).forEach((key) => {
      [0, 1, 2].forEach((i) => {
        gsap.to(u[key], { [i]: target[key][i], duration: 1.2, ease: "power2.inOut" });
      });
    });
  }, []);

  return <Ctx.Provider value={{ uniformsRef, setScene, currentRef }}>{children}</Ctx.Provider>;
}

export function useScene() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useScene must be used within SceneProvider");
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/motion/SceneProvider.tsx
git commit -m "feat: scene provider with GSAP uniform tweening"
```

---

## Task 7: SceneCanvas (OGL renderer + fallback)

**Files:** `src/components/motion/SceneCanvas.tsx`

- [ ] **Step 1: Build the canvas that reads uniforms each frame**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Vec2 } from "ogl";
import { useScene } from "./SceneProvider";
import { baseVert, fieldFrag } from "./shaders";

function lowGpu(): boolean {
  if (typeof navigator === "undefined") return false;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return (mem !== undefined && mem <= 2) || navigator.hardwareConcurrency <= 2;
}

export default function SceneCanvas() {
  const { uniformsRef } = useScene();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wrap = wrapRef.current;
    if (!wrap) return;

    // Fallback: static cream→green gradient
    if (reduce || lowGpu()) {
      wrap.style.background =
        "radial-gradient(120% 100% at 50% 0%, #F5ECCE 0%, #ECE0C0 55%, rgba(44,138,75,0.10) 100%)";
      return;
    }

    const renderer = new Renderer({ alpha: false, dpr: Math.min(window.devicePixelRatio, 1.5) });
    const gl = renderer.gl;
    gl.clearColor(0.96, 0.93, 0.81, 1);
    wrap.appendChild(gl.canvas);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    const u = uniformsRef.current;
    const program = new Program(gl, {
      vertex: baseVert,
      fragment: fieldFrag,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: u.speed },
        uDensity: { value: u.density },
        uMouse: { value: new Vec2(0.5, 0.5) },
        uScroll: { value: 0 },
        uColorA: { value: u.colorA },
        uColorB: { value: u.colorB },
        uColorC: { value: u.colorC },
        uRes: { value: new Vec2(1, 1) },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    function resize() {
      renderer.setSize(wrap!.clientWidth, wrap!.clientHeight);
      program.uniforms.uRes.value.set(gl.canvas.width, gl.canvas.height);
    }
    resize();
    window.addEventListener("resize", resize);

    const mouse = new Vec2(0.5, 0.5);
    function onMove(e: PointerEvent) {
      mouse.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
    }
    window.addEventListener("pointermove", onMove);

    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      program.uniforms.uScroll.value = max > 0 ? window.scrollY / max : 0;
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    let raf = 0;
    function frame(time: number) {
      program.uniforms.uTime.value = time * 0.001;
      program.uniforms.uSpeed.value = u.speed;
      program.uniforms.uDensity.value = u.density;
      program.uniforms.uColorA.value = u.colorA;
      program.uniforms.uColorB.value = u.colorB;
      program.uniforms.uColorC.value = u.colorC;
      // ease mouse
      const m = program.uniforms.uMouse.value as Vec2;
      m.x += (mouse.x - m.x) * 0.05;
      m.y += (mouse.y - m.y) * 0.05;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      gl.canvas.remove();
    };
  }, [uniformsRef]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.9 }}
    />
  );
}
```

- [ ] **Step 2: Verify it renders standalone** — temporarily render `<SceneProvider><SceneCanvas/></SceneProvider>` on `/`; expect a soft animated cream/green field, 60fps, no WebGL errors in console.

- [ ] **Step 3: Commit**

```bash
git add src/components/motion/SceneCanvas.tsx
git commit -m "feat: OGL scene canvas with reduced-motion + low-gpu fallback"
```

---

## Task 8: SmoothScroll + CustomCursor

**Files:** `src/components/motion/SmoothScroll.tsx`, `src/components/motion/CustomCursor.tsx`

- [ ] **Step 1: Lenis smooth scroll synced to ScrollTrigger**

```tsx
"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => { lenis.raf(time * 1000); };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => { gsap.ticker.remove(raf); lenis.destroy(); };
  }, []);
  return <>{children}</>;
}
```

- [ ] **Step 2: Custom cursor (desktop-only, magnetic, label)**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;

    document.body.style.cursor = "none";
    const dot = dotRef.current!, ring = ringRef.current!, label = labelRef.current!;
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring2 = { x: pos.x, y: pos.y };

    const move = (e: PointerEvent) => { pos.x = e.clientX; pos.y = e.clientY; };
    window.addEventListener("pointermove", move);

    let raf = 0;
    const loop = () => {
      gsap.set(dot, { x: pos.x, y: pos.y });
      ring2.x += (pos.x - ring2.x) * 0.18;
      ring2.y += (pos.y - ring2.y) * 0.18;
      gsap.set(ring, { x: ring2.x, y: ring2.y });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const over = (e: Event) => {
      const t = (e.target as HTMLElement).closest("[data-cursor]");
      if (t) {
        gsap.to(ring, { scale: 2.2, duration: 0.3 });
        const text = (t as HTMLElement).dataset.cursor;
        label.textContent = text && text !== "true" ? text : "";
      } else {
        gsap.to(ring, { scale: 1, duration: 0.3 });
        label.textContent = "";
      }
    };
    document.addEventListener("pointerover", over);

    return () => {
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="fixed top-0 left-0 z-[100] pointer-events-none -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ background: "var(--green)" }} />
      <div ref={ringRef} className="fixed top-0 left-0 z-[100] pointer-events-none -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center" style={{ border: "1.5px solid var(--green)" }}>
        <span ref={labelRef} className="text-[9px] font-sans uppercase tracking-wider" style={{ color: "var(--green)" }} />
      </div>
    </>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/motion/SmoothScroll.tsx src/components/motion/CustomCursor.tsx
git commit -m "feat: lenis smooth scroll + custom magnetic cursor"
```

---

## Task 9: Reveal, MagneticButton, TiltCard primitives

**Files:** `src/components/motion/Reveal.tsx`, `MagneticButton.tsx`, `TiltCard.tsx`

- [ ] **Step 1: Reveal (mask/stagger on scroll)**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Reveal({ children, y = 40, delay = 0, className }: { children: React.ReactNode; y?: number; delay?: number; className?: string; }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(el, { opacity: 1, y: 0 }); return;
    }
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo(el, { opacity: 0, y }, {
      opacity: 1, y: 0, duration: 0.9, delay, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  }, [y, delay]);
  return <div ref={ref} className={className} style={{ opacity: 0 }}>{children}</div>;
}
```

- [ ] **Step 2: MagneticButton**

```tsx
"use client";

import { useRef } from "react";
import { gsap } from "gsap";

export default function MagneticButton({ children, className, strength = 0.35, ...rest }: React.ComponentProps<"div"> & { strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const r = el.getBoundingClientRect();
    gsap.to(el, { x: (e.clientX - (r.left + r.width / 2)) * strength, y: (e.clientY - (r.top + r.height / 2)) * strength, duration: 0.4, ease: "power3.out" });
  };
  const reset = () => { if (ref.current) gsap.to(ref.current, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" }); };
  return <div ref={ref} className={className} onPointerMove={onMove} onPointerLeave={reset} {...rest}>{children}</div>;
}
```

- [ ] **Step 3: TiltCard**

```tsx
"use client";

import { useRef } from "react";
import { gsap } from "gsap";

export default function TiltCard({ children, className, max = 8 }: { children: React.ReactNode; className?: string; max?: number; }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current; if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(el, { rotateY: px * max, rotateX: -py * max, duration: 0.4, ease: "power3.out", transformPerspective: 800 });
  };
  const reset = () => { if (ref.current) gsap.to(ref.current, { rotateX: 0, rotateY: 0, duration: 0.6, ease: "power3.out" }); };
  return <div ref={ref} className={className} onPointerMove={onMove} onPointerLeave={reset} style={{ transformStyle: "preserve-3d" }}>{children}</div>;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/motion/Reveal.tsx src/components/motion/MagneticButton.tsx src/components/motion/TiltCard.tsx
git commit -m "feat: reveal, magnetic button, tilt card motion primitives"
```

---

## Task 10: PublicShell (composes the motion system)

**Files:** `src/components/layout/PublicShell.tsx`

- [ ] **Step 1: Build the shell**

Wraps page content in the providers + scene canvas + Nav/Footer, and sets an initial scene. Uses a small inner component to call `setScene` from inside the provider.

```tsx
"use client";

import { useEffect } from "react";
import { SceneProvider, useScene } from "@/components/motion/SceneProvider";
import SceneCanvas from "@/components/motion/SceneCanvas";
import SmoothScroll from "@/components/motion/SmoothScroll";
import CustomCursor from "@/components/motion/CustomCursor";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import type { SceneName } from "@/lib/motion/scenes";

function SceneSetter({ scene }: { scene: SceneName }) {
  const { setScene } = useScene();
  useEffect(() => { setScene(scene); }, [scene, setScene]);
  return null;
}

export default function PublicShell({ children, initialScene = "deep", footer = true }: { children: React.ReactNode; initialScene?: SceneName; footer?: boolean; }) {
  return (
    <SceneProvider>
      <SceneCanvas />
      <SceneSetter scene={initialScene} />
      <CustomCursor />
      <SmoothScroll>
        <Nav />
        <main className="relative z-10">{children}</main>
        {footer && <Footer />}
      </SmoothScroll>
    </SceneProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/PublicShell.tsx
git commit -m "feat: PublicShell composing scene + motion + chrome"
```

---

## Task 11: Recolor Nav + Footer + Marquee

**Files:** `src/components/layout/Nav.tsx`, `Footer.tsx`, `MarqueeTrack.tsx`

- [ ] **Step 1: Nav** — replace all `var(--ink*)`/`var(--coral)`/`var(--peach)`/`.glass` with light tokens. Wordmark uses `font-display` (Fredoka) in `--green`; the `.` accent in `--lime-deep`. Pill nav links `--green-ink` on hover bg `--cream-deep`. Primary CTA: background `--green`, text `--cream`. Add `data-cursor="true"` to the CTA. Use `.surface` for the nav pill background and `border-[var(--surface-border)]`.

- [ ] **Step 2: Footer** — same token swap: text `--ink-dim`, links hover `--green`, wordmark `font-display` `--green` with `--lime-deep` dot, social chips `border-[var(--surface-border)]`.

- [ ] **Step 3: MarqueeTrack** — text `--green` at low opacity, separators `--lime-deep`. Keep the GSAP loop.

- [ ] **Step 4: Verify** — dev server, `/`: nav + footer render on cream, green Fredoka wordmark, no old colors. Check console clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Nav.tsx src/components/layout/Footer.tsx src/components/layout/MarqueeTrack.tsx
git commit -m "feat: recolor nav, footer, marquee to light palette"
```

---

## Task 12: Recolor EventCard + wrap in TiltCard

**Files:** `src/components/events/EventCard.tsx`, `src/lib/mock-data.ts`

- [ ] **Step 1: Recolor category maps in `mock-data.ts`**

Replace `CATEGORY_COLORS` and `POSTER_GRADIENTS` with the green/lime family:

```ts
export const CATEGORY_COLORS: Record<string, string> = {
  sound_bath: "#3FA76A",
  supper: "#A9CE1E",
  run: "#2C8A4B",
  book_circle: "#1F6336",
  cycling: "#C8F135",
  other: "#8A9384",
};

export const POSTER_GRADIENTS: Record<string, string> = {
  sound_bath: "linear-gradient(135deg,#3FA76A 0%,#2C8A4B 100%)",
  supper: "linear-gradient(135deg,#A9CE1E 0%,#2C8A4B 100%)",
  run: "linear-gradient(135deg,#2C8A4B 0%,#1F6336 100%)",
  book_circle: "linear-gradient(135deg,#1F6336 0%,#2C8A4B 100%)",
  cycling: "linear-gradient(135deg,#C8F135 0%,#A9CE1E 100%)",
  other: "linear-gradient(135deg,#8A9384 0%,#2C8A4B 100%)",
};
```

- [ ] **Step 2: Recolor `EventCard.tsx`** — card bg `.surface`, border `--surface-border`; title `font-display` `--green-ink`; date/eyebrow `--green` uppercase Poppins; price `font-display`; almost-full dot `--lime-deep`; sold-out badge `--cream-deep`/`--ink-dim`. Keep the image/poster logic. Add `data-cursor="View"` to the root link.

- [ ] **Step 3: Wrap card body in TiltCard** — import `TiltCard`, wrap the inner content so the whole card tilts on hover (keep the `<Link>` as the outer element; put `<TiltCard>` inside it around the poster+body).

- [ ] **Step 4: Verify** — `/` shows recolored cards that tilt on hover; `/events` too (it reuses the card). Console clean.

- [ ] **Step 5: Commit**

```bash
git add src/components/events/EventCard.tsx src/lib/mock-data.ts
git commit -m "feat: recolor event card to green/lime + tilt on hover"
```

---

## Task 13: Convert Home page (Dawn → Trail)

**Files:** `src/app/page.tsx`

The Home page is an `async` server component reading `getPublishedEvents()` + `getFeaturedEvent()`. Keep the data fetching; replace the `AmbientMesh`/`Nav`/`HeroAnimator` chrome with `PublicShell`, recolor sections, and add scene transitions + motion primitives.

- [ ] **Step 1: Swap the shell**

Remove `<AmbientMesh/>`, `<Nav/>`, `<Footer/>`, and the old `HeroAnimator` import. Wrap the page body in `<PublicShell initialScene="dawn">…</PublicShell>`. Keep the `await getPublishedEvents()` / `getFeaturedEvent()` calls at top.

- [ ] **Step 2: Hero — Fredoka headline + Reveal**

Replace the headline markup with a Fredoka display heading reading the brand line ("Discover what's around you" / "Escape the ordinary"). Use the `Reveal` primitive for eyebrow, subline, CTAs. CTA buttons wrapped in `MagneticButton`, background `--green` text `--cream`, plus a `--lime` secondary. Add `data-cursor="Reserve"` to the primary. Featured-event side card wrapped in `TiltCard`, `.surface` bg.

- [ ] **Step 3: Scene transition Dawn→Trail**

Add a client snippet (small `"use client"` component, e.g. `src/components/motion/HomeScenes.tsx`) that uses `useScene().setScene` + a ScrollTrigger: when the "what's on" section enters, `setScene("trail")`; back to `"dawn"` on leave-back. Render it inside `PublicShell`.

```tsx
// src/components/motion/HomeScenes.tsx
"use client";
import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScene } from "./SceneProvider";

export default function HomeScenes() {
  const { setScene } = useScene();
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: "#discover", start: "top 60%", end: "bottom top",
      onEnter: () => setScene("trail"),
      onLeaveBack: () => setScene("dawn"),
    });
    return () => st.kill();
  }, [setScene]);
  return null;
}
```

- [ ] **Step 4: Recolor all Home sections** — discover heading `font-display` `--green-ink` with `--green`/`--lime-deep` accents; stats band `.surface-deep`; brand-story category pills recolored to the green/lime family; closing CTA card `.surface` with a `--lime`/`--green` conic ring (recolor the existing conic-gradient to greens). Replace every `var(--ink)/(--coral)/(--peach)/(--violet)` with light tokens. Cards rail: keep horizontal scroll; add draggable feel later in Plan B if time (optional here).

- [ ] **Step 5: Verify (the big one)**

Run dev server, open `/`:
- Cream base, animated green/lime shader field behind content.
- Fredoka green headline reveals on load.
- Cursor is custom; CTAs magnetic; cards tilt.
- Scrolling into "what's on" morphs the shader (slightly faster/greener).
- 60fps (check DevTools perf), no console errors.
- Toggle OS reduced-motion → shader becomes static gradient, native cursor, no smooth scroll. Still fully usable.

Take screenshots top + mid + bottom.

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/components/motion/HomeScenes.tsx
git commit -m "feat: home page converted to light game-style motion (dawn→trail)"
```

---

## Task 14: Retire dead chrome + build verification

**Files:** delete `AmbientMesh.tsx`, `HeroAnimator.tsx`

- [ ] **Step 1: Confirm nothing imports the old components**

Run: `grep -rn "AmbientMesh\|HeroAnimator" src`
Expected: only matches inside the two files themselves (and any not-yet-converted pages — if other public pages still import `AmbientMesh`, leave the file until Plan B and skip deletion; note it).

- [ ] **Step 2: Delete if unused** — if `grep` shows only self-references, `rm src/components/layout/AmbientMesh.tsx src/components/layout/HeroAnimator.tsx`. Otherwise defer to Plan B.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, no type errors. (Other public pages still use old tokens — they'll look off but must still BUILD. If a deleted-token reference breaks the build, that page is converted in Plan B; for now ensure build passes — if AmbientMesh deletion broke a page, restore the file.)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: retire old ambient mesh / hero animator chrome"
```

---

## Self-Review checklist (run before declaring done)

- [ ] Home renders light cream + green, animated shader, Fredoka headlines — matches spec §4/§5/§6/§8.
- [ ] Custom cursor, magnetic CTAs, tilt cards, scroll scene morph all work (spec §7).
- [ ] Reduced-motion + low-GPU fallback verified (spec §7).
- [ ] No bright-lime text on cream (AA) — lime only as fills/glows; lime text uses `--lime-deep`/`--green-ink` (spec §4 contrast note).
- [ ] `npm run build` passes; first-load JS within ~250kb budget for `/` (spec §10). Check the build output size line for `/`.
- [ ] No old tokens left in converted files: `grep -rn "var(--coral\|--violet\|--peach\|--ink)\b" src/app/page.tsx src/components/layout src/components/events` → none.

---

## Handoff to Plan B

Plan A delivers the motion system + Home. The motion primitives (`PublicShell`, `Reveal`, `MagneticButton`, `TiltCard`, scenes) are now reusable. Plan B applies them to the remaining public pages. Old tokens still live in unconverted pages — that's expected and handled in Plan B.
