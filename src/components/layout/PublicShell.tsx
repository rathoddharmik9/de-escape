"use client";

import { useEffect } from "react";
import { SceneProvider, useScene } from "@/components/motion/SceneProvider";
import SceneCanvas from "@/components/motion/SceneCanvas";
import SmoothScroll from "@/components/motion/SmoothScroll";
import CustomCursor from "@/components/motion/CustomCursor";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import type { SceneName } from "@/lib/motion/scenes";

function SceneSetter({ scene }: { scene: SceneName }) {
  const { setScene } = useScene();
  useEffect(() => {
    setScene(scene);
  }, [scene, setScene]);
  return null;
}

export default function PublicShell({
  children,
  initialScene = "deep",
  footer = true,
}: {
  children: React.ReactNode;
  initialScene?: SceneName;
  footer?: boolean;
}) {
  return (
    <SceneProvider>
      <SceneCanvas />
      <SceneSetter scene={initialScene} />
      <CustomCursor />
      <SmoothScroll>
        <Nav />
        <main className="relative z-10">{children}</main>
        {footer && <Footer />}
      </SmoothScroll>
    </SceneProvider>
  );
}
