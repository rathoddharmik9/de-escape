import PublicShell from "@/components/layout/PublicShell";
import Reveal from "@/components/motion/Reveal";

export const metadata = {
  title: "Terms of Service — De-escape",
  description: "Terms of Service governing the use of De-escape.",
};

export default function TermsPage() {
  return (
    <PublicShell initialScene="deep">
      {/* Hero */}
      <section className="px-6 pt-40 pb-16">
        <div className="max-w-[860px] mx-auto">
          <span className="block text-xs uppercase tracking-[0.18em] text-[var(--green)] mb-8">
            — Legal Terms
          </span>
          <h1
            className="font-display font-semibold leading-tight text-[var(--green-ink)]"
            style={{ fontSize: "clamp(42px,6vw,80px)", letterSpacing: "-0.02em", lineHeight: "0.95" }}
          >
            Terms of Service
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
                  1. Agreement to Terms
                </h2>
                <p>
                  By visiting our site or purchasing tickets to any event on De-escape, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services or register for events.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-[var(--green-ink)] mb-3 uppercase tracking-wider">
                  2. Registrations and Accounts
                </h2>
                <p>
                  You agree to provide true, accurate, and current information when registering for an event. Each ticket or pass code is valid only for the named individual on the registration and is non-transferable unless explicit consent is obtained from the event host.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-[var(--green-ink)] mb-3 uppercase tracking-wider">
                  3. Payments and Verifications
                </h2>
                <p>
                  Ticket purchases can be paid via instant Razorpay checkout or manual UPI verification. In cases of manual UPI payments, your registration is pending until verification. If we do not receive proof of payment or verify the transaction within the specified window, the registration may be cancelled without prior notice.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-[var(--green-ink)] mb-3 uppercase tracking-wider">
                  4. Attendance and Conduct
                </h2>
                <p>
                  We aim to provide safe, positive environments. We reserve the right to refuse entry or remove any attendee who displays abusive, harassing, or dangerous behavior at any of our curated physical events. No refunds will be provided in such cases.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-[var(--green-ink)] mb-3 uppercase tracking-wider">
                  5. Limitation of Liability
                </h2>
                <p>
                  De-escape acts as a listing and booking aggregator platform. Participation in any event is at your own risk. De-escape and its founder shall not be held liable for any personal injury, loss, damage, or accidents occurring during the events.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PublicShell>
  );
}
