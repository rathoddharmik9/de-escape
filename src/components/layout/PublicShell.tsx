"use client";

import { useEffect, useState } from "react";
import { useScene } from "@/components/motion/SceneProvider";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import type { SceneName } from "@/lib/motion/scenes";
import { getPublicAppSettings } from "@/lib/actions/admin-settings";

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
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    getPublicAppSettings().then((nextSettings) => {
      if (active) setSettings(nextSettings);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <SceneSetter scene={initialScene} />
      <Nav communityLink={settings.community_whatsapp_link || settings.whatsapp_group_invite_link} />
      <main className="relative z-10">{children}</main>
      {footer && <Footer settings={settings} />}
    </>
  );
}
