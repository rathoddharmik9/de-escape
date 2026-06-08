import { getAppSettings } from "@/lib/actions/admin-settings";
import SettingsForm from "@/components/admin/SettingsForm";

export const revalidate = 0; // Dynamic rendering

export default async function AdminSettingsPage() {
  const settings = await getAppSettings();

  return (
    <div className="max-w-[1100px] space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[var(--green-ink)] tracking-tight">
          System Settings
        </h1>
        <p className="text-sm text-[var(--ink-mute)] mt-1">
          Adjust global email sender profiles, WhatsApp community group redirects, and default payment policies.
        </p>
      </div>

      <SettingsForm initialSettings={settings} />
    </div>
  );
}
