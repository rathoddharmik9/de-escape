"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/mock-data";

interface RegItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  event: string;
  event_id: string;
  status: string;
  payment: string;
  amount: number;
  created: string;
}

interface BrowserProps {
  initialRegistrations: RegItem[];
}

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: "Received", bg: "var(--cream-deep)", color: "var(--ink-dim)" },
  awaiting_payment: { label: "Payment Pending", bg: "rgba(199,126,26,0.10)", color: "var(--warn)" },
  awaiting_verification: { label: "Received", bg: "rgba(199,126,26,0.10)", color: "var(--warn)" },
  approved: { label: "Approved", bg: "rgba(46,122,76,0.10)", color: "var(--ok)" },
  rejected: { label: "Rejected", bg: "rgba(179,58,42,0.10)", color: "var(--danger)" },
  attended: { label: "Attended", bg: "rgba(74,111,176,0.10)", color: "var(--info)" },
  refunded: { label: "Refunded", bg: "var(--cream-deep)", color: "var(--ink-dim)" },
};

export default function RegistrationsBrowser({ initialRegistrations }: BrowserProps) {
  const [registrations] = useState<RegItem[]>(initialRegistrations);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = registrations.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.event.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="max-w-[1100px]">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-[var(--green-ink)] tracking-tight">Registrations</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
          {[
            { label: "All", value: "all" },
          { label: "Received", value: "awaiting_verification" },
          { label: "Approved", value: "approved" },
          { label: "Rejected", value: "rejected" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all ${
              statusFilter === f.value
                ? "bg-[var(--green)] text-[var(--cream)]"
                : "surface text-[var(--ink-dim)] hover:text-[var(--green-ink)]"
            }`}
          >
            {f.label}
          </button>
        ))}

        <div className="ml-auto relative">
          <input
            type="search"
            placeholder="Search by name, phone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="surface text-xs text-[var(--green-ink)] placeholder:text-[var(--ink-mute)] rounded-full px-4 py-2 w-64 outline-none border-[var(--surface-border)] focus:border-[var(--green)] transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden border-[var(--surface-border)]"
        style={{ border: "1px solid var(--surface-border)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--cream-deep)]/50" style={{ borderBottom: "1px solid var(--surface-border)" }}>
              {["Name", "Event", "Date", "Payment", "Amount", "Status", "Details"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-[var(--ink-mute)] font-medium"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((reg) => {
              const style = STATUS_STYLES[reg.status] || STATUS_STYLES.approved;
              
              return (
                <tr
                  key={reg.id}
                  className="border-t border-[var(--surface-border)] transition-colors hover:bg-[var(--cream-deep)]/25"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--green-ink)] text-xs">{reg.name}</div>
                    <div className="text-[10px] text-[var(--ink-mute)]">{reg.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--ink-dim)] max-w-[160px] truncate">
                    {reg.event}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--ink-mute)]">
                    {new Date(reg.created).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--ink-mute)]">
                      {reg.payment === "manual_upi" ? "UPI" : "Free"}{" "}
                      {reg.payment.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--green-ink)]">
                    {formatPrice(reg.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-medium"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {style.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/registrations/${reg.id}`}
                        className="text-[10px] px-2.5 py-1 rounded-lg surface text-[var(--ink-dim)] hover:text-[var(--green-ink)] transition-all"
                      >
                        View →
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-[var(--ink-mute)] text-sm">
            No registrations match your filters.
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-[var(--ink-mute)]">
        {filtered.length} registration{filtered.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
