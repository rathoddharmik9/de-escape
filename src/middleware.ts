import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let user: any = null;
  const bypassCookie = request.cookies.get("sb-bypass-session");
  if (process.env.NODE_ENV !== "production" && bypassCookie?.value) {
    try {
      const bypassData = JSON.parse(bypassCookie.value);
      user = bypassData?.user || null;
    } catch {}
  }

  if (!user) {
    const { data } = await supabase.auth.getUser();
    user = data?.user || null;
  }

  // Service role client bypasses circular RLS on the admins table.
  // RLS policy requires being in admins to read admins — so the user's own
  // session token cannot check it. Service role skips RLS entirely.
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  const isAdminPath = request.nextUrl.pathname.startsWith("/admin");

  if (isAdminPath && !isLoginPage) {
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const { data: admin } = await serviceClient
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
    const { data: admin } = await serviceClient
      .from("admins")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (admin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*"],
};
