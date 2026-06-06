"use client";

import { useState, useMemo } from "react";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import AmbientMesh from "@/components/layout/AmbientMesh";
import EventCard from "@/components/events/EventCard";
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
    <>
      <AmbientMesh />
      <Nav />
      <main className="relative z-10 min-h-screen">
        {/* Header */}
        <section className="pt-40 pb-12 px-6">
          <div className="max-w-[1180px] mx-auto">
            <span className="block text-xs uppercase tracking-[0.18em] text-[var(--coral)] mb-4">
              — Discover
            </span>
            <h1
              className="font-serif font-normal leading-none tracking-tight text-[var(--ink)]"
              style={{ fontSize: "clamp(48px,6vw,80px)", letterSpacing: "-0.03em" }}
            >
              What&apos;s on
              <em className="italic text-[var(--peach)]"> near you</em>
            </h1>
            <p className="mt-4 text-base text-[var(--ink-2)] max-w-[52ch]">
              Curated events across cities. Filter by vibe, find your people.
            </p>
          </div>
        </section>

        {/* Sticky filters */}
        <div className="sticky top-[72px] z-30 px-6 py-4 backdrop-blur-xl border-b border-[var(--glass-border)]"
          style={{ background: "rgba(10,8,21,0.85)" }}>
          <div className="max-w-[1180px] mx-auto flex flex-wrap gap-2 items-center">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-200 ${
                  activeFilter === f.value
                    ? "text-[#1a0e08]"
                    : "glass text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-white/10"
                }`}
                style={
                  activeFilter === f.value
                    ? { background: "var(--ink)" }
                    : {}
                }
              >
                {f.label}
              </button>
            ))}

            {/* Search */}
            <div className="ml-auto relative">
              <input
                type="search"
                placeholder="Search events…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] rounded-full px-4 py-2 pr-10 outline-none focus:border-[var(--coral)] w-52 transition-all"
                style={{ border: "1px solid var(--glass-border)" }}
              />
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-3)]"
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
                <h2 className="font-serif text-3xl text-[var(--ink)] mb-3">
                  Nothing here yet
                </h2>
                <p className="text-[var(--ink-2)]">
                  Try a different filter or check back soon.
                </p>
                <button
                  onClick={() => { setActiveFilter("all"); setSearch(""); }}
                  className="mt-6 px-6 py-3 rounded-full text-sm font-medium glass text-[var(--ink)] hover:bg-white/10 transition-all"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-[var(--ink-3)] mb-6 uppercase tracking-wider">
                  {filtered.length} event{filtered.length !== 1 ? "s" : ""} found
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((event, i) => (
                    <EventCard key={event.id} event={event} index={i} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
