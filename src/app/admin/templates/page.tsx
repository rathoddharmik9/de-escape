import { getWhatsAppTemplates } from "@/lib/actions/admin-comms";
import TemplatesBrowser from "@/components/admin/TemplatesBrowser";

export const revalidate = 0; // Dynamic rendering

export default async function AdminTemplatesPage() {
  const templates = await getWhatsAppTemplates();

  return (
    <div className="max-w-[1100px] space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[var(--green-ink)] tracking-tight">
          WhatsApp Message Templates
        </h1>
        <p className="text-sm text-[var(--ink-mute)] mt-1">
          Review, sync, and customize template triggers used for automated lifecycle messages (reminders, passes, confirmations).
        </p>
      </div>

      <TemplatesBrowser initialTemplates={templates} />
    </div>
  );
}
