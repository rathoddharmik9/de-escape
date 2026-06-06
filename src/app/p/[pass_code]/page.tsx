"use client";

import Nav from "@/components/layout/Nav";
import AmbientMesh from "@/components/layout/AmbientMesh";
import Link from "next/link";

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
    category_color: "#f4c97a",
  };
}

export default function PassPage({ params }: Props) {
  const pass = getMockPass(params.pass_code);

  return (
    <>
      <AmbientMesh />
      <Nav />
      <main className="relative z-10 min-h-screen px-6 pt-36 pb-24 flex items-center justify-center">
        <div className="max-w-[460px] w-full">
          {/* Pass card */}
          <div
            className="rounded-3xl overflow-hidden"
            style={{ border: "1px solid var(--glass-border)", background: "rgba(255,255,255,0.05)" }}
          >
            {/* Card header */}
            <div
              className="px-8 pt-8 pb-6 text-center relative overflow-hidden"
              style={{ background: `${pass.category_color}18` }}
            >
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${pass.category_color}, transparent 70%)`,
                }}
                aria-hidden="true"
              />

              <div className="relative">
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--ink-3)] mb-3">
                  de—escape<span className="text-[var(--coral)]">.</span>
                </div>
                <div className="text-xs uppercase tracking-widest text-[var(--ink-3)] mb-5">
                  Event Pass
                </div>
                <h1 className="font-serif text-2xl text-[var(--ink)] leading-tight tracking-tight mb-1">
                  {pass.attendee_name}
                </h1>
                <p className="text-sm text-[var(--ink-2)]">is going to</p>
                <h2 className="font-serif text-xl text-[var(--ink)] leading-tight tracking-tight mt-2">
                  {pass.event_title}
                </h2>
              </div>
            </div>

            {/* Dashed divider */}
            <div
              className="relative h-0 border-t-2 border-dashed"
              style={{ borderColor: "var(--glass-border)" }}
            >
              <div
                className="absolute -left-4 -top-4 w-8 h-8 rounded-full"
                style={{ background: "var(--bg)" }}
              />
              <div
                className="absolute -right-4 -top-4 w-8 h-8 rounded-full"
                style={{ background: "var(--bg)" }}
              />
            </div>

            {/* Card body */}
            <div className="px-8 pt-6 pb-8">
              {/* Event details */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--ink-3)] mb-1">Date</div>
                  <div className="text-sm font-medium text-[var(--ink)]">{pass.event_date}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--ink-3)] mb-1">Time</div>
                  <div className="text-sm font-medium text-[var(--ink)]">{pass.event_time}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] uppercase tracking-widest text-[var(--ink-3)] mb-1">Venue</div>
                  <a
                    href={pass.venue_map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[var(--ink)] hover:text-[var(--coral)] transition-colors"
                  >
                    {pass.venue_name} ↗
                  </a>
                  <div className="text-xs text-[var(--ink-3)] mt-0.5">{pass.venue_address}</div>
                </div>
              </div>

              {/* Pass code */}
              <div className="text-center">
                <div className="text-[10px] uppercase tracking-widest text-[var(--ink-3)] mb-3">
                  Your pass code
                </div>
                <div
                  className="font-mono text-5xl tracking-[0.3em] text-[var(--ink)] py-5 px-6 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--glass-border)" }}
                >
                  {pass.pass_code}
                </div>
                <p className="mt-3 text-xs text-[var(--ink-3)]">
                  Show this code at the venue entrance
                </p>
              </div>

              {/* Actions */}
              <div className="mt-8 grid grid-cols-2 gap-3">
                <a
                  href={pass.venue_map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-medium glass hover:bg-white/10 transition-all text-[var(--ink)]"
                >
                  📍 Get directions
                </a>
                <button
                  onClick={() => {
                    const text = `*${pass.event_title}*\n📅 ${pass.event_date} at ${pass.event_time}\n📍 ${pass.venue_name}\n🎫 Pass code: ${pass.pass_code}`;
                    navigator.clipboard?.writeText(text);
                  }}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-medium glass hover:bg-white/10 transition-all text-[var(--ink)]"
                >
                  📋 Copy details
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/events"
              className="text-sm text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
            >
              ← Explore more events
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
