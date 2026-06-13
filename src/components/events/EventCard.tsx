import Link from "next/link";
import Image from "next/image";
import type { Event } from "@/lib/types";
import TiltCard from "@/components/motion/TiltCard";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  POSTER_GRADIENTS,
  formatPrice,
  formatDate,
  formatTime,
  seatsLeft,
} from "@/lib/mock-data";

interface Props {
  event: Event;
  index?: number;
}

const POSTER_ICONS: Record<string, string> = {
  sound_bath: "⌬",
  supper: "✦",
  run: "↟",
  book_circle: "◍",
  cycling: "⟳",
  other: "◐",
};

export default function EventCard({ event, index = 0 }: Props) {
  const left = seatsLeft(event);
  const almostFull = left <= 5 && left > 0;
  const soldOut = event.status === "sold_out" || left === 0;
  const catColor = CATEGORY_COLORS[event.category] || "#8A9384";

  return (
    <Link
      href={`/events/${event.slug}`}
      data-cursor="View"
      className="group block rounded-3xl overflow-hidden surface transition-all duration-500 hover:-translate-y-1.5 hover:border-[var(--green)]/40"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <TiltCard max={6}>
        {/* Poster */}
        <div className="aspect-[4/5] relative overflow-hidden">
          {event.cover_image_url ? (
            <Image
              src={event.cover_image_url}
              alt={event.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 33vw"
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center font-display text-[88px] text-[var(--cream)]/90 transition-transform duration-700 group-hover:scale-105"
              style={{ background: POSTER_GRADIENTS[event.category] }}
            >
              {POSTER_ICONS[event.category] || "◈"}
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--green-ink)]/55 pointer-events-none" />

          {/* Category badge */}
          <span
            className="absolute top-3.5 left-3.5 z-10 text-[10px] font-medium tracking-widest uppercase px-3 py-1.5 rounded-full backdrop-blur-md border"
            style={{
              background: `${catColor}26`,
              color: "#14331F",
              borderColor: `${catColor}66`,
            }}
          >
            {CATEGORY_LABELS[event.category] || "Event"}
          </span>

          {/* Status badge */}
          {soldOut && (
            <span className="absolute top-3.5 right-3.5 z-10 text-[10px] font-medium tracking-widest uppercase px-3 py-1.5 rounded-full backdrop-blur-md border border-[var(--surface-border)] text-[var(--green-ink)]" style={{ background: "var(--cream-deep)" }}>
              Sold out
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[var(--green)] mb-2">
            <span>{formatDate(event.start_at)}</span>
            <span className="opacity-40">·</span>
            <span>{formatTime(event.start_at)}</span>
          </div>

          <h3 className="font-display font-medium text-2xl leading-tight tracking-tight text-[var(--green-ink)]">
            {event.title}
          </h3>

          <p className="mt-1.5 text-[13px] text-[var(--ink-dim)] flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            {event.venue_name}
          </p>

          <div className="mt-4 pt-4 border-t border-[var(--surface-border)] flex justify-between items-center">
            <span className="font-display text-xl text-[var(--green-ink)]">
              {formatPrice(event.price_paise)}
              {event.price_paise > 0 && (
                <small className="text-xs text-[var(--ink-mute)] font-sans ml-1">/seat</small>
              )}
            </span>

            {!soldOut && (
              <span
                className={`text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
                  almostFull ? "text-[var(--lime-deep)]" : "text-[var(--ink-dim)]"
                }`}
              >
                {almostFull && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: "var(--lime-deep)",
                      boxShadow: "0 0 6px var(--lime)",
                    }}
                  />
                )}
                {almostFull
                  ? `${left} left`
                  : `${left} seats`}
              </span>
            )}
          </div>
        </div>
      </TiltCard>
    </Link>
  );
}
