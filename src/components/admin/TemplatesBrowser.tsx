"use client";

import { useState } from "react";
import {
  WhatsAppTemplate,
  syncWhatsAppTemplates,
  updateWhatsAppTemplate,
} from "@/lib/actions/admin-comms";

interface TemplatesBrowserProps {
  initialTemplates: WhatsAppTemplate[];
}

export default function TemplatesBrowser({ initialTemplates }: TemplatesBrowserProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(initialTemplates);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Edit modal state
  const [editingTemplate, setEditingTemplate] = useState<WhatsAppTemplate | null>(null);
  const [editMetaName, setEditMetaName] = useState("");
  const [editBodyText, setEditBodyText] = useState("");
  const [editVars, setEditVars] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const handleSync = async () => {
    setSyncing(true);
    setStatus(null);
    try {
      const res = await syncWhatsAppTemplates();
      if (res.success) {
        setStatus({ success: true, message: res.message || "Templates synced successfully." });
        // Since sync resets/seeds values, we can fetch latest from server or refresh.
        // For simple instant feedback, let's trigger a page reload or update locally.
        window.location.reload();
      } else {
        setStatus({ success: false, message: res.message || "Sync failed." });
      }
    } catch (err: unknown) {
      setStatus({
        success: false,
        message: err instanceof Error ? err.message : "Sync encountered an unexpected error.",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleEditClick = (tmpl: WhatsAppTemplate) => {
    setEditingTemplate(tmpl);
    setEditMetaName(tmpl.meta_template_name);
    setEditBodyText(tmpl.body_text);
    setEditVars(tmpl.variables.join(", "));
    setEditError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    setSaving(true);
    setEditError("");

    const varsArray = editVars
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    try {
      const res = await updateWhatsAppTemplate(
        editingTemplate.template_key,
        editMetaName,
        editBodyText,
        varsArray
      );

      if (res.success) {
        setTemplates((prev) =>
          prev.map((t) =>
            t.template_key === editingTemplate.template_key
              ? {
                  ...t,
                  meta_template_name: editMetaName.trim(),
                  body_text: editBodyText.trim(),
                  variables: varsArray,
                  updated_at: new Date().toISOString(),
                }
              : t
          )
        );
        setEditingTemplate(null);
      } else {
        setEditError(res.message || "Failed to update template.");
      }
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = templates.filter((t) => {
    const q = search.toLowerCase();
    return (
      !q ||
      t.template_key.toLowerCase().includes(q) ||
      t.meta_template_name.toLowerCase().includes(q) ||
      t.body_text.toLowerCase().includes(q)
    );
  });

  // Highlight parameter placeholders (e.g. {{1}}, {{2}}) with variable names
  const renderFormattedBody = (body: string, vars: string[]) => {
    let text = body;
    vars.forEach((v, index) => {
      const placeholder = `{{${index + 1}}}`;
      text = text.replaceAll(placeholder, `[${v.toUpperCase()}]`);
    });
    return text;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Status */}
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
            <div className="font-semibold">{status.success ? "Sync Completed" : "Sync Failed"}</div>
            <div className="opacity-90 mt-0.5">{status.message}</div>
          </div>
        </div>
      )}

      {/* Action panel & search */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <input
          type="search"
          placeholder="Search templates by key, meta name, body text..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="surface text-xs text-[var(--green-ink)] placeholder:text-[var(--ink-mute)] rounded-full px-4 py-2 w-80 outline-none border border-[var(--surface-border)] focus:border-[var(--green)] transition-all"
        />

        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[var(--green)] text-[var(--cream)] transition-all hover:-translate-y-0.5 hover:bg-[var(--green-deep)] disabled:opacity-50"
        >
          {syncing ? "Syncing Templates..." : "🔄 Sync & Reset Templates"}
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((t) => (
          <div
            key={t.template_key}
            className="surface p-6 rounded-2xl flex flex-col justify-between border border-[var(--surface-border)] transition-all hover:shadow-md"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 border-b border-[var(--surface-border)] pb-3">
                <div>
                  <div className="font-mono text-xs font-bold text-[var(--green-ink)]">
                    {t.template_key}
                  </div>
                  <div className="text-[10px] text-[var(--ink-mute)] mt-1 font-mono">
                    Meta Name: {t.meta_template_name}
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(46,122,76,0.08)] text-[var(--green)] uppercase tracking-wider">
                  {t.status}
                </span>
              </div>

              {/* Template parameters preview */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-[var(--ink-mute)] font-semibold">
                  Body text preview:
                </label>
                <p className="text-xs text-[var(--ink-dim)] bg-[var(--cream-soft)] p-3 rounded-xl border border-[var(--surface-border)] font-sans leading-relaxed whitespace-pre-line">
                  {renderFormattedBody(t.body_text, t.variables)}
                </p>
              </div>

              {/* Variables tags */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-[var(--ink-mute)] font-semibold">
                  Required variables order:
                </label>
                <div className="flex flex-wrap gap-1">
                  {t.variables.map((v, i) => (
                    <span
                      key={v}
                      className="px-2 py-0.5 rounded bg-[var(--cream-deep)] text-[10px] text-[var(--green-ink)] font-mono border border-[var(--surface-border)]"
                    >
                      {i + 1}: {v}
                    </span>
                  ))}
                  {t.variables.length === 0 && (
                    <span className="text-[10px] text-[var(--ink-mute)] italic">No parameters</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-[var(--surface-border)]">
              <span className="text-[10px] text-[var(--ink-mute)]">
                Last updated:{" "}
                {new Date(t.updated_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <button
                onClick={() => handleEditClick(t)}
                className="text-[10px] px-3 py-1.5 rounded-lg bg-[var(--cream-soft)] border border-[var(--surface-border)] text-[var(--green-ink)] font-semibold hover:bg-[var(--cream-deep)] transition-all"
              >
                Edit Template
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-[var(--ink-mute)] text-sm">
            No templates matching search filters found.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="max-w-[500px] w-full p-6 rounded-3xl surface space-y-4 shadow-xl border border-[var(--surface-border)]">
            <div className="text-lg font-display text-[var(--green-ink)]">
              Edit Template Mapping
            </div>
            <p className="text-xs text-[var(--ink-mute)]">
              Define matching Meta template identifiers and variables mapping. Updates do not change settings on Meta Dashboard, only local message parser triggers.
            </p>

            {editError && (
              <div className="p-3 rounded-lg text-xs bg-[rgba(179,58,42,0.08)] border border-[rgba(179,58,42,0.2)] text-[var(--danger)]">
                ⚠️ {editError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[10px] text-[var(--ink-mute)] mb-1 uppercase tracking-wider font-semibold">
                  Template Key (Fixed identifier)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingTemplate.template_key}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--cream-deep)] border border-[var(--surface-border)] text-[var(--ink-mute)] outline-none font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[var(--ink-mute)] mb-1 uppercase tracking-wider font-semibold">
                  Meta WhatsApp Template Name
                </label>
                <input
                  type="text"
                  required
                  value={editMetaName}
                  onChange={(e) => setEditMetaName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--cream-soft)] border border-[var(--surface-border)] text-[var(--green-ink)] outline-none focus:border-[var(--green)] font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[var(--ink-mute)] mb-1 uppercase tracking-wider font-semibold">
                  Local Template Body (For preview references)
                </label>
                <textarea
                  required
                  rows={4}
                  value={editBodyText}
                  onChange={(e) => setEditBodyText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--cream-soft)] border border-[var(--surface-border)] text-[var(--green-ink)] outline-none focus:border-[var(--green)] resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[var(--ink-mute)] mb-1 uppercase tracking-wider font-semibold">
                  Mapping Variables (Comma separated, order matches parameters list)
                </label>
                <input
                  type="text"
                  required
                  value={editVars}
                  onChange={(e) => setEditVars(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--cream-soft)] border border-[var(--surface-border)] text-[var(--green-ink)] outline-none focus:border-[var(--green)]"
                  placeholder="e.g. name, event_title, location"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold surface border border-[var(--surface-border)] text-[var(--ink-mute)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--green)] text-[var(--cream)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {saving ? "Saving Changes..." : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
