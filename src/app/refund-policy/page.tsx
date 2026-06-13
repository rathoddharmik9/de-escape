import PublicShell from "@/components/layout/PublicShell";
import Reveal from "@/components/motion/Reveal";

export const metadata = {
  title: "Refund Policy — De-escape",
  description: "Cancellation and refund policies for De-escape events.",
};

export default function RefundPolicyPage() {
  return (
    <PublicShell initialScene="deep">
      {/* Hero */}
      <section className="px-6 pt-40 pb-16">
        <div className="max-w-[860px] mx-auto">
          <span className="block text-xs uppercase tracking-[0.18em] text-[var(--green)] mb-8">
            — Refund Policy
          </span>
          <h1
            className="font-display font-semibold leading-tight text-[var(--green-ink)]"
            style={{ fontSize: "clamp(42px,6vw,80px)", letterSpacing: "-0.02em", lineHeight: "0.95" }}
          >
            Refund Policy
          </h1>
          <p className="text-xs text-[var(--ink-mute)] mt-4">Last Updated: June 10, 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="px-6 pb-24">
        <div className="max-w-[680px] mx-auto">
          <Reveal>
            <div className="text-sm text-[var(--ink-dim)] leading-[1.8] space-y-8">
              <div>
                <h2 className="text-base font-semibold text-[var(--green-ink)] mb-3 uppercase tracking-wider">
                  1. Standard Policy
                </h2>
                <p>
                  Unless stated otherwise on the specific event registration page, the default refund policy allows for a full refund of the ticket price if the cancellation request is submitted at least 48 hours prior to the scheduled start time of the event.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-[var(--green-ink)] mb-3 uppercase tracking-wider">
                  2. Late Cancellations
                </h2>
                <p>
                  Any cancellation request received within 48 hours of the event start time is non-refundable. Since slots are highly limited and ingredients, venues, or materials are arranged in advance, we cannot offer exceptions to this rule.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-[var(--green-ink)] mb-3 uppercase tracking-wider">
                  3. Host Cancellations or Rescheduling
                </h2>
                <p>
                  If an event is cancelled by the host or De-escape, or if the event is rescheduled to a date and time that you cannot attend, you will be offered a 100% full refund of the ticket amount.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-[var(--green-ink)] mb-3 uppercase tracking-wider">
                  4. How to Request a Refund
                </h2>
                <p>
                  To request a refund, please send an email to support@de-escape.com with your name, registration pass code, and event name. Approved refunds are typically processed back to the original payment source within 5 to 7 business days.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PublicShell>
  );
}
