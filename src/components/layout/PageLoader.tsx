"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export default function PageLoader({ onComplete }: { onComplete: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState<string | null>(null);

  useEffect(() => {
    fetch("/logo.svg")
      .then((res) => res.text())
      .then((data) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, "image/svg+xml");
        const svg = doc.querySelector("svg");
        if (svg) {
          // Remove the white background path (usually first path with fill #FDFEFD)
          const paths = svg.querySelectorAll("path");
          if (paths.length > 0) {
            const firstPath = paths[0];
            const fill = firstPath.getAttribute("fill")?.toLowerCase();
            if (fill === "#fdfefd" || fill === "#ffffff") {
              firstPath.remove();
            }
          }

          // Make the SVG responsive and centered
          svg.setAttribute("width", "100%");
          svg.setAttribute("height", "100%");
          svg.setAttribute("class", "w-full h-auto max-w-xl mx-auto overflow-visible");

          setSvgHtml(svg.outerHTML);
        } else {
          setSvgHtml("fallback");
        }
      })
      .catch((err) => {
        console.error("Failed to load logo SVG:", err);
        setSvgHtml("fallback");
      });
  }, []);

  useEffect(() => {
    if (!svgHtml) return;

    // Check if user prefers reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      onComplete();
      return;
    }

    // Lock body scroll during animation
    document.body.style.overflow = "hidden";

    const paths = containerRef.current?.querySelectorAll("path");
    if (!paths || paths.length === 0) {
      // Fallback simple fade out if no paths found
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.8,
        delay: 1.5,
        onComplete: () => {
          document.body.style.overflow = "";
          onComplete();
        },
      });
      return;
    }

    // Setup paths for draw animation
    paths.forEach((path) => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;

      // Tagline paths are colored light green/white in the original SVG
      const fill = path.getAttribute("fill") || "#177340";
      const isTagline =
        fill.toLowerCase() === "#fbfcfa" ||
        fill.toLowerCase() === "#eafaf6" ||
        fill.toLowerCase() === "#e4f5f1" ||
        fill.toLowerCase() === "#e0f3eb" ||
        fill.toLowerCase() === "#e8f7f2" ||
        fill.toLowerCase() === "#ebf9f1" ||
        fill.toLowerCase() === "#e7f8f1";

      path.setAttribute("data-is-tagline", isTagline ? "true" : "false");

      // Initial styles for draw phase
      path.style.fill = "transparent";
      path.style.stroke = isTagline ? "var(--green-ink)" : "var(--green)";
      path.style.strokeWidth = "1.2px";
    });

    const tl = gsap.timeline({
      onComplete: () => {
        // Reset body scroll lock
        document.body.style.overflow = "";
        onComplete();
      },
    });

    // 1. Draw outlines of paths sequentially left-to-right (using stagger)
    tl.to(paths, {
      strokeDashoffset: 0,
      duration: 2.2,
      stagger: 0.008,
      ease: "power2.inOut",
    });

    // 2. Transition stroke to transparent and reveal brand colors
    tl.to(
      paths,
      {
        fill: (index) => {
          const path = paths[index] as SVGPathElement;
          const isTagline = path.getAttribute("data-is-tagline") === "true";
          return isTagline ? "var(--green-ink)" : "var(--green)";
        },
        stroke: "transparent",
        duration: 0.8,
        ease: "power1.out",
      },
      "-=0.6"
    );

    // 3. Subtle scale up of the logo container for depth
    tl.to(
      containerRef.current,
      {
        scale: 1.04,
        duration: 1.5,
        ease: "power2.out",
      },
      "-=1.4"
    );

    // 4. Fade out the entire overlay
    tl.to(
      overlayRef.current,
      {
        opacity: 0,
        duration: 0.6,
        ease: "power2.inOut",
      },
      "+=0.3"
    );

    return () => {
      // Clean up scroll lock if component is unmounted early
      document.body.style.overflow = "";
    };
  }, [svgHtml, onComplete]);

  if (svgHtml === "fallback") {
    return (
      <div
        ref={overlayRef}
        className="loader-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--cream)]"
      >
        <div ref={containerRef} className="w-full max-w-lg px-6 text-center select-none">
          <h1 className="text-4xl font-bold font-display text-[var(--green)]">De-escape</h1>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      className="loader-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--cream)]"
    >
      <div
        ref={containerRef}
        className="w-full max-w-xl px-6 text-center select-none overflow-visible"
        dangerouslySetInnerHTML={svgHtml ? { __html: svgHtml } : undefined}
      />
    </div>
  );
}
