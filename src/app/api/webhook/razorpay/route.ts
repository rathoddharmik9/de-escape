import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/comms/email";
import { sendWhatsAppTemplate } from "@/lib/comms/whatsapp";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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


export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: "Missing signature or secret key." }, { status: 400 });
    }

    const expectedSignature = createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("Invalid webhook signature.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const body = JSON.parse(rawBody);
    const event = body.event;

    if (event === "payment.captured") {
      const payment = body.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      if (orderId) {
        const supabase = createAdminClient();

        // 1. Get the registration matching the order_id
        const { data: registration, error: regError } = await supabase
          .from("registrations")
          .select("*, events(*)")
          .eq("razorpay_order_id", orderId)
          .maybeSingle();

        if (regError || !registration) {
          console.error(`Registration not found for order ID: ${orderId}`);
          return NextResponse.json({ error: "Registration not found" }, { status: 404 });
        }

        // 2. If it's awaiting_payment, update it to awaiting_verification
        if (registration.status === "awaiting_payment" || registration.status === "pending") {
          const { error: updateError } = await supabase
            .from("registrations")
            .update({
              status: "awaiting_verification",
              razorpay_payment_id: paymentId,
              razorpay_signature: signature,
            })
            .eq("id", registration.id);

          if (updateError) {
            console.error(`Failed to update registration: ${updateError.message}`);
            return NextResponse.json({ error: "Database update failed" }, { status: 500 });
          }

          // 3. Increment registered_count on the event
          const { data: ev, error: evErr } = await supabase
            .from("events")
            .select("registered_count")
            .eq("id", registration.event_id)
            .single();

          if (ev && !evErr) {
            await supabase
              .from("events")
              .update({ registered_count: ev.registered_count + 1 })
              .eq("id", registration.event_id);
          }

          // 4. Send payment confirmation comms
          if (registration.events) {
            const event = registration.events;
            const amountFormatted = `₹${(payment.amount / 100).toFixed(0)}`;
            
            (async () => {
              try {
                const { data: templateData } = await supabase
                  .from("whatsapp_templates")
                  .select("meta_template_name")
                  .eq("template_key", "payment_confirmed")
                  .maybeSingle();
                const metaTemplateName = templateData?.meta_template_name || "payment_confirmed";

                await sendWhatsAppTemplate({
                  to: registration.phone,
                  templateKey: "payment_confirmed",
                  metaTemplateName,
                  variables: [registration.full_name, amountFormatted, event.title, orderId],
                  registrationId: registration.id,
                  eventId: event.id,
                });

                const emailHtml = `
                  <h2 style="font-family: 'Fredoka', sans-serif; color: #2C8A4B; margin-top: 0;">Payment Confirmed!</h2>
                  <p>Hey ${registration.full_name},</p>
                  <p>We've successfully received your payment of <strong>${amountFormatted}</strong> for <strong>${event.title}</strong>.</p>
                  <p>Order ID: <code>${orderId}</code><br>Payment ID: <code>${paymentId}</code></p>
                  <p>Our team is currently verifying the registration details. Once approved, we will send your official entry passcode.</p>
                `;
                await sendEmail({
                  to: registration.email,
                  subject: `Payment Confirmed: ${event.title}`,
                  templateKey: "payment_confirmed",
                  registrationId: registration.id,
                  eventId: event.id,
                  payload: { name: registration.full_name, amount: amountFormatted, event_title: event.title, order_id: orderId },
                  htmlContent: emailHtml,
                });
              } catch (commsErr) {
                console.error("Error sending payment confirmation comms:", commsErr);
              }
            })();
          }
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
