import { Suspense } from "react";
import PublicShell from "@/components/layout/PublicShell";
import { getEventBySlug } from "@/lib/data/events";
import { getPublicAppSettings } from "@/lib/actions/admin-settings";
import SuccessClient from "./SuccessClient";

// The invite can be changed by an admin after the event has been published.
export const dynamic = "force-dynamic";

interface Props {
  params: { slug: string };
}

export default async function SuccessPage({ params }: Props) {
  const [event, settings] = await Promise.all([getEventBySlug(params.slug), getPublicAppSettings()]);
  const groupInviteLink = event?.community_group_invite || settings.whatsapp_group_invite_link;

  return (
    <PublicShell initialScene="pulse" footer={false}>
      <div className="min-h-screen flex items-center justify-center px-6 pt-32 pb-24">
        <Suspense fallback={<div className="text-[var(--ink-dim)]">Loading...</div>}>
          <SuccessClient eventGroupInviteLink={groupInviteLink} />
        </Suspense>
      </div>
    </PublicShell>
  );
}
