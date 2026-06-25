"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import imageCompression from "browser-image-compression";
import { formatPrice, formatDate, seatsLeft } from "@/lib/mock-data";
import type { Event, EventGalleryImage, Registration } from "@/lib/types";
import {
  addEventGalleryImages,
  cancelEvent,
  deleteEventGalleryImage,
  publishEvent,
  reorderEventGalleryImages,
  updateCustomFields,
  uploadEventMedia,
} from "@/lib/actions/admin-events";

interface CustomField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface ContainerProps {
  event: Event;
  registrations: Registration[];
  galleryImages: EventGalleryImage[];
}

type UploadItem = {
  name: string;
  status: "queued" | "compressing" | "uploading" | "done" | "error";
  message?: string;
};

export default function EventDetailsContainer({ event, registrations, galleryImages }: ContainerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "registrations" | "gallery" | "custom_fields">("overview");
  
  const [publishing, setPublishing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // Custom fields builder state
  const [customFields, setCustomFields] = useState<CustomField[]>(
    (event as unknown as { custom_fields?: CustomField[] }).custom_fields || []
  );
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [savingFields, setSavingFields] = useState(false);
  const [fieldBuilderMessage, setFieldBuilderMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryMessage, setGalleryMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const left = seatsLeft(event);
  const pct = event.capacity > 0 ? Math.round((event.registered_count / event.capacity) * 100) : 0;

  async function handlePublish() {
    if (!confirm("Are you sure you want to publish this event to the public feed?")) return;
    setPublishing(true);
    try {
      const res = await publishEvent(event.id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.message || "Failed to publish event.");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleCancelSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      const res = await cancelEvent(event.id, cancelReason);
      if (res.success) {
        setShowCancelModal(false);
        router.refresh();
      } else {
        alert(res.message || "Failed to cancel event.");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setCancelling(false);
    }
  }

  function addCustomField() {
    setFieldBuilderMessage(null);
    if (!newFieldName.trim()) {
      setFieldBuilderMessage({ type: "error", text: "Field label is required." });
      return;
    }
    const key = newFieldName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/^_+|_+$/g, "")
      .substring(0, 30);

    if (!key) {
      setFieldBuilderMessage({ type: "error", text: "Use letters or numbers in the field label." });
      return;
    }
    if (customFields.some((field) => field.key === key)) {
      setFieldBuilderMessage({ type: "error", text: "A field with this label already exists." });
      return;
    }
    if (newFieldType === "select" && newFieldOptions.split(",").map(o => o.trim()).filter(Boolean).length < 2) {
      setFieldBuilderMessage({ type: "error", text: "Dropdown fields need at least two options." });
      return;
    }
      
    const newField = {
      key,
      label: newFieldName,
      type: newFieldType,
      required: newFieldRequired,
      options: newFieldType === "select" ? newFieldOptions.split(",").map(o => o.trim()).filter(Boolean) : undefined
    };

    setCustomFields((prev) => [...prev, newField]);
    setNewFieldName("");
    setNewFieldRequired(false);
    setNewFieldOptions("");
    setFieldBuilderMessage({ type: "success", text: "Field added. Save the configuration to publish it." });
  }

  function removeCustomField(index: number) {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveCustomFields() {
    setSavingFields(true);
    try {
      const res = await updateCustomFields(event.id, customFields);
      if (res.success) {
        setFieldBuilderMessage({ type: "success", text: "Custom fields saved successfully." });
        router.refresh();
      } else {
        setFieldBuilderMessage({ type: "error", text: res.message || "Failed to save custom fields." });
      }
    } catch (err: unknown) {
      setFieldBuilderMessage({ type: "error", text: err instanceof Error ? err.message : "An error occurred." });
    } finally {
      setSavingFields(false);
    }
  }

  function updateUploadItem(index: number, patch: Partial<UploadItem>) {
    setUploadItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setGalleryMessage(null);

    const invalidType = files.find((file) => !file.type.startsWith("image/"));
    if (invalidType) {
      setGalleryMessage({ type: "error", text: `${invalidType.name} is not an image file.` });
      return;
    }

    const tooLarge = files.find((file) => file.size > 20 * 1024 * 1024);
    if (tooLarge) {
      setGalleryMessage({ type: "error", text: `${tooLarge.name} is larger than 20 MB.` });
      return;
    }

    setUploadingGallery(true);
    setUploadItems(files.map((file) => ({ name: file.name, status: "queued" })));

    const uploadedImages: Array<{ storagePath: string; publicUrl: string; altText: string }> = [];

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        updateUploadItem(index, { status: "compressing", message: "Compressing" });

        const compressed = await imageCompression(file, {
          maxSizeMB: 0.7,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        });

        updateUploadItem(index, {
          status: "uploading",
          message: `${Math.max(1, Math.round(compressed.size / 1024))} KB`,
        });

        const res = await uploadEventMedia({
          fileBase64: await fileToBase64(compressed),
          fileName: file.name,
          contentType: compressed.type || file.type || "image/jpeg",
          folder: "gallery",
          eventId: event.id,
        });
        if (!res.success || !res.storagePath || !res.publicUrl) {
          throw new Error(`${file.name}: ${res.message || "Upload failed"}`);
        }

        uploadedImages.push({
          storagePath: res.storagePath,
          publicUrl: res.publicUrl,
          altText: event.title,
        });

        updateUploadItem(index, { status: "done", message: "Uploaded" });
      }

      const res = await addEventGalleryImages(event.id, uploadedImages);
      if (!res.success) {
        throw new Error(res.message || "Failed to save gallery images.");
      }

      setGalleryMessage({ type: "success", text: `${uploadedImages.length} image${uploadedImages.length === 1 ? "" : "s"} added to the gallery.` });
      router.refresh();
    } catch (err: unknown) {
      setGalleryMessage({ type: "error", text: err instanceof Error ? err.message : "Gallery upload failed." });
    } finally {
      setUploadingGallery(false);
    }
  }

  async function handleDeleteGalleryImage(imageId: string) {
    if (!confirm("Delete this gallery image?")) return;
    setDeletingImageId(imageId);
    setGalleryMessage(null);

    try {
      const res = await deleteEventGalleryImage(imageId);
      if (!res.success) {
        setGalleryMessage({ type: "error", text: res.message || "Failed to delete image." });
        return;
      }
      setGalleryMessage({ type: "success", text: "Image deleted." });
      router.refresh();
    } catch (err: unknown) {
      setGalleryMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to delete image." });
    } finally {
      setDeletingImageId(null);
    }
  }

  async function moveGalleryImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= galleryImages.length) return;

    const ordered = [...galleryImages];
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];

    setReordering(true);
    setGalleryMessage(null);
    try {
      const res = await reorderEventGalleryImages(event.id, ordered.map((image) => image.id));
      if (!res.success) {
        setGalleryMessage({ type: "error", text: res.message || "Failed to reorder gallery." });
        return;
      }
      router.refresh();
    } catch (err: unknown) {
      setGalleryMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to reorder gallery." });
    } finally {
      setReordering(false);
    }
  }

  const tabClass = (tab: string) =>
    `px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all duration-150 ${
      activeTab === tab
        ? "text-[var(--green-ink)] bg-[var(--cream-deep)] border border-[var(--surface-border)]"
        : "text-[var(--ink-mute)] hover:text-[var(--green-ink)]"
    }`;

  return (
    <div className="max-w-[1100px]">
      {/* Header breadcrumb & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link href="/admin/events" className="text-xs text-[var(--ink-mute)] hover:text-[var(--green-ink)] transition-colors">
            ← Back to events
          </Link>
          <h1 className="font-display text-3xl text-[var(--green-ink)] mt-2 tracking-tight flex items-center gap-3 flex-wrap">
            {event.title}
            <span
              className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-medium"
              style={{
                background:
                  event.status === "published"
                    ? "rgba(46,122,76,0.10)"
                    : event.status === "draft"
                    ? "var(--cream-deep)"
                    : "rgba(179,58,42,0.10)",
                color:
                  event.status === "published"
                    ? "var(--ok)"
                    : event.status === "draft"
                    ? "var(--ink-dim)"
                    : "var(--danger)",
              }}
            >
              {event.status}
            </span>
          </h1>
        </div>

        {/* Primary status change buttons */}
        <div className="flex gap-2">
          <Link
            href={`/admin/events/${event.id}/edit`}
            className="px-5 py-2.5 rounded-full text-xs font-semibold surface border border-[var(--surface-border)] hover:bg-[var(--cream-deep)]/30 transition-all text-[var(--green-ink)] flex items-center"
          >
            Edit Event
          </Link>
          {event.status === "draft" && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="px-5 py-2.5 rounded-full text-xs font-semibold transition-all bg-[var(--green)] text-[var(--cream)] hover:-translate-y-0.5"
            >
              {publishing ? "Publishing..." : "Publish Event"}
            </button>
          )}
          {event.status !== "cancelled" && event.status !== "past" && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-5 py-2.5 rounded-full text-xs font-semibold surface border border-[var(--surface-border)] hover:bg-[var(--cream-deep)]/30 transition-all text-[var(--danger)]"
            >
              Cancel Event
            </button>
          )}
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex gap-2 border-b border-[var(--surface-border)] pb-4 mb-8">
        <button onClick={() => setActiveTab("overview")} className={tabClass("overview")}>
          Overview
        </button>
        <button onClick={() => setActiveTab("registrations")} className={tabClass("registrations")}>
          Registrations ({registrations.length})
        </button>
        <button onClick={() => setActiveTab("gallery")} className={tabClass("gallery")}>
          Gallery ({galleryImages.length})
        </button>
        <button onClick={() => setActiveTab("custom_fields")} className={tabClass("custom_fields")}>
          Custom Fields
        </button>
      </div>

      {/* Overview Tab content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Main Info */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl surface space-y-4">
              <div className="text-xs uppercase tracking-widest text-[var(--ink-mute)] font-semibold">Event Details</div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase text-[var(--ink-mute)]">Date</div>
                  <div className="text-sm font-medium text-[var(--green-ink)]">{formatDate(event.start_at)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[var(--ink-mute)]">Venue</div>
                  <div className="text-sm font-medium text-[var(--green-ink)]">{event.venue_name}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[var(--ink-mute)]">Pricing</div>
                  <div className="text-sm font-medium text-[var(--green-ink)]">{formatPrice(event.price_paise)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[var(--ink-mute)]">Payment Mode</div>
                  <div className="text-sm font-medium text-[var(--green-ink)] uppercase">{event.payment_mode.replace("_", " ")}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[var(--ink-mute)]">Homepage</div>
                  <div className="text-sm font-medium text-[var(--green-ink)]">{event.show_on_home ? "Visible" : "Hidden"}</div>
                </div>
              </div>

              {(event.upi_id || event.upi_qr_image_url || event.community_group_invite) && (
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4 p-4 rounded-xl bg-[var(--cream-deep)] border border-[var(--surface-border)]">
                  <div className="space-y-3">
                    <div>
                      <div className="text-[10px] uppercase text-[var(--ink-mute)]">UPI ID</div>
                      <div className="text-sm font-mono text-[var(--green-ink)]">{event.upi_id || "Not set"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-[var(--ink-mute)]">WhatsApp invite</div>
                      <div className="text-xs text-[var(--ink-dim)] break-all">{event.community_group_invite || "Not set"}</div>
                    </div>
                  </div>
                  {event.upi_qr_image_url && (
                    <div className="rounded-xl bg-white p-2 border border-[var(--surface-border)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={event.upi_qr_image_url} alt="UPI QR code" className="w-full aspect-square object-contain" />
                    </div>
                  )}
                </div>
              )}

              {event.tagline && (
                <div>
                  <div className="text-[10px] uppercase text-[var(--ink-mute)] mb-1">Tagline</div>
                  <p className="text-xs text-[var(--ink-dim)] bg-[var(--cream-deep)] p-3 rounded-xl border border-[var(--surface-border)]">{event.tagline}</p>
                </div>
              )}

              <div>
                <div className="text-[10px] uppercase text-[var(--ink-mute)] mb-1">Description</div>
                <div className="text-xs text-[var(--ink-dim)] bg-[var(--cream-deep)] p-4 rounded-xl border border-[var(--surface-border)] prose prose-xs max-w-none" dangerouslySetInnerHTML={{ __html: event.description }} />
              </div>
            </div>
          </div>

          {/* Right sidebar stats */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl surface space-y-4">
              <div className="text-xs uppercase tracking-widest text-[var(--ink-mute)] font-semibold">Capacity Statistics</div>

              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-display text-[var(--green-ink)]">{event.registered_count} / {event.capacity}</span>
                <span className="text-xs text-[var(--ink-mute)]">{left} seats left</span>
              </div>

              <div className="h-1.5 rounded-full bg-[var(--cream-deep)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 85 ? "var(--danger)" : "var(--ok)",
                  }}
                />
              </div>
              <div className="text-[10px] text-[var(--ink-mute)]">{pct}% registration capacity reached.</div>
            </div>
          </div>
        </div>
      )}

      {/* Registrations Tab content */}
      {activeTab === "registrations" && (
        <div className="rounded-3xl overflow-hidden surface">
          {registrations.length > 0 ? (
            <div className="divide-y divide-[var(--surface-border)]">
              {registrations.map((reg) => (
                <Link
                  key={reg.id}
                  href={`/admin/registrations/${reg.id}`}
                  className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[var(--cream-deep)]/30 transition-all flex-wrap"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[var(--green-ink)]">{reg.full_name}</div>
                    <div className="text-xs text-[var(--ink-mute)] mt-0.5">{reg.email} · {reg.phone}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    {reg.status !== "awaiting_verification" && (
                      <span
                        className="text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background:
                            reg.status === "approved"
                              ? "rgba(46,122,76,0.10)"
                              : "rgba(179,58,42,0.10)",
                          color:
                            reg.status === "approved"
                              ? "var(--ok)"
                              : "var(--danger)",
                        }}
                      >
                        {reg.status.replace("_", " ")}
                      </span>
                    )}
                    <span className="text-xs text-[var(--ink-mute)] font-mono">{reg.pass_code}</span>
                    <span className="text-xs text-[var(--ink-mute)]">→</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[var(--ink-mute)]">No attendees registered yet for this event.</div>
          )}
        </div>
      )}

      {/* Gallery Tab content */}
      {activeTab === "gallery" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl surface space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h2 className="text-xs uppercase tracking-widest text-[var(--ink-mute)] font-semibold mb-2">Past Event Gallery</h2>
                <p className="text-xs text-[var(--ink-mute)] max-w-[58ch]">
                  Upload event photos in bulk. Images are compressed in your browser before being saved to Supabase.
                </p>
              </div>
              <div>
                <input
                  id="event-gallery-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryUpload}
                  disabled={uploadingGallery}
                  className="hidden"
                />
                <label
                  htmlFor="event-gallery-upload"
                  className={`inline-flex px-5 py-2.5 rounded-full text-xs font-semibold transition-all ${
                    uploadingGallery
                      ? "bg-[var(--cream-deep)] text-[var(--ink-mute)] cursor-wait"
                      : "bg-[var(--green)] text-[var(--cream)] hover:-translate-y-0.5 cursor-pointer"
                  }`}
                >
                  {uploadingGallery ? "Uploading..." : "Bulk upload images"}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-[var(--cream-deep)] border border-[var(--surface-border)] p-4">
                <div className="text-[10px] uppercase tracking-wider text-[var(--ink-mute)]">Compression</div>
                <div className="mt-1 text-sm font-medium text-[var(--green-ink)]">0.7 MB target</div>
              </div>
              <div className="rounded-2xl bg-[var(--cream-deep)] border border-[var(--surface-border)] p-4">
                <div className="text-[10px] uppercase tracking-wider text-[var(--ink-mute)]">Max dimension</div>
                <div className="mt-1 text-sm font-medium text-[var(--green-ink)]">1600 px</div>
              </div>
              <div className="rounded-2xl bg-[var(--cream-deep)] border border-[var(--surface-border)] p-4">
                <div className="text-[10px] uppercase tracking-wider text-[var(--ink-mute)]">File limit</div>
                <div className="mt-1 text-sm font-medium text-[var(--green-ink)]">20 MB each</div>
              </div>
            </div>

            {galleryMessage && (
              <div
                className="p-3 rounded-xl text-xs border"
                style={{
                  color: galleryMessage.type === "error" ? "var(--danger)" : "var(--ok)",
                  borderColor: galleryMessage.type === "error" ? "rgba(179,58,42,0.25)" : "rgba(46,122,76,0.25)",
                  background: galleryMessage.type === "error" ? "rgba(179,58,42,0.06)" : "rgba(46,122,76,0.06)",
                }}
              >
                {galleryMessage.text}
              </div>
            )}

            {uploadItems.length > 0 && (
              <div className="space-y-2">
                {uploadItems.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--cream-deep)] border border-[var(--surface-border)] px-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-[var(--green-ink)]">{item.name}</div>
                      {item.message && <div className="text-[10px] text-[var(--ink-mute)]">{item.message}</div>}
                    </div>
                    <span
                      className="text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: item.status === "error" ? "rgba(179,58,42,0.10)" : "rgba(46,122,76,0.10)",
                        color: item.status === "error" ? "var(--danger)" : "var(--ok)",
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {galleryImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryImages.map((image, index) => (
                <div key={image.id} className="group rounded-2xl overflow-hidden surface">
                  <div className="relative aspect-square bg-[var(--cream-deep)] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.public_url} alt={image.alt_text || event.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  </div>
                  <div className="p-3 flex items-center justify-between gap-2">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--ink-mute)]">
                      Photo {index + 1}
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveGalleryImage(index, -1)}
                        disabled={index === 0 || reordering}
                        className="h-7 w-7 rounded-full surface-deep text-xs text-[var(--ink-dim)] disabled:opacity-40"
                        aria-label="Move image earlier"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveGalleryImage(index, 1)}
                        disabled={index === galleryImages.length - 1 || reordering}
                        className="h-7 w-7 rounded-full surface-deep text-xs text-[var(--ink-dim)] disabled:opacity-40"
                        aria-label="Move image later"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGalleryImage(image.id)}
                        disabled={deletingImageId === image.id}
                        className="h-7 px-3 rounded-full text-[10px] font-semibold text-[var(--danger)] surface-deep disabled:opacity-50"
                      >
                        {deletingImageId === image.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[var(--ink-mute)] rounded-3xl border border-dashed border-[var(--surface-border)]">
              No gallery images yet. Upload photos after the event to create the public recap.
            </div>
          )}
        </div>
      )}

      {/* Custom Fields Tab content */}
      {activeTab === "custom_fields" && (
        <div className="p-6 rounded-3xl surface space-y-6">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-[var(--ink-mute)] font-semibold mb-2">Custom Registration Fields</h2>
            <p className="text-xs text-[var(--ink-mute)]">Add extra fields attendees must fill when registering for this event.</p>
          </div>

          {/* Current fields list */}
          <div className="space-y-2">
            {customFields.length > 0 ? (
              customFields.map((field, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[var(--cream-deep)] border border-[var(--surface-border)]">
                  <div>
                    <div className="text-xs font-semibold text-[var(--green-ink)]">
                      {field.label} {field.required && <span className="text-[var(--danger)]">*</span>}
                    </div>
                    <div className="text-[10px] text-[var(--ink-mute)]">
                      Type: <span className="uppercase">{field.type}</span> · Key: <code>{field.key}</code>
                      {field.options && field.options.length > 0 && ` · Options: (${field.options.join(", ")})`}
                    </div>
                  </div>
                  <button onClick={() => removeCustomField(idx)} className="text-xs text-[var(--danger)] hover:underline">
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-[var(--ink-mute)] rounded-xl border border-dashed border-[var(--surface-border)]">No custom fields defined yet.</div>
            )}
          </div>

          {/* Add field form */}
          <div className="p-4 rounded-2xl bg-[var(--cream-deep)]/60 border border-[var(--surface-border)] space-y-4">
            <div className="text-xs font-semibold text-[var(--green-ink)]">Add Custom Field</div>
            {fieldBuilderMessage && (
              <div
                className="p-3 rounded-xl text-xs border"
                style={{
                  color: fieldBuilderMessage.type === "error" ? "var(--danger)" : "var(--ok)",
                  borderColor: fieldBuilderMessage.type === "error" ? "rgba(179,58,42,0.25)" : "rgba(46,122,76,0.25)",
                  background: fieldBuilderMessage.type === "error" ? "rgba(179,58,42,0.06)" : "rgba(46,122,76,0.06)",
                }}
              >
                {fieldBuilderMessage.text}
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-[var(--ink-mute)] mb-1">Field Label</label>
                <input type="text" placeholder="e.g. T-Shirt Size" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--cream-soft)] border border-[var(--surface-border)] text-[var(--green-ink)] outline-none focus:border-[var(--green)]" />
              </div>

              <div>
                <label className="block text-[10px] text-[var(--ink-mute)] mb-1">Field Type</label>
                <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value)} className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--cream-soft)] border border-[var(--surface-border)] text-[var(--green-ink)] outline-none focus:border-[var(--green)] appearance-none">
                  <option value="text" className="bg-[var(--cream)]">Single Line Text</option>
                  <option value="textarea" className="bg-[var(--cream)]">Paragraph Text</option>
                  <option value="number" className="bg-[var(--cream)]">Number</option>
                  <option value="select" className="bg-[var(--cream)]">Dropdown Select</option>
                  <option value="checkbox" className="bg-[var(--cream)]">Checkbox</option>
                </select>
              </div>
            </div>

            {newFieldType === "select" && (
              <div>
                <label className="block text-[10px] text-[var(--ink-mute)] mb-1">Select Options (comma-separated)</label>
                <input type="text" placeholder="S, M, L, XL" value={newFieldOptions} onChange={(e) => setNewFieldOptions(e.target.value)} className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--cream-soft)] border border-[var(--surface-border)] text-[var(--green-ink)] outline-none focus:border-[var(--green)]" />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input type="checkbox" checked={newFieldRequired} onChange={(e) => setNewFieldRequired(e.target.checked)} id="new-req-toggle" className="rounded border-[var(--surface-border)] bg-transparent" />
              <label htmlFor="new-req-toggle" className="text-xs text-[var(--ink-mute)] select-none">Mark as required field</label>
            </div>

            <button type="button" onClick={addCustomField} className="px-4 py-2 rounded-xl text-xs font-semibold transition-all bg-[var(--green)] text-[var(--cream)]">
              + Add Field
            </button>
          </div>

          {/* Save trigger */}
          <div className="flex justify-end pt-4 border-t border-[var(--surface-border)]">
            <button onClick={saveCustomFields} disabled={savingFields} className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[var(--green)] text-[var(--cream)] transition-all hover:-translate-y-0.5 disabled:opacity-50">
              {savingFields ? "Saving changes..." : "Save Custom Fields Configuration"}
            </button>
          </div>
        </div>
      )}

      {/* Cancel Event Modal Dialog */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="max-w-[440px] w-full p-6 rounded-3xl surface space-y-4">
            <div className="text-lg font-display text-[var(--green-ink)]">Cancel Event</div>
            <p className="text-xs text-[var(--ink-mute)] leading-relaxed">
              Are you sure you want to cancel this event? This will mark the status as cancelled and add a cancellation header to description.
            </p>
            
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-[var(--ink-mute)] mb-1 uppercase tracking-wider">Reason for Cancellation</label>
                <input type="text" required placeholder="e.g. Inclement weather forecasts" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--cream-soft)] border border-[var(--surface-border)] text-[var(--green-ink)] outline-none focus:border-[var(--green)]" />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setShowCancelModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold surface border border-[var(--surface-border)] hover:bg-[var(--cream-deep)]/30 text-[var(--ink-mute)]">
                  Go Back
                </button>
                <button type="submit" disabled={cancelling} className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--danger)] text-white hover:-translate-y-0.5 transition-all">
                  {cancelling ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
