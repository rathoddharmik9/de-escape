import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// DEV-ONLY endpoint: creates a real session without email magic link
// Disabled in production automatically
export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not found", { status: 404 });
  }

  const { origin } = new URL(request.url);

  try {
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Generate a link and get its token
    const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
      type: "magiclink",
      email: "rathoddharmik9@gmail.com",
    });

    if (linkError || !linkData) {
      return new NextResponse(`Failed to generate link: ${linkError?.message}`, { status: 500 });
    }

    // Use the token to sign in via the Supabase verify endpoint
    const verifyUrl = linkData.properties.action_link;

    // Redirect the browser directly to the Supabase verify URL
    // but have Supabase redirect back to our confirm page
    const url = new URL(verifyUrl);
    url.searchParams.set("redirect_to", `${origin}/auth/confirm`);

    return NextResponse.redirect(url.toString());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new NextResponse(`Error: ${msg}`, { status: 500 });
  }
}
