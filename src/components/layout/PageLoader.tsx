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
          // Remove the background rect to make it transparent
          const rect = svg.querySelector("rect");
          if (rect) {
            rect.remove();
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

    const textElements = containerRef.current?.querySelectorAll("text");
    if (!textElements || textElements.length === 0) {
      // Fallback simple fade out if no text elements found
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

    // Setup text elements for draw animation
    textElements.forEach((el) => {
      // Use a fixed value of 1000 for stroke dasharray/offset
      el.style.strokeDasharray = "1000";
      el.style.strokeDashoffset = "1000";

      const isSubtitle = el.classList.contains("subtitle");

      // Initial styles for draw phase
      el.style.fill = "transparent";
      el.style.stroke = isSubtitle ? "var(--green-ink)" : "var(--green)";
      el.style.strokeWidth = isSubtitle ? "1px" : "3.5px";
      el.style.strokeLinejoin = "round";
    });

    const percentEl = overlayRef.current?.querySelector(".loader-percent");
    const barEl = overlayRef.current?.querySelector(".loader-bar-fill");
    const progressObj = { value: 0 };

    const tl = gsap.timeline({
      onComplete: () => {
        // Reset body scroll lock
        document.body.style.overflow = "";
        onComplete();
      },
    });

    // 1. Synchronize outline drawing with progress bar and percent counter
    tl.to(
      progressObj,
      {
        value: 100,
        duration: 2.2,
        ease: "power2.inOut",
        onUpdate: () => {
          if (percentEl) {
            percentEl.textContent = String(Math.floor(progressObj.value)).padStart(3, "0") + "%";
          }
          if (barEl) {
            gsap.set(barEl, { scaleX: progressObj.value / 100 });
          }
        },
      },
      0
    );

    // Draw outlines of text sequentially (title first, then subtitle)
    tl.to(
      textElements,
      {
        strokeDashoffset: 0,
        duration: 2.0,
        stagger: 0.35,
        ease: "power2.inOut",
      },
      0
    );

    // 2. Transition stroke to transparent and reveal brand colors
    tl.to(
      textElements,
      {
        fill: (index) => {
          const el = textElements[index] as SVGTextElement;
          const isSubtitle = el.classList.contains("subtitle");
          return isSubtitle ? "var(--green-ink)" : "var(--green)";
        },
        stroke: "transparent",
        duration: 0.8,
        ease: "power1.out",
      },
      "-=0.5"
    );

    // 3. Subtle scale up of the logo container for depth
    tl.to(
      containerRef.current,
      {
        scale: 1.03,
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
        className="loader-overlay fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--cream)]/85 backdrop-blur-xl"
      >
        <div ref={containerRef} className="w-full max-w-lg px-6 text-center select-none">
          <h1
            className="text-6xl font-black text-[var(--green)]"
            style={{ fontFamily: "var(--font-logo), sans-serif", WebkitTextStroke: "1px var(--green)" }}
          >
            De-escape
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={overlayRef}
      className="loader-overlay fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--cream)]/80 backdrop-blur-xl"
    >
      <div className="w-full max-w-xl px-6 text-center select-none flex flex-col items-center">
        <div ref={containerRef} className="w-full overflow-visible">
          {svgHtml && <div dangerouslySetInnerHTML={{ __html: svgHtml }} />}
        </div>

        {/* Game-style loading progress indicator */}
        <div className="w-56 h-[3px] bg-[var(--cream-deep)] rounded-full overflow-hidden mt-8 relative">
          <div className="loader-bar-fill absolute inset-y-0 left-0 w-full bg-[var(--green)] origin-left scale-x-0" />
        </div>
        <div className="loader-percent mt-2.5 font-mono text-[11px] tracking-widest text-[var(--green)] opacity-70">
          000%
        </div>
      </div>
    </div>
  );
}
