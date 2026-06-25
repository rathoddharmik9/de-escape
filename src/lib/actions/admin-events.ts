"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore Next.js invariant errors outside request context
  }
}

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
  paymentMode: z.enum(["manual_upi", "free"]).default("manual_upi"),
  upiId: z.string().optional(),
  upiQrImageUrl: z.string().optional(),
  communityGroupInvite: z.string().optional(),
  showOnHome: z.boolean().optional(),
  refundPolicy: z.string().min(1),
});

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
  publicUrl?: string;
  storagePath?: string;
};

const mediaUploadSchema = z.object({
  fileBase64: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.string().regex(/^image\//, "Only image uploads are allowed"),
  folder: z.enum(["covers", "upi-qr", "gallery"]),
  eventId: z.string().uuid().optional(),
});

const galleryImageInputSchema = z.object({
  storagePath: z.string().min(1),
  publicUrl: z.string().url(),
  altText: z.string().optional(),
  caption: z.string().optional(),
});

const galleryImagesInputSchema = z.array(galleryImageInputSchema).min(1).max(100);

function revalidateEventSurfaces(slug?: string | null) {
  safeRevalidatePath("/");
  safeRevalidatePath("/events");
  if (slug) {
    safeRevalidatePath(`/events/${slug}`);
  }
}

function isMissingShowOnHomeColumn(message: string) {
  return message.includes("show_on_home");
}

function withoutShowOnHome<T extends { show_on_home?: boolean }>(payload: T): Omit<T, "show_on_home"> {
  const next = { ...payload };
  delete next.show_on_home;
  return next;
}

function imageExtension(fileName: string, contentType: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext && ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(ext)) {
    return ext === "jpg" ? "jpeg" : ext;
  }
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  if (contentType === "image/heic") return "heic";
  if (contentType === "image/heif") return "heif";
  return "jpeg";
}

export async function uploadEventMedia(rawInput: unknown): Promise<ActionState> {
  try {
    await verifyAdminSession();
    const parsed = mediaUploadSchema.safeParse(rawInput);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
      };
    }

    const { fileBase64, fileName, contentType, folder, eventId } = parsed.data;
    const payload = fileBase64.split(",")[1] || fileBase64;
    const buffer = Buffer.from(payload, "base64");
    if (buffer.length === 0) {
      return { success: false, message: "Upload file is empty." };
    }
    if (buffer.length > 20 * 1024 * 1024) {
      return { success: false, message: "Image must be 20 MB or smaller." };
    }

    const ext = imageExtension(fileName, contentType);
    const storagePath =
      folder === "gallery" && eventId
        ? `events/${eventId}/gallery/${randomUUID()}.${ext}`
        : `${folder}/${randomUUID()}.${ext}`;

    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from("event-media")
      .upload(storagePath, buffer, {
        cacheControl: "31536000",
        contentType,
        upsert: false,
      });

    if (error) {
      return { success: false, message: "Failed to upload image: " + error.message };
    }

    const { data: publicData } = supabase.storage
      .from("event-media")
      .getPublicUrl(data.path);

    return {
      success: true,
      publicUrl: publicData.publicUrl,
      storagePath: data.path,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, message };
  }
}

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

    if (input.paymentMode === "manual_upi" && input.pricePaise > 0 && !input.upiId?.trim()) {
      return { success: false, message: "UPI ID is required for paid manual UPI events." };
    }

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
      upi_qr_image_url: input.upiQrImageUrl || null,
      community_group_invite: input.communityGroupInvite || null,
      show_on_home: input.showOnHome || false,
      refund_policy: input.refundPolicy,
      status: "draft", // Starts as draft
    };

    let savedPayload = insertPayload;
    let { error } = await supabase.from("events").insert(insertPayload);

    if (error && isMissingShowOnHomeColumn(error.message)) {
      const legacyPayload = withoutShowOnHome(insertPayload);
      savedPayload = legacyPayload as typeof insertPayload;
      const retry = await supabase.from("events").insert(legacyPayload);
      error = retry.error;
    }

    if (error) {
      console.error("Failed to create event:", error.message);
      return { success: false, message: "Database insert error: " + error.message };
    }

    await writeAuditLog(user.id, "event.create", "events", eventId, null, savedPayload);

    safeRevalidatePath("/");
    safeRevalidatePath("/events");
    safeRevalidatePath(`/events/${input.slug}`);

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

    if (input.paymentMode === "manual_upi" && input.pricePaise > 0 && !input.upiId?.trim()) {
      return { success: false, message: "UPI ID is required for paid manual UPI events." };
    }

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
      upi_qr_image_url: input.upiQrImageUrl || null,
      community_group_invite: input.communityGroupInvite || null,
      show_on_home: input.showOnHome || false,
      refund_policy: input.refundPolicy,
    };

    let savedPayload = updatePayload;
    let { error } = await supabase.from("events").update(updatePayload).eq("id", eventId);

    if (error && isMissingShowOnHomeColumn(error.message)) {
      const legacyPayload = withoutShowOnHome(updatePayload);
      savedPayload = legacyPayload as typeof updatePayload;
      const retry = await supabase.from("events").update(legacyPayload).eq("id", eventId);
      error = retry.error;
    }

    if (error) {
      console.error("Failed to update event:", error.message);
      return { success: false, message: "Database update error: " + error.message };
    }

    await writeAuditLog(user.id, "event.update", "events", eventId, oldEvent, savedPayload);

    safeRevalidatePath("/");
    safeRevalidatePath("/events");
    safeRevalidatePath(`/events/${input.slug}`);
    if (oldEvent.slug !== input.slug) {
      safeRevalidatePath(`/events/${oldEvent.slug}`);
    }

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

    const { data: event } = await supabase.from("events").select("slug, status").eq("id", eventId).single();
    if (!event) return { success: false, message: "Event not found." };

    const { error } = await supabase.from("events").update({ status: "published" }).eq("id", eventId);

    if (error) {
      return { success: false, message: "Failed to publish event: " + error.message };
    }

    await writeAuditLog(user.id, "event.publish", "events", eventId, { status: event.status }, { status: "published" });

    safeRevalidatePath("/");
    safeRevalidatePath("/events");
    safeRevalidatePath(`/events/${event.slug}`);

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

    const { data: event } = await supabase.from("events").select("slug, status, description").eq("id", eventId).single();
    if (!event) return { success: false, message: "Event not found." };

    const { error } = await supabase
      .from("events")
      .update({ status: "cancelled", description: `[CANCELLED: ${reason}] \n\n` + (event.description || '') })
      .eq("id", eventId);

    if (error) {
      return { success: false, message: "Failed to cancel event: " + error.message };
    }

    await writeAuditLog(user.id, "event.cancel", "events", eventId, { status: event.status }, { status: "cancelled", reason });

    safeRevalidatePath("/");
    safeRevalidatePath("/events");
    if (event?.slug) {
      safeRevalidatePath(`/events/${event.slug}`);
    }

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

    const { data: event } = await supabase.from("events").select("slug, custom_fields").eq("id", eventId).single();
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

    safeRevalidatePath("/");
    safeRevalidatePath("/events");
    if (event?.slug) {
      safeRevalidatePath(`/events/${event.slug}`);
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, message };
  }
}

