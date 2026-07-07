"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
    label: "Admin",
    items: [
      { label: "Settings", href: "/admin/settings", icon: "⊞" },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Common Nav component to avoid repeating
  const RenderNavigation = (onClickLink?: () => void) => (
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
                  onClick={onClickLink}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-sans transition-all duration-150",
                    isActive
                      ? "text-[var(--green-ink)] font-medium"
                      : "text-[var(--ink-dim)] hover:text-[var(--green-deep)] hover:bg-[var(--cream-soft)]"
                  )}
                  style={
                    isActive
                      ? { background: "rgba(44, 138, 75, 0.08)" }
                      : {}
                  }>
                  <span className="text-sm opacity-60">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const RenderLogo = () => (
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
        }}>
        De-escape
      </text>
    </svg>
  );

  const RenderUserFooter = () => (
    <div className="px-6 py-4 border-t border-[var(--surface-border)]">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[var(--cream)]"
          style={{ background: "var(--green-ink)" }}>
          D
        </div>
        <div>
          <div className="text-xs font-medium text-[var(--green-ink)]">
            Dharmik
          </div>
          <div className="text-[10px] text-[var(--ink-mute)]">
            Super admin
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "var(--cream)" }}>
      {/* Desktop Sidebar (Left side, fixed/static on large screens) */}
      <aside
        className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r border-[var(--surface-border)]"
        style={{ background: "var(--cream-deep)" }}>
        {/* Brand */}
        <div className="px-6 py-[.85rem] border-b border-[var(--surface-border)]">
          <Link href="/" className="h-7 block overflow-visible" aria-label="De-escape Logo">
            {RenderLogo()}
          </Link>
        </div>

        {/* Nav */}
        {RenderNavigation()}

        {/* Footer */}
        {RenderUserFooter()}
      </aside>

      {/* Mobile Drawer Navigation Sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden flex transition-all duration-300",
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop Overlay */}
        <div
          className={cn(
            "fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300",
            sidebarOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Drawer Sidebar Content Panel */}
        <aside
          className={cn(
            "relative flex flex-col w-64 max-w-[80vw] h-full border-r border-[var(--surface-border)] shadow-2xl transition-transform duration-300 ease-out",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
          style={{ background: "var(--cream-deep)" }}
        >
          {/* Header / Brand + Close */}
          <div className="px-6 py-3 border-b border-[var(--surface-border)] flex items-center justify-between">
            <Link
              href="/"
              className="h-7 block overflow-visible"
              aria-label="De-escape Logo"
              onClick={() => setSidebarOpen(false)}
            >
              {RenderLogo()}
            </Link>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-[var(--cream-soft)] text-[var(--green-ink)] transition-colors"
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Navigation inside Drawer */}
          {RenderNavigation(() => setSidebarOpen(false))}

          {/* User Profile Footer */}
          {RenderUserFooter()}
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-[var(--surface-border)] flex-shrink-0"
          style={{ background: "var(--cream-soft)" }}>
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden min-w-0">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-[var(--ink-dim)] hover:text-[var(--green-ink)] p-1.5 rounded-lg hover:bg-[var(--cream-deep)] transition-colors shrink-0"
              aria-label="Menu"
            >
              <Menu className="size-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <nav
              aria-label="Breadcrumb"
              className="text-xs text-[var(--ink-mute)] font-sans flex items-center overflow-hidden whitespace-nowrap min-w-0 pr-2"
            >
              {pathname
                .split("/")
                .filter(Boolean)
                .map((segment, i, arr) => {
                  const isUuid = segment.length > 20;
                  const segmentText = isUuid
                    ? `${segment.slice(0, 8)}...`
                    : segment.charAt(0).toUpperCase() + segment.slice(1);

                  return (
                    <span key={segment} className="flex items-center overflow-hidden min-w-0">
                      {i > 0 && <span className="mx-1 sm:mx-1.5 text-[var(--ink-mute)] shrink-0">/</span>}
                      <span
                        className={cn(
                          "truncate align-bottom",
                          i === arr.length - 1 ? "text-[var(--green-ink)] font-semibold" : ""
                        )}
                        title={segment}
                      >
                        {segmentText}
                      </span>
                    </span>
                  );
                })}
            </nav>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              href="/events"
              target="_blank"
              className="text-xs text-[var(--ink-dim)] px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full surface hover:text-[var(--green-ink)] transition-all flex items-center"
            >
              <span className="hidden xs:inline">View site ↗</span>
              <span className="xs:hidden">Site ↗</span>
            </Link>
            <Link
              href="/admin/events/new"
              className="text-xs text-[var(--cream)] px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full font-medium transition-all hover:-translate-y-0.5 flex items-center"
              style={{ background: "var(--green-ink)" }}
            >
              <span className="hidden xs:inline">+ New event</span>
              <span className="xs:hidden">+ Event</span>
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
