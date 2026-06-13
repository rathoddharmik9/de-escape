"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTurnstile } from "@/lib/turnstile";
import { generateUniquePassCode } from "@/lib/passcode";
import { z } from "zod";
import Razorpay from "razorpay";
import { sendEmail } from "@/lib/comms/email";
import { sendWhatsAppTemplate } from "@/lib/comms/whatsapp";
import { revalidatePath } from "next/cache";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch (error) {
    // Ignore Next.js invariant errors outside request context
  }
}


const registerSchema = z.object({
  eventId: z.string().uuid(),
  fullName: z.string().min(2).max(80),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Must be a 10-digit Indian phone number"),
  email: z.string().email(),
  age: z.number().int().min(13).max(99),
  city: z.string().min(1),
  instagram: z.string().optional(),
  heardFrom: z.string().optional(),
  notes: z.string().max(400).optional(),
  consent: z.literal(true),
  screenshotBase64: z.string().optional(),
  screenshotName: z.string().optional(),
  turnstileToken: z.string(),
  customAnswers: z.record(z.string(), z.any()).optional(),
});

export type RegisterState = {
  success: boolean;
  message?: string;
  registrationId?: string;
  passCode?: string;
  status?: string;
  razorpayOrder?: {
    id: string;
    amount: number;
    keyId: string;
  };
};

