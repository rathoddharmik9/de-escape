import { createAdminClient } from "@/lib/supabase/admin";
import BroadcastForm from "@/components/admin/BroadcastForm";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Dynamic rendering

export default async function AdminBroadcastsPage() {
  const supabase = createAdminClient();

  // 1. Fetch events for targeting
  const { data: events } = await supabase
    .from("events")
    .select("id, title, start_at, venue_name")
    .in("status", ["published", "sold_out", "past"])
    .order("start_at", { ascending: false });

  // 2. Fetch templates for dropdown selection
  const { data: templates } = await supabase
    .from("whatsapp_templates")
    .select("template_key, meta_template_name, body_text, variables")
    .eq("status", "approved");

  return (
    <div className="max-w-[1100px] space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-[var(--ink)] tracking-tight">
          Broadcasts Center
        </h1>
        <p className="text-sm text-[var(--ink-3)] mt-1">
          Compose and send transactional alerts or marketing updates to matching attendee cohorts.
        </p>
      </div>

      <BroadcastForm 
        events={events || []} 
        templates={templates || []} 
      />
    </div>
  );
}
