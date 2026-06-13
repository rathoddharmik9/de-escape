import { createAdminClient } from "@/lib/supabase/admin";

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// Helper to write outbound messaging log to database
async function logMessage(
  registrationId: string | null,
  eventId: string | null,
  recipient: string,
  templateKey: string,
  payload: Record<string, unknown>,
  status: "sent" | "failed",
  error: string | null,
  providerMessageId: string | null
) {
  try {
    const supabase = createAdminClient();
    await supabase.from("message_log").insert({
      registration_id: registrationId,
      event_id: eventId,
      channel: "whatsapp",
      template_key: templateKey,
      recipient,
      payload,
      provider_message_id: providerMessageId,
      status,
      error,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    });
  } catch (err) {
    console.error("Failed to write WhatsApp message log to DB:", err);
  }
}

export interface TemplateOptions {
  to: string; // phone number in E.164 (without plus sign for WhatsApp API, e.g. "919876543210")
  templateKey: string; // e.g. "approved_pass"
  metaTemplateName: string; // e.g. "approved_pass_v1"
  variables: string[]; // ordered parameters: ["Dharmik", "Sunset Sound Bath"]
  registrationId?: string | null;
  eventId?: string | null;
}

export async function sendWhatsAppTemplate(options: TemplateOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, templateKey, metaTemplateName, variables, registrationId = null, eventId = null } = options;
  
  // Format recipient: WhatsApp API expects digits only, no leading '+'
  const formattedTo = to.replace(/\+/g, "").trim();

  // Construct Meta template parameter objects
  const parameters = variables.map((v) => ({
    type: "text" as const,
    text: v,
  }));

  const requestPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedTo,
    type: "template",
    template: {
      name: metaTemplateName,
      language: {
        code: "en",
      },
      components: parameters.length > 0 ? [
        {
          type: "body",
          parameters,
        },
      ] : [],
    },
  };

  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    const errorMsg = "WhatsApp credentials are not configured.";
    console.error(errorMsg);
    await logMessage(registrationId, eventId, to, templateKey, { variables }, "failed", errorMsg, null);
    return { success: false, error: errorMsg };
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || `HTTP error ${response.status}`;
      throw new Error(errorMsg);
    }

    const messageId = data?.messages?.[0]?.id || null;
    await logMessage(registrationId, eventId, to, templateKey, { variables }, "sent", null, messageId);
    return { success: true, messageId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Meta WhatsApp API service error";
    console.error("Failed to send WhatsApp template via Meta Cloud API:", errorMsg);
    await logMessage(registrationId, eventId, to, templateKey, { variables }, "failed", errorMsg, null);
    return { success: false, error: errorMsg };
  }
}

export interface FreeformOptions {
  to: string;
  text: string;
  registrationId?: string | null;
  eventId?: string | null;
}

export async function sendWhatsAppFreeform(options: FreeformOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, text, registrationId = null, eventId = null } = options;
  const formattedTo = to.replace(/\+/g, "").trim();

  const requestPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: formattedTo,
    type: "text",
    text: {
      preview_url: false,
      body: text,
    },
  };

  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    const errorMsg = "WhatsApp credentials are not configured.";
    console.error(errorMsg);
    await logMessage(registrationId, eventId, to, "freeform_reply", { text }, "failed", errorMsg, null);
    return { success: false, error: errorMsg };
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || `HTTP error ${response.status}`;
      throw new Error(errorMsg);
    }

    const messageId = data?.messages?.[0]?.id || null;
    await logMessage(registrationId, eventId, to, "freeform_reply", { text }, "sent", null, messageId);
    return { success: true, messageId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Meta WhatsApp API service error";
    console.error("Failed to send WhatsApp freeform message via Meta Cloud API:", errorMsg);
    await logMessage(registrationId, eventId, to, "freeform_reply", { text }, "failed", errorMsg, null);
    return { success: false, error: errorMsg };
  }
}
