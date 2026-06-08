"use client";

import { useState } from "react";
import { addBlockedContact, removeBlockedContact, BlockedContact } from "@/lib/actions/admin-settings";

interface BlockListBrowserProps {
  initialBlocks: BlockedContact[];
}

export default function BlockListBrowser({ initialBlocks }: BlockListBrowserProps) {
  const [blocks, setBlocks] = useState<BlockedContact[]>(initialBlocks);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    const phoneTrimmed = phone.trim();
    const emailTrimmed = email.trim();

    if (!phoneTrimmed && !emailTrimmed) {
      setErrorMsg("Please specify either a phone number or an email to block.");
      return;
    }

    if (!reason.trim()) {
      setErrorMsg("A reason is required to add a block.");
      return;
    }

    setSubmitting(true);
    try {
      // Normalize phone format to start with +91 if length is 10 and doesn't start with it
      let normalizedPhone = phoneTrimmed;
      if (phoneTrimmed && /^\d{10}$/.test(phoneTrimmed)) {
        normalizedPhone = `+91${phoneTrimmed}`;
      }

      const res = await addBlockedContact(normalizedPhone || null, emailTrimmed || null, reason);
      if (res.success) {
        // Simple reload or manual append. Let's manually append for immediate feedback
        const newBlock: BlockedContact = {
          id: `local-${crypto.randomUUID()}`,
          phone: normalizedPhone || null,
          email: emailTrimmed || null,
          reason: reason.trim(),
          created_at: new Date().toISOString(),
        };
        setBlocks((prev) => [newBlock, ...prev]);
        setShowAddModal(false);
        setPhone("");
        setEmail("");
        setReason("");
      } else {
        setErrorMsg(res.message || "Failed to add block.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblock = async (id: string, detail: string) => {
    if (!confirm(`Are you sure you want to unblock "${detail}"?`)) return;

    try {
      const res = await removeBlockedContact(id);
      if (res.success) {
        setBlocks((prev) => prev.filter((b) => b.id !== id));
      } else {
        alert(res.message || "Failed to remove block.");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error unblocking contact.");
    }
  };

  const filtered = blocks.filter((b) => {
    const q = search.toLowerCase();
    return (
      !q ||
      b.phone?.includes(q) ||
      b.email?.toLowerCase().includes(q) ||
      b.reason.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-[1100px] space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <input
          type="search"
          placeholder="Search block list by phone, email, reason…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="surface text-xs text-[var(--green-ink)] placeholder:text-[var(--ink-mute)] rounded-full px-4 py-2 w-72 outline-none border border-[var(--surface-border)] focus:border-[var(--green)] transition-all"
        />

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[var(--green)] text-[var(--cream)] transition-all hover:-translate-y-0.5 hover:bg-[var(--green-deep)]"
        >
          + Add New Block
        </button>
      </div>

      {/* Block List Table */}
      <div className="rounded-2xl overflow-hidden border border-[var(--surface-border)] surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--cream-deep)]/50 border-b border-[var(--surface-border)]">
                {["Target Contacts", "Block Reason", "Created Date", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-[10px] uppercase tracking-widest text-[var(--ink-mute)] font-medium"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--surface-border)]">
              {filtered.map((b) => {
                const targetText = [b.phone && `📱 ${b.phone}`, b.email && `✉ ${b.email}`]
                  .filter(Boolean)
                  .join("  ·  ");

                return (
                  <tr key={b.id} className="transition-colors hover:bg-[var(--cream-deep)]/25">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[var(--green-ink)] text-xs">
                        {targetText || "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--ink-dim)] max-w-sm truncate">
                      {b.reason}
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--ink-mute)]">
                      {new Date(b.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleUnblock(b.id, b.phone || b.email || "Contact")}
                        className="text-[10px] px-2.5 py-1 rounded-lg surface text-[var(--danger)] hover:bg-[rgba(179,58,42,0.06)] border border-[var(--surface-border)] font-medium transition-all"
                      >
                        Unblock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-[var(--ink-mute)] text-sm">
            No blocked contacts found matching your search.
          </div>
        )}
      </div>

      <p className="text-xs text-[var(--ink-mute)] font-mono">
        {filtered.length} contact{filtered.length !== 1 ? "s" : ""} blocked.
      </p>

      {/* Add Block Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="max-w-[440px] w-full p-6 rounded-3xl surface space-y-4 shadow-xl border border-[var(--surface-border)]">
            <div className="text-lg font-display text-[var(--green-ink)]">Add Contact Block</div>
            <p className="text-xs text-[var(--ink-mute)] leading-relaxed">
              Block form submissions matching this phone number or email address. 
              Submissions matching these entries will be silently rejected to avoid leaking block configuration.
            </p>

            {errorMsg && (
              <div className="p-3 rounded-lg text-xs bg-[rgba(179,58,42,0.08)] border border-[rgba(179,58,42,0.2)] text-[var(--danger)]">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddBlock} className="space-y-4">
              <div>
                <label className="block text-[10px] text-[var(--ink-mute)] mb-1 uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9876543210 (10 digits)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--cream-soft)] border border-[var(--surface-border)] text-[var(--green-ink)] outline-none focus:border-[var(--green)]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[var(--ink-mute)] mb-1 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. spammer@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--cream-soft)] border border-[var(--surface-border)] text-[var(--green-ink)] outline-none focus:border-[var(--green)]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[var(--ink-mute)] mb-1 uppercase tracking-wider">
                  Reason for Block
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Charging fraud / fake screenshot spam"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-[var(--cream-soft)] border border-[var(--surface-border)] text-[var(--green-ink)] outline-none focus:border-[var(--green)] resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setErrorMsg("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold surface border border-[var(--surface-border)] text-[var(--ink-mute)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--danger)] text-white hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {submitting ? "Blocking..." : "Block Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