export async function addEventGalleryImages(eventId: string, rawImages: unknown): Promise<ActionState> {
  try {
    const user = await verifyAdminSession();
    const parsed = galleryImagesInputSchema.safeParse(rawImages);

    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", "),
      };
    }

    const supabase = createAdminClient();
    const { data: event } = await supabase.from("events").select("slug").eq("id", eventId).single();
    if (!event) return { success: false, message: "Event not found." };

    const { data: latestImage } = await supabase
      .from("event_gallery_images")
      .select("sort_order")
      .eq("event_id", eventId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const startingSort = typeof latestImage?.sort_order === "number" ? latestImage.sort_order + 1 : 0;
    const insertRows = parsed.data.map((image, index) => ({
      event_id: eventId,
      storage_path: image.storagePath,
      public_url: image.publicUrl,
      alt_text: image.altText?.trim() || null,
      caption: image.caption?.trim() || null,
      sort_order: startingSort + index,
    }));

    const { error } = await supabase.from("event_gallery_images").insert(insertRows);

    if (error) {
      return { success: false, message: "Failed to save gallery images: " + error.message };
    }

    await writeAuditLog(
      user.id,
      "event.gallery.add",
      "event_gallery_images",
      eventId,
      null,
      { count: insertRows.length, storage_paths: insertRows.map((row) => row.storage_path) }
    );

    revalidateEventSurfaces(event.slug);
    return { success: true, eventId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, message };
  }
}

export async function deleteEventGalleryImage(imageId: string): Promise<ActionState> {
  try {
    const user = await verifyAdminSession();
    const supabase = createAdminClient();

    const { data: image } = await supabase
      .from("event_gallery_images")
      .select("*, events(slug)")
      .eq("id", imageId)
      .single();

    if (!image) return { success: false, message: "Gallery image not found." };

    const { error: storageError } = await supabase.storage
      .from("event-media")
      .remove([image.storage_path]);

    if (storageError) {
      return { success: false, message: "Failed to remove stored image: " + storageError.message };
    }

    const { error: deleteError } = await supabase
      .from("event_gallery_images")
      .delete()
      .eq("id", imageId);

    if (deleteError) {
      return { success: false, message: "Failed to delete gallery image: " + deleteError.message };
    }

    await writeAuditLog(
      user.id,
      "event.gallery.delete",
      "event_gallery_images",
      imageId,
      image,
      null
    );

    const slug = Array.isArray(image.events) ? image.events[0]?.slug : image.events?.slug;
    revalidateEventSurfaces(slug);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, message };
  }
}

export async function reorderEventGalleryImages(eventId: string, orderedIds: string[]): Promise<ActionState> {
  try {
    const user = await verifyAdminSession();
    const supabase = createAdminClient();

    if (!Array.isArray(orderedIds) || orderedIds.length === 0 || orderedIds.some((id) => typeof id !== "string")) {
      return { success: false, message: "Invalid gallery order." };
    }

    const { data: event } = await supabase.from("events").select("slug").eq("id", eventId).single();
    if (!event) return { success: false, message: "Event not found." };

    const { data: existing, error: existingError } = await supabase
      .from("event_gallery_images")
      .select("id")
      .eq("event_id", eventId)
      .in("id", orderedIds);

    if (existingError) {
      return { success: false, message: "Failed to validate gallery order: " + existingError.message };
    }

    if ((existing ?? []).length !== orderedIds.length) {
      return { success: false, message: "Gallery order contains images from another event." };
    }

    for (let index = 0; index < orderedIds.length; index += 1) {
      const id = orderedIds[index];
      const { error } = await supabase
        .from("event_gallery_images")
        .update({ sort_order: index })
        .eq("event_id", eventId)
        .eq("id", id);

      if (error) {
        return { success: false, message: "Failed to reorder gallery images: " + error.message };
      }
    }

    await writeAuditLog(
      user.id,
      "event.gallery.reorder",
      "event_gallery_images",
      eventId,
      null,
      { orderedIds }
    );

    revalidateEventSurfaces(event.slug);
    return { success: true, eventId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, message };
  }
}
