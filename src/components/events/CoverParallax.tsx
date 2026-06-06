"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function CoverParallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const el = ref.current;
    if (!el) return;
    const tw = gsap.to(el, {
      yPercent: 15,
      ease: "none",
      scrollTrigger: { trigger: el.parentElement!, start: "top top", end: "bottom top", scrub: true },
    });
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
    };
  }, []);
  return (
    <div ref={ref} className="absolute inset-0">
      {children}
    </div>
  );
}
