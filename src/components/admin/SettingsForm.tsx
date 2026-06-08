"use client";

import { useState } from "react";
import { updateAppSettings } from "@/lib/actions/admin-settings";

interface SettingsFormProps {
  initialSettings: Record<string, string>;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState<Record<string, string>>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      const res = await updateAppSettings(settings);
      if (res.success) {
        setStatus({ success: true, message: "Application settings updated successfully." });
      } else {
        setStatus({ success: false, message: res.message || "Failed to update settings." });
      }
    } catch (err: unknown) {
      setStatus({
        success: false,
        message: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status && (
        <div
          className={`p-4 rounded-xl border text-xs flex gap-3 ${
            status.success
              ? "bg-[rgba(46,122,76,0.08)] border-[rgba(46,122,76,0.2)] text-[var(--green-deep)]"
              : "bg-[rgba(179,58,42,0.08)] border-[rgba(179,58,42,0.2)] text-[var(--danger)]"
          }`}
        >
          <span className="text-sm">{status.success ? "✓" : "⚠️"}</span>
          <div>
            <div className="font-semibold">{status.success ? "Settings Saved" : "Save Failed"}</div>
            <div className="opacity-90 mt-0.5">{status.message}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email & Outbound Config */}
        <div className="surface p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--green-ink)] border-b border-[var(--surface-border)] pb-2 mb-4">
            Outbound Comms Settings
          </h2>

          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2 font-medium">
              AWS SES Sender Email Address
            </label>
            <input
              type="text"
              required
              value={settings.ses_sender_email || ""}
              onChange={(e) => handleChange("ses_sender_email", e.target.value)}
              placeholder="e.g. De-escape <noreply@de-escape.in>"
              className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--cream-soft)] border text-[var(--green-ink)] placeholder:text-[var(--ink-mute)] outline-none border-[var(--surface-border)] focus:border-[var(--green)] transition-all"
            />
            <span className="text-[10px] text-[var(--ink-mute)] mt-1.5 block">
              Ensure this email address or its domain is verified in your AWS SES Console.
            </span>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2 font-medium">
              Global WhatsApp Group Invite
            </label>
            <input
              type="url"
              required
              value={settings.whatsapp_group_invite_link || ""}
              onChange={(e) => handleChange("whatsapp_group_invite_link", e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
              className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--cream-soft)] border text-[var(--green-ink)] placeholder:text-[var(--ink-mute)] outline-none border-[var(--surface-border)] focus:border-[var(--green)] transition-all"
            />
            <span className="text-[10px] text-[var(--ink-mute)] mt-1.5 block">
              Default invite link attached to WhatsApp passcode approvals.
            </span>
          </div>
        </div>

        {/* Support & Contacts */}
        <div className="surface p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--green-ink)] border-b border-[var(--surface-border)] pb-2 mb-4">
            Support Contacts
          </h2>

          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2 font-medium">
              Support Email
            </label>
            <input
              type="email"
              required
              value={settings.support_email || ""}
              onChange={(e) => handleChange("support_email", e.target.value)}
              placeholder="support@de-escape.in"
              className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--cream-soft)] border text-[var(--green-ink)] placeholder:text-[var(--ink-mute)] outline-none border-[var(--surface-border)] focus:border-[var(--green)] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2 font-medium">
              Support Phone
            </label>
            <input
              type="text"
              required
              value={settings.support_phone || ""}
              onChange={(e) => handleChange("support_phone", e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--cream-soft)] border text-[var(--green-ink)] placeholder:text-[var(--ink-mute)] outline-none border-[var(--surface-border)] focus:border-[var(--green)] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Policies */}
      <div className="surface p-6 rounded-2xl space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--green-ink)] border-b border-[var(--surface-border)] pb-2 mb-4">
          Ticket & Refund Policies
        </h2>

        <div>
          <label className="block text-xs uppercase tracking-widest text-[var(--ink-mute)] mb-2 font-medium">
            Default Cancellation & Refund Policy
          </label>
          <textarea
            rows={5}
            required
            value={settings.default_refund_policy || ""}
            onChange={(e) => handleChange("default_refund_policy", e.target.value)}
            placeholder="Write default policy text..."
            className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--cream-soft)] border text-[var(--green-ink)] placeholder:text-[var(--ink-mute)] outline-none border-[var(--surface-border)] focus:border-[var(--green)] transition-all resize-none"
          />
          <span className="text-[10px] text-[var(--ink-mute)] mt-1.5 block">
            This text serves as the default policy template shown to attendees when registering for new events.
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-4 rounded-2xl text-sm font-semibold bg-[var(--green)] text-[var(--cream)] transition-all hover:-translate-y-0.5 hover:bg-[var(--green-deep)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Saving Changes..." : "Save Application Settings"}
      </button>
    </form>
  );
}
