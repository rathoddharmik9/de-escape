"use client";

import Link from "next/link";
import { EVENTS, formatPrice, formatDate, seatsLeft, CATEGORY_LABELS } from "@/lib/mock-data";

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  published: { label: "Published", bg: "rgba(93,202,165,0.15)", color: "var(--teal)" },
  draft: { label: "Draft", bg: "rgba(184,176,200,0.12)", color: "var(--ink-2)" },
  sold_out: { label: "Sold out", bg: "rgba(244,201,122,0.15)", color: "var(--amber)" },
  cancelled: { label: "Cancelled", bg: "rgba(255,122,92,0.15)", color: "var(--coral)" },
  past: { label: "Past", bg: "rgba(122,115,138,0.15)", color: "var(--ink-3)" },
};

export default function AdminEventsPage() {
  return (
    <div className="max-w-[1100px]">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-[var(--ink)] tracking-tight">Events</h1>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5 text-[#1a0e08]"
          style={{ background: "var(--ink)" }}
        >
          + New event
        </Link>
      </div>

      <div className="space-y-3">
        {EVENTS.map((event) => {
          const left = seatsLeft(event);
          const pct = Math.round((event.registered_count / event.capacity) * 100);
          const statusStyle = STATUS_STYLES[event.status] || STATUS_STYLES.published;

          return (
            <Link
              key={event.id}
              href={`/admin/events/${event.id}`}
              className="block p-5 rounded-2xl transition-all hover:bg-white/5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)" }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-medium text-[var(--ink)]">{event.title}</span>
                    <span
                      className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-medium"
                      style={{ background: statusStyle.bg, color: statusStyle.color }}
                    >
                      {statusStyle.label}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--ink-3)]">
                      {CATEGORY_LABELS[event.category]}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--ink-3)] flex flex-wrap gap-3">
                    <span>{formatDate(event.start_at)}</span>
                    <span>·</span>
                    <span>{event.venue_name}</span>
                    <span>·</span>
                    <span>{formatPrice(event.price_paise)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right flex-shrink-0">
                  <div>
                    <div className="text-sm text-[var(--ink)]">{event.registered_count}/{event.capacity}</div>
                    <div className="text-xs text-[var(--ink-3)]">registered</div>
                  </div>
                  <div
                    className="w-px h-8 self-center"
                    style={{ background: "var(--glass-border)" }}
                  />
                  <div className="flex gap-1.5">
                    <button
                      className="text-xs px-3 py-1.5 rounded-lg glass text-[var(--ink-2)] hover:text-[var(--ink)] transition-all"
                      onClick={(e) => e.preventDefault()}
                    >
                      Edit
                    </button>
                    <button
                      className="text-xs px-3 py-1.5 rounded-lg glass text-[var(--ink-2)] hover:text-[var(--ink)] transition-all"
                      onClick={(e) => e.preventDefault()}
                    >
                      View →
                    </button>
                  </div>
                </div>
              </div>

              {/* Capacity bar */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 85 ? "var(--amber)" : "var(--teal)",
                    }}
                  />
                </div>
                <span className="text-[10px] text-[var(--ink-3)] whitespace-nowrap">
                  {pct}% full · {left} left
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
