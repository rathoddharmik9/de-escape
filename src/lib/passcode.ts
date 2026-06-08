import { createAdminClient } from "@/lib/supabase/admin";

// Alphanumeric characters excluding lookalikes: I, O, 1, 0, L
const CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function generateCode(): string {
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

export async function generateUniquePassCode(eventId: string): Promise<string> {
  const supabase = createAdminClient();
  let code = "";
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    code = generateCode();
    attempts++;
    
    // Check uniqueness for this event
    const { data, error } = await supabase
      .from("registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("pass_code", code)
      .maybeSingle();

    if (error) {
      console.error("Error checking passcode uniqueness:", error.message);
      // Fallback if registrations table does not exist yet
      break;
    }

    if (!data) {
      exists = false;
    }
  }

  return code;
}
