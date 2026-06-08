"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", href: "/admin", icon: "◈" },
      { label: "Events", href: "/admin/events", icon: "◆" },
      { label: "Registrations", href: "/admin/registrations", icon: "◉" },
      { label: "Analytics", href: "/admin/analytics", icon: "◐" },
    ],
  },
  {
    label: "Comms",
    items: [
      { label: "Broadcasts", href: "/admin/broadcasts", icon: "◍" },
      { label: "Inbox", href: "/admin/inbox", icon: "▣" },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Templates", href: "/admin/templates", icon: "▤" },
      { label: "Block list", href: "/admin/block-list", icon: "⊗" },
      { label: "Audit log", href: "/admin/audit-log", icon: "≡" },
      { label: "Settings", href: "/admin/settings", icon: "⊞" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--cream)" }}>
      {/* Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-[var(--surface-border)]"
        style={{ background: "var(--cream-deep)" }}
      >
        {/* Brand */}
        <div className="px-6 py-6 border-b border-[var(--surface-border)]">
          <Link href="/" className="h-7 block overflow-visible" aria-label="De-escape Logo">
            <svg viewBox="0 0 170 50" className="h-full w-auto overflow-visible">
              <text
                x="0"
                y="38"
                style={{
                  fontFamily: "var(--font-logo), sans-serif",
                  fontSize: "36px",
                  fontWeight: 900,
                  fill: "var(--green)",
                  stroke: "var(--green)",
                  strokeWidth: "1.2px",
                  strokeLinejoin: "round",
                  letterSpacing: "0.2px",
                }}
              >
                De-escape
              </text>
            </svg>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto" aria-label="Admin navigation">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--ink-mute)]">
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-sans transition-all duration-150 ${
                        isActive
                          ? "text-[var(--green-ink)] font-medium"
                          : "text-[var(--ink-dim)] hover:text-[var(--green-deep)] hover:bg-[var(--cream-soft)]"
                      }`}
                      style={isActive ? { background: "rgba(44, 138, 75, 0.08)" } : {}}
                    >
                      <span className="text-sm opacity-60">{item.icon}</span>
                      {item.label}
                      {item.label === "Registrations" && (
                        <span
                          className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(199,126,26,0.12)", color: "var(--warn)" }}
                        >
                          12
                        </span>
                      )}
                      {item.label === "Inbox" && (
                        <span
                          className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(179,58,42,0.10)", color: "var(--danger)" }}
                        >
                          3
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--surface-border)]">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[var(--cream)]"
              style={{ background: "var(--green-ink)" }}
            >
              D
            </div>
            <div>
              <div className="text-xs font-medium text-[var(--green-ink)]">Dharmik</div>
              <div className="text-[10px] text-[var(--ink-mute)]">Super admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="h-14 flex items-center justify-between px-6 border-b border-[var(--surface-border)] flex-shrink-0"
          style={{ background: "var(--cream-soft)" }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button className="lg:hidden text-[var(--ink-dim)] hover:text-[var(--green-ink)]" aria-label="Menu">
              ≡
            </button>
            <nav aria-label="Breadcrumb" className="text-xs text-[var(--ink-mute)] font-sans">
              {pathname.split("/").filter(Boolean).map((segment, i, arr) => (
                <span key={segment}>
                  {i > 0 && <span className="mx-1.5">/</span>}
                  <span className={i === arr.length - 1 ? "text-[var(--green-ink)]" : ""}>
                    {segment.charAt(0).toUpperCase() + segment.slice(1)}
                  </span>
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/events"
              target="_blank"
              className="text-xs text-[var(--ink-dim)] px-3 py-1.5 rounded-full surface hover:text-[var(--green-ink)] transition-all"
            >
              View site ↗
            </Link>
            <Link
              href="/admin/events/new"
              className="text-xs text-[var(--cream)] px-3 py-1.5 rounded-full font-medium transition-all hover:-translate-y-0.5"
              style={{ background: "var(--green-ink)" }}
            >
              + New event
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
