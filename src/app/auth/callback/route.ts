import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      
      if (user) {
        // Query the admins table to check if they have admin privileges
        const { data: admin } = await supabase
          .from("admins")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!admin) {
          // Logged in but not an admin! Sign out and redirect.
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/admin/login?error=unauthorized`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/admin/login?error=auth-failed`);
}
