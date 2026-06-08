import { createClient } from "@/lib/supabase/server";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";

export const revalidate = 0; // Dynamic rendering

export default async function AdminAnalyticsPage() {
  const supabase = createClient();

  // Fetch all events
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .order("start_at", { ascending: false });

  if (eventsError) {
    console.error("Error fetching events for analytics:", eventsError.message);
  }

  // Fetch registrations
  const { data: registrations, error: regsError } = await supabase
    .from("registrations")
    .select("*")
    .order("created_at", { ascending: true });

  if (regsError) {
    console.error("Error fetching registrations for analytics:", regsError.message);
  }

  return (
    <div className="max-w-[1100px] space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[var(--green-ink)] tracking-tight">
          Performance Analytics
        </h1>
        <p className="text-sm text-[var(--ink-mute)] mt-1">
          Monitor your registration rates, total cash intake, capacity fulfillment trends, and check-in rates.
        </p>
      </div>

      <AnalyticsDashboard
        events={events || []}
        registrations={registrations || []}
      />
    </div>
  );
}
