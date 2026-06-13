"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "success" | "error">("checking");
  const [message, setMessage] = useState("Verifying your login…");

  useEffect(() => {
    const supabase = createClient();

    async function handleSession() {
      // Give Supabase client time to parse hash tokens from URL
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        // Try waiting a moment for the hash to be processed
        await new Promise(r => setTimeout(r, 800));
        const retry = await supabase.auth.getSession();
        if (!retry.data.session) {
          setStatus("error");
          setMessage("Authentication failed or link expired. Please request a new link.");
          setTimeout(() => router.push("/admin/login?error=auth-failed"), 2000);
          return;
        }
      }

      const { data: { session: finalSession } } = await supabase.auth.getSession();

      if (!finalSession?.user) {
        setStatus("error");
        setMessage("Could not retrieve session. Please try again.");
        setTimeout(() => router.push("/admin/login?error=auth-failed"), 2000);
        return;
      }

      // Session established — redirect to admin, middleware will verify admin status
      setStatus("success");
      setMessage("Login successful! Redirecting to admin…");
      router.push("/admin");
    }

    handleSession();
  }, [router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--cream)" }}
    >
      <div className="max-w-[400px] w-full p-8 rounded-3xl surface text-center">
        {status === "checking" && (
          <>
            <div className="text-4xl mb-4 animate-pulse">🔐</div>
            <p className="text-sm text-[var(--ink-dim)]">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="text-4xl mb-4">✅</div>
            <p className="text-sm text-[var(--green-ink)] font-medium">{message}</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-sm text-[var(--ink-dim)]">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
