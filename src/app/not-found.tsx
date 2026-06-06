import Link from "next/link";
import AmbientMesh from "@/components/layout/AmbientMesh";
import Nav from "@/components/layout/Nav";

export default function NotFound() {
  return (
    <>
      <AmbientMesh />
      <Nav />
      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <div
            className="font-serif mb-4"
            style={{ fontSize: "clamp(80px,15vw,160px)", lineHeight: "1", letterSpacing: "-0.05em", color: "rgba(255,255,255,0.06)" }}
          >
            404
          </div>
          <h1
            className="font-serif font-normal text-[var(--ink)] -mt-8 mb-4"
            style={{ fontSize: "clamp(32px,5vw,52px)", letterSpacing: "-0.03em" }}
          >
            You wandered off the map.
          </h1>
          <p className="text-base text-[var(--ink-2)] max-w-[40ch] mx-auto leading-relaxed mb-10">
            The page you&apos;re looking for doesn&apos;t exist — or maybe the event already happened.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 px-7 py-4 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5"
            style={{ background: "var(--ink)", color: "#1a0e08" }}
          >
            ← Take me home
          </Link>
        </div>
      </main>
    </>
  );
}
