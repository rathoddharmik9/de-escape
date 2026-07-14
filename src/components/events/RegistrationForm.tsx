"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Copy, ChevronDown } from "lucide-react";
import PublicShell from "@/components/layout/PublicShell";
import MagneticButton from "@/components/motion/MagneticButton";
import { formatPrice, formatDate } from "@/lib/mock-data";
import type { Event } from "@/lib/types";
import { registerAttendee } from "@/lib/actions/register";
import { useSessionStore } from "@/lib/store/useSessionStore";
import { DEFAULT_UPI_ID, DEFAULT_UPI_QR_IMAGE_URL } from "@/lib/payments";
import {
  registrationBaseSchema,
  validateCustomAnswers,
  validatePaymentProofFile,
  zodIssuesToFieldErrors,
} from "@/lib/validation/registration";

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
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copiedUpi, setCopiedUpi] = useState(false);

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

  const proofPreviewUrl = useMemo(() => {
    if (!form.screenshot || !form.screenshot.type.startsWith("image/")) return "";
    return URL.createObjectURL(form.screenshot);
  }, [form.screenshot]);

  useEffect(() => {
    return () => {
      if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl);
    };
  }, [proofPreviewUrl]);

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
  const paymentUpiId = event.upi_id || DEFAULT_UPI_ID;
  const paymentQrImageUrl = event.upi_qr_image_url || DEFAULT_UPI_QR_IMAGE_URL;

  function set(field: string, value: string | boolean | File | null) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function handleScreenshotChange(file: File | null) {
    const error = validatePaymentProofFile(file);
    if (error) {
      set("screenshot", null);
      setErrors((prev) => ({ ...prev, screenshot: error }));
      return;
    }
    set("screenshot", file);
  }

  async function copyUpiId() {
    const upiId = paymentUpiId;
    try {
      await navigator.clipboard.writeText(upiId);
      setCopiedUpi(true);
      window.setTimeout(() => setCopiedUpi(false), 1600);
    } catch {
      setErrors((prev) => ({ ...prev, upi: "Could not copy UPI ID. Please select and copy it manually." }));
    }
  }

  function validate() {
    const parsed = registrationBaseSchema.safeParse({
      eventId: event.id,
      fullName: form.fullName,
      phone: form.phone,
      email: form.email,
      age: form.age,
      city: form.city,
      heardFrom: form.heardFrom,
      consent: form.consent,
    });
    const errs: Record<string, string> = parsed.success ? {} : zodIssuesToFieldErrors(parsed.error);
    if (event.payment_mode === "manual_upi") {
      const proofError = validatePaymentProofFile(form.screenshot);
      if (proofError) errs.screenshot = proofError;
    }

    const customValidation = validateCustomAnswers(event.custom_fields || [], customAnswers);
    Object.assign(errs, customValidation.errors);

    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      requestAnimationFrame(() => {
        const firstErr = document.querySelector("[data-field-error]");
        firstErr?.scrollIntoView({ behavior: "smooth", block: "center" });
        const field = firstErr?.getAttribute("data-field-error");
        if (field) {
          const input = document.querySelector<HTMLElement>(`[name="${field}"]`);
          input?.focus();
        }
      });
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
        heardFrom: form.heardFrom,
        consent: form.consent,
        screenshotBase64,
        screenshotName,
        customAnswers,
      };

      const res = await registerAttendee(payload);

      if (!res.success) {
        setErrors((prev) => ({
          ...prev,
          ...(res.fieldErrors || {}),
          submit: res.message || "An error occurred during registration.",
        }));
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
        fullName: form.fullName,
        status: res.status || "pending",
        eventTitle: event.title,
        groupInviteLink: event.community_group_invite,
      });

      router.push(`/events/${event.slug}/success?reg=${res.registrationId}`);
    } catch (err) {
      console.error("Submit handler error:", err);
      const isUploadSizeError = err instanceof Error && err.message.includes("Body exceeded");
      setErrors((prev) => ({
        ...prev,
        ...(isUploadSizeError ? { screenshot: "Payment screenshot must be 5 MB or smaller." } : {}),
        submit: isUploadSizeError ? "Please choose a smaller payment screenshot." : "Failed to submit registration. Please try again.",
      }));
      setSubmitting(false);
    }
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl text-sm text-[var(--green-ink)] placeholder:text-[var(--ink-dim)] outline-none transition-all duration-200 surface focus:border-[var(--green)] focus:shadow-[0_0_0_3px_rgba(200,241,53,0.25)] ${
      errors[field] ? "!border-[var(--error)]" : ""
    }`;

  return (
    <PublicShell initialScene="deep" footer={false}>
      <div className="px-6 pt-36 pb-24">
        <div className="max-w-[680px] mx-auto">
          {/* Back link */}
          <Link
            href={`/events/${event.slug}`}
            data-cursor="true"
            className="inline-flex items-center gap-2 text-xs text-[var(--ink-dim)] hover:text-[var(--green-ink)] mb-8 transition-colors"
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
              <div className="text-sm font-medium text-[var(--green-deep)] mb-3">Pay via UPI before submitting</div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6 items-start">
                <div>
                  <div className="flex gap-2 items-stretch mb-1">
                    <div className="font-mono text-lg sm:text-xl text-[var(--green-ink)] p-3 rounded-xl flex-1 min-w-0 break-all" style={{ background: "var(--cream-deep)" }}>
                      {paymentUpiId}
                    </div>
                    <button
                      type="button"
                      onClick={copyUpiId}
                      className="w-12 rounded-xl surface flex items-center justify-center text-[var(--green-ink)] hover:bg-[var(--cream-deep)] transition-colors"
                      aria-label="Copy UPI ID"
                      title="Copy UPI ID"
                    >
                      {copiedUpi ? <Check size={17} strokeWidth={2.3} /> : <Copy size={17} strokeWidth={2.3} />}
                    </button>
                  </div>
                  {copiedUpi && <p className="text-[10px] text-[var(--green)] mt-1">UPI ID copied.</p>}
                  {errors.upi && <p className="text-[10px] text-[var(--error)] mt-1">{errors.upi}</p>}
                  <p className="text-xs text-[var(--ink-dim)] mt-2">
                    Send <strong className="text-[var(--green-ink)]">{formatPrice(event.price_paise)}</strong> to the UPI ID above, then upload your payment screenshot below.
                  </p>
                </div>
                <div className="rounded-2xl overflow-hidden border border-[var(--surface-border)] bg-white p-3 min-h-[280px] md:min-h-[340px] flex items-center justify-center shadow-[0_14px_40px_rgba(44,138,75,0.12)]">
                  {paymentQrImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={paymentQrImageUrl} alt={`UPI QR code for ${event.title}`} className="w-full max-w-[340px] aspect-square object-contain" />
                  ) : (
                    <div className="text-center px-2">
                      <div className="text-[10px] uppercase tracking-widest text-[var(--ink-dim)]">UPI QR</div>
                      <div className="text-xs text-[var(--ink-dim)] mt-1">Admin has not added a QR yet.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {Object.values(errors).filter(Boolean).length > 0 && (
              <div
                className="rounded-2xl border p-4 text-sm"
                style={{ borderColor: "rgba(179,58,42,0.35)", background: "rgba(179,58,42,0.06)", color: "var(--danger)" }}
                role="alert"
              >
                <div className="font-semibold">Please fix the highlighted fields.</div>
                <div className="mt-1 text-xs opacity-90">
                  {Object.values(errors).filter(Boolean)[0]}
                </div>
              </div>
            )}
            {/* Full name */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-[var(--green-ink)] mb-2">
                Full name <span className="text-[var(--green)]">*</span>
              </label>
              <input name="fullName" type="text" placeholder="Priya Sharma" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} className={inputClass("fullName")} />
              {errors.fullName && <p data-field-error="fullName" className="mt-1.5 text-xs text-[var(--error)]">{errors.fullName}</p>}
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-[var(--green-ink)] mb-2">
                  Phone <span className="text-[var(--green)]">*</span>
                </label>
                <input name="phone" type="tel" placeholder="9876543210" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputClass("phone")} />
                {errors.phone && <p data-field-error="phone" className="mt-1.5 text-xs text-[var(--error)]">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-[var(--green-ink)] mb-2">
                  Email <span className="text-[var(--green)]">*</span>
                </label>
                <input name="email" type="email" placeholder="priya@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputClass("email")} />
                {errors.email && <p data-field-error="email" className="mt-1.5 text-xs text-[var(--error)]">{errors.email}</p>}
              </div>
            </div>

            {/* Age + City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-[var(--green-ink)] mb-2">
                  Age <span className="text-[var(--green)]">*</span>
                </label>
                <input name="age" type="number" placeholder="27" min={13} max={99} value={form.age} onChange={(e) => set("age", e.target.value)} className={inputClass("age")} />
                {errors.age && <p data-field-error="age" className="mt-1.5 text-xs text-[var(--error)]">{errors.age}</p>}
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-[var(--green-ink)] mb-2">
                  Area <span className="text-[var(--green)]">*</span>
                </label>
                <input name="city" type="text" placeholder="e.g. Malad" value={form.city} onChange={(e) => set("city", e.target.value)} className={inputClass("city")} />
                {errors.city && <p data-field-error="city" className="mt-1.5 text-xs text-[var(--error)]">{errors.city}</p>}
              </div>
            </div>

            {/* How did you hear */}
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold text-[var(--green-ink)] mb-2">
                How did you hear about us?
              </label>
              <div className="relative">
                <select
                  name="heardFrom"
                  value={form.heardFrom}
                  onChange={(e) => set("heardFrom", e.target.value)}
                  className={`${inputClass("heardFrom")} appearance-none pr-10`}
                >
                  <option value="">Select…</option>
                  {HEARD_FROM_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-[var(--green-ink)]">
                  <ChevronDown size={16} />
                </div>
              </div>
              {errors.heardFrom && <p data-field-error="heardFrom" className="mt-1.5 text-xs text-[var(--error)]">{errors.heardFrom}</p>}
            </div>



            {/* Screenshot upload for UPI */}
            {event.payment_mode === "manual_upi" && (
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-[var(--green-ink)] mb-2">
                  Payment screenshot <span className="text-[var(--green)]">*</span>
                </label>
                <label
                  aria-invalid={!!errors.screenshot}
                  className={`block w-full rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 hover:border-[var(--green)] hover:bg-[rgba(44,138,75,0.04)] ${
                    errors.screenshot ? "border-[var(--error)] bg-[rgba(220,38,38,0.06)] hover:!border-[var(--error)] hover:!bg-[rgba(220,38,38,0.1)]" : "border-[var(--surface-border)]"
                  } ${form.screenshot && !errors.screenshot ? "!border-[var(--lime-deep)] bg-[rgba(200,241,53,0.08)]" : ""}`}
                >
                  <input name="screenshot" type="file" accept="image/jpeg,image/png,image/heic,image/heif" className="sr-only" onChange={(e) => handleScreenshotChange(e.target.files?.[0] || null)} />
                  {form.screenshot ? (
                    <div>
                      {proofPreviewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={proofPreviewUrl} alt="Selected payment screenshot preview" className="mx-auto mb-3 max-h-40 rounded-xl object-contain" />
                      ) : (
                        <div className="text-2xl mb-2">Selected</div>
                      )}
                      <div className="text-sm font-medium text-[var(--green-deep)]">{form.screenshot.name}</div>
                      <div className="text-xs text-[var(--ink-dim)] mt-1">{(form.screenshot.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-3">Upload proof</div>
                      <div className="text-sm text-[var(--ink-dim)]">Drop screenshot here or click to upload</div>
                      <div className="text-xs text-[var(--ink-dim)] mt-1">JPEG, PNG, HEIC · max 5 MB</div>
                    </div>
                  )}
                </label>
                {errors.screenshot && <p data-field-error="screenshot" className="mt-1.5 text-xs text-[var(--error)]">{errors.screenshot}</p>}
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
                                name={field.key}
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
                            <span className="text-sm font-semibold text-[var(--green-ink)] leading-relaxed">
                              {field.label} <span className="text-[var(--green)]">*</span>
                            </span>
                          </label>
                          {errorMsg && <p data-field-error={field.key} className="mt-1.5 text-xs text-[var(--error)] ml-8">{errorMsg}</p>}
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs uppercase tracking-widest font-bold text-[var(--green-ink)] mb-2">
                            {field.label} <span className="text-[var(--green)]">*</span>
                          </label>
                          {field.type === "textarea" ? (
                            <textarea
                              name={field.key}
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
                            <div className="relative">
                              <select
                                name={field.key}
                                value={(value as string) || ""}
                                onChange={(e) => {
                                  setCustomAnswers((prev) => ({ ...prev, [field.key]: e.target.value }));
                                  setErrors((prev) => ({ ...prev, [field.key]: "" }));
                                }}
                                className={`${inputClass(field.key)} appearance-none pr-10`}
                              >
                                <option value="">Select…</option>
                                {field.options?.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-[var(--green-ink)]">
                                <ChevronDown size={16} />
                              </div>
                            </div>
                          ) : field.type === "number" ? (
                            <input
                              name={field.key}
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
                              name={field.key}
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
                          {errorMsg && <p data-field-error={field.key} className="mt-1.5 text-xs text-[var(--error)]">{errorMsg}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Consent */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 flex-shrink-0">
                  <input name="consent" type="checkbox" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} className="sr-only peer" />
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
                <span className="text-sm font-semibold text-[var(--green-ink)] leading-relaxed">
                  Send me WhatsApp + email updates about this event and De-escape. <span className="text-[var(--green)]">*</span>
                </span>
              </label>
              {errors.consent && <p data-field-error="consent" className="mt-1.5 text-xs text-[var(--error)] ml-8">{errors.consent}</p>}
            </div>

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
                ) : event.payment_mode === "manual_upi" ? (
                  "Submit payment proof →"
                ) : (
                  "Submit registration →"
                )}
              </button>
            </MagneticButton>

            <p className="text-center text-[11px] text-[var(--ink-dim)]">
              By submitting, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-[var(--green)]">Terms</Link>.
              {/* {" "}and{" "}
              <Link href="/refund-policy" className="underline hover:text-[var(--green)]">Refund Policy</Link>. */}
            </p>
          </form>
        </div>
      </div>
    </PublicShell>
  );
}
