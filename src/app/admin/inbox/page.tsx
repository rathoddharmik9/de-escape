import { createClient } from "@/lib/supabase/server";
import InboxChat, { ChatThread } from "@/components/admin/InboxChat";

export const revalidate = 0; // Dynamic rendering

interface OutboundPayload {
  text?: string;
  variables?: string[];
}

export default async function AdminInboxPage() {
  const supabase = createClient();

  // 1. Fetch all registrations to match phone numbers with names
  const { data: registrations } = await supabase
    .from("registrations")
    .select("id, full_name, phone");

  // 2. Fetch all inbound messages
  const { data: inbound } = await supabase
    .from("whatsapp_inbox")
    .select("*")
    .order("received_at", { ascending: true });

  // 3. Fetch all outbound WhatsApp logs
  const { data: outbound } = await supabase
    .from("message_log")
    .select("*")
    .eq("channel", "whatsapp")
    .order("created_at", { ascending: true });

  // 4. Fetch WhatsApp templates to reconstruct outbound messages
  const { data: templates } = await supabase
    .from("whatsapp_templates")
    .select("template_key, body_text");

  const templatesMap: Record<string, string> = {};
  if (templates) {
    templates.forEach((t) => {
      templatesMap[t.template_key] = t.body_text;
    });
  }

  // Helper to compile the reconstructed template text
  const getOutboundBody = (templateKey: string, payload: unknown) => {
    const p = payload as OutboundPayload | null | undefined;
    if (templateKey === "freeform_reply") {
      return p?.text || "Freeform message";
    }

    const bodyText = templatesMap[templateKey];
    if (bodyText && p?.variables && Array.isArray(p.variables)) {
      let reconstructed = bodyText;
      p.variables.forEach((variable: string, index: number) => {
        reconstructed = reconstructed.replace(new RegExp(`\\{\\{${index + 1}\\}\\}`, "g"), variable);
      });
      return reconstructed;
    }

    // Fallback if no template body is found
    if (p?.variables && Array.isArray(p.variables)) {
      return `[Template Alert: ${templateKey}]\n${p.variables.join(" · ")}`;
    }

    return p?.text || `Outbound template: ${templateKey}`;
  };


  // Group messages by phone number
  const threadsMap: Record<string, ChatThread> = {};

  const getThreadKey = (phone: string) => {
    return phone.replace(/\+/g, "").trim();
  };

  const getAttendeeInfo = (phoneKey: string) => {
    if (!registrations) return { name: null, id: null };
    const reg = registrations.find((r) => r.phone.replace(/\+/g, "").trim() === phoneKey);
    return reg ? { name: reg.full_name, id: reg.id } : { name: null, id: null };
  };

  // Process inbound messages
  if (inbound) {
    inbound.forEach((msg) => {
      const key = getThreadKey(msg.phone);
      if (!threadsMap[key]) {
        const info = getAttendeeInfo(key);
        threadsMap[key] = {
          phone: msg.phone,
          attendeeName: info.name,
          registrationId: info.id,
          lastMessageAt: msg.received_at,
          handled: msg.handled,
          messages: [],
        };
      }

      threadsMap[key].messages.push({
        id: msg.id,
        type: "inbound",
        body: msg.body,
        timestamp: msg.received_at,
      });

      if (new Date(msg.received_at).getTime() > new Date(threadsMap[key].lastMessageAt).getTime()) {
        threadsMap[key].lastMessageAt = msg.received_at;
      }

      // If any inbound message is not handled, set handled to false
      if (!msg.handled) {
        threadsMap[key].handled = false;
      }
    });
  }

  // Process outbound messages
  if (outbound) {
    outbound.forEach((msg) => {
      const key = getThreadKey(msg.recipient);
      if (!threadsMap[key]) {
        const info = getAttendeeInfo(key);
        threadsMap[key] = {
          phone: msg.recipient,
          attendeeName: info.name,
          registrationId: info.id,
          lastMessageAt: msg.created_at,
          handled: true, // outbound messages are handled by default
          messages: [],
        };
      }

      const bodyText = getOutboundBody(msg.template_key, msg.payload);

      threadsMap[key].messages.push({
        id: msg.id,
        type: "outbound",
        body: bodyText,
        timestamp: msg.created_at,
        status: msg.status,
        templateKey: msg.template_key,
      });

      if (new Date(msg.created_at).getTime() > new Date(threadsMap[key].lastMessageAt).getTime()) {
        threadsMap[key].lastMessageAt = msg.created_at;
      }
    });
  }

  // Sort messages inside each thread chronologically
  const threadsList = Object.values(threadsMap).map((thread) => {
    thread.messages.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    return thread;
  });

  return (
    <div className="max-w-[1100px] space-y-6 h-full flex flex-col">
      <div>
        <h1 className="font-display text-3xl text-[var(--green-ink)] tracking-tight">
          WhatsApp Inbox
        </h1>
        <p className="text-sm text-[var(--ink-mute)] mt-1">
          Review customer service chats, template statuses, and reply to inbound requests.
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <InboxChat initialThreads={threadsList} />
      </div>
    </div>
  );
}
