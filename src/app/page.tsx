import Link from "next/link";
import PublicShell from "@/components/layout/PublicShell";
import EventCard from "@/components/events/EventCard";
import HomeScenes from "@/components/motion/HomeScenes";
import Reveal from "@/components/motion/Reveal";
import MagneticButton from "@/components/motion/MagneticButton";
import { formatDate, formatPrice, formatTime, seatsLeft } from "@/lib/mock-data";
import { getHomeEvents, getPastEvents, getPublishedEvents } from "@/lib/data/events";
import { getPublicAppSettings } from "@/lib/actions/admin-settings";

export const revalidate = 60;

const limeGradientText = {
  background: "linear-gradient(90deg,#2C8A4B 0%,#A9CE1E 60%,#C8F135 100%)",
  WebkitBackgroundClip: "text" as const,
  WebkitTextFillColor: "transparent" as const,
  backgroundClip: "text" as const,
};

export default async function HomePage() {
  const [homeEvents, upcomingEvents, pastEvents, settings] = await Promise.all([
    getHomeEvents(),
    getPublishedEvents(),
    getPastEvents(6),
    getPublicAppSettings(),
  ]);
  const heroEvents = homeEvents.length > 0 ? homeEvents : upcomingEvents.slice(0, 4);
  const communityLink = settings.community_whatsapp_link || settings.whatsapp_group_invite_link || "/contact";

  return (
    <PublicShell initialScene="dawn">
      <HomeScenes />

      <section className="px-6 pt-28 pb-16 sm:pt-36 sm:pb-20 lg:min-h-[92dvh] flex items-center">
        <div className="max-w-[1180px] w-full mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-12 items-center">
          <div>
            

            <h1
              id="hero-headline"
              className="font-display font-semibold leading-[0.98] sm:leading-[0.95] text-[var(--green-ink)] max-w-[13ch]"
              style={{ fontSize: "clamp(46px,7vw,92px)", letterSpacing: "-0.02em" }}
            >
              {["Escape", "the"].map((word) => (
                <span key={word} className="inline-block overflow-hidden align-bottom px-[0.04em] mr-[0.18em]">
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
            </h1>
            <p
              id="hero-subline"
              className="mt-7 text-lg leading-relaxed text-[var(--ink-dim)] max-w-[52ch] opacity-0"
              style={{ transform: "translateY(20px)" }}
            >
              Curated meetups, slow gatherings, small adventures, and real rooms full of real people.
              Register for an event or join the community list for the next one.
            </p>

            <div
              id="hero-cta"
              className="mt-9 flex flex-wrap gap-3 opacity-0"
              style={{ transform: "translateY(20px)" }}
            >
              <MagneticButton className="inline-block">
                <Link
                  href="/about"
                  data-cursor="true"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-medium surface hover:bg-[var(--cream-deep)] transition-all duration-300 text-[var(--green-ink)]"
                >
                  Our story
                </Link>
              </MagneticButton>
              <MagneticButton className="inline-block">
                <a
                  href={communityLink}
                  target={communityLink.startsWith("http") ? "_blank" : undefined}
                  rel={communityLink.startsWith("http") ? "noopener noreferrer" : undefined}
                  data-cursor="Join"
                  className="relative inline-flex rounded-full p-[1px] overflow-hidden"
                >
                  <span
                    className="absolute inset-[-50%] animate-[spin_4s_linear_infinite]"
                    style={{ background: "conic-gradient(from 0deg,#2C8A4B,#C8F135,#A9CE1E,#2C8A4B)" }}
                    aria-hidden="true"
                  />
                  <span className="relative inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full text-sm font-medium text-[var(--green-ink)]" style={{ background: "var(--cream)" }}>
                    Join the community
                  </span>
                </a>
              </MagneticButton>
            </div>
          </div>

          <aside id="hero-card" className="surface rounded-[2rem] p-5 opacity-0" style={{ transform: "translateY(40px)" }} aria-label="Upcoming events">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--ink-mute)]">Register now</div>
              <Link href="/events" className="text-xs text-[var(--green)] hover:underline">All events</Link>
            </div>

            {heroEvents.length > 0 ? (
              <div className="space-y-3">
                {heroEvents.map((event) => {
                  const left = seatsLeft(event);
                  const pct = event.capacity > 0 ? Math.min(100, Math.round((event.registered_count / event.capacity) * 100)) : 0;
                  return (
                  <article
                    key={event.id}
                    className="group p-3 rounded-2xl hover:bg-[var(--cream-deep)] transition-colors"
                  >
                    <div className="grid grid-cols-[82px_1fr] gap-4">
                    <Link href={`/events/${event.slug}`} className="w-[82px] h-[82px] rounded-2xl overflow-hidden bg-[var(--cream-deep)]">
                      {event.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
                      ) : null}
                    </Link>
                    <div className="min-w-0">
                      <Link href={`/events/${event.slug}`} className="font-display block text-lg leading-tight text-[var(--green-ink)] group-hover:text-[var(--green)] transition-colors">
                        {event.title}
                      </Link>
                      <div className="text-xs text-[var(--ink-dim)] mt-1 leading-relaxed">
                        {formatDate(event.start_at)} · {formatTime(event.start_at)}
                        <br />
                        {event.venue_name}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider text-[var(--ink-mute)]">
                        <span>{formatPrice(event.price_paise)}</span>
                        <span>{left} seats left</span>
                      </div>
                    </div>
                    </div>
                    <div className="mt-3 grid grid-cols-[1fr_auto] gap-3 items-center">
                      <div>
                        <div className="h-1.5 rounded-full bg-[var(--cream-deep)] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: left <= 5 ? "var(--lime-deep)" : "var(--green)" }}
                          />
                        </div>
                        <div className="mt-1 text-[10px] text-[var(--ink-mute)]">{event.registered_count}/{event.capacity} registered</div>
                      </div>
                      <Link
                        href={`/events/${event.slug}/register`}
                        data-cursor="Reserve"
                        className="px-4 py-2 rounded-full text-xs font-semibold text-[var(--cream)] bg-[var(--green)] hover:bg-[var(--green-deep)] transition-all"
                      >
                        Register
                      </Link>
                    </div>
                  </article>
                )})}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="font-display text-xl text-[var(--green-ink)]">New events are being planned</div>
                <p className="text-xs text-[var(--ink-dim)] mt-2">Join the community to hear first.</p>
              </div>
            )}
          </aside>
        </div>
      </section>

      <section id="discover" className="px-6 py-20 sm:py-28 border-y border-[var(--surface-border)]" style={{ background: "var(--cream-soft)" }}>
        <div className="max-w-[1180px] mx-auto">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-8 mb-12">
              <div>
                <span className="block text-xs uppercase tracking-[0.18em] text-[var(--green)] mb-4">Past events</span>
                <h2 className="font-display font-medium leading-tight text-[var(--green-ink)] max-w-[16ch]" style={{ fontSize: "clamp(36px,5vw,64px)", letterSpacing: "-0.02em" }}>
                  Proof that people still show up.
                </h2>
              </div>
              <Link href="/events?time=past" className="text-sm text-[var(--green)] underline decoration-[var(--surface-border)] underline-offset-4 hover:decoration-[var(--green)]">
                View all past events
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pastEvents.map((event, index) => (
              <Reveal key={event.id} delay={index * 0.04}>
                <EventCard event={event} index={index} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-32">
        <Reveal>
          <div className="max-w-[960px] mx-auto rounded-[2rem] p-8 sm:p-12 surface text-center">
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--green)] mb-4">Ready when you are</div>
            <h2 className="font-display text-[var(--green-ink)] leading-tight mx-auto max-w-[16ch]" style={{ fontSize: "clamp(34px,5vw,62px)", letterSpacing: "-0.02em" }}>
              Pick one plan and let the city do the rest.
            </h2>
            <p className="mt-5 text-sm sm:text-base text-[var(--ink-dim)] max-w-[46ch] mx-auto">
              Register with UPI proof, get WhatsApp follow-up, and keep your pass ready for the event.
            </p>
            <div className="mt-9">
              <MagneticButton className="inline-block">
                <Link
                  href="/events"
                  data-cursor="Explore"
                  className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full text-sm font-medium transition-all duration-300 hover:bg-[var(--green-deep)]"
                  style={{ background: "var(--green)", color: "var(--cream)" }}
                >
                  Browse events
                </Link>
              </MagneticButton>
            </div>
          </div>
        </Reveal>
      </section>
    </PublicShell>
  );
}
