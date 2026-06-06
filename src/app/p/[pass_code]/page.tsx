"use client";

import Link from "next/link";
import PublicShell from "@/components/layout/PublicShell";
import TiltCard from "@/components/motion/TiltCard";

interface Props {
  params: { pass_code: string };
}

// Mock pass data
function getMockPass(passCode: string) {
  return {
    attendee_name: "Priya Sharma",
    event_title: "Midnight Cycling Scavenger Hunt",
    event_date: "Saturday, 7 June 2026",
    event_time: "10:30 PM",
    venue_name: "Marine Drive Starting Point",
    venue_address: "Near Hanuman Mandir, Marine Drive, Mumbai",
    venue_map_url: "https://maps.google.com/?q=Marine+Drive+Mumbai",
    pass_code: passCode.toUpperCase(),
    category_color: "#C8F135",
  };
}

export default function PassPage({ params }: Props) {
  const pass = getMockPass(params.pass_code);

  return (
    <PublicShell initialScene="deep" footer={false}>
      <div className="min-h-screen px-6 pt-36 pb-24 flex items-center justify-center">
        <div className="max-w-[460px] w-full">
          <TiltCard max={10}>
            {/* Pass card */}
            <div className="rounded-3xl overflow-hidden relative surface">
              {/* Holographic sheen */}
              <div
                className="absolute inset-0 pointer-events-none z-20"
                style={{ background: "linear-gradient(120deg, transparent 30%, rgba(200,241,53,0.18) 50%, transparent 70%)" }}
                aria-hidden="true"
              />

              {/* Card header */}
              <div className="px-8 pt-8 pb-6 text-center relative overflow-hidden" style={{ background: `${pass.category_color}26` }}>
                <div
                  className="absolute inset-0 opacity-30"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${pass.category_color}, transparent 70%)` }}
                  aria-hidden="true"
                />
                <div className="relative">
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--green)] mb-3 font-display font-semibold">
                    de—escape<span className="text-[var(--lime-deep)]">.</span>
                  </div>
                  <div className="text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-5">Event Pass</div>
                  <h1 className="font-display text-2xl text-[var(--green-ink)] leading-tight tracking-tight mb-1">{pass.attendee_name}</h1>
                  <p className="text-sm text-[var(--ink-dim)]">is going to</p>
                  <h2 className="font-display text-xl text-[var(--green-ink)] leading-tight tracking-tight mt-2">{pass.event_title}</h2>
                </div>
              </div>

              {/* Dashed divider */}
              <div className="relative h-0 border-t-2 border-dashed" style={{ borderColor: "var(--surface-border)" }}>
                <div className="absolute -left-4 -top-4 w-8 h-8 rounded-full" style={{ background: "var(--cream)" }} />
                <div className="absolute -right-4 -top-4 w-8 h-8 rounded-full" style={{ background: "var(--cream)" }} />
              </div>

              {/* Card body */}
              <div className="px-8 pt-6 pb-8 relative z-10">
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-[var(--ink-mute)] mb-1">Date</div>
                    <div className="text-sm font-medium text-[var(--green-ink)]">{pass.event_date}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-[var(--ink-mute)] mb-1">Time</div>
                    <div className="text-sm font-medium text-[var(--green-ink)]">{pass.event_time}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[10px] uppercase tracking-widest text-[var(--ink-mute)] mb-1">Venue</div>
                    <a
                      href={pass.venue_map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="Map"
                      className="text-sm font-medium text-[var(--green)] hover:text-[var(--green-deep)] transition-colors"
                    >
                      {pass.venue_name} ↗
                    </a>
                    <div className="text-xs text-[var(--ink-mute)] mt-0.5">{pass.venue_address}</div>
                  </div>
                </div>

                {/* Pass code */}
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-widest text-[var(--ink-mute)] mb-3">Your pass code</div>
                  <div
                    className="font-mono text-5xl tracking-[0.3em] text-[var(--green)] py-5 px-6 rounded-2xl"
                    style={{ background: "var(--cream-deep)", border: "1px solid var(--surface-border)", textShadow: "0 0 12px rgba(200,241,53,0.5)" }}
                  >
                    {pass.pass_code}
                  </div>
                  <p className="mt-3 text-xs text-[var(--ink-mute)]">Show this code at the venue entrance</p>
                </div>

                {/* Actions */}
                <div className="mt-8 grid grid-cols-2 gap-3">
                  <a
                    href={pass.venue_map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="true"
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-medium surface hover:bg-[var(--cream-deep)] transition-all text-[var(--green-ink)]"
                  >
                    📍 Get directions
                  </a>
                  <button
                    onClick={() => {
                      const text = `*${pass.event_title}*\n📅 ${pass.event_date} at ${pass.event_time}\n📍 ${pass.venue_name}\n🎫 Pass code: ${pass.pass_code}`;
                      navigator.clipboard?.writeText(text);
                    }}
                    data-cursor="true"
                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-medium surface hover:bg-[var(--cream-deep)] transition-all text-[var(--green-ink)]"
                  >
                    📋 Copy details
                  </button>
                </div>
              </div>
            </div>
          </TiltCard>

          <div className="mt-6 text-center">
            <Link href="/events" data-cursor="true" className="text-sm text-[var(--ink-mute)] hover:text-[var(--green)] transition-colors">
              ← Explore more events
            </Link>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
