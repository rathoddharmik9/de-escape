import { createAdminClient } from "@/lib/supabase/admin";
import { TemplateOptions, FreeformOptions } from "../../../src/lib/comms/whatsapp";

export async function sendWhatsAppTemplate(options: TemplateOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, templateKey, variables, registrationId = null, eventId = null } = options;
  const messageId = "mock-wa-template-" + crypto.randomUUID();

  try {
    const supabase = createAdminClient();
    await supabase.from("message_log").insert({
      registration_id: registrationId,
      event_id: eventId,
      channel: "whatsapp",
      template_key: templateKey,
      recipient: to,
      payload: { variables },
      provider_message_id: messageId,
      status: "sent",
      error: null,
      sent_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to write mock whatsapp log to DB:", err);
  }

  return { success: true, messageId };
}

export async function sendWhatsAppFreeform(options: FreeformOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, text, registrationId = null, eventId = null } = options;
  const messageId = "mock-wa-freeform-" + crypto.randomUUID();

  try {
    const supabase = createAdminClient();
    await supabase.from("message_log").insert({
      registration_id: registrationId,
      event_id: eventId,
      channel: "whatsapp",
      template_key: "freeform_reply",
      recipient: to,
      payload: { text },
      provider_message_id: messageId,
      status: "sent",
      error: null,
      sent_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to write mock whatsapp freeform log to DB:", err);
  }

  return { success: true, messageId };
}
