import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import AmbientMesh from "@/components/layout/AmbientMesh";
import Link from "next/link";

export const metadata = {
  title: "About — De-escape",
  description: "Why De-escape exists. A founder-built world for IRL events.",
};

export default function AboutPage() {
  return (
    <>
      <AmbientMesh />
      <Nav />
      <main className="relative z-10 min-h-screen">
        {/* Hero */}
        <section className="px-6 pt-40 pb-20">
          <div className="max-w-[860px] mx-auto">
            <span className="block text-xs uppercase tracking-[0.18em] text-[var(--violet)] mb-8">
              — Our story
            </span>
            <h1
              className="font-serif font-normal leading-tight text-[var(--ink)]"
              style={{ fontSize: "clamp(52px,8vw,100px)", letterSpacing: "-0.04em", lineHeight: "0.95" }}
            >
              We made it too easy{" "}
              <em className="italic text-[var(--peach)]">to stay home.</em>
            </h1>
          </div>
        </section>

        {/* Story */}
        <section className="px-6 pb-24">
          <div className="max-w-[680px] mx-auto">
            <div className="text-lg text-[var(--ink-2)] leading-[1.8] space-y-6">
              <p>
                De-escape started as a simple frustration. Every weekend, there was something interesting happening in the city — a sound bath at Marine Drive, a supper club in someone&apos;s home, a trail run at sunrise. But nobody knew about them because the algorithms kept showing ads instead.
              </p>
              <p>
                I wanted a place where <em className="italic text-[var(--ink)]">real</em> experiences lived. Not viral moments. Not influencer content. Just people, places, and something worth leaving the house for.
              </p>
              <p>
                So I built it. De-escape is a single-founder, independently run platform. Every event is curated. Every host is verified. Every rupee goes directly to making the event happen.
              </p>
              <p
                className="font-serif text-2xl text-[var(--ink)] leading-snug"
                style={{ letterSpacing: "-0.02em" }}
              >
                &ldquo;Escape the ordinary. Experience the world a new way.&rdquo;
              </p>
              <p>
                That&lsquo;s not marketing. That&lsquo;s the whole point.
              </p>
            </div>

            {/* Philosophy cards */}
            <div className="mt-16 grid gap-4">
              {[
                {
                  title: "Curated, not crowdsourced",
                  body: "Every event goes through a personal check before it's published. Small batches, real quality.",
                  accent: "#8a7fe6",
                },
                {
                  title: "IRL only",
                  body: "No webinars, no virtual meetups. If it doesn't happen in a real place with real people, it's not on De-escape.",
                  accent: "#ff7a5c",
                },
                {
                  title: "Community first",
                  body: "You're not a ticket number. Every attendee gets a WhatsApp check-in, a personal pass code, and a human on the other end.",
                  accent: "#5dcaa5",
                },
              ].map((p) => (
                <div
                  key={p.title}
                  className="p-6 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--glass-border)" }}
                >
                  <div
                    className="text-xs uppercase tracking-widest font-medium mb-2"
                    style={{ color: p.accent }}
                  >
                    {p.title}
                  </div>
                  <p className="text-sm text-[var(--ink-2)] leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-16 text-center">
              <p className="text-base text-[var(--ink-2)] mb-6">
                Want to come to something?
              </p>
              <Link
                href="/events"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5"
                style={{ background: "var(--ink)", color: "#1a0e08" }}
              >
                See what&apos;s on →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
