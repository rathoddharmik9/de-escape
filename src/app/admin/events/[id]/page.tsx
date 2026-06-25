import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import EventDetailsContainer from "@/components/admin/EventDetailsContainer";
import type { Event, EventGalleryImage, Registration } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: { id: string };
}

export default async function AdminEventDetailPage({ params }: Props) {
  const supabase = createAdminClient();

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

  // 3. Fetch Event Gallery Images
  const { data: galleryImages } = await supabase
    .from("event_gallery_images")
    .select("*")
    .eq("event_id", params.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <EventDetailsContainer
      event={event as Event}
      registrations={(registrations ?? []) as Registration[]}
      galleryImages={(galleryImages ?? []) as EventGalleryImage[]}
    />
  );
}
