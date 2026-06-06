import { createClient } from "@/lib/supabase/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import type { Event } from "@/lib/types";

// Cookie-less client for build-time contexts (generateStaticParams, generateMetadata).
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
    .in("status", ["published", "sold_out"]);
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
