"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function PageLoader({ onComplete }: { onComplete: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const logoTextRef = useRef<SVGTextElement>(null);
  const taglineTextRef = useRef<SVGTextElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      onComplete();
      return;
    }

    // Lock body scroll during animation
    document.body.style.overflow = "hidden";

    const tl = gsap.timeline({
      onComplete: () => {
        // Reset body scroll lock
        document.body.style.overflow = "";
        onComplete();
      },
    });

    // 1. Draw "De-escape" outlines
    tl.fromTo(
      logoTextRef.current,
      {
        strokeDasharray: 800,
        strokeDashoffset: 800,
        fill: "rgba(44, 138, 75, 0)",
      },
      {
        strokeDashoffset: 0,
        duration: 1.8,
        ease: "power2.inOut",
      }
    );

    // 2. Reveal filled green color and fade stroke
    tl.to(
      logoTextRef.current,
      {
        fill: "#2C8A4B", // var(--green)
        stroke: "transparent",
        duration: 0.8,
        ease: "power1.out",
      },
      "-=0.4"
    );

    // 3. Fade and reveal the tagline
    tl.fromTo(
      taglineTextRef.current,
      {
        opacity: 0,
        y: 10,
        fill: "transparent",
      },
      {
        opacity: 1,
        y: 0,
        fill: "#14331F", // var(--green-ink)
        duration: 0.8,
        ease: "power2.out",
      },
      "-=0.4"
    );

    // 4. Subtle scale up of the logo container for depth
    tl.to(
      containerRef.current,
      {
        scale: 1.04,
        duration: 1.4,
        ease: "power2.out",
      },
      "-=1.2"
    );

    // 5. Fade out the entire overlay
    tl.to(
      overlayRef.current,
      {
        opacity: 0,
        duration: 0.6,
        ease: "power2.inOut",
      },
      "+=0.4"
    );

    return () => {
      // Clean up scroll lock if component is unmounted early
      document.body.style.overflow = "";
    };
  }, [onComplete]);

  return (
    <div
      ref={overlayRef}
      className="loader-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--cream)]"
    >
      <div ref={containerRef} className="w-full max-w-lg px-6 text-center select-none">
        <svg
          viewBox="0 0 600 200"
          width="100%"
          height="100%"
          className="w-full h-auto overflow-visible"
        >
          <text
            ref={logoTextRef}
            x="50%"
            y="55%"
            textAnchor="middle"
            className="font-display font-bold"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "72px",
              letterSpacing: "-0.02em",
            }}
          >
            De-escape
          </text>
          <text
            ref={taglineTextRef}
            x="50%"
            y="82%"
            textAnchor="middle"
            className="font-sans font-medium uppercase"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              letterSpacing: "0.22em",
            }}
          >
            Discover what&apos;s around you
          </text>
        </svg>
      </div>
    </div>
  );
}
