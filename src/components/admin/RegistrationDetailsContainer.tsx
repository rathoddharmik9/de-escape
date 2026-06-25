"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/mock-data";
import type { PaymentMode, RegistrationStatus } from "@/lib/types";

interface ExtendedRegistration {
  id: string;
  event_id: string;
  pass_code: string;
  full_name: string;
  phone: string;
  email: string;
  age: number;
  city: string;
  instagram?: string;
  heard_from?: string;
  notes?: string;
  custom_answers?: Record<string, unknown>;
  payment_mode: PaymentMode;
  amount_paise: number;
  screenshot_url?: string;
  status: RegistrationStatus;
  consent_whatsapp: boolean;
  rejected_reason?: string;
  approved_at?: string;
  approved_by?: string;
  attended_at?: string;
  created_at: string;
}

interface ContainerProps {
  registration: ExtendedRegistration & {
    events?: {
      title: string;
      start_at: string;
    } | null;
  };
  signedUrl?: string;
}

const STATUS_STYLES: Record<RegistrationStatus | string, { label: string; bg: string; color: string }> = {
  pending: { label: "Received", bg: "var(--cream-deep)", color: "var(--ink-dim)" },
  awaiting_payment: { label: "Awaiting Payment", bg: "rgba(199,126,26,0.10)", color: "var(--warn)" },
  awaiting_verification: { label: "Received", bg: "rgba(199,126,26,0.10)", color: "var(--warn)" },
  approved: { label: "Approved", bg: "rgba(46,122,76,0.10)", color: "var(--ok)" },
  rejected: { label: "Rejected", bg: "rgba(179,58,42,0.10)", color: "var(--danger)" },
  refunded: { label: "Refunded", bg: "var(--cream-deep)", color: "var(--ink-dim)" },
  attended: { label: "Attended", bg: "rgba(74,111,176,0.10)", color: "var(--info)" },
  no_show: { label: "No Show", bg: "var(--cream-deep)", color: "var(--ink-mute)" },
};

