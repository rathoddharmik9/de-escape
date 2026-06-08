"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const eventInputSchema = z.object({
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers, and dashes only"),
  title: z.string().min(2),
  tagline: z.string().optional(),
  description: z.string().min(1),
  coverImageUrl: z.string().optional(),
  category: z.enum(["sound_bath", "supper", "run", "book_circle", "cycling", "other"]),
  startAt: z.string(), // ISO string
  endAt: z.string(),
  venueName: z.string().min(1),
  venueAddress: z.string().min(1),
  venueMapUrl: z.string().url().or(z.literal("")),
  capacity: z.number().int().min(1),
  pricePaise: z.number().int().min(0),
  paymentMode: z.enum(["razorpay", "manual_upi", "free"]),
  upiId: z.string().optional(),
  refundPolicy: z.string().min(1),
});

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

export type ActionState = {
  success: boolean;
  message?: string;
  eventId?: string;
};

export async function createEvent(rawInput: unknown): Promise<ActionState> {
  try {
    const user = await verifyAdminSession();
    const parsed = eventInputSchema.safeParse(rawInput);
    
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
      };
    }

    const input = parsed.data;
    const supabase = createAdminClient();

    // Check slug uniqueness
    const { data: existingSlug } = await supabase
      .from("events")
      .select("id")
      .eq("slug", input.slug)
      .maybeSingle();

    if (existingSlug) {
      return { success: false, message: "An event with this slug already exists." };
    }

    const eventId = crypto.randomUUID();

    const insertPayload = {
      id: eventId,
      slug: input.slug,
      title: input.title,
      tagline: input.tagline || null,
      description: input.description,
      cover_image_url: input.coverImageUrl || null,
      category: input.category,
      start_at: input.startAt,
      end_at: input.endAt,
      venue_name: input.venueName,
      venue_address: input.venueAddress,
      venue_map_url: input.venueMapUrl || null,
      capacity: input.capacity,
      price_paise: input.pricePaise,
      payment_mode: input.paymentMode,
      upi_id: input.upiId || null,
      refund_policy: input.refundPolicy,
      status: "draft", // Starts as draft
    };

    const { error } = await supabase.from("events").insert(insertPayload);

    if (error) {
      console.error("Failed to create event:", error.message);
      return { success: false, message: "Database insert error: " + error.message };
    }

    await writeAuditLog(user.id, "event.create", "events", eventId, null, insertPayload);

    return { success: true, eventId };
  } catch (err: unknown) {
    console.error("createEvent general error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return { success: false, message };
  }
}

export async function updateEvent(eventId: string, rawInput: unknown): Promise<ActionState> {
  try {
    const user = await verifyAdminSession();
    const parsed = eventInputSchema.safeParse(rawInput);
    
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
      };
    }

    const input = parsed.data;
    const supabase = createAdminClient();

    // Get old data for audit log
    const { data: oldEvent } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (!oldEvent) {
      return { success: false, message: "Event not found." };
    }

    const updatePayload = {
      slug: input.slug,
      title: input.title,
      tagline: input.tagline || null,
      description: input.description,
      cover_image_url: input.coverImageUrl || null,
      category: input.category,
      start_at: input.startAt,
      end_at: input.endAt,
      venue_name: input.venueName,
      venue_address: input.venueAddress,
      venue_map_url: input.venueMapUrl || null,
      capacity: input.capacity,
      price_paise: input.pricePaise,
      payment_mode: input.paymentMode,
      upi_id: input.upiId || null,
      refund_policy: input.refundPolicy,
    };

    const { error } = await supabase.from("events").update(updatePayload).eq("id", eventId);

    if (error) {
      console.error("Failed to update event:", error.message);
      return { success: false, message: "Database update error: " + error.message };
    }

    await writeAuditLog(user.id, "event.update", "events", eventId, oldEvent, updatePayload);

    return { success: true, eventId };
  } catch (err: unknown) {
    console.error("updateEvent general error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error.";
    return { success: false, message };
  }
}

export async function publishEvent(eventId: string): Promise<ActionState> {
  try {
    const user = await verifyAdminSession();
    const supabase = createAdminClient();

    const { data: event } = await supabase.from("events").select("status").eq("id", eventId).single();
    if (!event) return { success: false, message: "Event not found." };

    const { error } = await supabase.from("events").update({ status: "published" }).eq("id", eventId);

    if (error) {
      return { success: false, message: "Failed to publish event: " + error.message };
    }

    await writeAuditLog(user.id, "event.publish", "events", eventId, { status: event.status }, { status: "published" });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, message };
  }
}

export async function cancelEvent(eventId: string, reason: string): Promise<ActionState> {
  try {
    const user = await verifyAdminSession();
    const supabase = createAdminClient();

    const { data: event } = await supabase.from("events").select("status").eq("id", eventId).single();
    if (!event) return { success: false, message: "Event not found." };

    const { error } = await supabase
      .from("events")
      .update({ status: "cancelled", description: `[CANCELLED: ${reason}] \n\n` + event.status })
      .eq("id", eventId);

    if (error) {
      return { success: false, message: "Failed to cancel event: " + error.message };
    }

    await writeAuditLog(user.id, "event.cancel", "events", eventId, { status: event.status }, { status: "cancelled", reason });

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, message };
  }
}

export async function updateCustomFields(eventId: string, customFields: unknown[]): Promise<ActionState> {
  try {
    const user = await verifyAdminSession();
    const supabase = createAdminClient();

    const { data: event } = await supabase.from("events").select("custom_fields").eq("id", eventId).single();
    if (!event) return { success: false, message: "Event not found." };

    // Update custom fields jsonb column
    const { error } = await supabase
      .from("events")
      .update({ custom_fields: customFields })
      .eq("id", eventId);

    if (error) {
      return { success: false, message: "Failed to update custom fields: " + error.message };
    }

    await writeAuditLog(
      user.id,
      "event.update_custom_fields",
      "events",
      eventId,
      { custom_fields: event.custom_fields },
      { custom_fields: customFields }
    );

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, message };
  }
}
