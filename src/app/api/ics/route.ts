import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";


function formatICSDate(dateString: string): string {
  const d = new Date(dateString);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  const seconds = String(d.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

// Helper to escape special ICS characters
function escapeICS(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regId = searchParams.get("reg");

    if (!regId) {
      return new NextResponse("Missing registration ID query parameter 'reg'.", { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch registration with joined event details
    const { data: reg, error } = await supabase
      .from("registrations")
      .select("*, events(*)")
      .eq("id", regId)
      .maybeSingle();

    if (error || !reg) {
      return new NextResponse("Registration ticket not found.", { status: 404 });
    }

    const event = reg.events;
    if (!event) {
      return new NextResponse("Event details missing for this registration.", { status: 404 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    
    // Construct calendar invite text
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//De-escape//Event Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:${reg.id}@de-escape.in`,
      `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
      `DTSTART:${formatICSDate(event.start_at)}`,
      `DTEND:${formatICSDate(event.end_at)}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `LOCATION:${escapeICS(`${event.venue_name}, ${event.venue_address}`)}`,
      `DESCRIPTION:Your De-escape Pass Code: ${reg.pass_code}\\n\\nView your pass: ${siteUrl}/p/${reg.pass_code}\\n\\nRefund Policy: ${escapeICS(event.refund_policy)}`,
      `URL:${siteUrl}/p/${reg.pass_code}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="de-escape-event-${reg.pass_code}.ics"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected calendar invite generation error";
    console.error("Calendar invite generation failed:", errorMsg);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}
