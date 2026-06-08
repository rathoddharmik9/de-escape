import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  try {
    // 1. Verify cron authorization secret header
    const authHeader = request.headers.get("Authorization");
    if (process.env.NODE_ENV === "production" || CRON_SECRET) {
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
    }

    const supabase = createAdminClient();

    // 2. Fetch registrations that have non-null screenshots
    const { data: registrations, error: fetchError } = await supabase
      .from("registrations")
      .select("id, screenshot_url, status, events(end_at)")
      .not("screenshot_url", "is", null);

    if (fetchError) {
      console.error("Failed to fetch registrations for purge:", fetchError.message);
      return new NextResponse("Database select error.", { status: 500 });
    }

    if (!registrations || registrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No screenshot urls found in database to purge.",
        purgedCount: 0,
      });
    }

    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Filter registrations to purge based on the business rules:
    // - Parent event ended > 15 days ago
    // - If registration status is "refunded", retention window is extended to 365 days (1 year)
    const toPurge = registrations.filter((r) => {
      // If events metadata is missing or end_at is not present, we skip for safety
      const eventEndStr = (r.events as unknown as { end_at?: string })?.end_at;
      if (!eventEndStr) return false;

      const endAt = new Date(eventEndStr);
      if (r.status === "refunded") {
        return endAt < oneYearAgo;
      } else {
        return endAt < fifteenDaysAgo;
      }
    });

    if (toPurge.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No screenshots met the purge criteria (ended > 15 days ago, or > 365 days if refunded).",
        purgedCount: 0,
      });
    }

    const filePaths = toPurge.map((r) => r.screenshot_url as string);
    const ids = toPurge.map((r) => r.id);

    console.log(`Purging ${filePaths.length} screenshots:`, filePaths);

    // 3. Remove files from storage
    const { data: deletedFiles, error: storageError } = await supabase.storage
      .from("payment-proofs")
      .remove(filePaths);

    if (storageError) {
      console.error("Failed to delete screenshots from storage:", storageError.message);
      return new NextResponse("Storage delete error.", { status: 500 });
    }

    // 4. Clear screenshot_url fields in database
    const { error: dbUpdateError } = await supabase
      .from("registrations")
      .update({ screenshot_url: null })
      .in("id", ids);

    if (dbUpdateError) {
      console.error("Failed to clear screenshot URLs in registrations:", dbUpdateError.message);
      return new NextResponse("Database update error.", { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully purged ${toPurge.length} payment proof screenshot(s).`,
      purgedCount: toPurge.length,
      purgedIds: ids,
      deletedFiles,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected error during screenshot purge.";
    console.error("Error in purge-screenshots cron:", errorMsg);
    return new NextResponse(errorMsg, { status: 500 });
  }
}
