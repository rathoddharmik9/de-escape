import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// 1. GET Request: Verify token handshake from Meta dashboard
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode && token) {
      if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
        console.log("WhatsApp Webhook handshake successful!");
        return new NextResponse(challenge, {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });
      }
      return new NextResponse("Forbidden verification mismatch", { status: 403 });
    }
    return new NextResponse("Bad request", { status: 400 });
  } catch (err) {
    console.error("WhatsApp Webhook GET error:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// 2. POST Request: Inbound message alerts & status delivery receipts
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const supabase = createAdminClient();

    // Loop through changes entries
    const entries = payload.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const val = change.value || {};
        
        // A. Handle inbound messages
        if (val.messages && val.messages.length > 0) {
          for (const msg of val.messages) {
            const phone = msg.from; // e.g. "919876543210"
            const body = msg.text?.body || "";
            const timestamp = msg.timestamp ? new Date(parseInt(msg.timestamp) * 1000).toISOString() : new Date().toISOString();

            if (body.trim()) {
              // Insert message into whatsapp_inbox
              const { error } = await supabase.from("whatsapp_inbox").insert({
                phone,
                body,
                received_at: timestamp,
                handled: false,
              });

              if (error) {
                console.error("Failed to insert WhatsApp message to inbox:", error.message);
              } else {
                console.log(`Successfully logged WhatsApp inbound message from ${phone}`);
              }
            }
          }
        }

        // B. Handle delivery status receipts
        if (val.statuses && val.statuses.length > 0) {
          for (const statusItem of val.statuses) {
            const providerId = statusItem.id;
            const newStatus = statusItem.status; // 'delivered' | 'read' | 'failed'

            // Update status in message_log table
            const { error } = await supabase
              .from("message_log")
              .update({
                status: newStatus,
                updated_at: new Date().toISOString(),
              })
              .eq("provider_message_id", providerId);

            if (error) {
              console.error("Failed to update message status receipt:", error.message);
            }
          }
        }
      }
    }

    return new NextResponse("EVENT_RECEIVED", { status: 200 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "WhatsApp Webhook payload parsing error";
    console.error("WhatsApp Webhook POST failed:", errorMsg);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}
