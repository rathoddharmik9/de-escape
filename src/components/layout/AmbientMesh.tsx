"use client";

import { useEffect, useRef } from "react";

const blobs = [
  { color: "#ff7a5c", size: "55vw", top: "-15vw", left: "-10vw", opacity: 0.55 },
  { color: "#8a7fe6", size: "50vw", top: "30vh", right: "-15vw", opacity: 0.5 },
  { color: "#ff8fb2", size: "45vw", bottom: "-15vw", left: "20vw", opacity: 0.5 },
  { color: "#f4c97a", size: "40vw", top: "140vh", right: "10vw", opacity: 0.35 },
  { color: "#8a7fe6", size: "50vw", top: "240vh", left: "-10vw", opacity: 0.4 },
];

export default function AmbientMesh() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    import("gsap").then(({ gsap: g }) => {
      const blobs = containerRef.current?.querySelectorAll(".blob-el");
      if (!blobs) return;

      const durations = [14, 18, 16, 20, 22];
      blobs.forEach((blob, i) => {
        g.to(blob, {
          x: i % 2 === 0 ? 60 : -50,
          y: i % 2 === 0 ? 40 : 70,
          scale: 1.08 + i * 0.02,
          duration: durations[i],
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });
    });

    return () => {};
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {blobs.map((b, i) => (
        <div
          key={i}
          className="blob blob-el absolute"
          style={{
            width: b.size,
            height: b.size,
            background: b.color,
            top: b.top,
            left: b.left,
            right: (b as { right?: string }).right,
            bottom: (b as { bottom?: string }).bottom,
            opacity: b.opacity,
          }}
        />
      ))}
    </div>
  );
}
