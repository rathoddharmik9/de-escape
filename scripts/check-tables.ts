import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const { data, error } = await supabase.from("registrations").select("*").limit(1);
  if (error) {
    console.log("Error checking registrations table:", error.message, error.code);
  } else {
    console.log("Registrations table exists! First row:", data);
  }
}
main();
