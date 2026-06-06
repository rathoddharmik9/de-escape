import Link from "next/link";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import AmbientMesh from "@/components/layout/AmbientMesh";
import EventCard from "@/components/events/EventCard";
import HeroAnimator from "@/components/layout/HeroAnimator";
import MarqueeTrack from "@/components/layout/MarqueeTrack";
import { formatTime, seatsLeft } from "@/lib/mock-data";
import { getPublishedEvents, getFeaturedEvent } from "@/lib/data/events";

export default async function HomePage() {
  const upcoming = await getPublishedEvents();
  const featuredEvent = await getFeaturedEvent();
  if (!featuredEvent) return null;

  return (
    <>
      <AmbientMesh />
      <Nav />
      <main className="relative z-10">

        {/* ── HERO ── */}
        <section className="min-h-screen px-6 pt-40 pb-20 flex items-center justify-center">
          <HeroAnimator>
            <div className="max-w-[1180px] w-full mx-auto grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-center">

              {/* Left copy */}
              <div>
                <div
                  id="hero-eyebrow"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 glass rounded-full text-xs text-[var(--ink-2)] tracking-wider mb-7 opacity-0"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "var(--coral)", boxShadow: "0 0 10px var(--coral)" }}
                  />
                  Slow events, in your city, this week
                </div>

                <h1
                  id="hero-headline"
                  className="font-serif leading-[0.95] tracking-[-0.035em] text-[var(--ink)] max-w-[14ch]"
                  style={{ fontSize: "clamp(56px,9vw,120px)" }}
                >
                  {["Escape", "the"].map((word) => (
                    <span key={word} className="inline-block overflow-hidden align-bottom px-[0.04em]">
                      <span
                        className="inline-block hero-word"
                        style={{ transform: "translateY(110%)" }}
                      >
                        {word}
                      </span>
                    </span>
                  ))}{" "}
                  <span className="inline-block overflow-hidden align-bottom px-[0.04em]">
                    <span
                      className="inline-block hero-word italic"
                      style={{
                        transform: "translateY(110%)",
                        background: "linear-gradient(90deg,#ff7a5c 0%,#ff8fb2 45%,#8a7fe6 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      ordinary.
                    </span>
                  </span>
                  <br />
                  {["Experience", "the"].map((word) => (
                    <span key={word} className="inline-block overflow-hidden align-bottom px-[0.04em]">
                      <span
                        className="inline-block hero-word"
                        style={{ transform: "translateY(110%)" }}
                      >
                        {word}
                      </span>
                    </span>
                  ))}{" "}
                  <br />
                  <span className="inline-block overflow-hidden align-bottom px-[0.04em]">
                    <span
                      className="inline-block hero-word italic"
                      style={{
                        transform: "translateY(110%)",
                        background: "linear-gradient(90deg,#8a7fe6,#5dcaa5)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      world
                    </span>
                  </span>{" "}
                  <span className="inline-block overflow-hidden align-bottom px-[0.04em]">
                    <span
                      className="inline-block hero-word"
                      style={{ transform: "translateY(110%)" }}
                    >
                      differently.
                    </span>
                  </span>
                </h1>

                <p
                  id="hero-subline"
                  className="mt-7 text-lg leading-relaxed text-[var(--ink-2)] max-w-[52ch] opacity-0"
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
                  <Link
                    href="/events"
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--peach)]"
                    style={{ background: "var(--ink)", color: "#1a0e08" }}
                  >
                    Find your escape
                  </Link>
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-medium glass hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5 text-[var(--ink)]"
                  >
                    Our story
                  </Link>
                </div>
              </div>

              {/* Side featured-event card */}
              <aside
                id="hero-card"
                className="glass rounded-3xl p-6 opacity-0"
                style={{ transform: "translateY(40px)" }}
                aria-label="Featured event"
              >
                <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--ink-3)] mb-4">
                  Next near you
                </div>

                <div className="flex gap-4 pb-5 border-b border-[var(--glass-border)]">
                  <div className="w-16 h-16 rounded-2xl flex-shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featuredEvent.cover_image_url}
                      alt={featuredEvent.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-serif text-[19px] leading-tight tracking-tight text-[var(--ink)]">
                      {featuredEvent.title}
                    </div>
                    <div className="text-xs text-[var(--ink-2)] mt-1">
                      {featuredEvent.venue_name} · {formatTime(featuredEvent.start_at)}
                    </div>
                    <span
                      className="inline-block mt-2 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full text-[#cdc3ff]"
                      style={{ background: "rgba(138,127,230,0.18)", border: "1px solid rgba(138,127,230,0.3)" }}
                    >
                      Tonight
                    </span>
                  </div>
                </div>

                {/* Countdown placeholder — hydrated client-side by HeroAnimator */}
                <div
                  id="hero-countdown"
                  className="mt-5 grid grid-cols-4 gap-2 text-center"
                  data-target={featuredEvent.start_at}
                >
                  {["Days", "Hrs", "Min", "Sec"].map((unit, idx) => (
                    <div
                      key={unit}
                      className="rounded-xl py-2.5 px-2"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      <div className="font-serif text-xl text-[var(--ink)] countdown-num" data-cd-idx={idx}>--</div>
                      <div className="text-[10px] uppercase tracking-widest text-[var(--ink-3)] mt-1">
                        {unit}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex justify-between items-center pt-4 border-t border-[var(--glass-border)] text-xs text-[var(--ink-2)]">
                  <span>Hosted by <strong className="text-[var(--ink)] font-medium">De-escape</strong></span>
                  <span>
                    <strong className="text-[var(--ink)] font-medium">{seatsLeft(featuredEvent)}</strong> seats left
                  </span>
                </div>

                <Link
                  href={`/events/${featuredEvent.slug}`}
                  className="mt-5 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 text-white"
                  style={{ background: "var(--coral)" }}
                >
                  Reserve seat →
                </Link>
              </aside>
            </div>
          </HeroAnimator>
        </section>

        {/* ── MARQUEE ── */}
        <MarqueeTrack />

        {/* ── WHAT'S ON ── */}
        <section className="px-6 py-36" id="discover">
          <div className="max-w-[1180px] mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-8 mb-14">
              <div>
                <span className="block text-xs uppercase tracking-[0.18em] text-[var(--coral)] mb-4">
                  — Discover
                </span>
                <h2
                  className="font-serif font-normal leading-none tracking-tight text-[var(--ink)]"
                  style={{ fontSize: "clamp(40px,5.5vw,68px)", letterSpacing: "-0.03em" }}
                >
                  Events that feel like
                  <br />
                  <em className="italic text-[var(--peach)]">a breath, not a feed.</em>
                </h2>
              </div>
              <p className="text-[15px] text-[var(--ink-2)] max-w-[36ch] leading-relaxed">
                Hand-picked experiences. Filter by mood, neighbourhood, or &ldquo;what&apos;s on tonight.&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {upcoming.slice(0, 6).map((event, i) => (
                <EventCard key={event.id} event={event} index={i} />
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium glass hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5 text-[var(--ink)]"
              >
                See all events →
              </Link>
            </div>
          </div>
        </section>

        {/* ── STATS BAND ── */}
        <section
          className="px-6 py-20 border-y border-[var(--glass-border)]"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <div className="max-w-[1180px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: "50+", em: "", label: "Events hosted" },
              { n: "4", em: ".9", label: "Average rating" },
              { n: "1,200", em: "+", label: "Happy explorers" },
              { n: "6", em: "", label: "Cities & growing" },
            ].map((s) => (
              <div key={s.label}>
                <div
                  className="font-serif leading-none tracking-tight flex items-baseline gap-1"
                  style={{ fontSize: "clamp(40px,5vw,72px)", letterSpacing: "-0.03em" }}
                >
                  <span className="text-[var(--ink)]">{s.n}</span>
                  {s.em && <em className="italic text-[var(--peach)]">{s.em}</em>}
                </div>
                <div className="mt-2 text-xs uppercase tracking-widest text-[var(--ink-3)]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BRAND STORY TEASER ── */}
        <section className="px-6 py-36">
          <div className="max-w-[1180px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="block text-xs uppercase tracking-[0.18em] text-[var(--violet)] mb-6">
                — Why De-escape exists
              </span>
              <h2
                className="font-serif font-normal leading-tight tracking-tight text-[var(--ink)] max-w-[20ch]"
                style={{ fontSize: "clamp(36px,4.5vw,56px)", letterSpacing: "-0.025em" }}
              >
                We made it too easy to stay home.
                <em className="italic text-[var(--peach)]"> De-escape fixes that.</em>
              </h2>
              <p className="mt-6 text-[15px] text-[var(--ink-2)] leading-relaxed max-w-[48ch]">
                Real events, real people, real places. No algorithms deciding what you should care about.
                Just a founder who believes the best moments happen when you leave the house.
              </p>
              <Link
                href="/about"
                className="mt-8 inline-flex items-center gap-2 text-sm text-[var(--ink)] underline decoration-[var(--glass-border)] underline-offset-4 hover:decoration-[var(--coral)] transition-colors duration-200"
              >
                Read the story →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Sound Baths", color: "#8a7fe6", emoji: "⌬" },
                { label: "Supper Clubs", color: "#ff7a5c", emoji: "✦" },
                { label: "Run Clubs", color: "#5dcaa5", emoji: "↟" },
                { label: "Book Circles", color: "#f4c97a", emoji: "◍" },
                { label: "Cycling Hunts", color: "#ffb088", emoji: "⟳" },
                { label: "Open Mics", color: "#ff8fb2", emoji: "◐" },
              ].map((cat) => (
                <div
                  key={cat.label}
                  className="p-5 rounded-2xl glass hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <div className="mt-2 text-sm font-medium" style={{ color: cat.color }}>
                    {cat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CLOSING CTA ── */}
        <section className="px-6 pb-40">
          <div
            className="max-w-[1100px] mx-auto rounded-[2.5rem] p-16 text-center relative overflow-hidden glass-strong"
            style={{ border: "1px solid var(--glass-border)" }}
          >
            <div
              className="absolute inset-[-2px] rounded-[2.5rem] -z-10"
              style={{
                background: "conic-gradient(from 0deg,#ff7a5c,#ff8fb2,#8a7fe6,#f4c97a,#ff7a5c)",
                opacity: 0.2,
                animation: "spin 12s linear infinite",
              }}
              aria-hidden="true"
            />

            <h3
              className="font-serif font-normal leading-tight tracking-tight text-[var(--ink)] max-w-[18ch] mx-auto"
              style={{ fontSize: "clamp(36px,5.5vw,68px)", letterSpacing: "-0.03em" }}
            >
              Your next story starts{" "}
              <em
                className="italic"
                style={{
                  background: "linear-gradient(90deg,#ff7a5c,#ff8fb2,#8a7fe6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                outside.
              </em>
            </h3>

            <p className="mt-5 text-base text-[var(--ink-2)] max-w-[48ch] mx-auto leading-relaxed">
              Browse curated events near you. No app required — just show up.
            </p>

            <div className="mt-10 flex flex-wrap gap-3 justify-center">
              <Link
                href="/events"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full text-sm font-medium transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--peach)]"
                style={{ background: "var(--ink)", color: "#1a0e08" }}
              >
                Browse all events
              </Link>
              <Link
                href="/find-pass"
                className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full text-sm font-medium glass hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5 text-[var(--ink)]"
              >
                Find my pass
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
