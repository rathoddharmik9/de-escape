import Link from "next/link";
import PublicShell from "@/components/layout/PublicShell";
import MagneticButton from "@/components/motion/MagneticButton";

export default function NotFound() {
  return (
    <PublicShell initialScene="pulse" footer={false}>
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <div
            className="font-display font-semibold mb-4"
            style={{ fontSize: "clamp(80px,15vw,160px)", lineHeight: "1", letterSpacing: "-0.03em", color: "rgba(44,138,75,0.14)" }}
          >
            404
          </div>
          <h1
            className="font-display font-semibold text-[var(--green-ink)] -mt-8 mb-4"
            style={{ fontSize: "clamp(32px,5vw,52px)", letterSpacing: "-0.02em" }}
          >
            You wandered off the map.
          </h1>
          <p className="text-base text-[var(--ink-dim)] max-w-[40ch] mx-auto leading-relaxed mb-10">
            The page you&apos;re looking for doesn&apos;t exist — or maybe the event already happened.
          </p>
          <MagneticButton className="inline-block">
            <Link
              href="/"
              data-cursor="Home"
              className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5"
              style={{ background: "var(--green)", color: "var(--cream)" }}
            >
              ← Take me home
            </Link>
          </MagneticButton>
        </div>
      </div>
    </PublicShell>
  );
}
