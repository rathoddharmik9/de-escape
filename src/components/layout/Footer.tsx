import Link from "next/link";

const socials = [
  { label: "Instagram", href: "#", icon: "IG" },
  { label: "WhatsApp", href: "#", icon: "WA" },
];

const links = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-[var(--surface-border)] px-6 py-12 pb-16">
      <div className="max-w-[1180px] mx-auto flex flex-wrap justify-between items-start gap-8">
        <div>
          <Link href="/" className="font-display font-semibold text-2xl tracking-tight text-[var(--green)]">
            de—escape<span className="text-[var(--lime-deep)]">.</span>
          </Link>
          <p className="mt-2 text-xs text-[var(--ink-dim)]">
            © 2026 De-escape. Escape the ordinary.
          </p>
          <div className="mt-4 flex gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                data-cursor="true"
                className="w-9 h-9 rounded-full border border-[var(--surface-border)] flex items-center justify-center text-[10px] font-medium text-[var(--ink-dim)] transition-colors duration-200 hover:text-[var(--green)] hover:bg-[var(--cream-deep)]"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        <nav aria-label="Footer links">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-sm text-[var(--ink-dim)] hover:text-[var(--green)] transition-colors duration-200"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
