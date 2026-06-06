"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/layout/Nav";
import AmbientMesh from "@/components/layout/AmbientMesh";
import { EVENTS, formatPrice, formatDate } from "@/lib/mock-data";
import { notFound } from "next/navigation";

const HEARD_FROM_OPTIONS = [
  "Instagram",
  "Friend / Word of mouth",
  "Past De-escape event",
  "Google",
  "WhatsApp",
  "Other",
];

interface PageProps {
  params: { slug: string };
}

export default function RegisterPage({ params }: PageProps) {
  const event = EVENTS.find((e) => e.slug === params.slug);
  if (!event) notFound();

  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = form, 2 = payment
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    age: "",
    city: "",
    instagram: "",
    heard_from: "",
    notes: "",
    consent: true,
    screenshot: null as File | null,
  });

  function set(field: string, value: string | boolean | File | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim() || form.full_name.trim().length < 2) errs.full_name = "Name required (min 2 chars)";
    if (!form.phone.match(/^[6-9]\d{9}$/)) errs.phone = "Valid 10-digit Indian mobile required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = "Valid email required";
    const age = parseInt(form.age);
    if (isNaN(age) || age < 13 || age > 99) errs.age = "Age must be 13–99";
    if (!form.city.trim()) errs.city = "City required";
    if (!form.consent) errs.consent = "Consent required to proceed";
    if (event!.payment_mode === "manual_upi" && !form.screenshot) errs.screenshot = "Payment screenshot required";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstErr = document.querySelector("[data-field-error]");
      firstErr?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (event!.payment_mode === "razorpay" && step === 1) {
      setStep(2);
      return;
    }

    setSubmitting(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    router.push(`/events/${event!.slug}/success?name=${encodeURIComponent(form.full_name)}`);
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] outline-none transition-all duration-200 ${
      errors[field]
        ? "border-[var(--coral)] bg-[rgba(255,122,92,0.06)]"
        : "glass border-[var(--glass-border)] focus:border-[var(--coral)]"
    }`;

  return (
    <>
      <AmbientMesh />
      <Nav />
      <main className="relative z-10 min-h-screen px-6 pt-36 pb-24">
        <div className="max-w-[680px] mx-auto">

          {/* Back link */}
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-2 text-xs text-[var(--ink-3)] hover:text-[var(--ink)] mb-8 transition-colors"
          >
            ← Back to event
          </Link>

          {/* Event summary strip */}
          <div
            className="p-5 rounded-2xl mb-10 flex gap-4 items-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-border)" }}
          >
            {event.cover_image_url && (
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <div className="font-serif text-lg text-[var(--ink)] leading-tight">{event.title}</div>
              <div className="text-xs text-[var(--ink-2)] mt-0.5">
                {formatDate(event.start_at)} · {event.venue_name} · <strong>{formatPrice(event.price_paise)}</strong>
              </div>
            </div>
          </div>

          <h1
            className="font-serif text-4xl text-[var(--ink)] mb-2"
            style={{ letterSpacing: "-0.02em" }}
          >
            Reserve your seat
          </h1>
          <p className="text-[var(--ink-2)] mb-10">
            Fill in your details. We&apos;ll confirm via WhatsApp + email.
          </p>

          {/* UPI payment info (shown above form for manual UPI) */}
          {event.payment_mode === "manual_upi" && (
            <div
              className="p-6 rounded-2xl mb-8"
              style={{ background: "rgba(90,170,165,0.08)", border: "1px solid rgba(93,202,165,0.3)" }}
            >
              <div className="text-sm font-medium text-[var(--teal)] mb-3">
                📱 Pay via UPI before submitting
              </div>
              <div
                className="font-mono text-xl text-[var(--ink)] mb-1 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                {event.upi_id || "deescape@upi"}
              </div>
              <p className="text-xs text-[var(--ink-3)] mt-2">
                Send <strong className="text-[var(--ink)]">{formatPrice(event.price_paise)}</strong> to the UPI ID above, then upload screenshot below.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Full name */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--ink-3)] mb-2">
                Full name <span className="text-[var(--coral)]">*</span>
              </label>
              <input
                type="text"
                placeholder="Priya Sharma"
                value={form.full_name}
                onChange={(e) => set("full_name", e.target.value)}
                className={inputClass("full_name")}
                style={{ border: "1px solid" }}
              />
              {errors.full_name && (
                <p data-field-error className="mt-1.5 text-xs text-[var(--coral)]">{errors.full_name}</p>
              )}
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--ink-3)] mb-2">
                  Phone <span className="text-[var(--coral)]">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className={inputClass("phone")}
                  style={{ border: "1px solid" }}
                />
                {errors.phone && (
                  <p data-field-error className="mt-1.5 text-xs text-[var(--coral)]">{errors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--ink-3)] mb-2">
                  Email <span className="text-[var(--coral)]">*</span>
                </label>
                <input
                  type="email"
                  placeholder="priya@email.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputClass("email")}
                  style={{ border: "1px solid" }}
                />
                {errors.email && (
                  <p data-field-error className="mt-1.5 text-xs text-[var(--coral)]">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Age + City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--ink-3)] mb-2">
                  Age <span className="text-[var(--coral)]">*</span>
                </label>
                <input
                  type="number"
                  placeholder="27"
                  min={13}
                  max={99}
                  value={form.age}
                  onChange={(e) => set("age", e.target.value)}
                  className={inputClass("age")}
                  style={{ border: "1px solid" }}
                />
                {errors.age && (
                  <p data-field-error className="mt-1.5 text-xs text-[var(--coral)]">{errors.age}</p>
                )}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--ink-3)] mb-2">
                  City / Neighbourhood <span className="text-[var(--coral)]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Mumbai"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  className={inputClass("city")}
                  style={{ border: "1px solid" }}
                />
                {errors.city && (
                  <p data-field-error className="mt-1.5 text-xs text-[var(--coral)]">{errors.city}</p>
                )}
              </div>
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--ink-3)] mb-2">
                Instagram <span className="text-[var(--ink-3)] normal-case font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="@yourhandle"
                value={form.instagram}
                onChange={(e) => set("instagram", e.target.value)}
                className={inputClass("instagram")}
                style={{ border: "1px solid" }}
              />
            </div>

            {/* How did you hear */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--ink-3)] mb-2">
                How did you hear about us?
              </label>
              <select
                value={form.heard_from}
                onChange={(e) => set("heard_from", e.target.value)}
                className={`${inputClass("heard_from")} appearance-none`}
                style={{ border: "1px solid", background: "rgba(255,255,255,0.06)" }}
              >
                <option value="">Select…</option>
                {HEARD_FROM_OPTIONS.map((o) => (
                  <option key={o} value={o} style={{ background: "#120e22" }}>{o}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--ink-3)] mb-2">
                Anything we should know?
              </label>
              <textarea
                placeholder="Dietary restrictions, accessibility needs, or just a hello…"
                rows={3}
                maxLength={400}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                className={`${inputClass("notes")} resize-none`}
                style={{ border: "1px solid" }}
              />
              <p className="text-[10px] text-[var(--ink-3)] text-right mt-1">
                {form.notes.length}/400
              </p>
            </div>

            {/* Screenshot upload for UPI */}
            {event.payment_mode === "manual_upi" && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--ink-3)] mb-2">
                  Payment screenshot <span className="text-[var(--coral)]">*</span>
                </label>
                <label
                  className={`block w-full rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 hover:border-[var(--coral)] hover:bg-[rgba(255,122,92,0.04)] ${
                    errors.screenshot ? "border-[var(--coral)]" : "border-[var(--glass-border)]"
                  } ${form.screenshot ? "border-[var(--teal)] bg-[rgba(93,202,165,0.05)]" : ""}`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/heic"
                    className="sr-only"
                    onChange={(e) => set("screenshot", e.target.files?.[0] || null)}
                  />
                  {form.screenshot ? (
                    <div>
                      <div className="text-2xl mb-2">✅</div>
                      <div className="text-sm font-medium text-[var(--teal)]">{form.screenshot.name}</div>
                      <div className="text-xs text-[var(--ink-3)] mt-1">
                        {(form.screenshot.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-3">📸</div>
                      <div className="text-sm text-[var(--ink-2)]">Drop screenshot here or click to upload</div>
                      <div className="text-xs text-[var(--ink-3)] mt-1">JPEG, PNG, HEIC · max 5 MB</div>
                    </div>
                  )}
                </label>
                {errors.screenshot && (
                  <p data-field-error className="mt-1.5 text-xs text-[var(--coral)]">{errors.screenshot}</p>
                )}
              </div>
            )}

            {/* Consent */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={form.consent}
                    onChange={(e) => set("consent", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div
                    className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                      form.consent ? "border-[var(--coral)] bg-[var(--coral)]" : "border-[var(--glass-border)] bg-transparent"
                    }`}
                  >
                    {form.consent && (
                      <svg width="12" height="9" viewBox="0 0 12 9" fill="none" aria-hidden="true">
                        <path d="M1 4l3.5 3.5L11 1" stroke="#1a0e08" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-[var(--ink-2)] leading-relaxed">
                  Send me WhatsApp + email updates about this event and De-escape.
                </span>
              </label>
              {errors.consent && (
                <p data-field-error className="mt-1.5 text-xs text-[var(--coral)] ml-8">{errors.consent}</p>
              )}
            </div>

            {/* Razorpay step 2 */}
            {step === 2 && event.payment_mode === "razorpay" && (
              <div
                className="p-6 rounded-2xl"
                style={{ background: "rgba(255,122,92,0.06)", border: "1px solid rgba(255,122,92,0.3)" }}
              >
                <div className="text-sm font-medium text-[var(--coral)] mb-2">
                  💳 Payment — {formatPrice(event.price_paise)}
                </div>
                <p className="text-xs text-[var(--ink-2)]">
                  Clicking below will open the Razorpay checkout. Payment is required to complete your registration.
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(255,122,92,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{ background: "var(--coral)" }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Submitting…
                </span>
              ) : event.payment_mode === "razorpay" && step === 1 ? (
                `Continue to payment — ${formatPrice(event.price_paise)} →`
              ) : event.payment_mode === "razorpay" && step === 2 ? (
                `Pay ${formatPrice(event.price_paise)} with Razorpay →`
              ) : (
                "Submit registration →"
              )}
            </button>

            <p className="text-center text-[11px] text-[var(--ink-3)]">
              By submitting, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-[var(--ink)]">Terms</Link>
              {" "}and{" "}
              <Link href="/refund-policy" className="underline hover:text-[var(--ink)]">Refund Policy</Link>.
            </p>
          </form>
        </div>
      </main>
    </>
  );
}
