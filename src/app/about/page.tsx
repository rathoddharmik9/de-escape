import Link from "next/link";
import PublicShell from "@/components/layout/PublicShell";
import Reveal from "@/components/motion/Reveal";
import MagneticButton from "@/components/motion/MagneticButton";

export const metadata = {
  title: "About — De-escape",
  description: "Why De-escape exists. A founder-built world for IRL events.",
};

export default function AboutPage() {
  return (
    <PublicShell initialScene="deep">
      {/* Hero */}
      <section className="px-6 pt-40 pb-20">
        <div className="max-w-[860px] mx-auto">
          <span className="block text-xs uppercase tracking-[0.18em] text-[var(--green)] mb-8">
            — Our story
          </span>
          <h1
            className="font-display font-semibold leading-tight text-[var(--green-ink)]"
            style={{ fontSize: "clamp(52px,8vw,100px)", letterSpacing: "-0.02em", lineHeight: "0.95" }}
          >
            We made it too easy{" "}
            <span style={{ color: "var(--green)" }}>to stay home.</span>
          </h1>
        </div>
      </section>

      {/* Story */}
      <section className="px-6 pb-24">
        <div className="max-w-[680px] mx-auto">
          <Reveal>
            <div className="text-lg text-[var(--ink-dim)] leading-[1.8] space-y-6">
              <p>
                De-escape started as a simple frustration. Every weekend, there was something interesting happening in the city — a sound bath at Marine Drive, a supper club in someone&apos;s home, a trail run at sunrise. But nobody knew about them because the algorithms kept showing ads instead.
              </p>
              <p>
                I wanted a place where <em className="italic text-[var(--green-ink)]">real</em> experiences lived. Not viral moments. Not influencer content. Just people, places, and something worth leaving the house for.
              </p>
              <p>
                So I built it. De-escape is a single-founder, independently run platform. Every event is curated. Every host is verified. Every rupee goes directly to making the event happen.
              </p>
              <p className="font-display text-2xl text-[var(--green)] leading-snug" style={{ letterSpacing: "-0.01em" }}>
                &ldquo;Escape the ordinary. Experience the world a new way.&rdquo;
              </p>
              <p>That&lsquo;s not marketing. That&lsquo;s the whole point.</p>
            </div>
          </Reveal>

          {/* Philosophy cards */}
          <div className="mt-16 grid gap-4">
            {[
              { title: "Curated, not crowdsourced", body: "Every event goes through a personal check before it's published. Small batches, real quality.", accent: "#2C8A4B" },
              { title: "IRL only", body: "No webinars, no virtual meetups. If it doesn't happen in a real place with real people, it's not on De-escape.", accent: "#A9CE1E" },
              { title: "Community first", body: "You're not a ticket number. Every attendee gets a WhatsApp check-in, a personal pass code, and a human on the other end.", accent: "#1F6336" },
            ].map((p, i) => (
              <Reveal key={p.title} delay={i * 0.05}>
                <div className="p-6 rounded-2xl surface">
                  <div className="text-xs uppercase tracking-widest font-medium mb-2" style={{ color: p.accent }}>
                    {p.title}
                  </div>
                  <p className="text-sm text-[var(--ink-dim)] leading-relaxed">{p.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <p className="text-base text-[var(--ink-dim)] mb-6">Want to come to something?</p>
            <MagneticButton className="inline-block">
              <Link
                href="/events"
                data-cursor="Explore"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5"
                style={{ background: "var(--green)", color: "var(--cream)" }}
              >
                See what&apos;s on →
              </Link>
            </MagneticButton>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
