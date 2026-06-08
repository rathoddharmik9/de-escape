import { getBlockedContacts } from "@/lib/actions/admin-settings";
import BlockListBrowser from "@/components/admin/BlockListBrowser";

export const revalidate = 0; // Dynamic rendering

export default async function AdminBlockListPage() {
  const blocks = await getBlockedContacts();

  return (
    <div className="max-w-[1100px] space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[var(--green-ink)] tracking-tight">
          Block List Manager
        </h1>
        <p className="text-sm text-[var(--ink-mute)] mt-1">
          Add phone numbers and emails to the blacklist. Silent rejection keeps bots and bad actors away from event queues.
        </p>
      </div>

      <BlockListBrowser initialBlocks={blocks} />
    </div>
  );
}
