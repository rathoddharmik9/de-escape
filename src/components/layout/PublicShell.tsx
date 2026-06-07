"use client";

import { useEffect } from "react";
import { useScene } from "@/components/motion/SceneProvider";
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
    <>
      <SceneSetter scene={initialScene} />
      <Nav />
      <main className="relative z-10">{children}</main>
      {footer && <Footer />}
    </>
  );
}
