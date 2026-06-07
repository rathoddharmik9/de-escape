import Link from "next/link";
import PublicShell from "@/components/layout/PublicShell";
import EventCard from "@/components/events/EventCard";
import MarqueeTrack from "@/components/layout/MarqueeTrack";
import HomeScenes from "@/components/motion/HomeScenes";
import Reveal from "@/components/motion/Reveal";
import MagneticButton from "@/components/motion/MagneticButton";
import TiltCard from "@/components/motion/TiltCard";
import { formatTime, seatsLeft } from "@/lib/mock-data";
import { getPublishedEvents, getFeaturedEvent } from "@/lib/data/events";

const limeGradientText = {
  background: "linear-gradient(90deg,#2C8A4B 0%,#A9CE1E 60%,#C8F135 100%)",
  WebkitBackgroundClip: "text" as const,
  WebkitTextFillColor: "transparent" as const,
  backgroundClip: "text" as const,
};

export default async function HomePage() {
  const upcoming = await getPublishedEvents();
  const featuredEvent = await getFeaturedEvent();
  if (!featuredEvent) return null;

  return (
    <PublicShell initialScene="dawn">
      <HomeScenes />

      {/* ── HERO ── */}
      <section className="min-h-screen px-6 pt-40 pb-20 flex items-center justify-center">
        <div className="max-w-[1180px] w-full mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-center">

          {/* Left copy */}
          <div>
            <div
              id="hero-eyebrow"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 surface rounded-full text-xs text-[var(--ink-dim)] tracking-wider mb-7 opacity-0"
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--green)", boxShadow: "0 0 10px var(--lime)" }}
              />
              Slow events, in your city, this week
            </div>

            <h1
              id="hero-headline"
              className="font-display font-semibold leading-[0.95] tracking-[-0.02em] text-[var(--green-ink)] max-w-[14ch]"
              style={{ fontSize: "clamp(44px,6.5vw,84px)" }}
            >
              {["Escape", "the"].map((word) => (
                <span key={word} className="inline-block overflow-hidden align-bottom px-[0.04em]">
                  <span className="inline-block hero-word" style={{ transform: "translateY(110%)" }}>
                    {word}
                  </span>
                </span>
              ))}{" "}
              <span className="inline-block overflow-hidden align-bottom px-[0.04em]">
                <span className="inline-block hero-word" style={{ transform: "translateY(110%)", ...limeGradientText }}>
                  ordinary.
                </span>
              </span>
              <br />
              {["Experience", "the"].map((word) => (
                <span key={word} className="inline-block overflow-hidden align-bottom px-[0.04em]">
                  <span className="inline-block hero-word" style={{ transform: "translateY(110%)" }}>
                    {word}
                  </span>
                </span>
              ))}{" "}
              <br />
              <span className="inline-block overflow-hidden align-bottom px-[0.04em]">
                <span className="inline-block hero-word" style={{ transform: "translateY(110%)", ...limeGradientText }}>
                  world
                </span>
              </span>{" "}
              <span className="inline-block overflow-hidden align-bottom px-[0.04em]">
                <span className="inline-block hero-word" style={{ transform: "translateY(110%)" }}>
                  differently.
                </span>
              </span>
            </h1>

            <p
              id="hero-subline"
              className="mt-7 text-lg leading-relaxed text-[var(--ink-dim)] max-w-[52ch] opacity-0"
              style={{ transform: "translateY(20px)" }}
            >
              Curated in-real-life events — sound baths, suppers, run clubs, book circles.
              Find something that makes you leave the house.
            </p>

            <div
              id="hero-cta"
              className="mt-9 flex flex-wrap gap-3 opacity-0"
              style={{ transform: "translateY(20px)" }}
            >
              <MagneticButton className="inline-block">
                <Link
                  href="/events"
                  data-cursor="Explore"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-medium transition-all duration-300 hover:bg-[var(--green-deep)]"
                  style={{ background: "var(--green)", color: "var(--cream)" }}
                >
                  Find your escape
                </Link>
              </MagneticButton>
              <MagneticButton className="inline-block">
                <Link
                  href="/about"
                  data-cursor="true"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-medium surface hover:bg-[var(--cream-deep)] transition-all duration-300 text-[var(--green-ink)]"
                >
                  Our story
                </Link>
              </MagneticButton>
            </div>
          </div>

          {/* Side featured-event card */}
          <TiltCard max={7}>
            <aside
              id="hero-card"
              className="surface rounded-3xl p-6 opacity-0"
              style={{ transform: "translateY(40px)" }}
              aria-label="Featured event"
            >
              <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--ink-mute)] mb-4">
                Next near you
              </div>

              <div className="flex gap-4 pb-5 border-b border-[var(--surface-border)]">
                <div className="w-16 h-16 rounded-2xl flex-shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredEvent.cover_image_url}
                    alt={featuredEvent.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-display text-[19px] leading-tight tracking-tight text-[var(--green-ink)]">
                    {featuredEvent.title}
                  </div>
                  <div className="text-xs text-[var(--ink-dim)] mt-1">
                    {featuredEvent.venue_name} · {formatTime(featuredEvent.start_at)}
                  </div>
                  <span
                    className="inline-block mt-2 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full text-[var(--green-ink)]"
                    style={{ background: "rgba(200,241,53,0.35)", border: "1px solid var(--lime-deep)" }}
                  >
                    Tonight
                  </span>
                </div>
              </div>

              <div
                id="hero-countdown"
                className="mt-5 grid grid-cols-4 gap-2 text-center"
                data-target={featuredEvent.start_at}
              >
                {["Days", "Hrs", "Min", "Sec"].map((unit, idx) => (
                  <div key={unit} className="rounded-xl py-2.5 px-2" style={{ background: "var(--cream-deep)" }}>
                    <div className="font-display text-xl text-[var(--green-ink)] countdown-num" data-cd-idx={idx}>--</div>
                    <div className="text-[10px] uppercase tracking-widest text-[var(--ink-mute)] mt-1">
                      {unit}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-between items-center pt-4 border-t border-[var(--surface-border)] text-xs text-[var(--ink-dim)]">
                <span>Hosted by <strong className="text-[var(--green-ink)] font-medium">De-escape</strong></span>
                <span>
                  <strong className="text-[var(--green-ink)] font-medium">{seatsLeft(featuredEvent)}</strong> seats left
                </span>
              </div>

              <Link
                href={`/events/${featuredEvent.slug}`}
                data-cursor="Reserve"
                className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: "var(--green)", color: "var(--cream)" }}
              >
                Reserve seat →
              </Link>
            </aside>
          </TiltCard>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <MarqueeTrack />

      {/* ── WHAT'S ON ── */}
      <section className="px-6 py-36" id="discover">
        <div className="max-w-[1180px] mx-auto">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-8 mb-14">
              <div>
                <span className="block text-xs uppercase tracking-[0.18em] text-[var(--green)] mb-4">
                  — Discover
                </span>
                <h2
                  className="font-display font-medium leading-none tracking-tight text-[var(--green-ink)]"
                  style={{ fontSize: "clamp(40px,5.5vw,68px)", letterSpacing: "-0.02em" }}
                >
                  Events that feel like
                  <br />
                  <span style={limeGradientText}>a breath, not a feed.</span>
                </h2>
              </div>
              <p className="text-[15px] text-[var(--ink-dim)] max-w-[36ch] leading-relaxed">
                Hand-picked experiences. Filter by mood, neighbourhood, or &ldquo;what&apos;s on tonight.&rdquo;
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcoming.slice(0, 6).map((event, i) => (
              <Reveal key={event.id} delay={i * 0.05}>
                <EventCard event={event} index={i} />
              </Reveal>
            ))}
          </div>

          <div className="mt-12 text-center">
            <MagneticButton className="inline-block">
              <Link
                href="/events"
                data-cursor="true"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium surface hover:bg-[var(--cream-deep)] transition-all duration-300 text-[var(--green-ink)]"
              >
                See all events →
              </Link>
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section className="px-6 py-20 border-y border-[var(--surface-border)]" style={{ background: "var(--cream-soft)" }}>
        <div className="max-w-[1180px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { n: "50+", em: "", label: "Events hosted" },
            { n: "4", em: ".9", label: "Average rating" },
            { n: "1,200", em: "+", label: "Happy explorers" },
            { n: "6", em: "", label: "Cities & growing" },
          ].map((s) => (
            <Reveal key={s.label}>
              <div
                className="font-display leading-none tracking-tight flex items-baseline gap-1"
                style={{ fontSize: "clamp(40px,5vw,72px)", letterSpacing: "-0.02em" }}
              >
                <span className="text-[var(--green-ink)]">{s.n}</span>
                {s.em && <span style={limeGradientText}>{s.em}</span>}
              </div>
              <div className="mt-2 text-xs uppercase tracking-widest text-[var(--ink-mute)]">
                {s.label}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── BRAND STORY TEASER ── */}
      <section className="px-6 py-36">
        <div className="max-w-[1180px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <div>
              <span className="block text-xs uppercase tracking-[0.18em] text-[var(--green)] mb-6">
                — Why De-escape exists
              </span>
              <h2
                className="font-display font-medium leading-tight tracking-tight text-[var(--green-ink)] max-w-[20ch]"
                style={{ fontSize: "clamp(36px,4.5vw,56px)", letterSpacing: "-0.02em" }}
              >
                We made it too easy to stay home.
                <span style={limeGradientText}> De-escape fixes that.</span>
              </h2>
              <p className="mt-6 text-[15px] text-[var(--ink-dim)] leading-relaxed max-w-[48ch]">
                Real events, real people, real places. No algorithms deciding what you should care about.
                Just a founder who believes the best moments happen when you leave the house.
              </p>
              <Link
                href="/about"
                data-cursor="true"
                className="mt-8 inline-flex items-center gap-2 text-sm text-[var(--green)] underline decoration-[var(--surface-border)] underline-offset-4 hover:decoration-[var(--green)] transition-colors duration-200"
              >
                Read the story →
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Sound Baths", color: "#3FA76A", emoji: "⌬" },
              { label: "Supper Clubs", color: "#A9CE1E", emoji: "✦" },
              { label: "Run Clubs", color: "#2C8A4B", emoji: "↟" },
              { label: "Book Circles", color: "#1F6336", emoji: "◍" },
              { label: "Cycling Hunts", color: "#A9CE1E", emoji: "⟳" },
              { label: "Open Mics", color: "#2C8A4B", emoji: "◐" },
            ].map((cat, i) => (
              <Reveal key={cat.label} delay={i * 0.05}>
                <div className="p-5 rounded-2xl surface hover:border-[var(--green)]/30 transition-all duration-300 hover:-translate-y-1">
                  <span className="text-2xl">{cat.emoji}</span>
                  <div className="mt-2 text-sm font-medium" style={{ color: cat.color }}>
                    {cat.label}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section className="px-6 pb-40">
        <Reveal>
          <div
            className="max-w-[1100px] mx-auto rounded-[2.5rem] p-16 text-center relative overflow-hidden surface"
          >
            <div
              className="absolute inset-[-2px] rounded-[2.5rem] -z-10"
              style={{
                background: "conic-gradient(from 0deg,#2C8A4B,#A9CE1E,#C8F135,#2C8A4B)",
                opacity: 0.25,
                animation: "spin 12s linear infinite",
              }}
              aria-hidden="true"
            />

            <h3
              className="font-display font-medium leading-tight tracking-tight text-[var(--green-ink)] max-w-[18ch] mx-auto"
              style={{ fontSize: "clamp(36px,5.5vw,68px)", letterSpacing: "-0.02em" }}
            >
              Your next story starts{" "}
              <span style={limeGradientText}>outside.</span>
            </h3>

            <p className="mt-5 text-base text-[var(--ink-dim)] max-w-[48ch] mx-auto leading-relaxed">
              Browse curated events near you. No app required — just show up.
            </p>

            <div className="mt-10 flex flex-wrap gap-3 justify-center">
              <MagneticButton className="inline-block">
                <Link
                  href="/events"
                  data-cursor="Explore"
                  className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full text-sm font-medium transition-all duration-300 hover:bg-[var(--green-deep)]"
                  style={{ background: "var(--green)", color: "var(--cream)" }}
                >
                  Browse all events
                </Link>
              </MagneticButton>
              <MagneticButton className="inline-block">
                <Link
                  href="/find-pass"
                  data-cursor="true"
                  className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full text-sm font-medium surface hover:bg-[var(--cream-deep)] transition-all duration-300 text-[var(--green-ink)]"
                >
                  Find my pass
                </Link>
              </MagneticButton>
            </div>
          </div>
        </Reveal>
      </section>
    </PublicShell>
  );
}
