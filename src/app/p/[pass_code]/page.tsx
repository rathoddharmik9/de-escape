import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import PublicShell from "@/components/layout/PublicShell";
import PassCard from "@/components/events/PassCard";
import type { Event, Registration } from "@/lib/types";

interface Props {
  params: { pass_code: string };
}

export default async function PassPage({ params }: Props) {
  const supabase = createAdminClient();
  
  const { data: registration, error: regError } = await supabase
    .from("registrations")
    .select("*, events(*)")
    .eq("pass_code", params.pass_code.toUpperCase())
    .maybeSingle();

  if (regError || !registration) {
    notFound();
  }

  const event = registration.events as Event;
  const regData = registration as unknown as Registration;
  const isApproved = regData.status === "approved" || regData.status === "attended";

  return (
    <PublicShell initialScene="deep" footer={false}>
      <div className="min-h-screen px-6 pt-36 pb-24 flex items-center justify-center">
        {isApproved ? (
          <PassCard registration={regData} event={event} />
        ) : (
          <div className="max-w-[460px] w-full text-center">
            {/* Verification pending screen */}
            <div className="p-8 rounded-3xl surface border border-[var(--glass-border)] relative overflow-hidden">
              <div className="text-5xl mb-6">⏳</div>
              <h1 className="font-display text-2xl text-[var(--green-ink)] mb-4">
                Verification in progress
              </h1>
              <p className="text-sm text-[var(--ink-dim)] leading-relaxed mb-6">
                We are currently verifying your registration for <strong>{event.title}</strong>. 
                Once the host approves your payment, your pass will activate and display here.
              </p>
              
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-[var(--ink-mute)] mb-6">
                Current Status: <span className="uppercase font-semibold tracking-wider text-[var(--amber)]">{regData.status.replace("_", " ")}</span>
              </div>

              <p className="text-xs text-[var(--ink-mute)]">
                We will notify you via WhatsApp and email once verified.
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link href="/events" data-cursor="true" className="text-sm text-[var(--ink-mute)] hover:text-[var(--green)] transition-colors">
                ← Explore more events
              </Link>
            </div>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