export async function registerAttendee(rawInput: unknown): Promise<RegisterState> {
  try {
    const supabase = createAdminClient();

    // 1. Validate inputs
    const parsed = registerSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
      };
    }

    const {
      eventId,
      fullName,
      phone,
      email,
      age,
      city,
      instagram,
      heardFrom,
      notes,
      consent,
      screenshotBase64,
      screenshotName,
      turnstileToken,
      customAnswers,
    } = parsed.data;

    // Normalize inputs
    const normalizedPhone = `+91${phone}`;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Cloudflare Turnstile token validation
    const turnstileOk = await verifyTurnstile(turnstileToken);
    if (!turnstileOk) {
      return { success: false, message: "Security verification failed. Please try again." };
    }

    // 3. Block-list checks
    const { data: blocked } = await supabase
      .from("blocked_contacts")
      .select("id")
      .or(`phone.eq.${normalizedPhone},email.eq.${normalizedEmail}`)
      .limit(1)
      .maybeSingle();

    if (blocked) {
      // Vague success response to avoid leaking block list info
      return {
        success: true,
        message: "Registration received. We'll contact you if any details are required.",
        status: "pending",
      };
    }

    // 4. Check double registration (already registered for this event)
    const { data: existingReg } = await supabase
      .from("registrations")
      .select("id, pass_code, status")
      .eq("event_id", eventId)
      .eq("phone", normalizedPhone)
      .eq("email", normalizedEmail)
      .limit(1)
      .maybeSingle();

    if (existingReg) {
      return {
        success: true,
        message: "You have already registered for this event.",
        registrationId: existingReg.id,
        passCode: existingReg.pass_code,
        status: existingReg.status,
      };
    }

    // 5. Get Event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return { success: false, message: "Event not found." };
    }

    if (event.status === "draft" || event.status === "cancelled" || event.status === "past") {
      return { success: false, message: "This event is no longer active." };
    }

    // Check capacity
    if (event.registered_count >= event.capacity) {
      return { success: false, message: "This event is fully booked." };
    }

    // 6. Pass code generation
    const passCode = await generateUniquePassCode(eventId);

    // Prepare common registration payload
    const registrationId = crypto.randomUUID();
    let status = "pending";
    let screenshotUrl = null;

    // 7. UPI Flow screenshot upload
    if (event.payment_mode === "manual_upi") {
      status = "awaiting_verification";
      if (screenshotBase64 && screenshotName) {
        try {
          const buffer = Buffer.from(screenshotBase64.split(",")[1] || screenshotBase64, "base64");
          const ext = screenshotName.split(".").pop() || "png";
          const path = `event-${eventId}/reg-${registrationId}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("payment-proofs")
            .upload(path, buffer, {
              contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
              upsert: true,
            });

          if (uploadError) {
            console.error("Storage upload error:", uploadError.message);
            return { success: false, message: "Failed to upload payment proof screenshot." };
          }
          screenshotUrl = path;
        } catch (err) {
          console.error("Base64 decode error:", err);
          return { success: false, message: "Screenshot upload error." };
        }
      } else {
        return { success: false, message: "Payment screenshot is required for UPI payment." };
      }
    } else if (event.payment_mode === "razorpay") {
      status = "awaiting_payment";
    } else if (event.payment_mode === "free") {
      status = "awaiting_verification";
    }

    // 8. Razorpay Order Creation
    let razorpayOrder = undefined;
    let razorpayOrderId = null;

    if (event.payment_mode === "razorpay") {
      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return { success: false, message: "Razorpay payment integration is not configured." };
      }

      try {
        const razorpay = new Razorpay({
          key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const order = await razorpay.orders.create({
          amount: event.price_paise,
          currency: "INR",
          receipt: registrationId,
        });

        razorpayOrderId = order.id;
        razorpayOrder = {
          id: order.id,
          amount: event.price_paise,
          keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        };
      } catch (err) {
        console.error("Razorpay order creation failed:", err);
        return { success: false, message: "Failed to initiate online payment." };
      }
    }

    // 9. Write to database
    const { error: insertError } = await supabase.from("registrations").insert({
      id: registrationId,
      event_id: eventId,
      pass_code: passCode,
      full_name: fullName,
      phone: normalizedPhone,
      email: normalizedEmail,
      age,
      city,
      instagram: instagram || null,
      heard_from: heardFrom || null,
      notes: notes || null,
      custom_answers: customAnswers || {},
      payment_mode: event.payment_mode,
      razorpay_order_id: razorpayOrderId,
      amount_paise: event.price_paise,
      screenshot_url: screenshotUrl,
      status,
      consent_whatsapp: consent,
    });

    if (insertError) {
      console.error("Database insert error:", insertError.message);
      return { success: false, message: "Database registration error." };
    }

    safeRevalidatePath("/");
    safeRevalidatePath("/events");
    safeRevalidatePath(`/events/${event.slug}`);

    // 10. Outbound Comms Triggers
    if (status === "awaiting_verification") {
      (async () => {
        try {
          if (event.payment_mode === "manual_upi") {
            const { data: templateData } = await supabase
              .from("whatsapp_templates")
              .select("meta_template_name")
              .eq("template_key", "upi_screenshot_received")
              .maybeSingle();
            const metaTemplateName = templateData?.meta_template_name || "upi_screenshot_received";

            await sendWhatsAppTemplate({
              to: normalizedPhone,
              templateKey: "upi_screenshot_received",
              metaTemplateName,
              variables: [fullName, event.title],
              registrationId,
              eventId,
            });

            const emailHtml = `
              <h2 style="font-family: 'Fredoka', sans-serif; color: #2C8A4B; margin-top: 0;">Payment Proof Submitted</h2>
              <p>Hey ${fullName},</p>
              <p>We've received your payment screenshot for <strong>${event.title}</strong>.</p>
              <p>Our team is verifying the transaction details. We'll send you your passcode and ticket pass as soon as the review is complete.</p>
            `;
            await sendEmail({
              to: normalizedEmail,
              subject: `Payment Proof Submitted: ${event.title}`,
              templateKey: "upi_screenshot_received",
              registrationId,
              eventId,
              payload: { name: fullName, event_title: event.title },
              htmlContent: emailHtml,
            });
          } else if (event.payment_mode === "free") {
            const { data: templateData } = await supabase
              .from("whatsapp_templates")
              .select("meta_template_name")
              .eq("template_key", "registration_received")
              .maybeSingle();
            const metaTemplateName = templateData?.meta_template_name || "registration_received";

            const formattedDate = new Date(event.start_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            await sendWhatsAppTemplate({
              to: normalizedPhone,
              templateKey: "registration_received",
              metaTemplateName,
              variables: [fullName, event.title, formattedDate],
              registrationId,
              eventId,
            });

            const emailHtml = `
              <h2 style="font-family: 'Fredoka', sans-serif; color: #2C8A4B; margin-top: 0;">Registration Received</h2>
              <p>Hey ${fullName},</p>
              <p>We've received your registration for <strong>${event.title}</strong> on <strong>${formattedDate}</strong>.</p>
              <p>Our team is reviewing your registration. We'll send you your passcode and ticket pass once approved.</p>
            `;
            await sendEmail({
              to: normalizedEmail,
              subject: `Registration Received: ${event.title}`,
              templateKey: "registration_received",
              registrationId,
              eventId,
              payload: { name: fullName, event_title: event.title, event_date: formattedDate },
              htmlContent: emailHtml,
            });
          }
        } catch (commsErr) {
          console.error("Error triggering registration welcome comms:", commsErr);
        }
      })();
    }

    return {
      success: true,
      registrationId,
      passCode,
      status,
      razorpayOrder,
    };
  } catch (err) {
    console.error("Register attendee general error:", err);
    return { success: false, message: "An unexpected error occurred." };
  }
}
