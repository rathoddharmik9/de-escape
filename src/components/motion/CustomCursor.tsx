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
    const dot = dotRef.current!;
    const ring = ringRef.current!;
    const label = labelRef.current!;
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring2 = { x: pos.x, y: pos.y };

    const move = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
    };
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
      <div
        ref={dotRef}
        className="fixed top-0 left-0 z-[100] pointer-events-none -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
        style={{ background: "var(--green)" }}
      />
      <div
        ref={ringRef}
        className="fixed top-0 left-0 z-[100] pointer-events-none -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ border: "1.5px solid var(--green)" }}
      >
        <span
          ref={labelRef}
          className="text-[9px] font-sans uppercase tracking-wider"
          style={{ color: "var(--green)" }}
        />
      </div>
    </>
  );
}
