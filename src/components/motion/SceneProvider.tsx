"use client";

import { createContext, useContext, useRef, useCallback } from "react";
import { gsap } from "gsap";
import {
  SCENE_PRESETS,
  DEFAULT_SCENE,
  type SceneName,
  type ScenePreset,
} from "@/lib/motion/scenes";

interface LiveUniforms {
  colorA: [number, number, number];
  colorB: [number, number, number];
  colorC: [number, number, number];
  speed: number;
  density: number;
}

interface SceneCtx {
  uniformsRef: React.MutableRefObject<LiveUniforms>;
  setScene: (name: SceneName) => void;
  currentRef: React.MutableRefObject<SceneName>;
}

const Ctx = createContext<SceneCtx | null>(null);

function presetToLive(p: ScenePreset): LiveUniforms {
  return {
    colorA: [...p.colorA],
    colorB: [...p.colorB],
    colorC: [...p.colorC],
    speed: p.speed,
    density: p.density,
  };
}

export function SceneProvider({ children }: { children: React.ReactNode }) {
  const uniformsRef = useRef<LiveUniforms>(presetToLive(SCENE_PRESETS[DEFAULT_SCENE]));
  const currentRef = useRef<SceneName>(DEFAULT_SCENE);

  const setScene = useCallback((name: SceneName) => {
    if (currentRef.current === name) return;
    currentRef.current = name;
    const target = SCENE_PRESETS[name];
    const u = uniformsRef.current;
    gsap.to(u, { speed: target.speed, density: target.density, duration: 1.2, ease: "power2.inOut" });
    (["colorA", "colorB", "colorC"] as const).forEach((key) => {
      [0, 1, 2].forEach((i) => {
        gsap.to(u[key], { [i]: target[key][i], duration: 1.2, ease: "power2.inOut" });
      });
    });
  }, []);

  return <Ctx.Provider value={{ uniformsRef, setScene, currentRef }}>{children}</Ctx.Provider>;
}

export function useScene() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useScene must be used within SceneProvider");
  return ctx;
}
