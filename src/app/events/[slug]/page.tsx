import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PublicShell from "@/components/layout/PublicShell";
import CoverParallax from "@/components/events/CoverParallax";
import Reveal from "@/components/motion/Reveal";
import MagneticButton from "@/components/motion/MagneticButton";
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

export const revalidate = 60;

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
  const catColor = CATEGORY_COLORS[event.category] || "#8A9384";
  const isFree = event.price_paise === 0;

  return (
    <PublicShell initialScene="deep">
      {/* ── CINEMATIC COVER ── */}
      <div className="relative w-full overflow-hidden" style={{ height: "65vh", minHeight: "420px" }}>
        <CoverParallax>
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
            <div className="absolute inset-0" style={{ background: POSTER_GRADIENTS[event.category] }}>
              <div className="absolute inset-0 flex items-center justify-center font-display text-[180px] text-[var(--cream)]/25">
                {POSTER_ICONS[event.category]}
              </div>
            </div>
          )}
        </CoverParallax>

        {/* Gradient overlays — fade to cream (light theme) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--cream)] via-[var(--cream)]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--cream)]/40 to-transparent" />

        {/* Cover content */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10">
          <div className="max-w-[1180px] mx-auto">
            <span
              className="inline-block text-[10px] font-medium tracking-widest uppercase px-3 py-1.5 rounded-full mb-4"
              style={{ background: `${catColor}26`, color: "#14331F", border: `1px solid ${catColor}66` }}
            >
              {CATEGORY_LABELS[event.category] || "Event"}
            </span>

            <h1
              className="font-display font-semibold leading-tight tracking-tight text-[var(--green-ink)]"
              style={{ fontSize: "clamp(40px,6vw,80px)", letterSpacing: "-0.02em", maxWidth: "20ch" }}
            >
              {event.title}
            </h1>

            {event.tagline && (
              <p className="mt-3 text-lg text-[var(--green-deep)] max-w-[60ch]">{event.tagline}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="px-6 py-12">
        <div className="max-w-[1180px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">

          {/* Left: Details */}
          <article>
            <Reveal>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 rounded-2xl mb-10 surface">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-[var(--ink-mute)] mb-1.5">Date</div>
                  <div className="text-sm font-medium text-[var(--green-ink)]">{formatDate(event.start_at)}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-[var(--ink-mute)] mb-1.5">Time</div>
                  <div className="text-sm font-medium text-[var(--green-ink)]">
                    {formatTime(event.start_at)} → {formatTime(event.end_at)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-[var(--ink-mute)] mb-1.5">Venue</div>
                  <a
                    href={event.venue_map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="Map"
                    className="text-sm font-medium text-[var(--green)] hover:text-[var(--green-deep)] transition-colors underline underline-offset-2 decoration-[var(--surface-border)]"
                  >
                    {event.venue_name} ↗
                  </a>
                  <div className="text-xs text-[var(--ink-mute)] mt-0.5">{event.venue_address}</div>
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div
                className="prose prose-lg max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{ __html: event.description }}
                style={{
                  ["--tw-prose-body" as string]: "var(--ink-dim)",
                  ["--tw-prose-headings" as string]: "var(--green-ink)",
                  ["--tw-prose-bold" as string]: "var(--green-ink)",
                }}
              />
            </Reveal>

            <Reveal>
              <div className="mt-10 p-5 rounded-2xl surface-deep">
                <h3 className="text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2">Refund policy</h3>
                <p className="text-sm text-[var(--ink-dim)]">{event.refund_policy}</p>
              </div>
            </Reveal>

            <div className="mt-8 flex items-center gap-4">
              <span className="text-xs uppercase tracking-widest text-[var(--ink-mute)]">Share</span>
              {["WhatsApp", "Copy link"].map((s) => (
                <button
                  key={s}
                  data-cursor="true"
                  className="text-xs text-[var(--ink-dim)] px-3 py-1.5 rounded-full surface hover:text-[var(--green-ink)] hover:bg-[var(--cream-deep)] transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </article>

          {/* Right: Sticky CTA */}
          <aside>
            <div className="sticky top-24">
              <div className="p-6 rounded-3xl surface">
                <div className="flex items-baseline justify-between mb-6">
                  <div>
                    <div className="font-display text-4xl text-[var(--green-ink)]">{formatPrice(event.price_paise)}</div>
                    {!isFree && <div className="text-xs text-[var(--ink-mute)] mt-0.5">per seat</div>}
                  </div>

                  {almostFull && (
                    <span
                      className="text-[11px] uppercase tracking-wider px-3 py-1.5 rounded-full font-medium"
                      style={{ background: "rgba(200,241,53,0.25)", color: "var(--green-deep)", border: "1px solid var(--lime-deep)" }}
                    >
                      ⚡ {left} left
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-xs text-[var(--ink-mute)] mb-2">
                    <span>{event.registered_count} registered</span>
                    <span>{event.capacity} capacity</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--cream-deep)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(event.registered_count / event.capacity) * 100}%`,
                        background: almostFull ? "var(--lime-deep)" : "var(--green)",
                      }}
                    />
                  </div>
                </div>

                {soldOut ? (
                  <div className="w-full py-4 rounded-2xl text-center text-sm font-medium text-[var(--ink-mute)] surface-deep">
                    Sold out
                  </div>
                ) : (
                  <MagneticButton className="block">
                    <Link
                      href={`/events/${event.slug}/register`}
                      data-cursor="Reserve"
                      className="block w-full py-4 rounded-2xl text-center text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(44,138,75,0.35)]"
                      style={{ background: "var(--green)", color: "var(--cream)" }}
                    >
                      Reserve your seat →
                    </Link>
                  </MagneticButton>
                )}

                <div className="mt-4 text-xs text-center text-[var(--ink-mute)]">
                  {isFree
                    ? "Free entry. Just show up."
                    : event.payment_mode === "manual_upi"
                    ? "Pay via UPI · admin verifies"
                    : "Secure payment · admin verifies"}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {[
                  isFree ? "🎉 Free event" : event.payment_mode === "razorpay" ? "💳 Razorpay" : "📱 UPI",
                  "✅ Admin approved",
                  "📲 WhatsApp pass",
                ].map((chip) => (
                  <span key={chip} className="text-[11px] px-2.5 py-1 rounded-full surface text-[var(--ink-dim)]">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PublicShell>
  );
}
