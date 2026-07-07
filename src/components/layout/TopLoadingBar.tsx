"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * A sleek top-of-page loading bar (like NProgress) that triggers on
 * Next.js client-side route changes.
 *
 * Uses the De-escape brand gradient: green → lime → green-deep.
 * Renders a 3px bar at the very top with a glowing pulse.
 */
export default function TopLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const barRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const trickleTimerRef = useRef<ReturnType<typeof setInterval>>();
  const isRunningRef = useRef(false);

  const startLoading = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    progressRef.current = 0;

    const container = containerRef.current;
    const bar = barRef.current;
    const glow = glowRef.current;
    if (!container || !bar || !glow) return;

    // Show the bar
    container.style.opacity = "1";
    container.style.pointerEvents = "auto";

    // Reset
    bar.style.transition = "none";
    bar.style.transform = "scaleX(0)";
    glow.style.opacity = "1";

    // Kick off to 15% immediately
    requestAnimationFrame(() => {
      bar.style.transition = "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)";
      progressRef.current = 0.15;
      bar.style.transform = `scaleX(${progressRef.current})`;
    });

    // Trickle: slowly increment, slowing down as it approaches 90%
    trickleTimerRef.current = setInterval(() => {
      const current = progressRef.current;
      if (current >= 0.9) {
        clearInterval(trickleTimerRef.current);
        return;
      }

      // Randomized increment that slows as we approach completion
      let increment: number;
      if (current < 0.3) {
        increment = 0.03 + Math.random() * 0.05;
      } else if (current < 0.6) {
        increment = 0.02 + Math.random() * 0.03;
      } else {
        increment = 0.005 + Math.random() * 0.015;
      }

      progressRef.current = Math.min(current + increment, 0.9);
      if (bar) {
        bar.style.transition = "transform 400ms cubic-bezier(0.4, 0, 0.2, 1)";
        bar.style.transform = `scaleX(${progressRef.current})`;
      }
    }, 350);
  }, []);

  const finishLoading = useCallback(() => {
    if (!isRunningRef.current) return;
    isRunningRef.current = false;

    clearInterval(trickleTimerRef.current);
    cancelAnimationFrame(animFrameRef.current);

    const container = containerRef.current;
    const bar = barRef.current;
    const glow = glowRef.current;
    if (!container || !bar || !glow) return;

    // Complete to 100%
    progressRef.current = 1;
    bar.style.transition = "transform 200ms cubic-bezier(0.4, 0, 0.2, 1)";
    bar.style.transform = "scaleX(1)";

    // Fade out after completing
    setTimeout(() => {
      container.style.transition = "opacity 400ms ease";
      container.style.opacity = "0";
      glow.style.opacity = "0";

      setTimeout(() => {
        bar.style.transition = "none";
        bar.style.transform = "scaleX(0)";
        progressRef.current = 0;
        container.style.pointerEvents = "none";
      }, 400);
    }, 250);
  }, []);

  // Intercept link clicks to trigger loading bar before route change
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip external links, anchors, mailto, tel, etc.
      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.target === "_blank"
      ) {
        return;
      }

      // Skip if current URL is the same (no navigation)
      if (href === window.location.pathname + window.location.search) return;

      startLoading();
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [startLoading]);

  // When pathname/searchParams change, the new page has loaded → finish
  useEffect(() => {
    finishLoading();
  }, [pathname, searchParams, finishLoading]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearInterval(trickleTimerRef.current);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        zIndex: 99999,
        opacity: 0,
        pointerEvents: "none",
      }}
    >
      {/* The progress bar itself */}
      <div
        ref={barRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(90deg, var(--green) 0%, var(--lime) 40%, var(--lime-deep) 70%, var(--green-deep) 100%)",
          transformOrigin: "left",
          transform: "scaleX(0)",
          borderRadius: "0 2px 2px 0",
        }}
      />
      {/* Glowing tip */}
      <div
        ref={glowRef}
        style={{
          position: "absolute",
          top: "-2px",
          right: 0,
          width: "80px",
          height: "7px",
          background: "linear-gradient(90deg, transparent, var(--lime))",
          borderRadius: "0 4px 4px 0",
          opacity: 1,
          boxShadow: "0 0 12px var(--lime), 0 0 5px var(--green)",
          transition: "opacity 300ms ease",
        }}
      />
    </div>
  );
}
