import { SESClient, SendEmailCommand, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { createAdminClient } from "@/lib/supabase/admin";

const AWS_REGION = process.env.AWS_REGION || "ap-south-1";
const SES_SENDER_EMAIL = process.env.SES_SENDER_EMAIL || "De-escape <noreply@de-escape.in>";

// AWS SES client lazy initialization
let sesClient: SESClient | null = null;
function getSESClient() {
  if (!sesClient) {
    sesClient = new SESClient({
      region: AWS_REGION,
    });
  }
  return sesClient;
}

// Write outbound log helper
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
      channel: "email",
      template_key: templateKey,
      recipient,
      payload,
      provider_message_id: providerMessageId,
      status,
      error,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    });
  } catch (err) {
    console.error("Failed to write message log to DB:", err);
  }
}

// Brand email wrapper
function wrapEmailHtml(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>De-escape</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@900&family=Poppins:wght@300;400;500;600&display=swap');
          body {
            margin: 0;
            padding: 0;
            background-color: #F5ECCE;
            font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #14331F;
          }
        </style>
      </head>
      <body>
        <div style="background-color: #F5ECCE; padding: 40px 20px; min-height: 100vh;">
          <div style="background-color: #FBF6E6; max-width: 560px; margin: 0 auto; border-radius: 24px; border: 1px solid rgba(20, 51, 31, 0.08); overflow: hidden; box-shadow: 0 4px 20px rgba(20,51,31,0.02);">
            
            <!-- Brand Header -->
            <div style="padding: 30px 30px 20px 30px; text-align: center; border-bottom: 1px solid rgba(20, 51, 31, 0.05);">
              <span style="font-family: 'Nunito', 'Segoe UI', sans-serif; font-size: 26px; font-weight: 900; color: #1a7138; letter-spacing: 0.2px;">De-escape</span>
              <div style="font-size: 9px; text-transform: uppercase; tracking-widest: 0.15em; color: #8A9384; margin-top: 4px;">discover what's around you</div>
            </div>

            <!-- Content Area -->
            <div style="padding: 35px 30px; background-color: #FFFFFF; font-size: 14px; line-height: 1.6; color: #14331F;">
              ${content}
            </div>

            <!-- Brand Footer -->
            <div style="padding: 24px 30px; text-align: center; border-top: 1px solid rgba(20, 51, 31, 0.05); font-size: 11px; color: #8A9384;">
              <p style="margin: 0 0 8px 0;">This email is sent on behalf of De-escape.</p>
              <p style="margin: 0;">If you have any questions, reply to this email or reach out via WhatsApp.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export interface EmailOptions {
  to: string;
  subject: string;
  templateKey: string;
  registrationId?: string | null;
  eventId?: string | null;
  payload: Record<string, unknown>;
  htmlContent: string;
  icsAttachment?: {
    filename: string;
    content: string; // Plain ICS text
  };
  bcc?: string[];
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, subject, templateKey, registrationId = null, eventId = null, payload, htmlContent, icsAttachment, bcc } = options;
  const fullHtml = wrapEmailHtml(htmlContent);

  const adminBcc = process.env.ADMIN_BCC_EMAIL || "dharmik@de-escape.in";
  const bccAddresses = bcc || [adminBcc];
  const filteredBcc = bccAddresses.filter(
    (email) => email.toLowerCase().trim() !== to.toLowerCase().trim()
  );

  try {
    const client = getSESClient();
    let messageId: string | undefined;

    if (icsAttachment) {
      // Build raw MIME email with attachment
      const boundary = `----=_Part_${crypto.randomUUID().replace(/-/g, "")}`;
      
      const rawLines = [
        `From: ${SES_SENDER_EMAIL}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset=UTF-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        fullHtml,
        ``,
        `--${boundary}`,
        `Content-Type: text/calendar; method=REQUEST; name="${icsAttachment.filename}"`,
        `Content-Transfer-Encoding: base64`,
        `Content-Disposition: attachment; filename="${icsAttachment.filename}"`,
        ``,
        Buffer.from(icsAttachment.content).toString("base64"),
        ``,
        `--${boundary}--`
      ];

      const rawMessage = rawLines.join("\r\n");

      const response = await client.send(
        new SendRawEmailCommand({
          RawMessage: {
            Data: Buffer.from(rawMessage),
          },
          Source: SES_SENDER_EMAIL,
          Destination: {
            ToAddresses: [to],
            BccAddresses: filteredBcc.length > 0 ? filteredBcc : undefined,
          },
        })
      );
      messageId = response.MessageId;
    } else {
      // Standard SES command
      const response = await client.send(
        new SendEmailCommand({
          Source: SES_SENDER_EMAIL,
          Destination: {
            ToAddresses: [to],
            BccAddresses: filteredBcc.length > 0 ? filteredBcc : undefined,
          },
          Message: {
            Subject: {
              Data: subject,
              Charset: "UTF-8",
            },
            Body: {
              Html: {
                Data: fullHtml,
                Charset: "UTF-8",
              },
            },
          },
        })
      );
      messageId = response.MessageId;
    }

    if (!messageId) {
      throw new Error("No MessageId returned from SES Client.");
    }

    await logMessage(registrationId, eventId, to, templateKey, payload, "sent", null, messageId);
    return { success: true, messageId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "AWS SES service error";
    console.error("Failed to send email via AWS SES:", errorMsg);
    await logMessage(registrationId, eventId, to, templateKey, payload, "failed", errorMsg, null);
    return { success: false, error: errorMsg };
  }
}
