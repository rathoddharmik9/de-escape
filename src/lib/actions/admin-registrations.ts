"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/comms/email";
import { sendWhatsAppTemplate } from "@/lib/comms/whatsapp";

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

function formatICSDate(dateString: string): string {
  const d = new Date(dateString);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  const seconds = String(d.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

function escapeICS(str: string): string {
  return (str || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}


async function verifyAdminSession() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Unauthorized: No session");
  }

  // Check if admin
  const { data: admin } = await supabase
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
  targetId: string,
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
    console.error("Failed to write audit log:", error.message);
  }
}

export type RegistrationActionState = {
  success: boolean;
  message?: string;
};

export async function approveRegistration(registrationId: string): Promise<RegistrationActionState> {
  try {
    const user = await verifyAdminSession();
    const supabase = createAdminClient();

    const { data: reg } = await supabase
      .from("registrations")
      .select("*, events(*)")
      .eq("id", registrationId)
      .single();

    if (!reg) return { success: false, message: "Registration not found." };
    if (reg.status === "approved") {
      return { success: true, message: "Already approved." };
    }

    // Update status to approved
    const { error } = await supabase
      .from("registrations")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq("id", registrationId);

    if (error) {
      return { success: false, message: "Approval database error: " + error.message };
    }

    // Increment registered_count if payment_mode is manual_upi or free (Razorpay is incremented at webhook)
    if (reg.payment_mode !== "razorpay") {
      const { data: ev } = await supabase
        .from("events")
        .select("registered_count")
        .eq("id", reg.event_id)
        .single();
      if (ev) {
        await supabase
          .from("events")
          .update({ registered_count: ev.registered_count + 1 })
          .eq("id", reg.event_id);
      }
    }

    await writeAuditLog(user.id, "registration.approve", "registrations", registrationId, { status: reg.status }, { status: "approved" });

    // Populate reminder queue and send notifications
    if (reg.events) {
      const event = reg.events;
      const now = new Date();
      const remindersToInsert = [];
      const t24Time = new Date(new Date(event.start_at).getTime() - 24 * 60 * 60 * 1000);
      const t2Time = new Date(new Date(event.start_at).getTime() - 2 * 60 * 60 * 1000);
      const postEventTime = new Date(new Date(event.end_at).getTime() + 2 * 60 * 60 * 1000);

      if (t24Time > now) {
        remindersToInsert.push({ registration_id: reg.id, send_at: t24Time.toISOString(), kind: "t_24h" });
      }
      if (t2Time > now) {
        remindersToInsert.push({ registration_id: reg.id, send_at: t2Time.toISOString(), kind: "t_2h" });
      }
      if (postEventTime > now) {
        remindersToInsert.push({ registration_id: reg.id, send_at: postEventTime.toISOString(), kind: "post_event" });
      }

      if (remindersToInsert.length > 0) {
        await supabase.from("reminder_queue").insert(remindersToInsert);
      }

      // Trigger approval comms asynchronously
      (async () => {
        try {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
          const formattedDatetime = formatCommsDate(event.start_at);

          // Get global group invite link from settings
          const { data: groupSetting } = await supabase
            .from("app_settings")
            .select("value")
            .eq("key", "whatsapp_group_invite_link")
            .maybeSingle();
          const groupInviteLink = groupSetting?.value || "https://chat.whatsapp.com/example";

          // Send WhatsApp
          const { data: templateData } = await supabase
            .from("whatsapp_templates")
            .select("meta_template_name")
            .eq("template_key", "approved_pass")
            .maybeSingle();
          const metaTemplateName = templateData?.meta_template_name || "approved_pass";

          const passUrl = `${siteUrl}/p/${reg.pass_code}`;
          await sendWhatsAppTemplate({
            to: reg.phone,
            templateKey: "approved_pass",
            metaTemplateName,
            variables: [
              reg.full_name,
              event.title,
              formattedDatetime,
              event.venue_name,
              reg.pass_code,
              passUrl,
              groupInviteLink
            ],
            registrationId: reg.id,
            eventId: event.id,
          });

          // Generate ICS calendar attachment
          const icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//De-escape//Event Calendar//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:REQUEST",
            "BEGIN:VEVENT",
            `UID:${reg.id}@de-escape.in`,
            `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
            `DTSTART:${formatICSDate(event.start_at)}`,
            `DTEND:${formatICSDate(event.end_at)}`,
            `SUMMARY:${escapeICS(event.title)}`,
            `LOCATION:${escapeICS(`${event.venue_name}, ${event.venue_address}`)}`,
            `DESCRIPTION:Your De-escape Pass Code: ${reg.pass_code}\\n\\nView your pass: ${siteUrl}/p/${reg.pass_code}\\n\\nRefund Policy: ${escapeICS(event.refund_policy)}`,
            `URL:${siteUrl}/p/${reg.pass_code}`,
            "END:VEVENT",
            "END:VCALENDAR"
          ].join("\r\n");

          const icsAttachment = {
            filename: `de-escape-event-${reg.pass_code}.ics`,
            content: icsContent,
          };

          // Send Email
          const emailSubject = `Your Pass is Approved! - ${event.title}`;
          const emailHtml = `
            <h2 style="font-family: 'Fredoka', sans-serif; color: #2C8A4B; margin-top: 0;">You're In!</h2>
            <p>Hey ${reg.full_name},</p>
            <p>We're thrilled to confirm your registration for <strong>${event.title}</strong>!</p>
            
            <div style="background-color: #FBF6E6; border: 1px solid rgba(20,51,31,0.08); padding: 20px; border-radius: 16px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>📅 Date & Time:</strong><br>${formattedDatetime}</p>
              <p style="margin: 0 0 10px 0;"><strong>📍 Venue:</strong><br>${event.venue_name}<br><span style="font-size: 12px; color: #8A9384;">${event.venue_address}</span></p>
              <p style="margin: 0;"><strong>🎫 Pass Code:</strong><br><code style="font-size: 16px; color: #2C8A4B; font-weight: 600;">${reg.pass_code}</code></p>
            </div>

            <p>We have attached a calendar invite (.ics) to this email so you can add it to your calendar easily.</p>
            <p>You can also access your pass online to view details and directions:</p>
            <p style="text-align: center; margin: 25px 0;">
              <a href="${passUrl}" style="background-color: #2C8A4B; color: #FBF6E6; padding: 12px 24px; border-radius: 12px; font-weight: 500; text-decoration: none; display: inline-block;">View Ticket Pass</a>
            </p>
            <p>Join our event WhatsApp community to meet other attendees: <a href="${groupInviteLink}">${groupInviteLink}</a></p>
            <p>See you at the event!</p>
          `;

          await sendEmail({
            to: reg.email,
            subject: emailSubject,
            templateKey: "approved_pass",
            registrationId: reg.id,
            eventId: event.id,
            payload: { name: reg.full_name, event_title: event.title },
            htmlContent: emailHtml,
            icsAttachment,
          });
        } catch (commsErr) {
          console.error("Error triggering approval notifications:", commsErr);
        }
      })();
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, message };
  }
}

export async function rejectRegistration(registrationId: string, reason: string): Promise<RegistrationActionState> {
  try {
    const user = await verifyAdminSession();
    const supabase = createAdminClient();

    const { data: reg } = await supabase
      .from("registrations")
      .select("*, events(*)")
      .eq("id", registrationId)
      .single();

    if (!reg) return { success: false, message: "Registration not found." };

    const { error } = await supabase
      .from("registrations")
      .update({
        status: "rejected",
        rejected_reason: reason,
      })
      .eq("id", registrationId);

    if (error) {
      return { success: false, message: "Rejection error: " + error.message };
    }

    await writeAuditLog(user.id, "registration.reject", "registrations", registrationId, { status: reg.status }, { status: "rejected", reason });

    // Trigger rejection comms asynchronously
    if (reg.events) {
      const event = reg.events;
      (async () => {
        try {
          const { data: templateData } = await supabase
            .from("whatsapp_templates")
            .select("meta_template_name")
            .eq("template_key", "rejected")
            .maybeSingle();
          const metaTemplateName = templateData?.meta_template_name || "rejected";

          await sendWhatsAppTemplate({
            to: reg.phone,
            templateKey: "rejected",
            metaTemplateName,
            variables: [reg.full_name, event.title, reason],
            registrationId: reg.id,
            eventId: event.id,
          });

          const emailHtml = `
            <h2 style="font-family: 'Fredoka', sans-serif; color: #D32F2F; margin-top: 0;">Registration Update</h2>
            <p>Hi ${reg.full_name},</p>
            <p>Thank you for your interest in <strong>${event.title}</strong>.</p>
            <p>Unfortunately, we are unable to approve your registration at this time for the following reason:</p>
            <blockquote style="background-color: #FBF6E6; border-left: 4px solid #D32F2F; padding: 15px; margin: 20px 0; font-style: italic;">
              ${reason}
            </blockquote>
            <p>If you have any questions or feel there has been a mistake, please reach out to us by replying to this email or contacting our team on WhatsApp.</p>
          `;

          await sendEmail({
            to: reg.email,
            subject: `Registration Update: ${event.title}`,
            templateKey: "rejected",
            registrationId: reg.id,
            eventId: event.id,
            payload: { name: reg.full_name, event_title: event.title, reason },
            htmlContent: emailHtml,
          });
        } catch (commsErr) {
          console.error("Error sending rejection comms:", commsErr);
        }
      })();
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, message };
  }
}

export async function refundRegistration(registrationId: string): Promise<RegistrationActionState> {
  try {
    const user = await verifyAdminSession();
    const supabase = createAdminClient();

    const { data: reg } = await supabase
      .from("registrations")
      .select("*, events(*)")
      .eq("id", registrationId)
      .single();

    if (!reg) return { success: false, message: "Registration not found." };

    const { error } = await supabase
      .from("registrations")
      .update({
        status: "refunded",
      })
      .eq("id", registrationId);

    if (error) {
      return { success: false, message: "Refund error: " + error.message };
    }

    // Decrement registered_count on refund
    const { data: ev } = await supabase
      .from("events")
      .select("registered_count")
      .eq("id", reg.event_id)
      .single();

    if (ev && ev.registered_count > 0) {
      await supabase
        .from("events")
        .update({ registered_count: ev.registered_count - 1 })
        .eq("id", reg.event_id);
    }

    await writeAuditLog(user.id, "registration.refund", "registrations", registrationId, { status: reg.status }, { status: "refunded" });

    // Trigger refund processed comms asynchronously
    if (reg.events) {
      const event = reg.events;
      const amountFormatted = `₹${(reg.amount_paise / 100).toFixed(2)}`;
      (async () => {
        try {
          const { data: templateData } = await supabase
            .from("whatsapp_templates")
            .select("meta_template_name")
            .eq("template_key", "refund_processed")
            .maybeSingle();
          const metaTemplateName = templateData?.meta_template_name || "refund_processed";

          await sendWhatsAppTemplate({
            to: reg.phone,
            templateKey: "refund_processed",
            metaTemplateName,
            variables: [reg.full_name, amountFormatted, event.title],
            registrationId: reg.id,
            eventId: event.id,
          });

          const emailHtml = `
            <h2 style="font-family: 'Fredoka', sans-serif; color: #2C8A4B; margin-top: 0;">Refund Processed</h2>
            <p>Hi ${reg.full_name},</p>
            <p>This is to confirm that your refund of <strong>${amountFormatted}</strong> for the event <strong>${event.title}</strong> has been processed.</p>
            <p>It typically takes 5-7 business days for the funds to reflect back in your original payment method.</p>
          `;

          await sendEmail({
            to: reg.email,
            subject: `Refund Processed: ${event.title}`,
            templateKey: "refund_processed",
            registrationId: reg.id,
            eventId: event.id,
            payload: { name: reg.full_name, amount: amountFormatted, event_title: event.title },
            htmlContent: emailHtml,
          });
        } catch (commsErr) {
          console.error("Error sending refund comms:", commsErr);
        }
      })();
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, message };
  }
}

export async function markAttendance(registrationId: string, attended: boolean): Promise<RegistrationActionState> {
  try {
    const user = await verifyAdminSession();
    const supabase = createAdminClient();

    const { data: reg } = await supabase
      .from("registrations")
      .select("status")
      .eq("id", registrationId)
      .single();

    if (!reg) return { success: false, message: "Registration not found." };

    const status = attended ? "attended" : "no_show";

    const { error } = await supabase
      .from("registrations")
      .update({
        status,
        attended_at: attended ? new Date().toISOString() : null,
      })
      .eq("id", registrationId);

    if (error) {
      return { success: false, message: "Attendance update error: " + error.message };
    }

    await writeAuditLog(user.id, "registration.mark_attendance", "registrations", registrationId, { status: reg.status }, { status });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, message };
  }
}
