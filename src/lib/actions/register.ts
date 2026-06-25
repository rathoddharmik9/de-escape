"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateUniquePassCode } from "@/lib/passcode";
import { sendEmail } from "@/lib/comms/email";
import { sendWhatsAppTemplate } from "@/lib/comms/whatsapp";
import { revalidatePath } from "next/cache";
import {
  detectPaymentProofMime,
  extensionForPaymentProof,
  MAX_PAYMENT_PROOF_BYTES,
  RegistrationFieldErrors,
  registrationActionSchema,
  validateCustomAnswers,
  zodIssuesToFieldErrors,
} from "@/lib/validation/registration";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore Next.js invariant errors outside request context
  }
}

export type RegisterState = {
  success: boolean;
  message?: string;
  fieldErrors?: RegistrationFieldErrors;
  registrationId?: string;
  passCode?: string;
  status?: string;
};

export async function registerAttendee(rawInput: unknown): Promise<RegisterState> {
  try {
    const supabase = createAdminClient();

    // 1. Validate inputs
    const parsed = registrationActionSchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors = zodIssuesToFieldErrors(parsed.error);
      return {
        success: false,
        message: Object.values(fieldErrors)[0] || "Please fix the highlighted fields.",
        fieldErrors,
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
      customAnswers,
    } = parsed.data;

    // Normalize inputs
    const normalizedPhone = `+91${phone}`;
    const normalizedEmail = email;

    // 2. Block-list checks
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

    const customValidation = validateCustomAnswers(event.custom_fields ?? [], customAnswers ?? {});
    if (!customValidation.success) {
      return {
        success: false,
        message: Object.values(customValidation.errors)[0] || "Please fix the highlighted fields.",
        fieldErrors: customValidation.errors,
      };
    }

    const eventHasEnded = new Date(event.end_at).getTime() <= Date.now();
    if (event.status === "draft" || event.status === "cancelled" || event.status === "past" || eventHasEnded) {
      return { success: false, message: "Registration is closed for this event." };
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
          const base64Payload = screenshotBase64.split(",")[1] || screenshotBase64;
          const buffer = Buffer.from(base64Payload, "base64");
          if (buffer.length > MAX_PAYMENT_PROOF_BYTES) {
            return {
              success: false,
              message: "Payment proof must be 5 MB or smaller.",
              fieldErrors: { screenshot: "Payment proof must be 5 MB or smaller." },
            };
          }
          const detectedMime = detectPaymentProofMime(buffer);
          if (!detectedMime) {
            return {
              success: false,
              message: "Payment proof must be a real JPG, PNG, HEIC, or HEIF image.",
              fieldErrors: { screenshot: "Upload a real JPG, PNG, HEIC, or HEIF payment screenshot." },
            };
          }
          const ext = extensionForPaymentProof(screenshotName, detectedMime);
          if (!ext) {
            return {
              success: false,
              message: "Payment proof must be a JPG, PNG, HEIC, or HEIF image.",
              fieldErrors: { screenshot: "Upload a JPG, PNG, HEIC, or HEIF payment screenshot." },
            };
          }
          const path = `event-${eventId}/reg-${registrationId}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("payment-proofs")
            .upload(path, buffer, {
              contentType: detectedMime,
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
        return {
          success: false,
          message: "Payment screenshot is required for UPI payment.",
          fieldErrors: { screenshot: "Payment screenshot is required." },
        };
      }
    } else if (event.payment_mode === "free") {
      status = "awaiting_verification";
    }

    // 8. Write to database
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
      custom_answers: customValidation.data,
      payment_mode: event.payment_mode,
      amount_paise: event.price_paise,
      screenshot_url: screenshotUrl,
      status,
      consent_whatsapp: consent,
    });

    if (insertError) {
      console.error("Database insert error:", insertError.message);
      return { success: false, message: "Database registration error." };
    }

    const { error: countError } = await supabase
      .from("events")
      .update({ registered_count: event.registered_count + 1 })
      .eq("id", eventId);

    if (countError) {
      console.error("Registered count update error:", countError.message);
    }

    safeRevalidatePath("/");
    safeRevalidatePath("/events");
    safeRevalidatePath(`/events/${event.slug}`);

    // 9. Outbound Comms Triggers
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
              <p>Our team will follow up on WhatsApp with the next steps for this event.</p>
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
              <p>Our team will follow up on WhatsApp with the next steps for this event.</p>
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
    };
  } catch (err) {
    console.error("Register attendee general error:", err);
    return { success: false, message: "An unexpected error occurred." };
  }
}
