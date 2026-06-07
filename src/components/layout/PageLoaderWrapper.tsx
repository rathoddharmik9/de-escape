"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import PageLoader from "./PageLoader";

export default function PageLoaderWrapper() {
  const pathname = usePathname();
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem("de_escape_loaded") === "true") {
      setShowLoader(false);
    }
  }, []);

  // Exclude admin panel from loader animation
  if (pathname.startsWith("/admin")) return null;

  const handleComplete = () => {
    sessionStorage.setItem("de_escape_loaded", "true");
    setShowLoader(false);
    window.dispatchEvent(new Event("de_escape_loaded"));
  };

  return showLoader ? <PageLoader onComplete={handleComplete} /> : null;
}
