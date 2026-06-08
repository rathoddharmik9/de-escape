"use client";

import { useState } from "react";
import { replyToWhatsApp, markInboxHandled } from "@/lib/actions/admin-comms";
import Link from "next/link";

export interface ChatMessage {
  id: string;
  type: "inbound" | "outbound";
  body: string;
  timestamp: string;
  status?: string;
  templateKey?: string;
}

export interface ChatThread {
  phone: string;
  attendeeName: string | null;
  registrationId: string | null;
  lastMessageAt: string;
  handled: boolean;
  messages: ChatMessage[];
}

interface InboxChatProps {
  initialThreads: ChatThread[];
}

export default function InboxChat({ initialThreads }: InboxChatProps) {
  const [threads, setThreads] = useState<ChatThread[]>(initialThreads);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(
    initialThreads.length > 0 ? initialThreads[0].phone : null
  );
  const [search, setSearch] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sendingPhone, setSendingPhone] = useState<string | null>(null);
  const [handlingPhone, setHandlingPhone] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "unhandled" | "handled">("all");

  const activeThread = threads.find((t) => t.phone === selectedPhone);

  // Check if last inbound message is within 24h
  const checkIsWithin24Hours = (thread: ChatThread | undefined) => {
    if (!thread) return false;
    const inboundMessages = thread.messages.filter((m) => m.type === "inbound");
    if (inboundMessages.length === 0) return false;
    
    const lastInbound = inboundMessages[inboundMessages.length - 1];
    const lastTime = new Date(lastInbound.timestamp).getTime();
    const now = new Date().getTime();
    const diffHours = (now - lastTime) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  const isWithin24h = checkIsWithin24Hours(activeThread);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhone || !replyText.trim() || sendingPhone) return;

    setSendingPhone(selectedPhone);
    try {
      const res = await replyToWhatsApp(selectedPhone, replyText);
      if (res.success) {
        // Append outbound message locally
        setThreads((prev) =>
          prev.map((t) => {
            if (t.phone === selectedPhone) {
              const newMsg: ChatMessage = {
                id: `local-${crypto.randomUUID()}`,
                type: "outbound",
                body: replyText,
                timestamp: new Date().toISOString(),
                status: "sent",
                templateKey: "freeform_reply",
              };
              return {
                ...t,
                lastMessageAt: newMsg.timestamp,
                messages: [...t.messages, newMsg],
              };
            }
            return t;
          })
        );
        setReplyText("");
      } else {
        alert(res.message || "Failed to deliver WhatsApp message.");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error sending reply.");
    } finally {
      setSendingPhone(null);
    }
  };

  const handleMarkHandled = async (phone: string) => {
    if (handlingPhone) return;
    setHandlingPhone(phone);
    try {
      const res = await markInboxHandled(phone);
      if (res.success) {
        setThreads((prev) =>
          prev.map((t) => (t.phone === phone ? { ...t, handled: true } : t))
        );
      } else {
        alert(res.message || "Failed to mark as handled.");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error handling request.");
    } finally {
      setHandlingPhone(null);
    }
  };

  // Filter threads
  const filteredThreads = threads
    .filter((t) => {
      // Filter by status (unhandled vs handled)
      if (filterMode === "unhandled") return !t.handled;
      if (filterMode === "handled") return t.handled;
      return true;
    })
    .filter((t) => {
      // Filter by search query
      const q = search.toLowerCase();
      return (
        !q ||
        t.phone.includes(q) ||
        (t.attendeeName && t.attendeeName.toLowerCase().includes(q))
      );
    })
    // Sort by last message date descending
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)] min-h-[550px]">
      {/* Threads list (Left Column) */}
      <div className="lg:col-span-4 flex flex-col surface rounded-2xl overflow-hidden border border-[var(--surface-border)] h-full">
        {/* Search & Tabs */}
        <div className="p-4 border-b border-[var(--surface-border)] space-y-3">
          <input
            type="search"
            placeholder="Search by name, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs rounded-full px-4 py-2 border border-[var(--surface-border)] bg-[var(--cream-soft)] text-[var(--green-ink)] placeholder:text-[var(--ink-mute)] outline-none focus:border-[var(--green)]"
          />

          <div className="flex gap-1 bg-[var(--cream-deep)]/40 p-0.5 rounded-lg border border-[var(--surface-border)]/50">
            {(["all", "unhandled", "handled"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`flex-1 py-1 rounded-md text-[10px] uppercase tracking-wider font-semibold transition-all ${
                  filterMode === mode
                    ? "bg-white text-[var(--green-ink)] border border-[var(--surface-border)] shadow-xs"
                    : "text-[var(--ink-mute)] hover:text-[var(--green-ink)]"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* List scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--surface-border)] bg-[var(--cream-soft)]/20">
          {filteredThreads.length > 0 ? (
            filteredThreads.map((thread) => {
              const isSelected = thread.phone === selectedPhone;
              const lastMsg = thread.messages[thread.messages.length - 1];
              const nameOrPhone = thread.attendeeName || thread.phone;
              
              return (
                <button
                  key={thread.phone}
                  onClick={() => setSelectedPhone(thread.phone)}
                  className={`w-full text-left p-4 flex gap-3 transition-colors ${
                    isSelected
                      ? "bg-[var(--cream-deep)]/30 border-r-2 border-[var(--green)]"
                      : "hover:bg-[var(--cream-deep)]/15"
                  }`}
                >
                  <div
                    className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs text-[var(--cream)]"
                    style={{ background: "var(--green)" }}
                  >
                    {nameOrPhone.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-semibold text-[var(--green-ink)] truncate">
                        {nameOrPhone}
                      </span>
                      <span className="text-[9px] text-[var(--ink-mute)] whitespace-nowrap">
                        {new Date(thread.lastMessageAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>

                    <p className="text-[11px] text-[var(--ink-dim)] truncate">
                      {lastMsg ? lastMsg.body : "No messages yet"}
                    </p>

                    <div className="flex items-center gap-1.5 pt-0.5">
                      {!thread.handled ? (
                        <span className="text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-sm">
                          Pending
                        </span>
                      ) : (
                        <span className="text-[8px] font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-sm">
                          Handled
                        </span>
                      )}
                      {thread.attendeeName && (
                        <span className="text-[8px] font-mono text-[var(--ink-mute)]">
                          {thread.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-[var(--ink-mute)]">
              No conversations found.
            </div>
          )}
        </div>
      </div>

      {/* Message Area (Right Column) */}
      <div className="lg:col-span-8 flex flex-col surface rounded-2xl overflow-hidden border border-[var(--surface-border)] h-full">
        {activeThread ? (
          <>
            {/* Thread Header */}
            <div className="px-6 py-4 border-b border-[var(--surface-border)] flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-[var(--cream)]"
                  style={{ background: "var(--green)" }}
                >
                  {(activeThread.attendeeName || activeThread.phone).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--green-ink)]">
                    {activeThread.attendeeName || activeThread.phone}
                  </h2>
                  <div className="text-[10px] text-[var(--ink-mute)] flex items-center gap-2">
                    <span>{activeThread.phone}</span>
                    {activeThread.registrationId && (
                      <>
                        <span>·</span>
                        <Link
                          href={`/admin/registrations/${activeThread.registrationId}`}
                          className="text-[var(--green)] hover:underline"
                        >
                          View Registration Pass →
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {!activeThread.handled && (
                  <button
                    onClick={() => handleMarkHandled(activeThread.phone)}
                    disabled={handlingPhone === activeThread.phone}
                    className="text-[10px] font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full bg-[var(--green)] text-[var(--cream)] transition-all hover:bg-[var(--green-deep)] disabled:opacity-50"
                  >
                    {handlingPhone === activeThread.phone ? "Saving..." : "Mark Handled"}
                  </button>
                )}
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[var(--cream-soft)]/20">
              {activeThread.messages.map((msg) => {
                const isInbound = msg.type === "inbound";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isInbound ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-xs text-xs relative ${
                        isInbound
                          ? "bg-white border border-[var(--surface-border)] text-[var(--green-ink)] rounded-tl-none"
                          : "bg-[var(--green)] text-[var(--cream)] rounded-tr-none"
                      }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed">{msg.body}</p>
                      
                      <div
                        className={`text-[8px] mt-1 text-right flex items-center justify-end gap-1 ${
                          isInbound ? "text-[var(--ink-mute)]" : "text-emerald-100"
                        }`}
                      >
                        <span>
                          {new Date(msg.timestamp).toLocaleString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {!isInbound && msg.status && (
                          <span className="font-semibold uppercase tracking-wider scale-95 opacity-80">
                            · {msg.status === "sent" ? "✓" : msg.status}
                          </span>
                        )}
                        {!isInbound && msg.templateKey && msg.templateKey !== "freeform_reply" && (
                          <span className="font-semibold bg-emerald-700/50 px-1 rounded-sm text-[7px] uppercase tracking-wide">
                            Template: {msg.templateKey}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Form */}
            <div className="p-4 border-t border-[var(--surface-border)] bg-[var(--cream-soft)]/5">
              {isWithin24h ? (
                <form onSubmit={handleReplySubmit} className="flex gap-2 items-start">
                  <textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Compose a reply to ${activeThread.attendeeName || activeThread.phone}...`}
                    className="flex-1 text-xs rounded-xl px-4 py-2.5 border border-[var(--surface-border)] bg-white text-[var(--green-ink)] placeholder:text-[var(--ink-mute)] outline-none focus:border-[var(--green)] resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || sendingPhone === activeThread.phone}
                    className="px-4 py-3.5 rounded-xl font-semibold bg-[var(--green-ink)] text-white text-xs whitespace-nowrap transition-all hover:-translate-y-0.5 disabled:opacity-50"
                  >
                    {sendingPhone === activeThread.phone ? "Sending..." : "Send Reply"}
                  </button>
                </form>
              ) : (
                <div className="p-4 rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-800 text-[11px] leading-relaxed flex gap-2">
                  <span className="text-sm">⚠️</span>
                  <div>
                    <span className="font-semibold">Meta 24-Hour Window Expired.</span>
                    <p className="mt-0.5 text-yellow-700">
                      The customer service reply window is closed because the customer last messaged more than 24 hours ago. 
                      You can send template alerts instead from the{" "}
                      <Link href="/admin/broadcasts" className="underline font-bold text-[var(--green-ink)]">
                        Broadcasts Center
                      </Link>.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--ink-mute)]">
            <span className="text-4xl mb-2">💬</span>
            <p className="text-xs">Select a conversation thread from the inbox to chat.</p>
          </div>
        )}
      </div>
    </div>
  );
}
