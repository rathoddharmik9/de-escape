import Link from "next/link";

type BrandIconProps = {
  size?: number;
};

function InstagramIcon({ size = 18 }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ size = 18 }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14.2 8.1V6.6c0-.7.5-1.1 1.2-1.1h1.7V2.4c-1-.1-1.9-.2-2.7-.2-2.7 0-4.5 1.6-4.5 4.5v1.4H7v3.5h2.9v9.9h3.7v-9.9h2.9l.5-3.5h-3Z" />
    </svg>
  );
}

function WhatsAppIcon({ size = 18 }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.4a9.3 9.3 0 0 0-8 14l-1 5.2 5.3-1.3A9.3 9.3 0 1 0 12 2.4Zm0 16.8c-1.3 0-2.6-.3-3.8-1l-.3-.2-3.1.8.6-3.1-.2-.3a7.5 7.5 0 1 1 6.8 3.8Zm4.2-5.6c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1-.2.3-.7.8-.8 1-.2.2-.3.2-.6.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.3 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.7-1.6c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1 0 1.3.9 2.5 1.1 2.7.1.2 1.8 2.8 4.4 3.9.6.3 1.1.4 1.5.5.6.2 1.2.1 1.6.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1.1.1-1.2 0-.1-.2-.2-.4-.3Z" />
    </svg>
  );
}

export default function Footer({ settings = {} }: { settings?: Record<string, string> }) {
  const socials = [
    { label: "Instagram", href: settings.instagram_url || "https://instagram.com/de_escape", icon: InstagramIcon },
    { label: "Facebook", href: settings.facebook_url || "https://facebook.com/deescape", icon: FacebookIcon },
    { label: "WhatsApp", href: settings.footer_whatsapp_url || settings.community_whatsapp_link || "/contact", icon: WhatsAppIcon },
  ].filter((item) => item.href);

  const links = [
    { label: "Privacy", href: settings.privacy_url || "/privacy" },
    { label: "Terms", href: settings.terms_url || "/terms" },
    // { label: "Refund Policy", href: settings.refund_policy_url || "/refund-policy" },
    { label: "Contact", href: settings.contact_url || "/contact" },
  ];

  return (
    <footer className="relative z-10 border-t border-[var(--surface-border)] px-6 py-12 pb-16">
      <div className="max-w-[1180px] mx-auto flex flex-wrap justify-between items-start gap-8">
        <div>
          <Link href="/" className="h-8 block overflow-visible" aria-label="De-escape Logo">
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
          <p className="mt-2 text-xs text-[var(--ink-dim)]">
            © 2026 De-escape. Escape the ordinary.
          </p>
          <div className="mt-4 flex gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                aria-label={s.label}
                data-cursor="true"
                className="w-10 h-10 rounded-full border border-[var(--surface-border)] flex items-center justify-center text-[var(--ink-dim)] transition-colors duration-200 hover:text-[var(--green)] hover:bg-[var(--cream-deep)]"
                title={s.label}
              >
                <s.icon size={17} />
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
