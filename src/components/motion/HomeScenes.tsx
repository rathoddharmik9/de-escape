"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useScene } from "./SceneProvider";

export default function HomeScenes() {
  const { setScene } = useScene();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Countdown ticker (was in the retired HeroAnimator)
    const cd = document.getElementById("hero-countdown");
    let interval: ReturnType<typeof setInterval> | undefined;
    if (cd?.dataset.target) {
      const targetMs = new Date(cd.dataset.target).getTime();
      const nums = cd.querySelectorAll(".countdown-num");
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
      };
      tick();
      interval = setInterval(tick, 1000);
    }

    if (reduce) {
      gsap.set(".hero-word", { y: "0%" });
      gsap.set("#hero-subline, #hero-cta, #hero-card", { opacity: 1, y: 0 });
      return () => { if (interval) clearInterval(interval); };
    }

    gsap.registerPlugin(ScrollTrigger);

    const playHeroAnimation = () => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline
        .to(".hero-word", { y: "0%", duration: 1.0, stagger: 0.07, ease: "power4.out" }, 0.35)
        .to("#hero-subline", { opacity: 1, y: 0, duration: 0.7 }, 1.0)
        .to("#hero-cta", { opacity: 1, y: 0, duration: 0.7 }, 1.15)
        .to("#hero-card", { opacity: 1, y: 0, duration: 0.9 }, 0.5);
      return timeline;
    };

    let tl: gsap.core.Timeline | undefined;
    const handleLoad = () => {
      tl = playHeroAnimation();
    };

    const isLoaderActive = sessionStorage.getItem("de_escape_loaded") !== "true";
    if (isLoaderActive) {
      window.addEventListener("de_escape_loaded", handleLoad);
    } else {
      tl = playHeroAnimation();
    }

    // Scene transition dawn -> trail
    const st = ScrollTrigger.create({
      trigger: "#discover",
      start: "top 60%",
      end: "bottom top",
      onEnter: () => setScene("trail"),
      onLeaveBack: () => setScene("dawn"),
    });

    return () => {
      if (interval) clearInterval(interval);
      st.kill();
      if (tl) tl.kill();
      window.removeEventListener("de_escape_loaded", handleLoad);
    };
  }, [setScene]);

  return null;
}
