"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import Nav from "@/components/layout/Nav";
import AmbientMesh from "@/components/layout/AmbientMesh";

function SuccessContent() {
  const params = useSearchParams();
  const name = params.get("name") || "Explorer";
  const regId = `DE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const checkRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    // Draw the checkmark circle
    const circle = checkRef.current;
    if (!circle) return;
    const len = circle.getTotalLength?.() ?? 0;
    circle.style.strokeDasharray = String(len);
    circle.style.strokeDashoffset = String(len);
    setTimeout(() => {
      circle.style.transition = "stroke-dashoffset 1s ease";
      circle.style.strokeDashoffset = "0";
    }, 300);
  }, []);

  return (
    <div className="text-center max-w-[520px] mx-auto">
      {/* Animated checkmark */}
      <div className="mb-8 flex justify-center">
        <div className="relative w-24 h-24">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              ref={checkRef}
              cx="50" cy="50" r="44"
              fill="none"
              stroke="var(--teal)"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="36" height="28" viewBox="0 0 36 28" fill="none" aria-hidden="true">
              <path
                d="M3 14l9 9L33 3"
                stroke="var(--teal)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-[dash_0.6s_0.8s_ease_forwards]"
                style={{ strokeDasharray: 50, strokeDashoffset: 50, animation: "none" }}
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="text-xs uppercase tracking-[0.2em] text-[var(--teal)] mb-4">
        Registration received
      </div>

      <h1
        className="font-serif font-normal text-[var(--ink)] mb-4"
        style={{ fontSize: "clamp(36px,6vw,60px)", letterSpacing: "-0.03em", lineHeight: "1" }}
      >
        We got you, {name.split(" ")[0]}.
      </h1>

      <p className="text-base text-[var(--ink-2)] leading-relaxed mb-8 max-w-[42ch] mx-auto">
        Your registration is in. Watch your WhatsApp and email — we&apos;ll confirm once payment is verified and you&apos;re approved.
      </p>

      {/* Registration ID */}
      <div
        className="p-5 rounded-2xl mb-8 inline-block"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-border)" }}
      >
        <div className="text-[11px] uppercase tracking-widest text-[var(--ink-3)] mb-2">
          Registration ID
        </div>
        <div className="font-mono text-2xl text-[var(--ink)] tracking-widest">
          {regId}
        </div>
        <div className="text-xs text-[var(--ink-3)] mt-2">
          Save this — you may need it for support
        </div>
      </div>

      {/* Next steps */}
      <div className="text-left grid gap-3 mb-10">
        {[
          { step: "1", text: "We'll verify your payment (usually within a few hours)" },
          { step: "2", text: "Once approved, you'll get a pass code on WhatsApp + email" },
          { step: "3", text: "Show your pass code at the venue — that's all" },
        ].map((item) => (
          <div
            key={item.step}
            className="flex gap-4 p-4 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)" }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-[#1a0e08]"
              style={{ background: "var(--peach)" }}
            >
              {item.step}
            </div>
            <p className="text-sm text-[var(--ink-2)] leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5"
          style={{ background: "var(--ink)", color: "#1a0e08" }}
        >
          Explore more events
        </Link>
        <Link
          href="/find-pass"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium glass hover:bg-white/10 transition-all hover:-translate-y-0.5 text-[var(--ink)]"
        >
          Find my pass later
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <>
      <AmbientMesh />
      <Nav />
      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-32 pb-24">
        <Suspense fallback={<div className="text-[var(--ink-2)]">Loading…</div>}>
          <SuccessContent />
        </Suspense>
      </main>
    </>
  );
}
