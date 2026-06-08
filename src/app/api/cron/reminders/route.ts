import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/comms/email";
import { sendWhatsAppTemplate } from "@/lib/comms/whatsapp";

export const dynamic = "force-dynamic";


const CRON_SECRET = process.env.CRON_SECRET;

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

const DEFAULT_META_TEMPLATES: Record<string, string> = {
  registration_received: "registration_received",
  payment_confirmed: "payment_confirmed",
  upi_screenshot_received: "upi_screenshot_received",
  approved_pass: "approved_pass",
  rejected: "rejected",
  reminder_t_24h: "reminder_t_24h",
  reminder_t_2h: "reminder_t_2h",
  event_cancelled: "event_cancelled",
  refund_processed: "refund_processed",
  post_event_thanks: "post_event_thanks",
};

export async function GET(request: Request) {
  try {
    // 1. Verify cron authorization secret header
    const authHeader = request.headers.get("Authorization");
    if (process.env.NODE_ENV === "production" || CRON_SECRET) {
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    const supabase = createAdminClient();

    // 2. Fetch pending reminders (send_at <= now() and sent = false)
    const { data: queue, error: queueError } = await supabase
      .from("reminder_queue")
      .select("*")
      .eq("sent", false)
      .lte("send_at", new Date().toISOString())
      .limit(100);

    if (queueError) {
      console.error("Failed to query reminder queue:", queueError.message);
      return new NextResponse("Database select error.", { status: 500 });
    }

    if (!queue || queue.length === 0) {
      return NextResponse.json({ processed: 0, message: "No pending reminders." });
    }

    // 3. Load Meta templates mapping from DB cache
    const { data: templates } = await supabase
      .from("whatsapp_templates")
      .select("template_key, meta_template_name")
      .eq("status", "approved");

    const templateMap = { ...DEFAULT_META_TEMPLATES };
    if (templates) {
      templates.forEach((t) => {
        templateMap[t.template_key] = t.meta_template_name;
      });
    }

    let processedCount = 0;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    for (const item of queue) {
      // Mark as sent immediately to prevent race-condition pings in parallel
      await supabase
        .from("reminder_queue")
        .update({ sent: true, updated_at: new Date().toISOString() })
        .eq("id", item.id);

      // Fetch registration joined with event details
      const { data: reg } = await supabase
        .from("registrations")
        .select("*, events(*)")
        .eq("id", item.registration_id)
        .maybeSingle();

      if (!reg || !reg.events) {
        continue; // Orphaned reminder
      }

      // Suppress reminder if attendee is cancelled, rejected, or refunded
      if (reg.status !== "approved" && reg.status !== "attended") {
        continue;
      }

      const event = reg.events;
      const formattedDatetime = formatCommsDate(event.start_at);

      if (item.kind === "t_24h") {
        // T-24h reminder (Email + WhatsApp)
        processedCount++;

        // A. Outbound Email
        const emailSubject = `Tomorrow: ${event.title}`;
        const emailHtml = `
          <h2 style="font-family: 'Fredoka', sans-serif; color: #2C8A4B; margin-top: 0;">Tomorrow is the day!</h2>
          <p>Hey ${reg.full_name},</p>
          <p>This is a friendly reminder that you're registered for <strong>${event.title}</strong> tomorrow.</p>
          
          <div style="background-color: #FBF6E6; border: 1px solid rgba(20,51,31,0.08); padding: 20px; border-radius: 16px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>📅 Date & Time:</strong><br>${formattedDatetime}</p>
            <p style="margin: 0 0 10px 0;"><strong>📍 Venue:</strong><br>${event.venue_name}<br><span style="font-size: 12px; color: #8A9384;">${event.venue_address}</span></p>
            <p style="margin: 0;"><strong>🎫 Pass Code:</strong><br><code style="font-size: 16px; color: #2C8A4B; font-weight: 600;">${reg.pass_code}</code></p>
          </div>

          <p>Please keep your passcode handy on arrival. You can view your pass page at any time:</p>
          <p style="text-align: center; margin: 25px 0;">
            <a href="${siteUrl}/p/${reg.pass_code}" style="background-color: #2C8A4B; color: #FBF6E6; padding: 12px 24px; border-radius: 12px; font-weight: 500; text-decoration: none; display: inline-block;">View Ticket Pass</a>
          </p>
          <p>See you tomorrow!</p>
        `;

        await sendEmail({
          to: reg.email,
          subject: emailSubject,
          templateKey: "reminder_t_24h",
          registrationId: reg.id,
          eventId: event.id,
          payload: { name: reg.full_name, event_title: event.title },
          htmlContent: emailHtml,
        });

        // B. Outbound WhatsApp Template
        await sendWhatsAppTemplate({
          to: reg.phone,
          templateKey: "reminder_t_24h",
          metaTemplateName: templateMap.reminder_t_24h,
          variables: [reg.full_name, event.title, formattedDatetime, event.venue_name, reg.pass_code],
          registrationId: reg.id,
          eventId: event.id,
        });

      } else if (item.kind === "t_2h") {
        // T-2h reminder (WhatsApp only per spec §14)
        processedCount++;

        await sendWhatsAppTemplate({
          to: reg.phone,
          templateKey: "reminder_t_2h",
          metaTemplateName: templateMap.reminder_t_2h,
          variables: [reg.full_name, event.title, reg.pass_code, event.venue_map_url || `${siteUrl}/p/${reg.pass_code}`],
          registrationId: reg.id,
          eventId: event.id,
        });

      } else if (item.kind === "post_event") {
        // T+24h post-event thank you (Email + WhatsApp)
        processedCount++;

        // A. Outbound Email
        const emailSubject = `Thanks for coming to ${event.title}!`;
        const emailHtml = `
          <h2 style="font-family: 'Fredoka', sans-serif; color: #2C8A4B; margin-top: 0;">Thank you!</h2>
          <p>Hey ${reg.full_name},</p>
          <p>We wanted to say a huge thank you for attending <strong>${event.title}</strong> yesterday.</p>
          <p>We hope you had a relaxing and meaningful experience. We'd love to hear your feedback on the event, or feel free to share your thoughts directly by replying to this email.</p>
          <p>Keep an eye on the discovery feed for upcoming sound baths, dinners, and events.</p>
          <p style="text-align: center; margin: 25px 0;">
            <a href="${siteUrl}/events" style="background-color: #2C8A4B; color: #FBF6E6; padding: 12px 24px; border-radius: 12px; font-weight: 500; text-decoration: none; display: inline-block;">Explore Next Events</a>
          </p>
          <p>Warmly,<br>The De-escape Team</p>
        `;

        await sendEmail({
          to: reg.email,
          subject: emailSubject,
          templateKey: "post_event_thanks",
          registrationId: reg.id,
          eventId: event.id,
          payload: { name: reg.full_name, event_title: event.title },
          htmlContent: emailHtml,
        });

        // B. Outbound WhatsApp Template
        await sendWhatsAppTemplate({
          to: reg.phone,
          templateKey: "post_event_thanks",
          metaTemplateName: templateMap.post_event_thanks,
          variables: [reg.full_name, event.title, `${siteUrl}/events`],
          registrationId: reg.id,
          eventId: event.id,
        });
      }
    }

    return NextResponse.json({ processed: processedCount, message: "Reminders processed successfully." });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected cron reminders execution error";
    console.error("Cron reminders execution failed:", errorMsg);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}
