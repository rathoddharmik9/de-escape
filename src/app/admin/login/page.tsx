"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { signInWithMagicLink, signInWithPassword } from "@/lib/actions/auth";

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const errorParam = searchParams?.get("error");
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
      if (password) {
        const res = await signInWithPassword(email, password);
        if (res.success) {
          router.push("/admin");
          router.refresh();
        } else {
          setErrorMsg(res.error || "Failed to sign in with password.");
        }
      } else {
        const res = await signInWithMagicLink(email);
        if (res.success) {
          setSent(true);
        } else {
          setErrorMsg(res.error || "Failed to send login link.");
        }
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
      <div className="flex flex-col items-center mb-10">
        <Link href="/" className="h-8 block overflow-visible" aria-label="De-escape Logo">
          <svg viewBox="0 0 170 50" className="h-full w-auto overflow-visible">
            <text
              x="0"
              y="38"
              style={{
                fontFamily: "var(--font-logo), sans-serif",
                fontSize: "36px",
                fontWeight: 900,
                fill: "var(--green)",
                stroke: "var(--green)",
                strokeWidth: "1.2px",
                strokeLinejoin: "round",
                letterSpacing: "0.2px",
              }}
            >
              De-escape
            </text>
          </svg>
        </Link>
        <div className="text-xs uppercase tracking-widest text-[var(--ink-mute)] mt-3">
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
                setPassword("");
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
              Enter your admin email. We&apos;ll send a one-click login link, or enter your password to bypass.
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

              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2">
                  Password (Optional)
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-[var(--green-ink)] placeholder:text-[var(--ink-mute)] surface outline-none border-[var(--surface-border)] focus:border-[var(--green)] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold bg-[var(--green)] text-[var(--cream)] transition-all hover:-translate-y-0.5 hover:bg-[var(--green-deep)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? "Processing…" : password ? "Sign in →" : "Send magic link →"}
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
