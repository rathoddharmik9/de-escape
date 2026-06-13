"use client";

import { useState } from "react";
import { sendBroadcast } from "@/lib/actions/admin-comms";

interface EventItem {
  id: string;
  title: string;
  start_at: string;
  venue_name?: string;
}

interface TemplateItem {
  template_key: string;
  meta_template_name: string;
  body_text: string;
  variables: string[];
}

interface BroadcastFormProps {
  events: EventItem[];
  templates: TemplateItem[];
}

const DEFAULT_EMAIL_BODY = `<h2>Hello {{name}},</h2>
<p>We have an exciting update regarding <strong>{{event_title}}</strong>!</p>
<p>Event details:</p>
<ul>
  <li><strong>Date:</strong> {{event_date}}</li>
  <li><strong>Pass Code:</strong> {{pass_code}}</li>
</ul>
<p>You can access your pass here: <a href="{{pass_url}}">View Pass</a></p>
<p>See you there!</p>`;

export default function BroadcastForm({ events, templates }: BroadcastFormProps) {
  const [eventId, setEventId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channels, setChannels] = useState<string[]>(["email"]);
  
  // WhatsApp States
  const [whatsappTemplateKey, setWhatsappTemplateKey] = useState<string>("");
  
  // Email States
  const [emailSubject, setEmailSubject] = useState<string>("Important Update: {{event_title}}");
  const [emailBodyHtml, setEmailBodyHtml] = useState<string>(DEFAULT_EMAIL_BODY);

  // Status/Response states
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; sentCount?: number } | null>(null);

  // Get current active event for preview
  const selectedEvent = events.find(e => e.id === eventId);
  const previewEventTitle = selectedEvent ? selectedEvent.title : "Amazing Event";
  const previewEventDate = selectedEvent 
    ? new Date(selectedEvent.start_at).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "long",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }) + " IST"
    : "Sunday, June 14, 2026 at 6:00 PM IST";
  const previewVenue = selectedEvent?.venue_name || "De-escape Hub";

  // Get current active template for preview
  const selectedTemplate = templates.find(t => t.template_key === whatsappTemplateKey);

  // Toggle channel selection
  const handleChannelToggle = (channel: string) => {
    setChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel) 
        : [...prev, channel]
    );
  };

  // Compile Preview Texts
  const compileEmailBody = () => {
    return emailBodyHtml
      .replace(/\{\{name\}\}/g, "Dharmik Rathod")
      .replace(/\{\{event_title\}\}/g, previewEventTitle)
      .replace(/\{\{event_date\}\}/g, previewEventDate)
      .replace(/\{\{pass_code\}\}/g, "DE-SAMPLE")
      .replace(/\{\{pass_url\}\}/g, "https://de-escape.in/p/DE-SAMPLE");
  };

  const compileEmailSubject = () => {
    return emailSubject.replace(/\{\{event_title\}\}/g, previewEventTitle);
  };

  const compileWhatsAppBody = () => {
    if (!selectedTemplate) return "Select a template to preview message.";
    
    // Meta template placeholders match [name, event_title, datetime, venue, pass_code]
    return selectedTemplate.body_text
      .replace(/\{\{1\}\}/g, "Dharmik Rathod")
      .replace(/\{\{2\}\}/g, previewEventTitle)
      .replace(/\{\{3\}\}/g, previewEventDate)
      .replace(/\{\{4\}\}/g, previewVenue)
      .replace(/\{\{5\}\}/g, "DE-SAMPLE")
      .replace(/\{\{6\}\}/g, "https://de-escape.in/p/DE-SAMPLE")
      .replace(/\{\{7\}\}/g, "https://chat.whatsapp.com/sample-group");
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (channels.length === 0) {
      alert("Please select at least one delivery channel (WhatsApp or Email).");
      return;
    }

    if (channels.includes("whatsapp") && !whatsappTemplateKey) {
      alert("Please select a WhatsApp template.");
      return;
    }

    if (channels.includes("email") && (!emailSubject || !emailBodyHtml)) {
      alert("Please fill out both email subject and body.");
      return;
    }

    if (!confirm("Are you sure you want to blast this broadcast? This will be sent immediately to matching attendees.")) {
      return;
    }

    setIsSending(true);
    setResult(null);

    try {
      const payload = {
        eventId: eventId === "all" ? null : eventId,
        statusFilter,
        channels,
        whatsappTemplateKey: channels.includes("whatsapp") ? whatsappTemplateKey : null,
        emailSubject: channels.includes("email") ? emailSubject : null,
        emailBodyHtml: channels.includes("email") ? emailBodyHtml : null,
      };

      const res = await sendBroadcast(payload);
      setResult(res);
    } catch (err: unknown) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "An unexpected error occurred."
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Form Area */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
        {/* Filters Box */}
        <div className="p-6 rounded-2xl border border-[var(--surface-border)]" style={{ background: "var(--cream-soft)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--green-ink)] mb-4">1. Recipient Cohort Filter</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5" htmlFor="event-select">
                Target Event
              </label>
              <select
                id="event-select"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 border border-[var(--surface-border)] outline-none bg-white focus:border-[var(--green)]"
              >
                <option value="all">All Active Events</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} ({new Date(e.start_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5" htmlFor="status-select">
                Registration Status
              </label>
              <select
                id="status-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 border border-[var(--surface-border)] outline-none bg-white focus:border-[var(--green)]"
              >
                <option value="all">General List (Approved & Attended)</option>
                <option value="approved">Approved Pass Holders Only</option>
                <option value="awaiting_verification">Awaiting Verification Only</option>
                <option value="pending">Pending Registrations Only</option>
                <option value="attended">Attended Cohort Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Channels Selector */}
        <div className="p-6 rounded-2xl border border-[var(--surface-border)]" style={{ background: "var(--cream-soft)" }}>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--green-ink)] mb-4">2. Choose Delivery Channels</h2>
          
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleChannelToggle("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                channels.includes("email")
                  ? "bg-[var(--green)] text-white border-[var(--green)]"
                  : "bg-white text-[var(--ink-dim)] border-[var(--surface-border)] hover:bg-[var(--cream)]"
              }`}
            >
              <span className="text-lg">✉</span> Email Blast
            </button>
            <button
              type="button"
              onClick={() => handleChannelToggle("whatsapp")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
                channels.includes("whatsapp")
                  ? "bg-[#25D366] text-white border-[#25D366]"
                  : "bg-white text-[var(--ink-dim)] border-[var(--surface-border)] hover:bg-[var(--cream)]"
              }`}
            >
              <span className="text-lg">💬</span> WhatsApp Template
            </button>
          </div>
        </div>

        {/* WhatsApp Template Composition Box */}
        {channels.includes("whatsapp") && (
          <div className="p-6 rounded-2xl border border-[var(--surface-border)] space-y-4" style={{ background: "var(--cream-soft)" }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--green-ink)]">3. WhatsApp Template Setup</h2>
            
            <div>
              <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5" htmlFor="whatsapp-template-select">
                Approved Meta Template
              </label>
              <select
                id="whatsapp-template-select"
                value={whatsappTemplateKey}
                onChange={(e) => setWhatsappTemplateKey(e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 border border-[var(--surface-border)] outline-none bg-white focus:border-[var(--green)]"
              >
                <option value="">-- Select Template --</option>
                {templates.map((t) => (
                  <option key={t.template_key} value={t.template_key}>
                    {t.meta_template_name} ({t.variables.length} vars)
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[var(--ink-mute)]">
                Note: WhatsApp templates must be approved by Meta and variables mapped chronologically.
              </p>
            </div>
          </div>
        )}

        {/* Email Composition Box */}
        {channels.includes("email") && (
          <div className="p-6 rounded-2xl border border-[var(--surface-border)] space-y-4" style={{ background: "var(--cream-soft)" }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--green-ink)]">3. Email Editor</h2>
            
            <div>
              <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5" htmlFor="email-subject-input">
                Subject Line
              </label>
              <input
                id="email-subject-input"
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Compose subject line..."
                className="w-full text-sm rounded-xl px-3 py-2 border border-[var(--surface-border)] outline-none bg-white focus:border-[var(--green)]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5" htmlFor="email-body-input">
                HTML Body Content
              </label>
              <textarea
                id="email-body-input"
                rows={10}
                value={emailBodyHtml}
                onChange={(e) => setEmailBodyHtml(e.target.value)}
                className="w-full text-sm rounded-xl px-3 py-2 border border-[var(--surface-border)] outline-none bg-white focus:border-[var(--green)] font-mono text-xs"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {["{{name}}", "{{event_title}}", "{{event_date}}", "{{pass_code}}", "{{pass_url}}"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setEmailBodyHtml(prev => prev + tag)}
                    className="text-[10px] px-2 py-0.5 bg-white border border-[var(--surface-border)] rounded-md hover:bg-[var(--cream)] text-[var(--ink-dim)] font-mono"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Status / Output Display */}
        {result && (
          <div
            className={`p-4 rounded-xl border text-sm flex gap-3 ${
              result.success
                ? "bg-[rgba(93,202,165,0.1)] border-[rgba(93,202,165,0.2)] text-[var(--green-ink)]"
                : "bg-[rgba(255,122,92,0.1)] border-[rgba(255,122,92,0.2)] text-[var(--coral)]"
            }`}
          >
            <span className="text-base">{result.success ? "✓" : "✗"}</span>
            <div>
              <div className="font-semibold">{result.success ? "Broadcast Complete" : "Broadcast Failed"}</div>
              <div className="text-xs opacity-90 mt-0.5">
                {result.success 
                  ? `Successfully processed and delivered communications to ${result.sentCount} matching recipients.` 
                  : result.message}
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={isSending}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-medium text-sm transition-all hover:-translate-y-0.5 disabled:opacity-50"
          style={{ background: "var(--green-ink)" }}
        >
          {isSending ? (
            <>
              <span className="animate-spin text-base">◌</span> Processing Queue...
            </>
          ) : (
            <>🚀 Dispatch Broadcast</>
          )}
        </button>
      </form>

      {/* Previews Panel */}
      <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-6">
        {/* Mobile WhatsApp Chat Preview */}
        {channels.includes("whatsapp") && (
          <div className="border border-[var(--surface-border)] rounded-[2.5rem] bg-[#efeae2] p-4 shadow-xl overflow-hidden relative max-w-[340px] mx-auto">
            {/* Phone Speaker & Camera */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-b-xl z-10 flex items-center justify-center">
              <div className="w-10 h-1 bg-zinc-800 rounded-full" />
              <div className="w-2.5 h-2.5 bg-zinc-900 rounded-full ml-3" />
            </div>

            {/* Chat Header */}
            <div className="bg-[#075e54] text-white pt-6 pb-2.5 px-4 rounded-t-3xl -mx-4 -mt-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                De
              </div>
              <div>
                <div className="text-xs font-semibold">De-escape Broadcast</div>
                <div className="text-[9px] text-white/70">Official Business Account</div>
              </div>
            </div>

            {/* Chat Window */}
            <div className="h-[250px] overflow-y-auto py-4 px-2 flex flex-col justify-end space-y-2">
              <div className="bg-white rounded-lg shadow-sm p-3 max-w-[85%] self-start relative text-[11px] leading-relaxed text-zinc-800 rounded-tl-none border-l-4 border-[#25D366]">
                <div className="whitespace-pre-line font-sans">
                  {compileWhatsAppBody()}
                </div>
                <div className="text-[8px] text-zinc-400 text-right mt-1">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-zinc-500 font-sans tracking-wide py-2">
              📱 WhatsApp Preview
            </div>
          </div>
        )}

        {/* Email Client Preview */}
        {channels.includes("email") && (
          <div className="border border-[var(--surface-border)] rounded-2xl bg-white shadow-xl overflow-hidden">
            {/* Email Header */}
            <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-3 text-xs text-zinc-600 space-y-1">
              <div><span className="font-semibold">From:</span> De-escape &lt;noreply@de-escape.in&gt;</div>
              <div><span className="font-semibold">To:</span> dharmik@de-escape.in</div>
              <div className="truncate"><span className="font-semibold">Subject:</span> {compileEmailSubject() || "(No Subject)"}</div>
            </div>

            {/* Email Brand Wrapper */}
            <div className="p-4 bg-[#F5ECCE] max-h-[350px] overflow-y-auto">
              <div className="bg-[#FBF6E6] border border-zinc-200 rounded-xl overflow-hidden max-w-sm mx-auto shadow-sm">
                <div className="py-4 text-center border-b border-zinc-100 bg-[#FBF6E6]">
                  <span className="font-black text-emerald-800 tracking-wide text-lg" style={{ fontFamily: "var(--font-logo), sans-serif" }}>De-escape</span>
                </div>
                
                {/* HTML content inside email preview */}
                <div 
                  className="p-5 bg-white text-xs leading-relaxed text-zinc-800 email-preview-content"
                  dangerouslySetInnerHTML={{ __html: compileEmailBody() }}
                />

                <div className="py-3 text-center border-t border-zinc-50 text-[9px] text-zinc-400">
                  This email is sent on behalf of De-escape.
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-zinc-500 font-sans tracking-wide py-2 border-t border-zinc-100 bg-zinc-50">
              ✉ Email Preview
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
