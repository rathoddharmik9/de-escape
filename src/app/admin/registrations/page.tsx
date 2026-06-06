"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/mock-data";

const MOCK_REGS = [
  { id: "reg-001", name: "Priya Sharma", phone: "+91 98765 43210", email: "priya@example.com", event: "Midnight Cycling Scavenger Hunt", event_id: "evt-001", status: "awaiting_verification", payment: "razorpay", amount: 59900, created: "2026-06-04T10:23:00+05:30" },
  { id: "reg-002", name: "Arjun Kumar", phone: "+91 87654 32109", email: "arjun@example.com", event: "Strangers + Chai in Bandra", event_id: "evt-003", status: "awaiting_verification", payment: "manual_upi", amount: 25000, created: "2026-06-04T11:05:00+05:30" },
  { id: "reg-003", name: "Meera Pillai", phone: "+91 76543 21098", email: "meera@example.com", event: "Midnight Cycling Scavenger Hunt", event_id: "evt-001", status: "awaiting_verification", payment: "razorpay", amount: 59900, created: "2026-06-04T12:44:00+05:30" },
  { id: "reg-004", name: "Rohan Verma", phone: "+91 65432 10987", email: "rohan@example.com", event: "Slow Supper, Eight Strangers", event_id: "evt-004", status: "approved", payment: "razorpay", amount: 149900, created: "2026-06-03T09:15:00+05:30" },
  { id: "reg-005", name: "Sneha Joshi", phone: "+91 54321 09876", email: "sneha@example.com", event: "First-Light Trail Run", event_id: "evt-005", status: "approved", payment: "free", amount: 0, created: "2026-06-02T16:30:00+05:30" },
  { id: "reg-006", name: "Dev Nair", phone: "+91 43210 98765", email: "dev@example.com", event: "Sunset Sound Bath", event_id: "evt-002", status: "rejected", payment: "manual_upi", amount: 39900, created: "2026-06-01T14:22:00+05:30" },
];

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  awaiting_verification: { label: "Pending", bg: "rgba(244,201,122,0.15)", color: "var(--amber)" },
  approved: { label: "Approved", bg: "rgba(93,202,165,0.15)", color: "var(--teal)" },
  rejected: { label: "Rejected", bg: "rgba(255,122,92,0.15)", color: "var(--coral)" },
  attended: { label: "Attended", bg: "rgba(138,127,230,0.15)", color: "var(--violet)" },
  refunded: { label: "Refunded", bg: "rgba(184,176,200,0.15)", color: "var(--ink-2)" },
};

export default function RegistrationsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = MOCK_REGS.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.phone.includes(q) || r.email.toLowerCase().includes(q) || r.event.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="max-w-[1100px]">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-[var(--ink)] tracking-tight">Registrations</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { label: "All", value: "all" },
          { label: "Pending", value: "awaiting_verification" },
          { label: "Approved", value: "approved" },
          { label: "Rejected", value: "rejected" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all ${
              statusFilter === f.value
                ? "text-[#1a0e08]"
                : "glass text-[var(--ink-2)] hover:text-[var(--ink)]"
            }`}
            style={statusFilter === f.value ? { background: "var(--ink)" } : {}}
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
            className="glass text-xs text-[var(--ink)] placeholder:text-[var(--ink-3)] rounded-full px-4 py-2 w-64 outline-none focus:border-[var(--coral)] transition-all"
            style={{ border: "1px solid var(--glass-border)" }}
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--glass-border)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--glass-border)" }}>
              {["Name", "Event", "Date", "Payment", "Amount", "Status", "Actions"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-[var(--ink-3)] font-medium"
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
                  className="border-t transition-colors hover:bg-white/3"
                  style={{ borderColor: "var(--glass-border)" }}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--ink)] text-xs">{reg.name}</div>
                    <div className="text-[10px] text-[var(--ink-3)]">{reg.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--ink-2)] max-w-[160px] truncate">
                    {reg.event}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--ink-3)]">
                    {new Date(reg.created).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                      {reg.payment === "razorpay" ? "💳" : reg.payment === "manual_upi" ? "📱" : "🎉"}{" "}
                      {reg.payment.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--ink)]">
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
                      {reg.status === "awaiting_verification" && (
                        <>
                          <button
                            className="text-[10px] px-2.5 py-1 rounded-lg font-medium transition-all hover:-translate-y-0.5"
                            style={{ background: "rgba(93,202,165,0.15)", color: "var(--teal)" }}
                          >
                            Approve
                          </button>
                          <button
                            className="text-[10px] px-2.5 py-1 rounded-lg font-medium"
                            style={{ background: "rgba(255,122,92,0.15)", color: "var(--coral)" }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <Link
                        href={`/admin/registrations/${reg.id}`}
                        className="text-[10px] px-2.5 py-1 rounded-lg glass text-[var(--ink-2)] hover:text-[var(--ink)] transition-all"
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
          <div className="py-16 text-center text-[var(--ink-3)] text-sm">
            No registrations match your filters.
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-[var(--ink-3)]">
        {filtered.length} registration{filtered.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
