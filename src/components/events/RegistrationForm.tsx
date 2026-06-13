"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { Turnstile } from "@marsidev/react-turnstile";
import PublicShell from "@/components/layout/PublicShell";
import MagneticButton from "@/components/motion/MagneticButton";
import { formatPrice, formatDate } from "@/lib/mock-data";
import type { Event } from "@/lib/types";
import { registerAttendee } from "@/lib/actions/register";
import { useSessionStore } from "@/lib/store/useSessionStore";
import { useEffect } from "react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const HEARD_FROM_OPTIONS = [
  "Instagram",
  "Friend / Word of mouth",
  "Past De-escape event",
  "Google",
  "WhatsApp",
  "Other",
];

interface FormProps {
  event: Event;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export default function RegistrationForm({ event }: FormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [turnstileToken, setTurnstileToken] = useState("");

  const profile = useSessionStore((state) => state.profile);
  const setProfile = useSessionStore((state) => state.setProfile);
  const setLastRegistration = useSessionStore((state) => state.setLastRegistration);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    age: "",
    city: "",
    instagram: "",
    heardFrom: "",
    notes: "",
    consent: true,
    screenshot: null as File | null,
  });

  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        fullName: profile.fullName || prev.fullName,
        phone: profile.phone || prev.phone,
        email: profile.email || prev.email,
        age: profile.age || prev.age,
        city: profile.city || prev.city,
        instagram: profile.instagram || prev.instagram,
      }));
    }
  }, [profile]);
  const [customAnswers, setCustomAnswers] = useState<Record<string, string | number | boolean>>({});

  function set(field: string, value: string | boolean | File | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      errs.fullName = "Name required (min 2 chars)";
    }
    if (!form.phone.match(/^[6-9]\d{9}$/)) {
      errs.phone = "Valid 10-digit Indian mobile required";
    }
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errs.email = "Valid email required";
    }
    const age = parseInt(form.age);
    if (isNaN(age) || age < 13 || age > 99) {
      errs.age = "Age must be 13–99";
    }
    if (!form.city.trim()) {
      errs.city = "City required";
    }
    if (!form.consent) {
      errs.consent = "Consent required to proceed";
    }
    if (event.payment_mode === "manual_upi" && !form.screenshot) {
      errs.screenshot = "Payment screenshot required";
    }

    const customFields = event.custom_fields || [];
    customFields.forEach((field) => {
      if (field.required) {
        const val = customAnswers[field.key];
        if (field.type === "checkbox") {
          if (!val) {
            errs[field.key] = `${field.label} is required`;
          }
        } else {
          if (
            val === undefined ||
            val === null ||
            val === "" ||
            (typeof val === "string" && !val.trim())
          ) {
            errs[field.key] = `${field.label} is required`;
          }
        }
      }
    });

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

    if (event.payment_mode === "razorpay" && step === 1) {
      setStep(2);
      return;
    }

    if (!turnstileToken) {
      setErrors((prev) => ({ ...prev, turnstile: "Please complete the security check" }));
      return;
    }

    setSubmitting(true);

    try {
      let screenshotBase64 = undefined;
      let screenshotName = undefined;

      if (event.payment_mode === "manual_upi" && form.screenshot) {
        screenshotBase64 = await fileToBase64(form.screenshot);
        screenshotName = form.screenshot.name;
      }

      const payload = {
        eventId: event.id,
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        age: parseInt(form.age),
        city: form.city,
        instagram: form.instagram,
        heardFrom: form.heardFrom,
        notes: form.notes,
        consent: form.consent,
        screenshotBase64,
        screenshotName,
        turnstileToken,
        customAnswers,
      };

      const res = await registerAttendee(payload);

      if (!res.success) {
        setErrors((prev) => ({ ...prev, submit: res.message || "An error occurred during registration." }));
        setSubmitting(false);
        return;
      }

      // Save attendee details to store
      setProfile({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        age: form.age,
        city: form.city,
        instagram: form.instagram,
      });

      // Save last registration session details to store
      setLastRegistration({
        registrationId: res.registrationId || "",
        passCode: res.passCode || "",
        fullName: form.fullName,
        status: res.status || "pending",
        eventTitle: event.title,
      });

      if (event.payment_mode === "razorpay" && res.razorpayOrder) {
        const options = {
          key: res.razorpayOrder.keyId,
          amount: res.razorpayOrder.amount,
          currency: "INR",
          name: "De-escape",
          description: event.title,
          order_id: res.razorpayOrder.id,
          handler: function () {
            router.push(`/events/${event.slug}/success?reg=${res.registrationId}`);
          },
          prefill: {
            name: form.fullName,
            email: form.email,
            contact: form.phone,
          },
          theme: {
            color: "#C8F135",
          },
          modal: {
            ondismiss: function () {
              setSubmitting(false);
            },
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        router.push(`/events/${event.slug}/success?reg=${res.registrationId}`);
      }
    } catch (err) {
      console.error("Submit handler error:", err);
      setErrors((prev) => ({ ...prev, submit: "Failed to submit registration. Please try again." }));
      setSubmitting(false);
    }
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl text-sm text-[var(--green-ink)] placeholder:text-[var(--ink-mute)] outline-none transition-all duration-200 surface focus:border-[var(--green)] focus:shadow-[0_0_0_3px_rgba(200,241,53,0.25)] ${
      errors[field] ? "!border-[var(--error)]" : ""
    }`;

  return (
    <PublicShell initialScene="deep" footer={false}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="px-6 pt-36 pb-24">
        <div className="max-w-[680px] mx-auto">
          {/* Back link */}
          <Link
            href={`/events/${event.slug}`}
            data-cursor="true"
            className="inline-flex items-center gap-2 text-xs text-[var(--ink-mute)] hover:text-[var(--green-ink)] mb-8 transition-colors"
          >
            ← Back to event
          </Link>

          {/* Event summary strip */}
          <div className="p-5 rounded-2xl mb-10 flex gap-4 items-center surface">
            {event.cover_image_url && (
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.cover_image_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <div className="font-display text-lg text-[var(--green-ink)] leading-tight">{event.title}</div>
              <div className="text-xs text-[var(--ink-dim)] mt-0.5">
                {formatDate(event.start_at)} · {event.venue_name} · <strong>{formatPrice(event.price_paise)}</strong>
              </div>
            </div>
          </div>

          <h1 className="font-display text-4xl text-[var(--green-ink)] mb-2" style={{ letterSpacing: "-0.02em" }}>
            Reserve your seat
          </h1>
          <p className="text-[var(--ink-dim)] mb-10">
            Fill in your details. We&apos;ll confirm via WhatsApp + email.
          </p>

          {/* UPI payment info */}
          {event.payment_mode === "manual_upi" && (
            <div className="p-6 rounded-2xl mb-8" style={{ background: "rgba(44,138,75,0.08)", border: "1px solid var(--green)" }}>
              <div className="text-sm font-medium text-[var(--green-deep)] mb-3">📱 Pay via UPI before submitting</div>
              <div className="font-mono text-xl text-[var(--green-ink)] mb-1 p-3 rounded-xl" style={{ background: "var(--cream-deep)" }}>
                {event.upi_id || "deescape@upi"}
              </div>
              <p className="text-xs text-[var(--ink-mute)] mt-2">
                Send <strong className="text-[var(--green-ink)]">{formatPrice(event.price_paise)}</strong> to the UPI ID above, then upload screenshot below.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Full name */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2">
                Full name <span className="text-[var(--green)]">*</span>
              </label>
              <input type="text" placeholder="Priya Sharma" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} className={inputClass("fullName")} />
              {errors.fullName && <p data-field-error className="mt-1.5 text-xs text-[var(--error)]">{errors.fullName}</p>}
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2">
                  Phone <span className="text-[var(--green)]">*</span>
                </label>
                <input type="tel" placeholder="9876543210" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass("phone")} />
                {errors.phone && <p data-field-error className="mt-1.5 text-xs text-[var(--error)]">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2">
                  Email <span className="text-[var(--green)]">*</span>
                </label>
                <input type="email" placeholder="priya@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass("email")} />
                {errors.email && <p data-field-error className="mt-1.5 text-xs text-[var(--error)]">{errors.email}</p>}
              </div>
            </div>

            {/* Age + City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2">
                  Age <span className="text-[var(--green)]">*</span>
                </label>
                <input type="number" placeholder="27" min={13} max={99} value={form.age} onChange={(e) => set("age", e.target.value)} className={inputClass("age")} />
                {errors.age && <p data-field-error className="mt-1.5 text-xs text-[var(--error)]">{errors.age}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2">
                  City / Neighbourhood <span className="text-[var(--green)]">*</span>
                </label>
                <input type="text" placeholder="Mumbai" value={form.city} onChange={(e) => set("city", e.target.value)} className={inputClass("city")} />
                {errors.city && <p data-field-error className="mt-1.5 text-xs text-[var(--error)]">{errors.city}</p>}
              </div>
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2">
                Instagram <span className="text-[var(--ink-mute)] normal-case font-normal">(optional)</span>
              </label>
              <input type="text" placeholder="@yourhandle" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} className={inputClass("instagram")} />
            </div>

            {/* How did you hear */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2">
                How did you hear about us?
              </label>
              <select
                value={form.heardFrom}
                onChange={(e) => set("heardFrom", e.target.value)}
                className={`${inputClass("heardFrom")} appearance-none`}
              >
                <option value="">Select…</option>
                {HEARD_FROM_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2">
                Anything we should know?
              </label>
              <textarea
                placeholder="Dietary restrictions, accessibility needs, or just a hello…"
                rows={3}
                maxLength={400}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                className={`${inputClass("notes")} resize-none`}
              />
              <p className="text-[10px] text-[var(--ink-mute)] text-right mt-1">{form.notes.length}/400</p>
            </div>

            {/* Screenshot upload for UPI */}
            {event.payment_mode === "manual_upi" && (
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2">
                  Payment screenshot <span className="text-[var(--green)]">*</span>
                </label>
                <label
                  className={`block w-full rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 hover:border-[var(--green)] hover:bg-[rgba(44,138,75,0.04)] ${
                    errors.screenshot ? "border-[var(--error)]" : "border-[var(--surface-border)]"
                  } ${form.screenshot ? "!border-[var(--lime-deep)] bg-[rgba(200,241,53,0.08)]" : ""}`}
                >
                  <input type="file" accept="image/jpeg,image/png,image/heic" className="sr-only" onChange={(e) => set("screenshot", e.target.files?.[0] || null)} />
                  {form.screenshot ? (
                    <div>
                      <div className="text-2xl mb-2">✅</div>
                      <div className="text-sm font-medium text-[var(--green-deep)]">{form.screenshot.name}</div>
                      <div className="text-xs text-[var(--ink-mute)] mt-1">{(form.screenshot.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-3">📸</div>
                      <div className="text-sm text-[var(--ink-dim)]">Drop screenshot here or click to upload</div>
                      <div className="text-xs text-[var(--ink-mute)] mt-1">JPEG, PNG, HEIC · max 5 MB</div>
                    </div>
                  )}
                </label>
                {errors.screenshot && <p data-field-error className="mt-1.5 text-xs text-[var(--error)]">{errors.screenshot}</p>}
              </div>
            )}

            {/* Custom Fields */}
            {event.custom_fields && event.custom_fields.length > 0 && (
              <div className="space-y-5">
                {event.custom_fields.map((field) => {
                  const errorMsg = errors[field.key];
                  const value = customAnswers[field.key];

                  return (
                    <div key={field.key}>
                      {field.type === "checkbox" ? (
                        <div>
                          <label className="flex items-start gap-3 cursor-pointer group">
                            <div className="relative mt-0.5 flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={!!value}
                                onChange={(e) => {
                                  setCustomAnswers((prev) => ({ ...prev, [field.key]: e.target.checked }));
                                  setErrors((prev) => ({ ...prev, [field.key]: "" }));
                                }}
                                className="sr-only peer"
                              />
                              <div
                                className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                                  value ? "border-[var(--green)] bg-[var(--green)]" : "border-[var(--surface-border)] bg-transparent"
                                } ${errorMsg ? "!border-[var(--error)]" : ""}`}
                              >
                                {value && (
                                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none" aria-hidden="true">
                                    <path d="M1 4l3.5 3.5L11 1" stroke="#F5ECCE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <span className="text-sm text-[var(--ink-dim)] leading-relaxed">
                              {field.label} {field.required && <span className="text-[var(--green)]">*</span>}
                            </span>
                          </label>
                          {errorMsg && <p data-field-error className="mt-1.5 text-xs text-[var(--error)] ml-8">{errorMsg}</p>}
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2">
                            {field.label} {field.required && <span className="text-[var(--green)]">*</span>}
                          </label>
                          {field.type === "textarea" ? (
                            <textarea
                              placeholder={`Enter ${field.label.toLowerCase()}…`}
                              value={(value as string) || ""}
                              onChange={(e) => {
                                setCustomAnswers((prev) => ({ ...prev, [field.key]: e.target.value }));
                                setErrors((prev) => ({ ...prev, [field.key]: "" }));
                              }}
                              className={`${inputClass(field.key)} resize-none`}
                              rows={3}
                            />
                          ) : field.type === "select" ? (
                            <select
                              value={(value as string) || ""}
                              onChange={(e) => {
                                setCustomAnswers((prev) => ({ ...prev, [field.key]: e.target.value }));
                                setErrors((prev) => ({ ...prev, [field.key]: "" }));
                              }}
                              className={`${inputClass(field.key)} appearance-none`}
                            >
                              <option value="">Select…</option>
                              {field.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : field.type === "number" ? (
                            <input
                              type="number"
                              placeholder={`Enter ${field.label.toLowerCase()}…`}
                              value={(value as string) || ""}
                              onChange={(e) => {
                                let val: string | number = e.target.value;
                                if (val !== "") {
                                  const parsedNum = Number(val);
                                  if (!isNaN(parsedNum)) {
                                    val = parsedNum;
                                  }
                                }
                                setCustomAnswers((prev) => ({ ...prev, [field.key]: val }));
                                setErrors((prev) => ({ ...prev, [field.key]: "" }));
                              }}
                              className={inputClass(field.key)}
                            />
                          ) : (
                            // Default: text
                            <input
                              type="text"
                              placeholder={`Enter ${field.label.toLowerCase()}…`}
                              value={(value as string) || ""}
                              onChange={(e) => {
                                setCustomAnswers((prev) => ({ ...prev, [field.key]: e.target.value }));
                                setErrors((prev) => ({ ...prev, [field.key]: "" }));
                              }}
                              className={inputClass(field.key)}
                            />
                          )}
                          {errorMsg && <p data-field-error className="mt-1.5 text-xs text-[var(--error)]">{errorMsg}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Turnstile Verification Widget */}
            {form.fullName && form.phone && form.email && (
              <div className="flex justify-center py-2">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""}
                  onSuccess={(token) => {
                    setTurnstileToken(token);
                    setErrors((prev) => ({ ...prev, turnstile: "" }));
                  }}
                  onError={() => setErrors((prev) => ({ ...prev, turnstile: "Security verification failed." }))}
                  onExpire={() => setTurnstileToken("")}
                />
              </div>
            )}
            {errors.turnstile && <p className="text-center text-xs text-[var(--error)]">{errors.turnstile}</p>}

            {/* Consent */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} className="sr-only peer" />
                  <div
                    className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                      form.consent ? "border-[var(--green)] bg-[var(--green)]" : "border-[var(--surface-border)] bg-transparent"
                    }`}
                  >
                    {form.consent && (
                      <svg width="12" height="9" viewBox="0 0 12 9" fill="none" aria-hidden="true">
                        <path d="M1 4l3.5 3.5L11 1" stroke="#F5ECCE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-[var(--ink-dim)] leading-relaxed">
                  Send me WhatsApp + email updates about this event and De-escape.
                </span>
              </label>
              {errors.consent && <p data-field-error className="mt-1.5 text-xs text-[var(--error)] ml-8">{errors.consent}</p>}
            </div>

            {/* Razorpay step 2 */}
            {step === 2 && event.payment_mode === "razorpay" && (
              <div className="p-6 rounded-2xl" style={{ background: "rgba(44,138,75,0.06)", border: "1px solid var(--green)" }}>
                <div className="text-sm font-medium text-[var(--green-deep)] mb-2">💳 Payment — {formatPrice(event.price_paise)}</div>
                <p className="text-xs text-[var(--ink-dim)]">
                  Clicking below will open the Razorpay checkout. Payment is required to complete your registration.
                </p>
              </div>
            )}

            {/* Submit */}
            {errors.submit && <p className="text-center text-xs text-[var(--error)]">{errors.submit}</p>}
            <MagneticButton className="block">
              <button
                type="submit"
                disabled={submitting}
                data-cursor="Reserve"
                className="w-full py-4 rounded-2xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(44,138,75,0.35)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 active:scale-[0.98]"
                style={{ background: "var(--green)", color: "var(--cream)" }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
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
            </MagneticButton>

            <p className="text-center text-[11px] text-[var(--ink-mute)]">
              By submitting, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-[var(--green)]">Terms</Link>
              {" "}and{" "}
              <Link href="/refund-policy" className="underline hover:text-[var(--green)]">Refund Policy</Link>.
            </p>
          </form>
        </div>
      </div>
    </PublicShell>
  );
}
