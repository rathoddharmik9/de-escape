"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInWithMagicLink } from "@/lib/actions/auth";

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized") {
      setErrorMsg("Access denied. Your email is not registered as an administrator.");
    } else if (errorParam === "auth-failed") {
      setErrorMsg("Authentication failed or link expired. Please request a new link.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await signInWithMagicLink(email);
      if (res.success) {
        setSent(true);
      } else {
        setErrorMsg(res.error || "Failed to send login link.");
      }
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[400px] w-full relative z-10">
      {/* Brand */}
      <div className="text-center mb-10">
        <Link href="/" className="font-display text-3xl tracking-tight text-[var(--green-ink)]">
          de—escape<span className="text-[var(--green)]">.</span>
        </Link>
        <div className="text-xs uppercase tracking-widest text-[var(--ink-mute)] mt-2">
          Admin access
        </div>
      </div>

      <div className="p-8 rounded-3xl surface">
        {sent ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">📬</div>
            <h2 className="font-display text-2xl text-[var(--green-ink)] mb-3">Check your email</h2>
            <p className="text-sm text-[var(--ink-dim)] leading-relaxed">
              A magic link has been sent to{" "}
              <strong className="text-[var(--green-ink)]">{email}</strong>. Click it to sign in — valid for 15 minutes.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setEmail("");
                setErrorMsg("");
              }}
              className="mt-6 text-xs text-[var(--ink-mute)] underline hover:text-[var(--green-ink)] transition-colors"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl text-[var(--green-ink)] mb-2 tracking-tight">
              Sign in
            </h1>
            <p className="text-sm text-[var(--ink-dim)] mb-6">
              Enter your admin email. We&apos;ll send a one-click login link — no password needed.
            </p>

            {errorMsg && (
              <div
                className="p-4 rounded-xl text-xs text-[var(--green-ink)] mb-6 border"
                style={{ background: "rgba(179,58,42,0.08)", borderColor: "rgba(179,58,42,0.2)" }}
              >
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="admin@de-escape.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm text-[var(--green-ink)] placeholder:text-[var(--ink-mute)] surface outline-none border-[var(--surface-border)] focus:border-[var(--green)] transition-all"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-[var(--green)] text-[var(--cream)] transition-all hover:-translate-y-0.5 hover:bg-[var(--green-deep)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? "Sending…" : "Send magic link →"}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="text-center text-xs text-[var(--ink-mute)] mt-6">
        <Link href="/" className="hover:text-[var(--green-ink)] transition-colors">
          ← Back to De-escape
        </Link>
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--cream)" }}
    >
      <Suspense fallback={
        <div className="max-w-[400px] w-full text-center relative z-10 p-8 rounded-3xl surface">
          <p className="text-xs text-[var(--ink-mute)]">Loading console...</p>
        </div>
      }>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