export default function RegistrationDetailsContainer({ registration, signedUrl }: ContainerProps) {
  const [showImageZoom, setShowImageZoom] = useState(false);

  const statusStyle = STATUS_STYLES[registration.status] || STATUS_STYLES.pending;

  return (
    <div className="max-w-[1100px]">
      {/* Header breadcrumb & info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/admin/registrations"
            className="text-xs text-[var(--ink-mute)] hover:text-[var(--green-ink)] transition-colors"
          >
            ← Back to registrations
          </Link>
          <h1 className="font-display text-3xl text-[var(--green-ink)] mt-2 tracking-tight flex items-center gap-3 flex-wrap">
            {registration.full_name}
            <span
              className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-medium"
              style={{ background: statusStyle.bg, color: statusStyle.color }}
            >
              {statusStyle.label}
            </span>
          </h1>
          <p className="text-xs text-[var(--ink-mute)] mt-1">
            Registered on {new Date(registration.created_at).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <Link
          href={`https://wa.me/${registration.phone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-full text-xs font-semibold bg-[var(--green)] text-[var(--cream)] hover:-translate-y-0.5 transition-all"
        >
          Open WhatsApp
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Left Column: Details */}
        <div className="space-y-6">
          {/* Rejection notice if rejected */}
          {registration.status === "rejected" && registration.rejected_reason && (
            <div
              className="p-5 rounded-2xl border flex flex-col gap-1"
              style={{ background: "rgba(179,58,42,0.08)", borderColor: "rgba(179,58,42,0.2)" }}
            >
              <div className="text-xs uppercase tracking-widest text-[var(--danger)] font-semibold">
                Rejection Reason
              </div>
              <p className="text-xs text-[var(--ink-dim)] leading-relaxed">
                {registration.rejected_reason}
              </p>
            </div>
          )}

          {/* Attendee Details Card */}
          <div className="p-6 rounded-3xl surface">
            <h2 className="text-xs uppercase tracking-widest text-[var(--ink-mute)] font-semibold mb-4">
              Registration Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] text-[var(--ink-mute)] uppercase tracking-wider">Full Name</span>
                <span className="text-sm font-medium text-[var(--green-ink)]">{registration.full_name}</span>
              </div>
              <div>
                <span className="block text-[10px] text-[var(--ink-mute)] uppercase tracking-wider">Pass Code</span>
                <span className="text-sm font-mono font-medium text-[var(--green-ink)]">{registration.pass_code}</span>
              </div>
              <div>
                <span className="block text-[10px] text-[var(--ink-mute)] uppercase tracking-wider">Email</span>
                <span className="text-sm font-medium text-[var(--green-ink)] break-all">{registration.email}</span>
              </div>
              <div>
                <span className="block text-[10px] text-[var(--ink-mute)] uppercase tracking-wider">Phone</span>
                <span className="text-sm font-medium text-[var(--green-ink)]">{registration.phone}</span>
              </div>
              <div>
                <span className="block text-[10px] text-[var(--ink-mute)] uppercase tracking-wider">Age</span>
                <span className="text-sm font-medium text-[var(--green-ink)]">{registration.age} years</span>
              </div>
              <div>
                <span className="block text-[10px] text-[var(--ink-mute)] uppercase tracking-wider">City</span>
                <span className="text-sm font-medium text-[var(--green-ink)]">{registration.city}</span>
              </div>
              <div>
                <span className="block text-[10px] text-[var(--ink-mute)] uppercase tracking-wider">Instagram</span>
                <span className="text-sm font-medium text-[var(--green-ink)]">
                  {registration.instagram ? (
                    <a
                      href={`https://instagram.com/${registration.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--green)] hover:underline"
                    >
                      {registration.instagram.startsWith("@") ? registration.instagram : `@${registration.instagram}`}
                    </a>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-[var(--ink-mute)] uppercase tracking-wider">How they heard</span>
                <span className="text-sm font-medium text-[var(--green-ink)]">{registration.heard_from || "—"}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-[10px] text-[var(--ink-mute)] uppercase tracking-wider">WhatsApp Consent</span>
                <span className="text-xs text-[var(--ink-dim)] mt-0.5 block">
                  {registration.consent_whatsapp
                    ? "✓ Opted in for updates via WhatsApp"
                    : "✗ Declined updates via WhatsApp"}
                </span>
              </div>
              {registration.notes && (
                <div className="sm:col-span-2">
                  <span className="block text-[10px] text-[var(--ink-mute)] uppercase tracking-wider">Notes</span>
                  <p className="text-xs text-[var(--ink-dim)] bg-[var(--cream-deep)] p-3 rounded-xl border border-[var(--surface-border)] mt-1 whitespace-pre-wrap">
                    {registration.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Custom Answers Card */}
          <div className="p-6 rounded-3xl surface">
            <h2 className="text-xs uppercase tracking-widest text-[var(--ink-mute)] font-semibold mb-4">
              Custom Field Responses
            </h2>
            {registration.custom_answers && Object.keys(registration.custom_answers).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(registration.custom_answers).map(([key, val]) => (
                  <div key={key} className="border-b border-[var(--surface-border)] last:border-0 pb-3 last:pb-0">
                    <span className="block text-[10px] text-[var(--ink-mute)] uppercase tracking-wider">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-medium text-[var(--green-ink)] mt-0.5 block">
                      {typeof val === "boolean" ? (val ? "Yes" : "No") : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--ink-mute)]">No custom fields responses provided for this event.</p>
            )}
          </div>
        </div>

        {/* Right Column: Event & Payment Info */}
        <div className="space-y-6">
          {/* Event Information summary */}
          <div className="p-5 rounded-3xl surface">
            <h2 className="text-xs uppercase tracking-widest text-[var(--ink-mute)] font-semibold mb-3">
              Event Details
            </h2>
            <div className="text-sm font-medium text-[var(--green-ink)] truncate">
              {registration.events?.title || "Unknown Event"}
            </div>
            <div className="text-xs text-[var(--ink-mute)] mt-1">
              {registration.events?.start_at ? formatDate(registration.events.start_at) : "Unknown Date"}
            </div>
            <Link
              href={`/admin/events/${registration.event_id}`}
              className="text-xs text-[var(--green)] hover:underline mt-3 block"
            >
              View event settings →
            </Link>
          </div>

          {/* Payment Info */}
          <div className="p-5 rounded-3xl space-y-4 surface">
            <h2 className="text-xs uppercase tracking-widest text-[var(--ink-mute)] font-semibold">
              Payment Details
            </h2>

            <div>
              <span className="block text-[10px] text-[var(--ink-mute)] uppercase">Amount</span>
              <span className="text-xl font-display text-[var(--green-ink)]">
                {formatPrice(registration.amount_paise)}
              </span>
            </div>

            <div>
              <span className="block text-[10px] text-[var(--ink-mute)] uppercase">Method</span>
              <span className="text-xs text-[var(--ink-dim)] mt-0.5 block uppercase">
                {registration.payment_mode.replace("_", " ")}
              </span>
            </div>

            {/* Manual payment screenshot */}
            {registration.payment_mode === "manual_upi" && (
              <div className="pt-2 border-t border-[var(--surface-border)]">
                <span className="block text-[10px] text-[var(--ink-mute)] uppercase mb-2">
                  Payment Proof Screenshot
                </span>
                {signedUrl ? (
                  <div
                    onClick={() => setShowImageZoom(true)}
                    className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden border border-[var(--surface-border)] cursor-zoom-in hover:brightness-95 transition-all group bg-black/40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={signedUrl}
                      alt="Payment Screenshot Proof"
                      className="object-contain w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-xs font-medium text-white px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
                        Click to Zoom
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-[var(--ink-mute)] border border-dashed border-[var(--surface-border)] rounded-2xl">
                    No screenshot proof uploaded or path is missing.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-5 rounded-3xl space-y-3 surface">
            <h2 className="text-xs uppercase tracking-widest text-[var(--ink-mute)] font-semibold">
              Admin Note
            </h2>
            <p className="text-xs text-[var(--ink-dim)] leading-relaxed">
              This screen is for viewing submitted registration details and payment proof. Follow-up, confirmation, and group approval happen on WhatsApp.
            </p>
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {showImageZoom && signedUrl && (
        <div
          onClick={() => setShowImageZoom(false)}
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signedUrl}
              alt="Payment Screenshot Zoomed"
              className="object-contain max-w-full max-h-full rounded-lg"
            />
            <button
              onClick={() => setShowImageZoom(false)}
              className="absolute top-4 right-4 text-white hover:text-white/70 bg-black/60 rounded-full w-10 h-10 flex items-center justify-center border border-white/10"
              aria-label="Close zoomed image"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
