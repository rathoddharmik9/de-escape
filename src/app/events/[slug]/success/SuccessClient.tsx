"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import Link from "next/link";
import MagneticButton from "@/components/motion/MagneticButton";
import { useSessionStore } from "@/lib/store/useSessionStore";

interface SuccessClientProps {
  eventGroupInviteLink?: string | null;
}

export default function SuccessClient({ eventGroupInviteLink }: SuccessClientProps) {
  const params = useSearchParams();
  const lastReg = useSessionStore((state) => state.lastRegistration);

  const name = lastReg?.fullName || params?.get("name") || "Explorer";
  // Server-provided data reflects the current event/admin setting; session data can be from an older registration.
  const groupInviteLink = eventGroupInviteLink || lastReg?.groupInviteLink || "";

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
        Your registration is in. Connect with the event group on WhatsApp for updates from the host.
      </p>

      <div className="p-6 rounded-3xl mb-8 surface text-left">
        <div className="text-[10px] uppercase tracking-widest text-[var(--ink-mute)] mb-2">
          Event WhatsApp group
        </div>
        {groupInviteLink ? (
          <>
            <p className="text-sm text-[var(--ink-dim)] leading-relaxed mb-4">
              Join the group for event coordination, host updates, and venue-day communication.
            </p>
            <a
              href={groupInviteLink}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="WhatsApp"
              className="inline-flex w-full items-center justify-center px-5 py-3.5 rounded-2xl text-sm font-semibold bg-[var(--green)] text-[var(--cream)] hover:bg-[var(--green-deep)] transition-all"
            >
              Connect on WhatsApp
            </a>
          </>
        ) : (
          <p className="text-sm text-[var(--ink-dim)] leading-relaxed">
            The WhatsApp group link has not been added by admin yet. The host will share the group details separately.
          </p>
        )}
      </div>

      <div className="text-left grid gap-3 mb-10">
        {[
          { step: "1", text: "Your payment proof and details have been recorded" },
          { step: "2", text: "The host will verify your registration" },
          { step: "3", text: "Use the WhatsApp group for all event updates" },
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
      </div>
    </div>
  );
}
