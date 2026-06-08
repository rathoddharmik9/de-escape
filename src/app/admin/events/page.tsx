import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatDate, seatsLeft, CATEGORY_LABELS } from "@/lib/mock-data";
import type { Event } from "@/lib/types";

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  published: { label: "Published", bg: "rgba(46,122,76,0.10)", color: "var(--ok)" },
  draft: { label: "Draft", bg: "var(--cream-deep)", color: "var(--ink-dim)" },
  sold_out: { label: "Sold out", bg: "rgba(199,126,26,0.10)", color: "var(--warn)" },
  cancelled: { label: "Cancelled", bg: "rgba(179,58,42,0.10)", color: "var(--danger)" },
  past: { label: "Past", bg: "var(--cream-deep)", color: "var(--ink-mute)" },
};

export default async function AdminEventsPage() {
  const supabase = createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("start_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch admin events:", error.message);
  }

  const eventsList = (events ?? []) as Event[];

  return (
    <div className="max-w-[1100px]">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-[var(--green-ink)] tracking-tight">Events</h1>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5 bg-[var(--green)] text-[var(--cream)]"
        >
          + New event
        </Link>
      </div>

      <div className="space-y-3">
        {eventsList.length > 0 ? (
          eventsList.map((event) => {
            const left = seatsLeft(event);
            const pct = event.capacity > 0 ? Math.round((event.registered_count / event.capacity) * 100) : 0;
            const statusStyle = STATUS_STYLES[event.status] || STATUS_STYLES.published;

            return (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="block p-5 rounded-2xl transition-all surface hover:bg-[var(--cream-deep)]/30"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-medium text-[var(--green-ink)]">{event.title}</span>
                      <span
                        className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-medium"
                        style={{ background: statusStyle.bg, color: statusStyle.color }}
                      >
                        {statusStyle.label}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--ink-mute)]">
                        {CATEGORY_LABELS[event.category] || event.category}
                      </span>
                    </div>
                    <div className="text-xs text-[var(--ink-mute)] flex flex-wrap gap-3">
                      <span>{formatDate(event.start_at)}</span>
                      <span>·</span>
                      <span>{event.venue_name}</span>
                      <span>·</span>
                      <span>{formatPrice(event.price_paise)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right flex-shrink-0">
                    <div>
                      <div className="text-sm text-[var(--green-ink)]">{event.registered_count}/{event.capacity}</div>
                      <div className="text-xs text-[var(--ink-mute)]">registered</div>
                    </div>
                    <div
                      className="w-px h-8 self-center"
                      style={{ background: "var(--surface-border)" }}
                    />
                    <div className="flex gap-1.5">
                      <button
                        className="text-xs px-3 py-1.5 rounded-lg surface text-[var(--ink-dim)] hover:text-[var(--green-ink)] transition-all"
                      >
                        Manage →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Capacity bar */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 h-1 rounded-full bg-[var(--cream-deep)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 85 ? "var(--warn)" : "var(--ok)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--ink-mute)] whitespace-nowrap">
                    {pct}% full · {left} left
                  </span>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="p-12 text-center text-sm text-[var(--ink-mute)] border border-dashed border-[var(--surface-border)] rounded-2xl">
            No events found in the database.
          </div>
        )}
      </div>
    </div>
  );
}
