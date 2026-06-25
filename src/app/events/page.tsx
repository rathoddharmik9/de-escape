import { getDiscoverEvents } from "@/lib/data/events";
import EventsBrowser from "@/components/events/EventsBrowser";
import PublicShell from "@/components/layout/PublicShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: { time?: string };
}) {
  const events = await getDiscoverEvents();
  return (
    <PublicShell initialScene="trail">
      <EventsBrowser events={events} initialTime={searchParams?.time === "past" ? "past" : "upcoming"} />
    </PublicShell>
  );
}
