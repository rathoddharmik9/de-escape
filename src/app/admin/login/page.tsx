"use client";

import { useState } from "react";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--bg)" }}
    >
      {/* Subtle background glow */}
      <div
        className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{ background: "var(--violet)", filter: "blur(120px)" }}
        aria-hidden="true"
      />

      <div className="max-w-[400px] w-full relative z-10">
        {/* Brand */}
        <div className="text-center mb-10">
          <Link href="/" className="font-serif text-3xl tracking-tight text-[var(--ink)]">
            de—escape<span className="text-[var(--coral)]">.</span>
          </Link>
          <div className="text-xs uppercase tracking-widest text-[var(--ink-3)] mt-2">
            Admin access
          </div>
        </div>

        <div
          className="p-8 rounded-3xl"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--glass-border)" }}
        >
          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="font-serif text-2xl text-[var(--ink)] mb-3">Check your email</h2>
              <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                A magic link has been sent to{" "}
                <strong className="text-[var(--ink)]">{email}</strong>. Click it to sign in — valid for 15 minutes.
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="mt-6 text-xs text-[var(--ink-3)] underline hover:text-[var(--ink)] transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-2xl text-[var(--ink)] mb-2 tracking-tight">
                Sign in
              </h1>
              <p className="text-sm text-[var(--ink-2)] mb-8">
                Enter your admin email. We&apos;ll send a one-click login link — no password needed.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--ink-3)] mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="admin@de-escape.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] glass outline-none focus:border-[var(--coral)] transition-all"
                    style={{ border: "1px solid var(--glass-border)" }}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  style={{ background: "var(--coral)" }}
                >
                  {loading ? "Sending…" : "Send magic link →"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[var(--ink-3)] mt-6">
          <Link href="/" className="hover:text-[var(--ink)] transition-colors">
            ← Back to De-escape
          </Link>
        </p>
      </div>
    </div>
  );
}
