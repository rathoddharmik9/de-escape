import PublicShell from "@/components/layout/PublicShell";
import Reveal from "@/components/motion/Reveal";

export const metadata = {
  title: "Privacy Policy — De-escape",
  description: "Privacy Policy and data practices for De-escape events platform.",
};

export default function PrivacyPage() {
  return (
    <PublicShell initialScene="deep">
      {/* Hero */}
      <section className="px-6 pt-40 pb-16">
        <div className="max-w-[860px] mx-auto">
          <span className="block text-xs uppercase tracking-[0.18em] text-[var(--green)] mb-8">
            — Legal Policy
          </span>
          <h1
            className="font-display font-semibold leading-tight text-[var(--green-ink)]"
            style={{ fontSize: "clamp(42px,6vw,80px)", letterSpacing: "-0.02em", lineHeight: "0.95" }}
          >
            Privacy Policy
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
                  1. Information We Collect
                </h2>
                <p>
                  We collect personal information that you voluntarily provide to us when registering for events. This includes your name, email address, phone number, age, city, Instagram handle, and payment details. We also collect optional inputs such as how you heard about us and any custom fields specified by the event organizers.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-[var(--green-ink)] mb-3 uppercase tracking-wider">
                  2. How We Use Your Information
                </h2>
                <p>
                  Your information is used to process your registration, verify payment status, generate event entry passes, and send you important updates (such as location details or timing changes) via email and WhatsApp. We do not use your data for marketing or spam without your explicit consent.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-[var(--green-ink)] mb-3 uppercase tracking-wider">
                  3. Data Protection & Processing
                </h2>
                <p>
                  We store and process your data using industry-leading third-party services including Supabase for data storage. We do not store or host UPI PINs or sensitive bank credentials on our servers.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-[var(--green-ink)] mb-3 uppercase tracking-wider">
                  4. Sharing of Information
                </h2>
                <p>
                  Your details are shared with the specific hosts/curators of the events you register for to facilitate event management and entry verification. We do not sell, rent, or distribute your personal data to any third-party advertisers.
                </p>
              </div>

              <div>
                <h2 className="text-base font-semibold text-[var(--green-ink)] mb-3 uppercase tracking-wider">
                  5. Your Choices
                </h2>
                <p>
                  You may request details of the personal information we hold about you or ask us to delete your personal data from our systems by contacting us at support@de-escape.com.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PublicShell>
  );
}
