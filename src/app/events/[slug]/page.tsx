import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import AmbientMesh from "@/components/layout/AmbientMesh";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  POSTER_GRADIENTS,
  formatPrice,
  formatDate,
  formatTime,
  seatsLeft,
} from "@/lib/mock-data";
import { getEventBySlug, getEventBySlugBuild, getPublishedEventSlugs } from "@/lib/data/events";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  const slugs = await getPublishedEventSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const event = await getEventBySlugBuild(params.slug);
  if (!event) return { title: "Event not found" };
  return {
    title: `${event.title} — De-escape`,
    description: event.tagline,
    openGraph: {
      title: event.title,
      description: event.tagline,
      images: event.cover_image_url ? [event.cover_image_url] : [],
    },
  };
}

const POSTER_ICONS: Record<string, string> = {
  sound_bath: "⌬",
  supper: "✦",
  run: "↟",
  book_circle: "◍",
  cycling: "⟳",
  other: "◐",
};

export default async function EventDetailPage({ params }: Props) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();

  const left = seatsLeft(event);
  const almostFull = left <= 5 && left > 0;
  const soldOut = event.status === "sold_out" || left === 0;
  const catColor = CATEGORY_COLORS[event.category] || "#b8b0c8";
  const isFree = event.price_paise === 0;

  return (
    <>
      <AmbientMesh />
      <Nav />
      <main className="relative z-10">

        {/* ── CINEMATIC COVER ── */}
        <div className="relative w-full" style={{ height: "65vh", minHeight: "420px" }}>
          {event.cover_image_url ? (
            <Image
              src={event.cover_image_url}
              alt={event.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: POSTER_GRADIENTS[event.category] }}
            >
              <div className="absolute inset-0 flex items-center justify-center font-serif text-[180px] text-white/20">
                {POSTER_ICONS[event.category]}
              </div>
            </div>
          )}

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-black/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg)]/60 to-transparent" />

          {/* Cover content */}
          <div className="absolute bottom-0 left-0 right-0 px-6 pb-10">
            <div className="max-w-[1180px] mx-auto">
              <span
                className="inline-block text-[10px] font-medium tracking-widest uppercase px-3 py-1.5 rounded-full mb-4"
                style={{
                  background: `${catColor}22`,
                  color: catColor,
                  border: `1px solid ${catColor}44`,
                }}
              >
                {CATEGORY_LABELS[event.category] || "Event"}
              </span>

              <h1
                className="font-serif font-normal leading-tight tracking-tight text-[var(--ink)]"
                style={{ fontSize: "clamp(40px,6vw,80px)", letterSpacing: "-0.03em", maxWidth: "20ch" }}
              >
                {event.title}
              </h1>

              {event.tagline && (
                <p className="mt-3 text-lg text-[var(--ink-2)] max-w-[60ch]">
                  {event.tagline}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="px-6 py-12">
          <div className="max-w-[1180px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">

            {/* Left: Details */}
            <article>
              {/* Event meta strip */}
              <div
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 rounded-2xl mb-10"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-border)" }}
              >
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-[var(--ink-3)] mb-1.5">Date</div>
                  <div className="text-sm font-medium text-[var(--ink)]">{formatDate(event.start_at)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-[var(--ink-3)] mb-1.5">Time</div>
                  <div className="text-sm font-medium text-[var(--ink)]">
                    {formatTime(event.start_at)} → {formatTime(event.end_at)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-[var(--ink-3)] mb-1.5">Venue</div>
                  <a
                    href={event.venue_map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[var(--ink)] hover:text-[var(--coral)] transition-colors underline underline-offset-2 decoration-[var(--glass-border)]"
                  >
                    {event.venue_name} ↗
                  </a>
                  <div className="text-xs text-[var(--ink-3)] mt-0.5">{event.venue_address}</div>
                </div>
              </div>

              {/* Description */}
              <div
                className="prose prose-lg max-w-none text-[var(--ink-2)] leading-relaxed"
                dangerouslySetInnerHTML={{ __html: event.description }}
                style={{
                  ["--tw-prose-body" as string]: "var(--ink-2)",
                  ["--tw-prose-headings" as string]: "var(--ink)",
                  ["--tw-prose-bold" as string]: "var(--ink)",
                }}
              />

              {/* Refund policy */}
              <div
                className="mt-10 p-5 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--glass-border)" }}
              >
                <h3 className="text-xs uppercase tracking-widest text-[var(--ink-3)] mb-2">
                  Refund policy
                </h3>
                <p className="text-sm text-[var(--ink-2)]">{event.refund_policy}</p>
              </div>

              {/* Share */}
              <div className="mt-8 flex items-center gap-4">
                <span className="text-xs uppercase tracking-widest text-[var(--ink-3)]">Share</span>
                {["WhatsApp", "Copy link"].map((s) => (
                  <button
                    key={s}
                    className="text-xs text-[var(--ink-2)] px-3 py-1.5 rounded-full glass hover:text-[var(--ink)] hover:bg-white/10 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </article>

            {/* Right: Sticky CTA */}
            <aside>
              <div className="sticky top-24">
                <div
                  className="p-6 rounded-3xl"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--glass-border)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {/* Pricing */}
                  <div className="flex items-baseline justify-between mb-6">
                    <div>
                      <div className="font-serif text-4xl text-[var(--ink)]">
                        {formatPrice(event.price_paise)}
                      </div>
                      {!isFree && (
                        <div className="text-xs text-[var(--ink-3)] mt-0.5">per seat</div>
                      )}
                    </div>

                    {almostFull && (
                      <span
                        className="text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full font-medium"
                        style={{ background: "rgba(244,201,122,0.15)", color: "var(--amber)", border: "1px solid rgba(244,201,122,0.3)" }}
                      >
                        ⚡ {left} left
                      </span>
                    )}
                  </div>

                  {/* Capacity bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-xs text-[var(--ink-3)] mb-2">
                      <span>{event.registered_count} registered</span>
                      <span>{event.capacity} capacity</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(event.registered_count / event.capacity) * 100}%`,
                          background: almostFull ? "var(--amber)" : catColor,
                        }}
                      />
                    </div>
                  </div>

                  {soldOut ? (
                    <div className="w-full py-4 rounded-2xl text-center text-sm font-medium text-[var(--ink-3)] bg-white/5 border border-[var(--glass-border)]">
                      Sold out
                    </div>
                  ) : (
                    <Link
                      href={`/events/${event.slug}/register`}
                      className="block w-full py-4 rounded-2xl text-center text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(255,122,92,0.4)]"
                      style={{ background: "var(--coral)" }}
                    >
                      Reserve your seat →
                    </Link>
                  )}

                  <div className="mt-4 text-xs text-center text-[var(--ink-3)]">
                    {isFree ? "Free entry. Just show up." : event.payment_mode === "manual_upi" ? "Pay via UPI · admin verifies" : "Secure payment · admin verifies"}
                  </div>
                </div>

                {/* Payment mode chip */}
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {[
                    isFree ? "🎉 Free event" : event.payment_mode === "razorpay" ? "💳 Razorpay" : "📱 UPI",
                    "✅ Admin approved",
                    "📲 WhatsApp pass",
                  ].map((chip) => (
                    <span
                      key={chip}
                      className="text-[11px] px-2.5 py-1 rounded-full glass text-[var(--ink-2)]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
