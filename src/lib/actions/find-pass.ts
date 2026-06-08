"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function lookupPass(phone: string, email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Normalize
    const cleanPhone = phone.trim().replace(/\s+/g, "");
    const normalizedPhone = cleanPhone.startsWith("+91") ? cleanPhone : `+91${cleanPhone}`;
    const normalizedEmail = email.toLowerCase().trim();

    // Query registrations
    const { data: registration, error } = await supabase
      .from("registrations")
      .select("id, status, pass_code")
      .eq("phone", normalizedPhone)
      .eq("email", normalizedEmail)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Pass lookup database error:", error.message);
      return { success: false, error: "Database search error." };
    }

    if (!registration) {
      return { success: false, error: "No registration found with those details." };
    }

    // (In Plan 4, this is where we will trigger sending the WhatsApp and Email templates containing the passcode link)
    console.log(`[Lookup Pass] Found passcode: ${registration.pass_code} for registration: ${registration.id}`);

    return { success: true };
  } catch (err) {
    console.error("Pass lookup general error:", err);
    return { success: false, error: "An unexpected error occurred." };
  }
}
