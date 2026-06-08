import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EventDetailsContainer from "@/components/admin/EventDetailsContainer";
import type { Event, Registration } from "@/lib/types";

interface Props {
  params: { id: string };
}

export default async function AdminEventDetailPage({ params }: Props) {
  const supabase = createClient();

  // 1. Fetch Event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (eventError || !event) {
    notFound();
  }

  // 2. Fetch Event Registrations
  const { data: registrations } = await supabase
    .from("registrations")
    .select("*")
    .eq("event_id", params.id)
    .order("created_at", { ascending: false });

  return (
    <EventDetailsContainer
      event={event as Event}
      registrations={(registrations ?? []) as Registration[]}
    />
  );
}
