import { createAdminClient } from "@/lib/supabase/admin";
import { EmailOptions } from "../../../src/lib/comms/email";

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, subject, templateKey, registrationId = null, eventId = null, payload } = options;
  const messageId = "mock-email-" + crypto.randomUUID();

  try {
    const supabase = createAdminClient();
    await supabase.from("message_log").insert({
      registration_id: registrationId,
      event_id: eventId,
      channel: "email",
      template_key: templateKey,
      recipient: to,
      payload: payload || {},
      provider_message_id: messageId,
      status: "sent",
      error: null,
      sent_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to write mock email log to DB:", err);
  }

  return { success: true, messageId };
}
