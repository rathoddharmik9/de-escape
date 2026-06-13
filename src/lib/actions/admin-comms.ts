"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/comms/email";
import { sendWhatsAppTemplate, sendWhatsAppFreeform } from "@/lib/comms/whatsapp";
import { z } from "zod";

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

function formatCommsDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }) + " IST";
}

const broadcastInputSchema = z.object({
  eventId: z.string().uuid().nullable(),
  statusFilter: z.string(), // 'all' | 'approved' | 'awaiting_verification' | 'pending' | 'attended'
  channels: z.array(z.enum(["whatsapp", "email"])),
  whatsappTemplateKey: z.string().nullable().optional(),
  emailSubject: z.string().nullable().optional(),
  emailBodyHtml: z.string().nullable().optional(),
});

export type ActionState = {
  success: boolean;
  message?: string;
  sentCount?: number;
};

// 1. Send Broadcast Action
export async function sendBroadcast(rawInput: unknown): Promise<ActionState> {
  try {
    const user = await verifyAdminSession();
    const parsed = broadcastInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
      };
    }

    const { eventId, statusFilter, channels, whatsappTemplateKey, emailSubject, emailBodyHtml } = parsed.data;
    const supabase = createAdminClient();

    // Build registrations query
    let query = supabase.from("registrations").select("*, events(*)");

    if (eventId) {
      query = query.eq("event_id", eventId);
    }

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    } else {
      // Exclude draft/awaiting_payment registrations for general safety
      query = query.not("status", "in", "('pending','awaiting_payment','rejected','refunded')");
    }

    const { data: recipients, error: recError } = await query;
    if (recError) {
      return { success: false, message: "Recipients fetch error: " + recError.message };
    }

    if (!recipients || recipients.length === 0) {
      return { success: true, message: "No matching recipients found.", sentCount: 0 };
    }

    // Load Meta templates mapping if whatsapp channel used
    const templateNameMap: Record<string, string> = {};
    if (channels.includes("whatsapp") && whatsappTemplateKey) {
      const { data: tmpl } = await supabase
        .from("whatsapp_templates")
        .select("template_key, meta_template_name")
        .eq("template_key", whatsappTemplateKey)
        .maybeSingle();

      if (tmpl) {
        templateNameMap[whatsappTemplateKey] = tmpl.meta_template_name;
      } else {
        templateNameMap[whatsappTemplateKey] = whatsappTemplateKey; // fallback
      }
    }

    let sentCount = 0;

    for (const reg of recipients) {
      const event = reg.events;
      if (!event) continue;

      const formattedDatetime = formatCommsDate(event.start_at);
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      // A. WhatsApp Broadcast
      if (channels.includes("whatsapp") && whatsappTemplateKey) {
        // Build variables array (standard lifecycle replacements)
        // Meta template placeholders match [name, event_title, datetime, venue, pass_code]
        const variables = [
          reg.full_name,
          event.title,
          formattedDatetime,
          event.venue_name,
          reg.pass_code,
        ];

        await sendWhatsAppTemplate({
          to: reg.phone,
          templateKey: whatsappTemplateKey,
          metaTemplateName: templateNameMap[whatsappTemplateKey],
          variables,
          registrationId: reg.id,
          eventId: event.id,
        });
      }

      // B. Email Broadcast
      if (channels.includes("email") && emailSubject && emailBodyHtml) {
        // Interpolate simple body tags
        const customizedBody = emailBodyHtml
          .replace(/\{\{name\}\}/g, reg.full_name)
          .replace(/\{\{event_title\}\}/g, event.title)
          .replace(/\{\{event_date\}\}/g, formattedDatetime)
          .replace(/\{\{pass_code\}\}/g, reg.pass_code)
          .replace(/\{\{pass_url\}\}/g, `${siteUrl}/p/${reg.pass_code}`);

        const customizedSubject = emailSubject
          .replace(/\{\{event_title\}\}/g, event.title);

        await sendEmail({
          to: reg.email,
          subject: customizedSubject,
          templateKey: "broadcast_email",
          registrationId: reg.id,
          eventId: event.id,
          payload: { subject: customizedSubject },
          htmlContent: customizedBody,
        });
      }

      sentCount++;
    }

    // Log the broadcast action
    await supabase.from("broadcasts").insert({
      event_id: eventId,
      filter: { statusFilter },
      channels,
      whatsapp_template_key: whatsappTemplateKey || null,
      email_subject: emailSubject || null,
      email_body_html: emailBodyHtml || null,
      sent_count: sentCount,
      sent_by: user.id,
    });

    return { success: true, sentCount };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected broadcast error";
    return { success: false, message: errorMsg };
  }
}

// 2. Reply to Chat Message
export async function replyToWhatsApp(phone: string, text: string): Promise<ActionState> {
  try {
    await verifyAdminSession();
    if (!phone || !text.trim()) {
      return { success: false, message: "Phone number and text are required." };
    }

    const res = await sendWhatsAppFreeform({ to: phone, text });
    if (res.success) {
      return { success: true };
    } else {
      return { success: false, message: res.error || "Failed to send WhatsApp message." };
    }
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : "Error replying." };
  }
}

