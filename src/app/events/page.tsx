import { getPublishedEvents } from "@/lib/data/events";
import EventsBrowser from "@/components/events/EventsBrowser";
import PublicShell from "@/components/layout/PublicShell";

export default async function EventsPage() {
  const events = await getPublishedEvents();
  return (
    <PublicShell initialScene="trail">
      <EventsBrowser events={events} />
    </PublicShell>
  );
}
