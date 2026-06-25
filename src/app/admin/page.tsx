import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice, formatDate } from "@/lib/mock-data";
import type { Event } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Helper to format timestamps relative to now
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  
  const diffDays = Math.round(diffHrs / 24);
  return `${diffDays}d ago`;
}

// Action label mapping helper
const ACTION_LABELS: Record<string, { label: string; type: string }> = {
  "registration.approve": { label: "Registration approved", type: "success" },
  "registration.reject": { label: "Registration rejected", type: "warning" },
  "registration.refund": { label: "Registration refunded", type: "warning" },
  "registration.mark_attendance": { label: "Attendance updated", type: "info" },
  "event.create": { label: "Event created", type: "info" },
  "event.update": { label: "Event updated", type: "info" },
  "event.publish": { label: "Event published", type: "success" },
  "event.cancel": { label: "Event cancelled", type: "warning" },
};

export default async function AdminDashboard() {
  const supabase = createAdminClient();
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  // 1. Fetch active events count
  const { count: activeEventsCount } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .in("status", ["published", "sold_out"]);

  // 2. Fetch newly received registrations count
  const { count: receivedCount } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("status", "awaiting_verification");

  // 3. Fetch revenue this month
  const { data: revData } = await supabase
    .from("registrations")
    .select("amount_paise")
    .in("status", ["approved", "attended", "no_show"])
    .gte("created_at", startOfMonth);

  const revenueThisMonth = (revData ?? []).reduce((acc, r) => acc + r.amount_paise, 0);

  // 4. Fetch attendance rate
  const { data: attendanceData } = await supabase
    .from("registrations")
    .select("status")
    .in("status", ["attended", "no_show"]);

  const attendedCount = (attendanceData ?? []).filter((r) => r.status === "attended").length;
  const totalAttendanceCount = (attendanceData ?? []).length;
  const attendanceRate = totalAttendanceCount > 0 ? Math.round((attendedCount / totalAttendanceCount) * 100) : 0;

  // 5. Fetch upcoming events (max 4)
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("*")
    .in("status", ["published", "sold_out"])
    .order("start_at", { ascending: true })
    .limit(4);

  // 6. Fetch recent audit logs (max 5)
  const { data: logs } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const KPIs = [
    { label: "Active events", value: String(activeEventsCount ?? 0), unit: "", color: "var(--ok)", delta: "Published & sold out" },
    { label: "New registrations", value: String(receivedCount ?? 0), unit: "", color: "var(--warn)", delta: "Payment proof received" },
    { label: "Revenue this month", value: formatPrice(revenueThisMonth), unit: "", color: "var(--green)", delta: "Approved, attended, or no-show" },
    { label: "Attendance rate", value: String(attendanceRate), unit: "%", color: "var(--info)", delta: "Attended vs No-show" },
  ];

  const recentActions = (logs ?? []).map((log) => {
    const actionConfig = ACTION_LABELS[log.action] || { label: log.action, type: "info" };
    return {
      action: actionConfig.label,
      detail: `ID: ${log.target_id || "System"}`,
      time: formatTimeAgo(log.created_at),
      type: actionConfig.type,
    };
  });

  return (
    <div className="max-w-[1100px]">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-[var(--green-ink)] tracking-tight">
            Good evening, Dharmik.
          </h1>
          <p className="text-sm text-[var(--ink-dim)] mt-1">
            Mumbai Admin Console
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {KPIs.map((kpi) => (
          <div
            key={kpi.label}
            className="surface p-5 rounded-2xl"
          >
            <div className="text-[11px] uppercase tracking-widest text-[var(--ink-mute)] mb-3">
              {kpi.label}
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className="font-display leading-none"
                style={{ fontSize: "clamp(32px,4vw,44px)", color: kpi.color, letterSpacing: "-0.02em" }}
              >
                {kpi.value}
              </span>
              {kpi.unit && (
                <span className="text-lg font-display" style={{ color: kpi.color }}>
                  {kpi.unit}
                </span>
              )}
            </div>
            <div className="mt-2 text-xs text-[var(--ink-dim)]">{kpi.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Upcoming events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[var(--green-ink)] uppercase tracking-widest">
              Upcoming events
            </h2>
            <Link
              href="/admin/events"
              className="text-xs text-[var(--ink-mute)] hover:text-[var(--green-ink)] transition-colors"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingEvents && upcomingEvents.length > 0 ? (
              (upcomingEvents as Event[]).map((event) => {
                const pct = event.capacity > 0 ? Math.round((event.registered_count / event.capacity) * 100) : 0;
                return (
                  <Link
                    key={event.id}
                    href={`/admin/events/${event.id}`}
                    className="surface block p-4 rounded-2xl transition-all hover:bg-[var(--cream-deep)]/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[var(--green-ink)] truncate">{event.title}</div>
                        <div className="text-xs text-[var(--ink-mute)] mt-0.5">
                          {formatDate(event.start_at)} · {event.venue_name}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm text-[var(--green-ink)]">{event.registered_count}/{event.capacity}</div>
                        <div className="text-xs text-[var(--ink-mute)]">{formatPrice(event.price_paise)}</div>
                      </div>
                    </div>

                    {/* Capacity bar */}
                    <div className="mt-3 h-1 rounded-full bg-[var(--cream-deep)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 85 ? "var(--warn)" : "var(--ok)",
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-[var(--ink-mute)] border border-dashed border-[var(--surface-border)] rounded-2xl">
                No active events found.
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[var(--green-ink)] uppercase tracking-widest">
              Recent activity
            </h2>
            <Link
              href="/admin/audit-log"
              className="text-xs text-[var(--ink-mute)] hover:text-[var(--green-ink)] transition-colors"
            >
              Audit log →
            </Link>
          </div>

          <div
            className="surface rounded-2xl overflow-hidden mb-4"
          >
            {recentActions.length > 0 ? (
              recentActions.map((item, i) => (
                <div
                  key={i}
                  className="px-4 py-3 flex items-start gap-3 border-b last:border-0 border-[var(--surface-border)]"
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{
                      background:
                        item.type === "success"
                          ? "var(--ok)"
                          : item.type === "warning"
                          ? "var(--warn)"
                          : "var(--info)",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-[var(--green-ink)]">{item.action}</div>
                    <div className="text-xs text-[var(--ink-mute)] truncate">{item.detail}</div>
                  </div>
                  <div className="text-[10px] text-[var(--ink-mute)] flex-shrink-0 pt-0.5">{item.time}</div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-[var(--ink-mute)]">No activity logged.</div>
            )}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/admin/registrations"
              className="surface py-3 rounded-xl text-xs font-medium text-center hover:bg-[var(--cream-deep)]/30 transition-all text-[var(--green-ink)]"
            >
              View registrations ({receivedCount ?? 0})
            </Link>
            <Link
              href="/admin/events/new"
              className="py-3 rounded-xl text-xs font-medium text-center transition-all hover:-translate-y-0.5 bg-[var(--green)] text-[var(--cream)]"
            >
              + Create event
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
