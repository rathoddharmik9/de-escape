import { createClient as createAnonClient } from "@supabase/supabase-js";
import type { Event, EventGalleryImage } from "@/lib/types";

// Cookie-less client for build-time contexts (generateStaticParams, generateMetadata, and public routes).
function buildClient() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function getPublishedEventSlugs(): Promise<string[]> {
  const supabase = buildClient();
  const { data, error } = await supabase
    .from("events")
    .select("slug")
    .in("status", ["published", "sold_out"])
    .gt("end_at", new Date().toISOString());
  if (error) throw new Error(`getPublishedEventSlugs: ${error.message}`);
  return (data ?? []).map((r: { slug: string }) => r.slug);
}

export async function getEventBySlugBuild(slug: string): Promise<Event | null> {
  const supabase = buildClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`getEventBySlugBuild: ${error.message}`);
  }
  return data as Event;
}

export async function getPublishedEvents(): Promise<Event[]> {
  const supabase = buildClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .in("status", ["published", "sold_out"])
    .gt("end_at", now)
    .order("start_at", { ascending: true });
  if (error) throw new Error(`getPublishedEvents: ${error.message}`);
  return (data ?? []) as Event[];
}

export async function getHomeEvents(): Promise<Event[]> {
  const supabase = buildClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .in("status", ["published", "sold_out"])
    .eq("show_on_home", true)
    .gt("end_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(4);
  if (error) {
    if (error.message.includes("show_on_home")) {
      const events = await getPublishedEvents();
      return events.slice(0, 4);
    }
    throw new Error(`getHomeEvents: ${error.message}`);
  }
  return (data ?? []) as Event[];
}

export async function getPastEvents(limit = 6): Promise<Event[]> {
  const supabase = buildClient();
  const now = new Date().toISOString();
  let query = supabase
    .from("events")
    .select("*")
    .in("status", ["published", "sold_out", "past"])
    .or(`status.eq.past,end_at.lt.${now}`)
    .order("start_at", { ascending: false });

  if (limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(`getPastEvents: ${error.message}`);
  return (data ?? []) as Event[];
}

export async function getDiscoverEvents(): Promise<Event[]> {
  const supabase = buildClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .in("status", ["published", "sold_out", "past"])
    .order("start_at", { ascending: true });
  if (error) throw new Error(`getDiscoverEvents: ${error.message}`);
  return (data ?? []) as Event[];
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const supabase = buildClient();
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

export async function getEventGalleryImages(eventId: string): Promise<EventGalleryImage[]> {
  const supabase = buildClient();
  const { data, error } = await supabase
    .from("event_gallery_images")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (error.message.includes("event_gallery_images")) return [];
    throw new Error(`getEventGalleryImages: ${error.message}`);
  }
  return (data ?? []) as EventGalleryImage[];
}

export async function getFeaturedEvent(): Promise<Event | null> {
  const events = await getPublishedEvents();
  return events[0] ?? null;
}
