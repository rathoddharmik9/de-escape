"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice, formatDate, seatsLeft } from "@/lib/mock-data";
import type { Event, Registration } from "@/lib/types";
import { publishEvent, cancelEvent, updateCustomFields } from "@/lib/actions/admin-events";

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
}

export default function EventDetailsContainer({ event, registrations }: ContainerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "registrations" | "custom_fields">("overview");
  
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
    if (!newFieldName.trim()) return;
    const key = newFieldName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .substring(0, 30);
      
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
  }

  function removeCustomField(index: number) {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveCustomFields() {
    setSavingFields(true);
    try {
      const res = await updateCustomFields(event.id, customFields);
      if (res.success) {
        alert("Custom fields saved successfully!");
        router.refresh();
      } else {
        alert(res.message || "Failed to save custom fields.");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setSavingFields(false);
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
              </div>

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
                    <span
                      className="text-[9px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background:
                          reg.status === "approved"
                            ? "rgba(46,122,76,0.10)"
                            : reg.status === "awaiting_verification"
                            ? "rgba(199,126,26,0.10)"
                            : "rgba(179,58,42,0.10)",
                        color:
                          reg.status === "approved"
                            ? "var(--ok)"
                            : reg.status === "awaiting_verification"
                            ? "var(--warn)"
                            : "var(--danger)",
                      }}
                    >
                      {reg.status.replace("_", " ")}
                    </span>
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
