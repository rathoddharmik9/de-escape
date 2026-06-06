"use client";

import { useEffect } from "react";

export default function HeroAnimator({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Reveal everything instantly
      document.querySelectorAll(".hero-word, #hero-eyebrow, #hero-subline, #hero-cta, #hero-card").forEach((el) => {
        (el as HTMLElement).style.opacity = "1";
        (el as HTMLElement).style.transform = "none";
      });
      return;
    }

    import("gsap").then(async ({ gsap }) => {
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.to("#hero-eyebrow", { opacity: 1, y: 0, duration: 0.6 }, 0.2)
        .to(".hero-word", { y: "0%", duration: 1.1, stagger: 0.07, ease: "power4.out" }, 0.35)
        .to("#hero-subline", { opacity: 1, y: 0, duration: 0.7 }, 1.0)
        .to("#hero-cta", { opacity: 1, y: 0, duration: 0.7 }, 1.15)
        .to("#hero-card", { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 0.5);

      // Countdown ticker
      const cdContainer = document.getElementById("hero-countdown");
      if (cdContainer) {
        const targetIso = cdContainer.dataset.target;
        if (targetIso) {
          const targetMs = new Date(targetIso).getTime();
          const nums = cdContainer.querySelectorAll(".countdown-num");

          const tick = () => {
            const diff = Math.max(0, targetMs - Date.now());
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            const values = [d, h, m, s];
            nums.forEach((el, i) => {
              el.textContent = String(values[i]).padStart(2, "0");
            });
          }
          tick();
          setInterval(tick, 1000);
        }
      }

      // Blob parallax
      gsap.to(".blob-el:nth-child(1)", {
        yPercent: 30,
        ease: "none",
        scrollTrigger: { trigger: "main", start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".blob-el:nth-child(3)", {
        yPercent: -20,
        ease: "none",
        scrollTrigger: { trigger: "main", start: "top top", end: "bottom top", scrub: true },
      });

      // Pointer tilt on hero card
      const card = document.getElementById("hero-card");
      const hero = document.querySelector("section");
      if (card && hero) {
        hero.addEventListener("pointermove", (e: Event) => {
          const pe = e as PointerEvent;
          const r = hero.getBoundingClientRect();
          const px = (pe.clientX - r.left) / r.width - 0.5;
          const py = (pe.clientY - r.top) / r.height - 0.5;
          gsap.to(card, {
            rotateY: px * 6,
            rotateX: -py * 6,
            duration: 0.6,
            ease: "power3.out",
            transformPerspective: 800,
            transformOrigin: "center",
          });
        });
        hero.addEventListener("pointerleave", () => {
          gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.8, ease: "power3.out" });
        });
      }
    });
  }, []);

  return <>{children}</>;
}