// 3. Mark Message as Handled
export async function markInboxHandled(phone: string): Promise<ActionState> {
  try {
    await verifyAdminSession();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("whatsapp_inbox")
      .update({ handled: true, updated_at: new Date().toISOString() })
      .eq("phone", phone);

    if (error) {
      return { success: false, message: "Database update error: " + error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : "Error marking handled." };
  }
}

// 4. Seeding & Syncing Meta WhatsApp Templates
const SEED_TEMPLATES = [
  { key: "registration_received", name: "registration_received", body: "Hello {{1}}, we received your registration for {{2}} on {{3}}.", vars: ["name", "event_title", "event_date"] },
  { key: "payment_confirmed", name: "payment_confirmed", body: "Hello {{1}}, your payment of {{2}} for {{3}} is confirmed. Order ID: {{4}}.", vars: ["name", "amount", "event_title", "order_id"] },
  { key: "upi_screenshot_received", name: "upi_screenshot_received", body: "Hello {{1}}, we got your payment proof for {{2}} and are verifying it.", vars: ["name", "event_title"] },
  { key: "approved_pass", name: "approved_pass", body: "Hello {{1}}, you're in! {{2}} starts at {{3}}. Location: {{4}}. Pass Code: {{5}}. Pass URL: {{6}}. Community: {{7}}.", vars: ["name", "event_title", "event_datetime", "venue", "pass_code", "pass_url", "group_link"] },
  { key: "rejected", name: "rejected", body: "Hello {{1}}, we couldn't confirm your registration for {{2}} due to: {{3}}.", vars: ["name", "event_title", "reason"] },
  { key: "reminder_t_24h", name: "reminder_t_24h", body: "Hello {{1}}, tomorrow is {{2}} starting at {{3}}. Location: {{4}}. Pass Code: {{5}}.", vars: ["name", "event_title", "event_datetime", "venue", "pass_code"] },
  { key: "reminder_t_2h", name: "reminder_t_2h", body: "Hello {{1}}, see you in 2 hours for {{2}}. Pass Code: {{3}}. Map: {{4}}.", vars: ["name", "event_title", "pass_code", "venue_map_url"] },
  { key: "event_cancelled", name: "event_cancelled", body: "Hello {{1}}, we regret to inform you that {{2}} has been cancelled: {{3}}.", vars: ["name", "event_title", "reason"] },
  { key: "refund_processed", name: "refund_processed", body: "Hello {{1}}, your refund of {{2}} for {{3}} has been processed.", vars: ["name", "amount", "event_title"] },
  { key: "post_event_thanks", name: "post_event_thanks", body: "Hello {{1}}, thanks for coming to {{2}}! Provide feedback: {{3}}.", vars: ["name", "event_title", "feedback_url"] },
];

export async function syncWhatsAppTemplates(): Promise<ActionState> {
  try {
    await verifyAdminSession();
    const supabase = createAdminClient();

    for (const t of SEED_TEMPLATES) {
      await supabase.from("whatsapp_templates").upsert({
        template_key: t.key,
        meta_template_name: t.name,
        body_text: t.body,
        variables: t.vars,
        status: "approved",
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "template_key" });
    }

    return { success: true, message: "WhatsApp templates synced and approved." };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : "Templates sync error." };
  }
}

export interface WhatsAppTemplate {
  template_key: string;
  meta_template_name: string;
  body_text: string;
  variables: string[];
  status: string;
  approved_at: string | null;
  updated_at: string;
}

export async function getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
  try {
    await verifyAdminSession();
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("whatsapp_templates")
      .select("*")
      .order("template_key", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Error fetching templates:", err);
    return [];
  }
}

export async function updateWhatsAppTemplate(
  key: string,
  metaName: string,
  body: string,
  variables: string[]
): Promise<ActionState> {
  try {
    const user = await verifyAdminSession();
    const supabase = createAdminClient();

    // Fetch before status for audit
    const { data: before } = await supabase
      .from("whatsapp_templates")
      .select("*")
      .eq("template_key", key)
      .maybeSingle();

    const { error } = await supabase
      .from("whatsapp_templates")
      .update({
        meta_template_name: metaName.trim(),
        body_text: body.trim(),
        variables,
        updated_at: new Date().toISOString(),
      })
      .eq("template_key", key);

    if (error) {
      return { success: false, message: "Template save error: " + error.message };
    }

    // Write audit log
    const { error: auditErr } = await supabase.from("audit_log").insert({
      actor_id: user.id,
      action: "templates.update",
      target_table: "whatsapp_templates",
      target_id: key,
      before,
      after: { meta_template_name: metaName, body_text: body, variables },
    });
    if (auditErr) {
      console.error("Audit log error in templates:", auditErr.message);
    }

    return { success: true };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : "Error saving template." };
  }
}

