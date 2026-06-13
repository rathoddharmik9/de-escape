"use client";

import { useState } from "react";
import PublicShell from "@/components/layout/PublicShell";
import Reveal from "@/components/motion/Reveal";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      alert("Thank you for your message! We will get back to you shortly.");
      setSuccess(true);
      setForm({ name: "", email: "", message: "" });
      setSubmitting(false);
    }, 800);
  }

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm bg-[var(--cream-soft)] border border-[var(--surface-border)] text-[var(--green-ink)] placeholder:text-[var(--ink-mute)] outline-none focus:border-[var(--green)] transition-all";

  return (
    <PublicShell initialScene="deep">
      {/* Hero */}
      <section className="px-6 pt-40 pb-12">
        <div className="max-w-[860px] mx-auto">
          <span className="block text-xs uppercase tracking-[0.18em] text-[var(--green)] mb-8">
            — Say Hello
          </span>
          <h1
            className="font-display font-semibold leading-tight text-[var(--green-ink)]"
            style={{ fontSize: "clamp(42px,6vw,80px)", letterSpacing: "-0.02em", lineHeight: "0.95" }}
          >
            Contact Us
          </h1>
        </div>
      </section>

      {/* Main layout grid */}
      <section className="px-6 pb-24">
        <div className="max-w-[860px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Details */}
          <Reveal>
            <div className="space-y-8">
              <p className="text-sm text-[var(--ink-dim)] leading-relaxed">
                Have a question about an event, a booking refund, or want to host your own curated experience? Drop us a line. We reply to everything.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--ink-mute)]">General Support</div>
                  <a href="mailto:support@de-escape.com" className="text-sm font-semibold text-[var(--green-ink)] hover:text-[var(--green)] transition-colors">
                    support@de-escape.com
                  </a>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--ink-mute)]">WhatsApp Hotline</div>
                  <div className="text-sm font-semibold text-[var(--green-ink)]">
                    +91 98765 43210 (10 AM — 6 PM IST)
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--ink-mute)]">Office Address</div>
                  <p className="text-xs text-[var(--ink-dim)] leading-relaxed">
                    De-escape Labs,<br />
                    Indiranagar, Bengaluru,<br />
                    Karnataka, India - 560038
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Form */}
          <Reveal delay={0.1}>
            <div className="surface p-6 sm:p-8 rounded-3xl border border-[var(--surface-border)]">
              <h2 className="text-xs uppercase tracking-widest text-[var(--ink-mute)] font-semibold mb-6">
                Send a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[var(--ink-mute)] mb-1.5 font-medium">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kabir Sen"
                    value={form.name}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, name: e.target.value }));
                      setSuccess(false);
                    }}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[var(--ink-mute)] mb-1.5 font-medium">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. kabir@gmail.com"
                    value={form.email}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, email: e.target.value }));
                      setSuccess(false);
                    }}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-[var(--ink-mute)] mb-1.5 font-medium">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="What can we help you with?"
                    value={form.message}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, message: e.target.value }));
                      setSuccess(false);
                    }}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl text-xs font-semibold bg-[var(--green)] text-[var(--cream)] transition-all hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Send Message"}
                </button>

                {success && (
                  <p className="text-xs text-[var(--ok)] text-center mt-2">
                    ✓ Your message was sent successfully!
                  </p>
                )}
              </form>
            </div>
          </Reveal>
        </div>
      </section>
    </PublicShell>
  );
}
