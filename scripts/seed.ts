import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { EVENTS } from "../src/lib/mock-data";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const rows = EVENTS.map((e) => ({
    slug: e.slug,
    title: e.title,
    tagline: e.tagline,
    description: e.description,
    cover_image_url: e.cover_image_url || null,
    category: e.category,
    start_at: e.start_at,
    end_at: e.end_at,
    venue_name: e.venue_name,
    venue_address: e.venue_address,
    venue_map_url: e.venue_map_url,
    capacity: e.capacity,
    registered_count: e.registered_count,
    price_paise: e.price_paise,
    payment_mode: e.payment_mode,
    upi_id: e.upi_id ?? null,
    refund_policy: e.refund_policy,
    status: e.status,
  }));

  const { error } = await supabase.from("events").upsert(rows, { onConflict: "slug" });
  if (error) { console.error(error); process.exit(1); }
  console.log(`Seeded ${rows.length} events.`);
}

main();
