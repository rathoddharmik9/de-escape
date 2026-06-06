"use client";

import { useRef } from "react";
import { gsap } from "gsap";

export default function MagneticButton({
  children,
  className,
  strength = 0.35,
  ...rest
}: React.ComponentProps<"div"> & { strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const r = el.getBoundingClientRect();
    gsap.to(el, {
      x: (e.clientX - (r.left + r.width / 2)) * strength,
      y: (e.clientY - (r.top + r.height / 2)) * strength,
      duration: 0.4,
      ease: "power3.out",
    });
  };
  const reset = () => {
    if (ref.current) gsap.to(ref.current, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" });
  };
  return (
    <div ref={ref} className={className} onPointerMove={onMove} onPointerLeave={reset} {...rest}>
      {children}
    </div>
  );
}
