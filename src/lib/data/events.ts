import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/lib/types";

export async function getPublishedEvents(): Promise<Event[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .in("status", ["published", "sold_out"])
    .order("start_at", { ascending: true });
  if (error) throw new Error(`getPublishedEvents: ${error.message}`);
  return (data ?? []) as Event[];
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null; // no rows
    throw new Error(`getEventBySlug: ${error.message}`);
  }
  return data as Event;
}

export async function getFeaturedEvent(): Promise<Event | null> {
  const events = await getPublishedEvents();
  return events[0] ?? null;
}
