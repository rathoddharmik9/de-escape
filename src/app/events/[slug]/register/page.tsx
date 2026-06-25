import { getEventBySlug } from "@/lib/data/events";
import { notFound } from "next/navigation";
import Link from "next/link";
import RegistrationForm from "@/components/events/RegistrationForm";
import PublicShell from "@/components/layout/PublicShell";

interface Props {
  params: { slug: string };
}

export default async function RegisterPage({ params }: Props) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();
  const isPast = event.status === "past" || new Date(event.end_at).getTime() <= Date.now();

  if (isPast) {
    return (
      <PublicShell initialScene="deep">
        <div className="px-6 pt-36 pb-24">
          <div className="max-w-[680px] mx-auto p-8 rounded-3xl surface text-center">
            <div className="text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-3">
              Registration closed
            </div>
            <h1 className="font-display text-4xl text-[var(--green-ink)] tracking-tight">
              This event has ended.
            </h1>
            <p className="mt-3 text-sm text-[var(--ink-dim)]">
              Past events are shown as recaps only. You can browse upcoming events and register for an active event.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/events"
                className="px-5 py-3 rounded-full text-xs font-semibold bg-[var(--green)] text-[var(--cream)]"
              >
                View upcoming events
              </Link>
              <Link
                href={`/events/${event.slug}`}
                className="px-5 py-3 rounded-full text-xs font-semibold surface text-[var(--green-ink)]"
              >
                Back to recap
              </Link>
            </div>
          </div>
        </div>
      </PublicShell>
    );
  }

  return <RegistrationForm event={event} />;
}
