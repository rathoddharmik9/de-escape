import type { Event } from "./types";

// NOTE: EVENTS is retained only for DB seeding purposes (scripts/seed.ts).
// It is NOT used at runtime by public or administrative page components.
export const EVENTS: Event[] = [
  {
    id: "evt-001",
    slug: "midnight-cycling-scavenger-hunt",
    title: "Midnight Cycling Scavenger Hunt",
    tagline: "Clues. Pedals. Adventure. Are you in?",
    description: `<p>The city transforms at midnight. Streets breathe differently. Landmarks lose their tourist faces and put on their real ones.</p>
<p>We're cycling through it — and we've hidden clues along the way.</p>
<p>This is a team-based scavenger hunt on wheels through Mumbai's most iconic nocturnal stretches. You'll solve riddles, find checkpoints, and earn points. Fastest team with the most points wins bragging rights (and maybe a trophy made of a bicycle bell).</p>
<p><strong>What to bring:</strong> Your own bicycle (or rent one nearby), a sense of adventure, snacks for fuel, and a team of 2–4.</p>
<p><strong>Route:</strong> Marine Drive → Colaba → CST → Crawford Market → Bandra (surprise finale)</p>`,
    cover_image_url:
      "https://res.cloudinary.com/dbkmzjt0e/image/upload/v1780223773/WhatsApp_Image_2026-05-31_at_11.09.25_ozfvau.jpg",
    category: "cycling",
    start_at: "2026-06-06T22:30:00+05:30",
    end_at: "2026-06-07T03:00:00+05:30",
    venue_name: "Marine Drive Starting Point",
    venue_address: "Near Hanuman Mandir, Marine Drive, Mumbai",
    venue_map_url: "https://maps.google.com/?q=Marine+Drive+Mumbai",
    capacity: 40,
    registered_count: 34,
    price_paise: 59900,
    payment_mode: "manual_upi",
    upi_id: "deescape@upi",
    refund_policy: "Full refund 48h before event. No refund within 48h.",
    status: "published",
  },
  {
    id: "evt-002",
    slug: "sunset-sound-bath-marine-drive",
    title: "Sunset Sound Bath at Marine Drive",
    tagline: "Let the ocean and the gongs do the rest.",
    description: `<p>A 90-minute guided sound bath as the sun dissolves into the Arabian Sea. Tibetan bowls, crystal singing bowls, and ocean percussion — designed to take you somewhere your to-do list can't follow.</p>`,
    cover_image_url: "",
    category: "sound_bath",
    start_at: "2026-06-14T18:00:00+05:30",
    end_at: "2026-06-14T19:30:00+05:30",
    venue_name: "Marine Drive Promenade",
    venue_address: "Netaji Subhash Chandra Bose Road, Marine Drive, Mumbai",
    venue_map_url: "https://maps.google.com/?q=Marine+Drive+Mumbai",
    capacity: 30,
    registered_count: 18,
    price_paise: 39900,
    payment_mode: "manual_upi",
    upi_id: "deescape@upi",
    refund_policy: "Full refund 48h before event. No refund within 48h.",
    status: "published",
  },
  {
    id: "evt-003",
    slug: "strangers-chai-bandra",
    title: "Strangers + Chai in Bandra",
    tagline: "Eight strangers. One long table. No agenda.",
    description: `<p>A slow Sunday morning ritual. You arrive, you sit, someone pours chai. Nobody knows anybody. That's the point.</p>`,
    cover_image_url: "",
    category: "supper",
    start_at: "2026-06-08T11:00:00+05:30",
    end_at: "2026-06-08T13:30:00+05:30",
    venue_name: "The Bandra Café",
    venue_address: "16th Road, Bandra West, Mumbai",
    venue_map_url: "https://maps.google.com/?q=16th+Road+Bandra+West+Mumbai",
    capacity: 12,
    registered_count: 6,
    price_paise: 25000,
    payment_mode: "manual_upi",
    upi_id: "deescape@upi",
    refund_policy: "Full refund 48h before event. No refund within 48h.",
    status: "published",
  },
  {
    id: "evt-004",
    slug: "slow-supper-eight-strangers",
    title: "Slow Supper, Eight Strangers",
    tagline: "A dinner where you're not allowed to talk about work.",
    description: `<p>Three courses, eight strangers, one rule: no talking about work. Conversation cards help. Wine helps more.</p>`,
    cover_image_url: "",
    category: "supper",
    start_at: "2026-06-11T20:00:00+05:30",
    end_at: "2026-06-11T23:00:00+05:30",
    venue_name: "Private Residence, Koregaon Park",
    venue_address: "Koregaon Park, Pune",
    venue_map_url: "https://maps.google.com/?q=Koregaon+Park+Pune",
    capacity: 8,
    registered_count: 5,
    price_paise: 149900,
    payment_mode: "manual_upi",
    upi_id: "deescape@upi",
    refund_policy: "Full refund 48h before event. No refund within 48h.",
    status: "published",
  },
  {
    id: "evt-006",
    slug: "quiet-poetry-candles-only",
    title: "Quiet Poetry, Candles Only",
    tagline: "Bring something to read, or just listen.",
    description: `<p>A candlelit reading circle in a studio in Lajpat Nagar. You can share something you wrote, something you love, or something that broke you open once. Or just sit and receive.</p>`,
    cover_image_url: "",
    category: "book_circle",
    start_at: "2026-06-13T19:30:00+05:30",
    end_at: "2026-06-13T22:00:00+05:30",
    venue_name: "Lantern Studio",
    venue_address: "Lajpat Nagar II, New Delhi",
    venue_map_url: "https://maps.google.com/?q=Lajpat+Nagar+New+Delhi",
    capacity: 15,
    registered_count: 9,
    price_paise: 49900,
    payment_mode: "manual_upi",
    upi_id: "deescape@upi",
    refund_policy: "Full refund 48h before event. No refund within 48h.",
    status: "published",
  },
];


export const CATEGORY_LABELS: Record<string, string> = {
  sound_bath: "Sound Bath",
  supper: "Supper Club",
  run: "Run Club",
  book_circle: "Book Circle",
  cycling: "Cycling",
  other: "Community",
};

export const CATEGORY_COLORS: Record<string, string> = {
  sound_bath: "#3FA76A",
  supper: "#A9CE1E",
  run: "#2C8A4B",
  book_circle: "#1F6336",
  cycling: "#C8F135",
  other: "#8A9384",
};

export const POSTER_GRADIENTS: Record<string, string> = {
  sound_bath: "linear-gradient(135deg,#3FA76A 0%,#2C8A4B 100%)",
  supper: "linear-gradient(135deg,#A9CE1E 0%,#2C8A4B 100%)",
  run: "linear-gradient(135deg,#2C8A4B 0%,#1F6336 100%)",
  book_circle: "linear-gradient(135deg,#1F6336 0%,#2C8A4B 100%)",
  cycling: "linear-gradient(135deg,#C8F135 0%,#A9CE1E 100%)",
  other: "linear-gradient(135deg,#8A9384 0%,#2C8A4B 100%)",
};

export function formatPrice(paise: number): string {
  if (paise === 0) return "Free";
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function seatsLeft(event: Event): number {
  return event.capacity - event.registered_count;
}
