import { getPublishedEvents } from "@/lib/data/events";
import EventsBrowser from "@/components/events/EventsBrowser";

export default async function EventsPage() {
  const events = await getPublishedEvents();
  return <EventsBrowser events={events} />;
}
