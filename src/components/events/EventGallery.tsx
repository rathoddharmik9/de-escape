"use client";

import { useEffect, useMemo, useState } from "react";
import type { EventGalleryImage } from "@/lib/types";

interface EventGalleryProps {
  images: EventGalleryImage[];
  eventTitle: string;
}

export default function EventGallery({ images, eventTitle }: EventGalleryProps) {
  const [showAll, setShowAll] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const visibleImages = useMemo(() => (showAll ? images : images.slice(0, 12)), [images, showAll]);
  const activeImage = activeIndex === null ? null : images[activeIndex];

  useEffect(() => {
    if (activeIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => current === null ? current : (current - 1 + images.length) % images.length);
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) => current === null ? current : (current + 1) % images.length);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeIndex, images.length]);

  if (images.length === 0) return null;

  function goPrevious() {
    setActiveIndex((current) => current === null ? current : (current - 1 + images.length) % images.length);
  }

  function goNext() {
    setActiveIndex((current) => current === null ? current : (current + 1) % images.length);
  }

  return (
    <section className="mt-14">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="block text-xs uppercase tracking-[0.18em] text-[var(--green)] mb-3">
            Event gallery
          </span>
          <h2 className="font-display text-4xl sm:text-5xl leading-tight text-[var(--green-ink)]">
            Moments from this event
          </h2>
        </div>
        <div className="text-xs uppercase tracking-widest text-[var(--ink-mute)]">
          {images.length} photo{images.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {visibleImages.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            data-cursor="View"
            className="group relative aspect-square overflow-hidden rounded-2xl bg-[var(--cream-deep)] border border-[var(--surface-border)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.public_url}
              alt={image.alt_text || eventTitle}
              loading={index < 3 ? "eager" : "lazy"}
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            />
            <span className="absolute inset-0 bg-[var(--green-ink)]/0 transition-colors duration-300 group-hover:bg-[var(--green-ink)]/10" />
          </button>
        ))}
      </div>

      {!showAll && images.length > 12 && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            data-cursor="true"
            className="px-6 py-3 rounded-full text-sm font-medium surface text-[var(--green-ink)] hover:bg-[var(--cream-deep)] transition-all"
          >
            View all photos
          </button>
        </div>
      )}

      {activeImage && (
        <div className="fixed inset-0 z-[100] bg-[var(--green-ink)]/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8">
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute right-4 top-4 sm:right-6 sm:top-6 h-11 w-11 rounded-full bg-[var(--cream)] text-[var(--green-ink)] text-xl leading-none"
            aria-label="Close gallery image"
          >
            ×
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrevious}
                className="absolute left-3 sm:left-6 h-11 w-11 rounded-full bg-[var(--cream)]/95 text-[var(--green-ink)] text-xl"
                aria-label="Previous gallery image"
              >
                ←
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-3 sm:right-6 h-11 w-11 rounded-full bg-[var(--cream)]/95 text-[var(--green-ink)] text-xl"
                aria-label="Next gallery image"
              >
                →
              </button>
            </>
          )}

          <figure className="max-w-[min(1120px,88vw)] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage.public_url}
              alt={activeImage.alt_text || eventTitle}
              className="max-h-[78vh] w-full object-contain rounded-2xl"
            />
            {activeImage.caption && (
              <figcaption className="mt-4 text-center text-sm text-[var(--cream)]/85">
                {activeImage.caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </section>
  );
}
