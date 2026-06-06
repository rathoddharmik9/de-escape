"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: "◈" },
  { label: "Events", href: "/admin/events", icon: "◆" },
  { label: "Registrations", href: "/admin/registrations", icon: "◉" },
  { label: "Analytics", href: "/admin/analytics", icon: "◐" },
  { label: "Broadcasts", href: "/admin/broadcasts", icon: "◍" },
  { label: "Inbox", href: "/admin/inbox", icon: "▣" },
  { label: "Block list", href: "/admin/block-list", icon: "⊗" },
  { label: "Audit log", href: "/admin/audit-log", icon: "≡" },
  { label: "Settings", href: "/admin/settings", icon: "⊞" },
  { label: "Templates", href: "/admin/templates", icon: "▤" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-[var(--glass-border)]"
        style={{ background: "var(--bg-2)" }}
      >
        {/* Brand */}
        <div className="px-6 py-6 border-b border-[var(--glass-border)]">
          <Link href="/" className="font-serif text-xl tracking-tight text-[var(--ink)]">
            de—escape<span className="text-[var(--coral)]">.</span>
          </Link>
          <div className="text-[10px] uppercase tracking-widest text-[var(--ink-3)] mt-1">
            Admin panel
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                  isActive
                    ? "text-[var(--ink)] font-medium"
                    : "text-[var(--ink-3)] hover:text-[var(--ink-2)] hover:bg-white/4"
                }`}
                style={isActive ? { background: "rgba(255,255,255,0.07)" } : {}}
              >
                <span className="text-base opacity-70">{item.icon}</span>
                {item.label}
                {item.label === "Registrations" && (
                  <span
                    className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: "rgba(255,122,92,0.2)", color: "var(--coral)" }}
                  >
                    3
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--glass-border)]">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#1a0e08]"
              style={{ background: "var(--coral)" }}
            >
              D
            </div>
            <div>
              <div className="text-xs font-medium text-[var(--ink)]">Dharmik</div>
              <div className="text-[10px] text-[var(--ink-3)]">Super admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="h-14 flex items-center justify-between px-6 border-b border-[var(--glass-border)] flex-shrink-0"
          style={{ background: "var(--bg-2)" }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button className="lg:hidden text-[var(--ink-2)] hover:text-[var(--ink)]" aria-label="Menu">
              ≡
            </button>
            <nav aria-label="Breadcrumb" className="text-xs text-[var(--ink-3)]">
              {pathname.split("/").filter(Boolean).map((segment, i, arr) => (
                <span key={segment}>
                  {i > 0 && <span className="mx-1.5">/</span>}
                  <span className={i === arr.length - 1 ? "text-[var(--ink)]" : ""}>
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
              className="text-xs text-[var(--ink-3)] px-3 py-1.5 rounded-full glass hover:text-[var(--ink)] transition-all"
            >
              View site ↗
            </Link>
            <Link
              href="/admin/events/new"
              className="text-xs text-[#1a0e08] px-3 py-1.5 rounded-full font-medium transition-all hover:-translate-y-0.5"
              style={{ background: "var(--ink)" }}
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
