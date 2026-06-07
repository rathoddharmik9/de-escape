"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle, Vec2 } from "ogl";
import { useScene } from "./SceneProvider";
import { baseVert, fieldFrag } from "./shaders";

function lowGpu(): boolean {
  if (typeof navigator === "undefined") return false;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return (mem !== undefined && mem <= 2) || navigator.hardwareConcurrency <= 2;
}

export default function SceneCanvas() {
  const { uniformsRef } = useScene();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wrap = wrapRef.current;
    if (!wrap) return;

    if (reduce || lowGpu()) {
      wrap.style.background =
        "radial-gradient(120% 100% at 50% 0%, #F5ECCE 0%, #ECE0C0 55%, rgba(44,138,75,0.10) 100%)";
      return;
    }

    const renderer = new Renderer({ alpha: false, dpr: Math.min(window.devicePixelRatio, 1.5) });
    const gl = renderer.gl;
    gl.clearColor(0.96, 0.93, 0.81, 1);
    wrap.appendChild(gl.canvas);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.display = "block";

    const u = uniformsRef.current;
    const program = new Program(gl, {
      vertex: baseVert,
      fragment: fieldFrag,
      uniforms: {
        uTime: { value: 0 },
        uSpeed: { value: u.speed },
        uDensity: { value: u.density },
        uMouse: { value: new Vec2(0.5, 0.5) },
        uScroll: { value: 0 },
        uColorA: { value: u.colorA },
        uColorB: { value: u.colorB },
        uColorC: { value: u.colorC },
        uRes: { value: new Vec2(1, 1) },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    function resize() {
      if (!wrap) return;
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      (program.uniforms.uRes.value as Vec2).set(gl.canvas.width, gl.canvas.height);
    }
    resize();
    window.addEventListener("resize", resize);

    const mouse = new Vec2(0.5, 0.5);
    function onMove(e: PointerEvent) {
      mouse.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
    }
    window.addEventListener("pointermove", onMove);

    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      program.uniforms.uScroll.value = max > 0 ? window.scrollY / max : 0;
    }
    window.addEventListener("scroll", onScroll, { passive: true });

    let raf = 0;
    function frame(time: number) {
      program.uniforms.uTime.value = time * 0.001;
      program.uniforms.uSpeed.value = u.speed;
      program.uniforms.uDensity.value = u.density;
      program.uniforms.uColorA.value = u.colorA;
      program.uniforms.uColorB.value = u.colorB;
      program.uniforms.uColorC.value = u.colorC;
      const m = program.uniforms.uMouse.value as Vec2;
      m.x += (mouse.x - m.x) * 0.05;
      m.y += (mouse.y - m.y) * 0.05;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      gl.canvas.remove();
    };
  }, [uniformsRef]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.3 }}
    />
  );
}
