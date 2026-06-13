"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function verifyAdminSession() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized: No session");
  }

  // Check if admin
  const adminClient = createAdminClient();
  const { data: admin } = await adminClient
    .from("admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    throw new Error("Unauthorized: Not an administrator");
  }

  return user;
}

async function writeAuditLog(
  actorId: string,
  action: string,
  targetTable: string,
  targetId: string | null,
  before: unknown,
  after: unknown
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("audit_log").insert({
    actor_id: actorId,
    action,
    target_table: targetTable,
    target_id: targetId,
    before,
    after,
  });
  if (error) {
    console.error("Failed to write audit log in settings:", error.message);
  }
}

export type ActionState = {
  success: boolean;
  message?: string;
};

const DEFAULT_SETTINGS: Record<string, string> = {
  ses_sender_email: "De-escape <noreply@de-escape.in>",
  whatsapp_group_invite_link: "https://chat.whatsapp.com/example",
  support_phone: "+91 98765 43210",
  support_email: "support@de-escape.in",
  default_refund_policy: "Full refund 48h before event start. No refunds within 48h.",
};

// 1. Get app settings (Self-healing defaults seed)
export async function getAppSettings(): Promise<Record<string, string>> {
  try {
    await verifyAdminSession();
    const supabase = createAdminClient();

    const { data: currentSettings, error } = await supabase
      .from("app_settings")
      .select("key, value");

    if (error) {
      throw error;
    }

    const settingsMap: Record<string, string> = {};
    (currentSettings || []).forEach((row) => {
      settingsMap[row.key] = row.value;
    });

    // Seed missing defaults
    const missingKeys = Object.keys(DEFAULT_SETTINGS).filter((key) => !(key in settingsMap));
    
    if (missingKeys.length > 0) {
      const inserts = missingKeys.map((key) => ({
        key,
        value: DEFAULT_SETTINGS[key],
      }));

      const { data: newlySeeded, error: seedError } = await supabase
        .from("app_settings")
        .insert(inserts)
        .select();

      if (seedError) {
        console.error("Failed to seed app settings:", seedError.message);
      } else if (newlySeeded) {
        newlySeeded.forEach((row) => {
          settingsMap[row.key] = row.value;
        });
      }
    }

    return settingsMap;
  } catch (err) {
    console.error("Error fetching app settings:", err);
    return DEFAULT_SETTINGS;
  }
}

// 2. Update app settings
export async function updateAppSettings(settings: Record<string, string>): Promise<ActionState> {
  try {
    const user = await verifyAdminSession();
    const supabase = createAdminClient();

    // Fetch before values for logging
    const { data: beforeRows } = await supabase
      .from("app_settings")
      .select("key, value");

    const beforeMap: Record<string, string> = {};
    (beforeRows || []).forEach((r) => {
      beforeMap[r.key] = r.value;
    });

    // Perform updates/upserts
    const upserts = Object.entries(settings).map(([key, value]) => ({
      key,
      value: value.trim(),
    }));

    const { error } = await supabase
      .from("app_settings")
      .upsert(upserts, { onConflict: "key" });

    if (error) {
      return { success: false, message: "Settings save error: " + error.message };
    }

    // Write audit log
    await writeAuditLog(
      user.id,
      "settings.update",
      "app_settings",
      null,
      beforeMap,
      settings
    );

    return { success: true };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : "Error saving settings." };
  }
}

export interface BlockedContact {
  id: string;
  phone: string | null;
  email: string | null;
  reason: string;
  created_at: string;
}

// 3. Get Blocked Contacts
export async function getBlockedContacts(): Promise<BlockedContact[]> {
  try {
    await verifyAdminSession();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("blocked_contacts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching blocked contacts:", err);
    return [];
  }
}

// 4. Add Blocked Contact
export async function addBlockedContact(
  phone: string | null,
  email: string | null,
  reason: string
): Promise<ActionState> {
  try {
    const user = await verifyAdminSession();
    const supabase = createAdminClient();

    const phoneVal = phone?.trim() || null;
    const emailVal = email?.trim()?.toLowerCase() || null;

    if (!phoneVal && !emailVal) {
      return { success: false, message: "Provide either a phone number or an email address to block." };
    }

    if (!reason.trim()) {
      return { success: false, message: "A reason is required to block contacts." };
    }

    const { data: inserted, error } = await supabase
      .from("blocked_contacts")
      .insert({
        phone: phoneVal,
        email: emailVal,
        reason: reason.trim(),
        added_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return { success: false, message: "Failed to block contact: " + error.message };
    }

    await writeAuditLog(
      user.id,
      "blocked_contacts.add",
      "blocked_contacts",
      inserted.id,
      null,
      inserted
    );

    return { success: true };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : "Error blocking contact." };
  }
}

// 5. Remove Blocked Contact (Unblock)
export async function removeBlockedContact(id: string): Promise<ActionState> {
  try {
    const user = await verifyAdminSession();
    const supabase = createAdminClient();

    // Fetch before deleting for audit trail
    const { data: before } = await supabase
      .from("blocked_contacts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!before) {
      return { success: false, message: "Blocked contact not found." };
    }

    const { error } = await supabase
      .from("blocked_contacts")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, message: "Failed to delete: " + error.message };
    }

    await writeAuditLog(
      user.id,
      "blocked_contacts.remove",
      "blocked_contacts",
      id,
      before,
      null
    );

    return { success: true };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : "Error unblocking contact." };
  }
}
