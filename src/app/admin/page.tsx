import Link from "next/link";
import { EVENTS, formatPrice, formatDate } from "@/lib/mock-data";

const KPIs = [
  { label: "Active events", value: "4", unit: "", color: "#8a7fe6", delta: "+1 this week" },
  { label: "Pending reviews", value: "3", unit: "", color: "#ff7a5c", delta: "Needs action" },
  { label: "Revenue this month", value: "₹18,400", unit: "", color: "#5dcaa5", delta: "+34% vs last mo" },
  { label: "Attendance rate", value: "87", unit: "%", color: "#f4c97a", delta: "Last 30 days" },
];

const RECENT_ACTIONS = [
  { action: "Registration approved", detail: "Priya Sharma → Midnight Cycling", time: "2m ago", type: "success" },
  { action: "New registration", detail: "Arjun K → Strangers + Chai", time: "14m ago", type: "info" },
  { action: "Registration rejected", detail: "Anonymous → Slow Supper", time: "1h ago", type: "warning" },
  { action: "Event published", detail: "Sunset Sound Bath", time: "3h ago", type: "info" },
  { action: "Broadcast sent", detail: "48h reminder → 28 attendees", time: "5h ago", type: "success" },
];

export default function AdminDashboard() {
  const upcomingEvents = EVENTS.filter((e) => e.status === "published").slice(0, 4);

  return (
    <div className="max-w-[1100px]">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-[var(--ink)] tracking-tight">
            Good evening, Dharmik.
          </h1>
          <p className="text-sm text-[var(--ink-3)] mt-1">
            Saturday, 7 June 2026 · Mumbai
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {KPIs.map((kpi) => (
          <div
            key={kpi.label}
            className="p-5 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-border)" }}
          >
            <div className="text-[11px] uppercase tracking-widest text-[var(--ink-3)] mb-3">
              {kpi.label}
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className="font-serif leading-none"
                style={{ fontSize: "clamp(32px,4vw,44px)", color: kpi.color, letterSpacing: "-0.02em" }}
              >
                {kpi.value}
              </span>
              {kpi.unit && (
                <span className="text-lg font-serif" style={{ color: kpi.color }}>
                  {kpi.unit}
                </span>
              )}
            </div>
            <div className="mt-2 text-xs text-[var(--ink-3)]">{kpi.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Upcoming events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[var(--ink)] uppercase tracking-widest">
              Upcoming events
            </h2>
            <Link
              href="/admin/events"
              className="text-xs text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingEvents.map((event) => {
              const pct = Math.round((event.registered_count / event.capacity) * 100);
              return (
                <Link
                  key={event.id}
                  href={`/admin/events/${event.id}`}
                  className="block p-4 rounded-2xl transition-all hover:bg-white/5"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--ink)] truncate">{event.title}</div>
                      <div className="text-xs text-[var(--ink-3)] mt-0.5">
                        {formatDate(event.start_at)} · {event.venue_name}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm text-[var(--ink)]">{event.registered_count}/{event.capacity}</div>
                      <div className="text-xs text-[var(--ink-3)]">{formatPrice(event.price_paise)}</div>
                    </div>
                  </div>

                  {/* Capacity bar */}
                  <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 85 ? "var(--amber)" : "var(--teal)",
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[var(--ink)] uppercase tracking-widest">
              Recent activity
            </h2>
            <Link
              href="/admin/audit-log"
              className="text-xs text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
            >
              Audit log →
            </Link>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--glass-border)" }}
          >
            {RECENT_ACTIONS.map((item, i) => (
              <div
                key={i}
                className="px-4 py-3 flex items-start gap-3"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{
                    background:
                      item.type === "success"
                        ? "var(--teal)"
                        : item.type === "warning"
                        ? "var(--amber)"
                        : "var(--violet)",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-[var(--ink)]">{item.action}</div>
                  <div className="text-xs text-[var(--ink-3)] truncate">{item.detail}</div>
                </div>
                <div className="text-[10px] text-[var(--ink-3)] flex-shrink-0 pt-0.5">{item.time}</div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              href="/admin/registrations"
              className="py-3 rounded-xl text-xs font-medium text-center glass hover:bg-white/8 transition-all text-[var(--ink)]"
            >
              Review pending (3)
            </Link>
            <Link
              href="/admin/events/new"
              className="py-3 rounded-xl text-xs font-medium text-center transition-all hover:-translate-y-0.5 text-[#1a0e08]"
              style={{ background: "var(--peach)" }}
            >
              + Create event
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
