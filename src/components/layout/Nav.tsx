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
    // Animate in after short delay
    setTimeout(() => {
      nav.style.transition = "opacity 0.7s ease, transform 0.7s ease";
      nav.style.opacity = "1";
      nav.style.transform = "translateX(-50%) translateY(0)";
    }, 100);
  }, []);

  return (
    <nav
      ref={navRef}
      style={{
        opacity: 0,
        transform: "translateX(-50%) translateY(-30px)",
      }}
      className="fixed top-[18px] left-1/2 z-50 w-[min(1180px,calc(100vw-36px))] flex items-center justify-between px-5 py-3 glass rounded-full"
      aria-label="Main navigation"
    >
      <Link
        href="/"
        className="font-serif text-2xl leading-none tracking-tight text-[var(--ink)]"
      >
        de—escape<span className="text-[var(--coral)]">.</span>
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
              className="text-[13px] text-[var(--ink-2)] px-3.5 py-2 rounded-full transition-colors duration-200 hover:text-[var(--ink)] hover:bg-white/5"
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
          className="text-[13px] text-[var(--ink)] bg-[var(--ink)] text-[#1a0e08] px-4 py-2.5 rounded-full font-medium transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--peach)]"
          style={{ color: "#1a0e08", background: "var(--ink)" }}
        >
          Find your escape
        </Link>
      </div>
    </nav>
  );
}
