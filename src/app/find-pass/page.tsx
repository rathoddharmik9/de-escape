"use client";

import { useState } from "react";
import Nav from "@/components/layout/Nav";
import AmbientMesh from "@/components/layout/AmbientMesh";
import Footer from "@/components/layout/Footer";

export default function FindPassPage() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || !email) { setError("Both fields required."); return; }
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <>
      <AmbientMesh />
      <Nav />
      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-32 pb-24">
        <div className="max-w-[440px] w-full">
          {submitted ? (
            <div className="text-center">
              <div className="text-5xl mb-6">📬</div>
              <h1
                className="font-serif text-[var(--ink)] mb-4"
                style={{ fontSize: "clamp(32px,5vw,52px)", letterSpacing: "-0.03em" }}
              >
                Check your WhatsApp
              </h1>
              <p className="text-base text-[var(--ink-2)] leading-relaxed">
                We&apos;ve re-sent your pass link via WhatsApp and email. It should arrive within a minute.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-8 text-sm text-[var(--ink-3)] underline hover:text-[var(--ink)] transition-colors"
              >
                Try different details
              </button>
            </div>
          ) : (
            <>
              <div className="text-xs uppercase tracking-[0.18em] text-[var(--coral)] mb-6">
                — Pass lookup
              </div>
              <h1
                className="font-serif font-normal text-[var(--ink)] mb-3"
                style={{ fontSize: "clamp(36px,5.5vw,56px)", letterSpacing: "-0.03em", lineHeight: "1" }}
              >
                Find your pass
              </h1>
              <p className="text-base text-[var(--ink-2)] mb-10 leading-relaxed">
                Enter the phone and email you registered with. We&apos;ll re-send your pass link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--ink-3)] mb-2">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] glass outline-none focus:border-[var(--coral)] transition-all"
                    style={{ border: "1px solid var(--glass-border)" }}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--ink-3)] mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    placeholder="priya@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] glass outline-none focus:border-[var(--coral)] transition-all"
                    style={{ border: "1px solid var(--glass-border)" }}
                  />
                </div>

                {error && <p className="text-xs text-[var(--coral)]">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "var(--coral)" }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      Sending…
                    </span>
                  ) : (
                    "Send my pass →"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
