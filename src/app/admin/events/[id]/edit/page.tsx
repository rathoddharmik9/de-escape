import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import EditEventForm from "@/components/admin/EditEventForm";
import type { Event } from "@/lib/types";

interface Props {
  params: { id: string };
}

export default async function AdminEventEditPage({ params }: Props) {
  const supabase = createClient();

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !event) {
    notFound();
  }

  return <EditEventForm event={event as Event} />;
}
