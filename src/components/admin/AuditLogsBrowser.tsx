"use client";

import { useState } from "react";

interface AuditLogItem {
  id: string;
  actor_id: string;
  actor_email: string;
  action: string;
  target_table: string;
  target_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
}

interface BrowserProps {
  initialLogs: AuditLogItem[];
}

const ACTION_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  "registration.approve": { label: "Registration Approved", bg: "rgba(46,122,76,0.10)", color: "var(--ok)" },
  "registration.reject": { label: "Registration Rejected", bg: "rgba(179,58,42,0.10)", color: "var(--danger)" },
  "registration.refund": { label: "Registration Refunded", bg: "rgba(179,58,42,0.10)", color: "var(--danger)" },
  "registration.mark_attendance": { label: "Attendance Updated", bg: "rgba(74,111,176,0.10)", color: "var(--info)" },
  "event.create": { label: "Event Created", bg: "rgba(46,122,76,0.10)", color: "var(--ok)" },
  "event.update": { label: "Event Updated", bg: "var(--cream-deep)", color: "var(--ink-dim)" },
  "event.publish": { label: "Event Published", bg: "rgba(46,122,76,0.10)", color: "var(--ok)" },
  "event.cancel": { label: "Event Cancelled", bg: "rgba(179,58,42,0.10)", color: "var(--danger)" },
  "event.update_custom_fields": { label: "Custom Fields Updated", bg: "var(--cream-deep)", color: "var(--ink-dim)" },
};

export default function AuditLogsBrowser({ initialLogs }: BrowserProps) {
  const [logs] = useState<AuditLogItem[]>(initialLogs);
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filtered = logs.filter((log) => {
    const matchAction =
      actionFilter === "all" ||
      (actionFilter === "events" && log.action.startsWith("event.")) ||
      (actionFilter === "registrations" && log.action.startsWith("registration."));

    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      log.actor_email.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.target_table.toLowerCase().includes(q) ||
      (log.target_id && log.target_id.toLowerCase().includes(q));

    return matchAction && matchSearch;
  });

  function toggleExpand(id: string) {
    setExpandedLogId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="max-w-[1100px]">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-[var(--green-ink)] tracking-tight">Audit Log</h1>
          <p className="text-xs text-[var(--ink-mute)] mt-1">
            Historical trace of administrator adjustments and events CRUD mutations.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { label: "All Logs", value: "all" },
          { label: "Event Logs", value: "events" },
          { label: "Registration Logs", value: "registrations" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setActionFilter(f.value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all ${
              actionFilter === f.value
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
            placeholder="Search by admin, action, target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="surface text-xs text-[var(--green-ink)] placeholder:text-[var(--ink-mute)] rounded-full px-4 py-2 w-64 outline-none border-[var(--surface-border)] focus:border-[var(--green)] transition-all"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div
        className="rounded-2xl overflow-hidden border-[var(--surface-border)]"
        style={{ border: "1px solid var(--surface-border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--cream-deep)]/50" style={{ borderBottom: "1px solid var(--surface-border)" }}>
                {["Timestamp", "Actor", "Action", "Target", "IP Address", "Details"].map((h) => (
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
              {filtered.map((log) => {
                const badge = ACTION_LABELS[log.action] || {
                  label: log.action,
                  bg: "var(--cream-deep)",
                  color: "var(--ink-dim)",
                };
                const isExpanded = expandedLogId === log.id;

                return (
                  <>
                    <tr
                      key={log.id}
                      className={`border-t border-[var(--surface-border)] transition-colors hover:bg-[var(--cream-deep)]/25 ${
                        isExpanded ? "bg-[var(--cream-deep)]/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-xs text-[var(--ink-dim)] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--green-ink)] font-medium truncate max-w-[180px]">
                        {log.actor_email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: badge.bg, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--ink-dim)]">
                        <div className="font-mono text-[10px] text-[var(--ink-dim)]">
                          {log.target_table}
                        </div>
                        <div className="text-[9px] truncate max-w-[120px] text-[var(--ink-mute)]">{log.target_id || "System"}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--ink-mute)] font-mono">
                        {log.ip || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleExpand(log.id)}
                          className="text-[10px] px-2.5 py-1 rounded-lg surface text-[var(--ink-dim)] hover:text-[var(--green-ink)] transition-all whitespace-nowrap"
                        >
                          {isExpanded ? "Hide diff" : "Inspect"}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-[var(--cream-deep)] border-t border-[var(--surface-border)]">
                        <td colSpan={6} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-[var(--ink-mute)] mb-1">
                                Before State
                              </div>
                              {log.before ? (
                                <pre className="text-[10px] font-mono p-3 bg-[var(--cream-deep)] rounded-xl overflow-auto max-h-48 border border-[var(--surface-border)] text-[var(--green-ink)] scrollbar-thin">
                                  {JSON.stringify(log.before, null, 2)}
                                </pre>
                              ) : (
                                <div className="text-xs text-[var(--ink-mute)] p-3 bg-[var(--cream-deep)] rounded-xl border border-[var(--surface-border)] italic">
                                  No previous state (Creation / Init action)
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-[var(--ink-mute)] mb-1">
                                After State
                              </div>
                              {log.after ? (
                                <pre className="text-[10px] font-mono p-3 bg-[var(--cream-deep)] rounded-xl overflow-auto max-h-48 border border-[var(--surface-border)] text-[var(--green-ink)] scrollbar-thin">
                                  {JSON.stringify(log.after, null, 2)}
                                </pre>
                              ) : (
                                <div className="text-xs text-[var(--ink-mute)] p-3 bg-[var(--cream-deep)] rounded-xl border border-[var(--surface-border)] italic">
                                  No post state (Deletion action)
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-[var(--ink-mute)] text-sm">
            No audit logs match your search.
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-[var(--ink-mute)] font-mono">
        {filtered.length} log entry{filtered.length !== 1 ? "s" : ""} displayed.
      </p>
    </div>
  );
}
