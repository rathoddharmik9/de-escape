"use client";

import { useEffect, useRef } from "react";

const TAGS = [
  "sound baths",
  "supper clubs",
  "run clubs",
  "book circles",
  "open mics",
  "pottery",
  "strangers + chai",
  "silent discos",
  "poetry nights",
  "cold-water meets",
  "midnight cycling",
  "rooftop yoga",
];

export default function MarqueeTrack() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    import("gsap").then(({ gsap }) => {
      const track = trackRef.current;
      if (!track) return;
      const half = track.scrollWidth / 2;
      gsap.to(track, { x: -half, duration: 40, repeat: -1, ease: "none" });
    });
  }, []);

  const doubled = [...TAGS, ...TAGS];

  return (
    <div
      className="relative z-10 overflow-hidden py-5 border-y border-[var(--surface-border)]"
      style={{ background: "var(--cream-soft)" }}
      aria-hidden="true"
    >
      <div ref={trackRef} className="flex gap-12 whitespace-nowrap will-change-transform">
        {doubled.map((tag, i) => (
          <span
            key={i}
            className="font-display text-[26px] text-[var(--green)] opacity-70 inline-flex items-center gap-12 whitespace-nowrap"
          >
            {tag}
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--lime-deep)" }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
