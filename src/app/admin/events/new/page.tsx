"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { createEvent } from "@/lib/actions/admin-events";

const CATEGORIES = [
  { value: "sound_bath", label: "Sound Bath" },
  { value: "supper", label: "Supper / Food" },
  { value: "run", label: "Running" },
  { value: "book_circle", label: "Book Circle" },
  { value: "cycling", label: "Cycling" },
  { value: "other", label: "Other" },
];

export default function NewEventPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [form, setForm] = useState({
    slug: "",
    title: "",
    tagline: "",
    description: "",
    coverImageUrl: "",
    category: "other",
    startAt: "",
    endAt: "",
    venueName: "",
    venueAddress: "",
    venueMapUrl: "",
    capacity: "20",
    priceInr: "499",
    paymentMode: "manual_upi",
    upiId: "",
    refundPolicy: "Full refund up to 48 hours before the event. No refunds within 48 hours.",
  });

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    
    // Auto-generate slug from title
    if (field === "title" && !form.slug) {
      const slugified = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 40);
      setForm((prev) => ({ ...prev, title: value, slug: slugified }));
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrors((prev) => ({ ...prev, coverImageUrl: "" }));

    try {
      const ext = file.name.split(".").pop();
      const path = `cover-${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from("event-media")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from("event-media")
        .getPublicUrl(data.path);

      setForm((prev) => ({ ...prev, coverImageUrl: publicUrl }));
    } catch (err: unknown) {
      console.error("Cover upload error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setErrors((prev) => ({ ...prev, coverImageUrl: "Failed to upload image: " + errorMessage }));
    } finally {
      setUploading(false);
    }
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.slug.trim() || !form.slug.match(/^[a-z0-9-]+$/)) {
      errs.slug = "Valid lowercase URL-safe slug required";
    }
    if (!form.title.trim()) errs.title = "Title required";
    if (!form.description.trim()) errs.description = "Description required";
    if (!form.startAt) errs.startAt = "Start time required";
    if (!form.endAt) errs.endAt = "End time required";
    if (!form.venueName.trim()) errs.venueName = "Venue name required";
    if (!form.venueAddress.trim()) errs.venueAddress = "Venue address required";
    
    const cap = parseInt(form.capacity);
    if (isNaN(cap) || cap < 1) errs.capacity = "Capacity must be at least 1";
    
    const price = parseFloat(form.priceInr);
    if (isNaN(price) || price <= 0) errs.priceInr = "Price must be greater than 0";
    
    if (form.paymentMode === "manual_upi" && !form.upiId.trim()) {
      errs.upiId = "UPI ID required for UPI payments";
    }
    
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        slug: form.slug,
        title: form.title,
        tagline: form.tagline,
        description: form.description,
        coverImageUrl: form.coverImageUrl,
        category: form.category,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        venueName: form.venueName,
        venueAddress: form.venueAddress,
        venueMapUrl: form.venueMapUrl,
        capacity: parseInt(form.capacity),
        pricePaise: Math.round(parseFloat(form.priceInr) * 100),
        paymentMode: form.paymentMode,
        upiId: form.upiId,
        refundPolicy: form.refundPolicy,
      };

      const res = await createEvent(payload);

      if (res.success) {
        router.push("/admin/events");
      } else {
        setErrors((prev) => ({ ...prev, submit: res.message || "Failed to create event." }));
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrors((prev) => ({ ...prev, submit: errorMessage }));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl text-sm bg-[var(--cream-soft)] border text-[var(--green-ink)] placeholder:text-[var(--ink-mute)] outline-none focus:border-[var(--green)] transition-all ${
      errors[field] ? "border-[var(--danger)] bg-[rgba(179,58,42,0.04)]" : "border-[var(--surface-border)]"
    }`;

  return (
    <div className="max-w-[760px] mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/events" className="text-xs text-[var(--ink-mute)] hover:text-[var(--green-ink)] transition-colors">
          ← Back to events
        </Link>
        <h1 className="font-display text-3xl text-[var(--green-ink)] mt-2 tracking-tight">Create New Event</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2 font-medium">Event Title</label>
          <input type="text" placeholder="e.g. Midnight Cycling Tour" value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass("title")} />
          {errors.title && <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.title}</p>}
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2 font-medium">URL Slug (lowercase & dashes)</label>
          <input type="text" placeholder="midnight-cycling-tour" value={form.slug} onChange={(e) => set("slug", e.target.value)} className={inputClass("slug")} />
          {errors.slug && <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.slug}</p>}
        </div>

        {/* Tagline */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2 font-medium">Tagline (brief one-line card text)</label>
          <input type="text" placeholder="Explore empty city streets under the moonlight." value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputClass("tagline")} />
        </div>

        {/* Category & Capacity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2 font-medium">Category</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className={`${inputClass("category")} appearance-none`}>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} className="bg-[var(--cream)]">{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2 font-medium">Seat Capacity</label>
            <input type="number" min={1} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} className={inputClass("capacity")} />
            {errors.capacity && <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.capacity}</p>}
          </div>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2 font-medium">Start Time (IST)</label>
            <input type="datetime-local" value={form.startAt} onChange={(e) => set("startAt", e.target.value)} className={inputClass("startAt")} />
            {errors.startAt && <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.startAt}</p>}
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2 font-medium">End Time (IST)</label>
            <input type="datetime-local" value={form.endAt} onChange={(e) => set("endAt", e.target.value)} className={inputClass("endAt")} />
            {errors.endAt && <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.endAt}</p>}
          </div>
        </div>

        {/* Venue details */}
        <div className="p-5 rounded-2xl surface space-y-4">
          <div className="text-xs uppercase tracking-widest text-[var(--ink-mute)] font-semibold">Location / Venue Details</div>
          
          <div>
            <label className="block text-xs uppercase tracking-[0.05em] text-[var(--ink-mute)] mb-1">Venue Name</label>
            <input type="text" placeholder="Marine Drive Starting Point" value={form.venueName} onChange={(e) => set("venueName", e.target.value)} className={inputClass("venueName")} />
            {errors.venueName && <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.venueName}</p>}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.05em] text-[var(--ink-mute)] mb-1">Venue Address</label>
            <input type="text" placeholder="Near NCPA, Nariman Point, Mumbai" value={form.venueAddress} onChange={(e) => set("venueAddress", e.target.value)} className={inputClass("venueAddress")} />
            {errors.venueAddress && <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.venueAddress}</p>}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-[0.05em] text-[var(--ink-mute)] mb-1">Google Maps Link</label>
            <input type="url" placeholder="https://maps.google.com/..." value={form.venueMapUrl} onChange={(e) => set("venueMapUrl", e.target.value)} className={inputClass("venueMapUrl")} />
            {errors.venueMapUrl && <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.venueMapUrl}</p>}
          </div>
        </div>

        {/* Pricing & Payments */}
        <div className="p-5 rounded-2xl surface space-y-4">
          <div className="text-xs uppercase tracking-widest text-[var(--ink-mute)] font-semibold">Pricing & Payments</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-[0.05em] text-[var(--ink-mute)] mb-1">Price (INR)</label>
              <input type="number" min={0} placeholder="0" value={form.priceInr} onChange={(e) => set("priceInr", e.target.value)} className={inputClass("priceInr")} />
              {errors.priceInr && <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.priceInr}</p>}
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.05em] text-[var(--ink-mute)] mb-1">Payment Mode</label>
              <select value={form.paymentMode} onChange={(e) => set("paymentMode", e.target.value)} className={`${inputClass("paymentMode")} appearance-none`}>
                <option value="manual_upi" className="bg-[var(--cream)]">Manual UPI Transfer</option>
                <option value="razorpay" className="bg-[var(--cream)]">Razorpay Checkout</option>
              </select>
            </div>
          </div>

          {form.paymentMode === "manual_upi" && (
            <div>
              <label className="block text-xs uppercase tracking-[0.05em] text-[var(--ink-mute)] mb-1">UPI Address for Transfer</label>
              <input type="text" placeholder="deescape@upi" value={form.upiId} onChange={(e) => set("upiId", e.target.value)} className={inputClass("upiId")} />
              {errors.upiId && <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.upiId}</p>}
            </div>
          )}
        </div>

        {/* Cover image upload */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2 font-medium">Cover Image</label>
          <div className="flex gap-4 items-center">
            {form.coverImageUrl && (
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-[var(--surface-border)] flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.coverImageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="cover-upload-file" disabled={uploading} />
              <label htmlFor="cover-upload-file" className="px-4 py-2 rounded-xl text-xs font-semibold surface hover:bg-[var(--cream-deep)] cursor-pointer inline-block">
                {uploading ? "Uploading cover..." : "Upload Cover Image"}
              </label>
              <p className="text-[10px] text-[var(--ink-mute)] mt-1">Recommended: 16:9 landscape aspect ratio.</p>
              {errors.coverImageUrl && <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.coverImageUrl}</p>}
            </div>
          </div>
        </div>

        {/* Description textarea */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2 font-medium">Description (Markdown / HTML)</label>
          <textarea rows={8} placeholder="Write a description for your event. You can use HTML formatting." value={form.description} onChange={(e) => set("description", e.target.value)} className={`${inputClass("description")} resize-none`} />
          {errors.description && <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.description}</p>}
        </div>

        {/* Refund Policy */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2 font-medium">Refund Policy</label>
          <input type="text" value={form.refundPolicy} onChange={(e) => set("refundPolicy", e.target.value)} className={inputClass("refundPolicy")} />
        </div>

        {errors.submit && <div className="p-4 rounded-xl text-xs text-[var(--danger)] border border-[rgba(179,58,42,0.3)] bg-[rgba(179,58,42,0.05)]">{errors.submit}</div>}

        <button type="submit" disabled={submitting || uploading} className="w-full py-4 rounded-2xl text-sm font-semibold bg-[var(--green)] text-[var(--cream)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? "Creating event..." : "Create Event as Draft"}
        </button>
      </form>
    </div>
  );
}
