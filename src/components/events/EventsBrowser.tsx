"use client";

import { useState, useMemo } from "react";
import EventCard from "@/components/events/EventCard";
import Reveal from "@/components/motion/Reveal";
import MagneticButton from "@/components/motion/MagneticButton";
import type { Event } from "@/lib/types";

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Sound Baths", value: "sound_bath" },
  { label: "Supper Clubs", value: "supper" },
  { label: "Run Clubs", value: "run" },
  { label: "Book Circles", value: "book_circle" },
  { label: "Cycling", value: "cycling" },
  { label: "Free", value: "free" },
];

export default function EventsBrowser({ events }: { events: Event[] }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchCat =
        activeFilter === "all"
          ? true
          : activeFilter === "free"
          ? e.price_paise === 0
          : e.category === activeFilter;
      const matchSearch =
        search === "" ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.venue_name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [events, activeFilter, search]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="pt-40 pb-12 px-6">
        <div className="max-w-[1180px] mx-auto">
          <span className="block text-xs uppercase tracking-[0.18em] text-[var(--green)] mb-4">
            — Discover
          </span>
          <h1
            className="font-display font-medium leading-none tracking-tight text-[var(--green-ink)]"
            style={{ fontSize: "clamp(48px,6vw,80px)", letterSpacing: "-0.02em" }}
          >
            What&apos;s on
            <span style={{ color: "var(--green)" }}> near you</span>
          </h1>
          <p className="mt-4 text-base text-[var(--ink-dim)] max-w-[52ch]">
            Curated events across cities. Filter by vibe, find your people.
          </p>
        </div>
      </section>

      {/* Sticky filters */}
      <div
        className="sticky top-[72px] z-30 px-6 py-4 backdrop-blur-xl border-b border-[var(--surface-border)]"
        style={{ background: "rgba(245,236,206,0.85)" }}
      >
        <div className="max-w-[1180px] mx-auto flex flex-wrap gap-2 items-center">
          {FILTERS.map((f) => (
            <MagneticButton key={f.value} strength={0.2} className="inline-block">
              <button
                onClick={() => setActiveFilter(f.value)}
                data-cursor="true"
                className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-200 ${
                  activeFilter === f.value
                    ? ""
                    : "surface text-[var(--ink-dim)] hover:text-[var(--green-ink)] hover:bg-[var(--cream-deep)]"
                }`}
                style={
                  activeFilter === f.value
                    ? { background: "var(--green)", color: "var(--cream)" }
                    : {}
                }
              >
                {f.label}
              </button>
            </MagneticButton>
          ))}

          {/* Search */}
          <div className="ml-auto relative">
            <input
              type="search"
              placeholder="Search events…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="surface text-sm text-[var(--green-ink)] placeholder:text-[var(--ink-mute)] rounded-full px-4 py-2 pr-10 outline-none focus:border-[var(--green)] w-52 transition-all"
            />
            <svg
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-mute)]"
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="px-6 py-12 pb-36">
        <div className="max-w-[1180px] mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-32">
              <div className="text-6xl mb-6">🌿</div>
              <h2 className="font-display text-3xl text-[var(--green-ink)] mb-3">
                Nothing here yet
              </h2>
              <p className="text-[var(--ink-dim)]">
                Try a different filter or check back soon.
              </p>
              <button
                onClick={() => { setActiveFilter("all"); setSearch(""); }}
                data-cursor="true"
                className="mt-6 px-6 py-3 rounded-full text-sm font-medium surface text-[var(--green-ink)] hover:bg-[var(--cream-deep)] transition-all"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-[var(--ink-mute)] mb-6 uppercase tracking-wider">
                {filtered.length} event{filtered.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((event, i) => (
                  <Reveal key={event.id} delay={i * 0.05}>
                    <EventCard event={event} index={i} />
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
