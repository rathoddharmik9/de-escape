import { Suspense } from "react";
import PublicShell from "@/components/layout/PublicShell";
import { getEventBySlug } from "@/lib/data/events";
import SuccessClient from "./SuccessClient";

interface Props {
  params: { slug: string };
}

export default async function SuccessPage({ params }: Props) {
  const event = await getEventBySlug(params.slug);

  return (
    <PublicShell initialScene="pulse" footer={false}>
      <div className="min-h-screen flex items-center justify-center px-6 pt-32 pb-24">
        <Suspense fallback={<div className="text-[var(--ink-dim)]">Loading...</div>}>
          <SuccessClient eventGroupInviteLink={event?.community_group_invite} />
        </Suspense>
      </div>
    </PublicShell>
  );
}
