import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");

  // TEMP: Login bypass — allow all /admin access without auth.
  // Revert this block to restore the auth guard below.
  if (isAdminPath && !isLoginPage) {
    return res;
  }

  /* ── Restore guard ─────────────────────────────────────────────
  if (isAdminPath && !isLoginPage) {
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const { data: admin } = await supabase
      .from("admins")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!admin) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/admin/login?error=unauthorized", request.url));
    }
  }

  if (isLoginPage && user) {
    const { data: admin } = await supabase
      .from("admins")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (admin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }
  ─────────────────────────────────────────────────────────────── */

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
