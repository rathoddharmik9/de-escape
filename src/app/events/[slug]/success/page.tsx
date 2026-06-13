"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import PublicShell from "@/components/layout/PublicShell";
import MagneticButton from "@/components/motion/MagneticButton";
import { useSessionStore } from "@/lib/store/useSessionStore";

function SuccessContent() {
  const params = useSearchParams();
  const lastReg = useSessionStore((state) => state.lastRegistration);
  
  const name = lastReg?.fullName || params.get("name") || "Explorer";
  const regId = lastReg?.registrationId || params.get("reg") || `DE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const passcode = lastReg?.passCode;

  const checkRef = useRef<SVGCircleElement>(null);
  const burstRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const circle = checkRef.current;
    if (circle) {
      const len = circle.getTotalLength?.() ?? 0;
      circle.style.strokeDasharray = String(len);
      circle.style.strokeDashoffset = String(len);
      setTimeout(() => {
        circle.style.transition = "stroke-dashoffset 1s ease";
        circle.style.strokeDashoffset = "0";
      }, 300);
    }

    // Restrained lime particle burst
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const host = burstRef.current;
    if (!host) return;
    import("gsap").then(({ gsap }) => {
      const dots: HTMLDivElement[] = [];
      for (let i = 0; i < 12; i++) {
        const d = document.createElement("div");
        d.style.cssText =
          "position:absolute;top:50%;left:50%;width:8px;height:8px;border-radius:50%;background:var(--lime);pointer-events:none";
        host.appendChild(d);
        dots.push(d);
      }
      dots.forEach((d, i) => {
        const angle = (i / dots.length) * Math.PI * 2;
        gsap.fromTo(
          d,
          { x: 0, y: 0, opacity: 1, scale: 1 },
          {
            x: Math.cos(angle) * 90,
            y: Math.sin(angle) * 90,
            opacity: 0,
            scale: 0.3,
            duration: 1,
            delay: 0.9,
            ease: "power2.out",
            onComplete: () => d.remove(),
          }
        );
      });
    });
  }, []);

  return (
    <div className="text-center max-w-[520px] mx-auto">
      {/* Animated checkmark + burst */}
      <div className="mb-8 flex justify-center">
        <div ref={burstRef} className="relative w-24 h-24">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle ref={checkRef} cx="50" cy="50" r="44" fill="none" stroke="var(--green)" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="36" height="28" viewBox="0 0 36 28" fill="none" aria-hidden="true">
              <path d="M3 14l9 9L33 3" stroke="var(--green)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      <div className="text-xs uppercase tracking-[0.2em] text-[var(--green)] mb-4">Registration received</div>

      <h1
        className="font-display font-semibold text-[var(--green-ink)] mb-4"
        style={{ fontSize: "clamp(36px,6vw,60px)", letterSpacing: "-0.02em", lineHeight: "1" }}
      >
        We got you, {name.split(" ")[0]}.
      </h1>

      <p className="text-base text-[var(--ink-dim)] leading-relaxed mb-8 max-w-[42ch] mx-auto">
        Your registration is in. Watch your WhatsApp and email — we&apos;ll confirm once payment is verified and you&apos;re approved.
      </p>

      {/* Registration ID & Passcode Info */}
      <div className="p-6 rounded-3xl mb-8 inline-block surface border border-[var(--glass-border)] min-w-[280px]">
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-widest text-[var(--ink-mute)] mb-1">Registration ID</div>
          <div className="font-mono text-xl text-[var(--green-ink)] tracking-widest">{regId}</div>
        </div>
        
        {passcode && (
          <div className="pt-4 border-t border-[var(--surface-border)]">
            <div className="text-[10px] uppercase tracking-widest text-[var(--ink-mute)] mb-1">Your Pass Code</div>
            <div className="font-mono text-lg text-[var(--green)] font-semibold tracking-wider mb-3">{passcode}</div>
            <Link
              href={`/p/${passcode}`}
              data-cursor="Pass"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[var(--green)] text-[var(--cream)] hover:bg-[var(--green-deep)] transition-all duration-300"
            >
              View Ticket Pass →
            </Link>
          </div>
        )}
        
        {!passcode && (
          <div className="text-xs text-[var(--ink-mute)] mt-2">Save this ID — you may need it for support</div>
        )}
      </div>

      {/* Next steps */}
      <div className="text-left grid gap-3 mb-10">
        {[
          { step: "1", text: "We'll verify your payment (usually within a few hours)" },
          { step: "2", text: "Once approved, you'll get a pass code on WhatsApp + email" },
          { step: "3", text: "Show your pass code at the venue — that's all" },
        ].map((item) => (
          <div key={item.step} className="flex gap-4 p-4 rounded-xl surface">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: "var(--lime)", color: "var(--green-ink)" }}
            >
              {item.step}
            </div>
            <p className="text-sm text-[var(--ink-dim)] leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <MagneticButton className="inline-block">
          <Link
            href="/events"
            data-cursor="Explore"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5"
            style={{ background: "var(--green)", color: "var(--cream)" }}
          >
            Explore more events
          </Link>
        </MagneticButton>
        <MagneticButton className="inline-block">
          <Link
            href="/find-pass"
            data-cursor="true"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium surface hover:bg-[var(--cream-deep)] transition-all hover:-translate-y-0.5 text-[var(--green-ink)]"
          >
            Find my pass later
          </Link>
        </MagneticButton>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <PublicShell initialScene="pulse" footer={false}>
      <div className="min-h-screen flex items-center justify-center px-6 pt-32 pb-24">
        <Suspense fallback={<div className="text-[var(--ink-dim)]">Loading…</div>}>
          <SuccessContent />
        </Suspense>
      </div>
    </PublicShell>
  );
}
