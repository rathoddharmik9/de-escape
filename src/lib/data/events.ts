import { createClient as createAnonClient } from "@supabase/supabase-js";
import type { Event } from "@/lib/types";
import { cache as reactCache } from "react";

// Fallback for standalone Node.js contexts (like CLI scripts and E2E tests) where React's cache is not available.
const cache = typeof reactCache === "function" ? reactCache : (<T extends Function>(fn: T): T => fn);

// Cookie-less client for build-time contexts (generateStaticParams, generateMetadata, and public routes).
function buildClient() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export const getPublishedEventSlugs = cache(async (): Promise<string[]> => {
  const supabase = buildClient();
  const { data, error } = await supabase
    .from("events")
    .select("slug")
    .in("status", ["published", "sold_out"])
    .gt("end_at", new Date().toISOString());
  if (error) throw new Error(`getPublishedEventSlugs: ${error.message}`);
  return (data ?? []).map((r: { slug: string }) => r.slug);
});

export const getEventBySlugBuild = cache(async (slug: string): Promise<Event | null> => {
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
});

export const getPublishedEvents = cache(async (): Promise<Event[]> => {
  const supabase = buildClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .in("status", ["published", "sold_out"])
    .gt("end_at", new Date().toISOString())
    .order("start_at", { ascending: true });
  if (error) throw new Error(`getPublishedEvents: ${error.message}`);
  return (data ?? []) as Event[];
});

export const getEventBySlug = cache(async (slug: string): Promise<Event | null> => {
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
});

export const getFeaturedEvent = cache(async (): Promise<Event | null> => {
  const events = await getPublishedEvents();
  return events[0] ?? null;
});

