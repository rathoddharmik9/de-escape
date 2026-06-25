import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const newLink = "https://chat.whatsapp.com/KttOYHKOaXkHo8votUAXxz?mode=gi_t";
  const targetKeys = ["community_whatsapp_link", "whatsapp_group_invite_link", "footer_whatsapp_url"];

  console.log("Updating keys in Supabase database...");

  for (const key of targetKeys) {
    const { data, error } = await supabase
      .from("app_settings")
      .upsert({ key, value: newLink }, { onConflict: "key" })
      .select();

    if (error) {
      console.error(`Failed to update ${key}:`, error.message);
    } else {
      console.log(`Successfully updated ${key} to:`, data?.[0]?.value);
    }
  }
}

main();
