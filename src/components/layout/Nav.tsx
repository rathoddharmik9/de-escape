"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function Nav() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nav.style.opacity = "1";
      nav.style.transform = "translateX(-50%)";
      return;
    }

    const showNav = () => {
      nav.style.transition = "opacity 0.7s ease, transform 0.7s ease";
      nav.style.opacity = "1";
      nav.style.transform = "translateX(-50%) translateY(0)";
    };

    const isLoaderActive = sessionStorage.getItem("de_escape_loaded") !== "true";
    if (isLoaderActive) {
      const handleLoad = () => {
        showNav();
      };
      window.addEventListener("de_escape_loaded", handleLoad);
      return () => window.removeEventListener("de_escape_loaded", handleLoad);
    } else {
      const timer = setTimeout(showNav, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <nav
      ref={navRef}
      style={{
        opacity: 0,
        transform: "translateX(-50%) translateY(-30px)",
      }}
      className="fixed top-[18px] left-1/2 z-50 w-[min(1180px,calc(100vw-36px))] flex items-center justify-between px-5 py-3 surface rounded-full"
      aria-label="Main navigation"
    >
      <Link href="/" className="h-8 block overflow-visible" aria-label="De-escape Logo">
        <svg viewBox="0 0 170 50" className="h-full w-auto overflow-visible">
          <text
            x="0"
            y="38"
            style={{
              fontFamily: "var(--font-logo), sans-serif",
              fontSize: "36px",
              fontWeight: 900,
              fill: "var(--green)",
              stroke: "var(--green)",
              strokeWidth: "1.2px",
              strokeLinejoin: "round",
              letterSpacing: "0.2px",
            }}
          >
            De-escape
          </text>
        </svg>
      </Link>

      <ul className="hidden md:flex gap-1 list-none" role="menubar">
        {[
          { label: "Discover", href: "/events" },
          { label: "About", href: "/about" },
          { label: "Find Pass", href: "/find-pass" },
        ].map((item) => (
          <li key={item.href} role="none">
            <Link
              href={item.href}
              className="text-[13px] text-[var(--ink-dim)] px-3.5 py-2 rounded-full transition-colors duration-200 hover:text-[var(--green-ink)] hover:bg-[var(--cream-deep)]"
              role="menuitem"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2">
        <Link
          href="/events"
          data-cursor="true"
          className="text-[13px] px-4 py-2.5 rounded-full font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--green-deep)]"
          style={{ color: "var(--cream)", background: "var(--green)" }}
        >
          Find your escape
        </Link>
      </div>
    </nav>
  );
}
