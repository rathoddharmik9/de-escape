import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  const bypassCookie = cookieStore.get("sb-bypass-session");
  const isBypass = process.env.NODE_ENV !== "production" && !!bypassCookie?.value;
  const key = isBypass ? process.env.SUPABASE_SERVICE_ROLE_KEY! : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* called from a Server Component; safe to ignore */ }
        },
      },
    }
  );

  // If NODE_ENV is not production, check for bypass cookie
  if (process.env.NODE_ENV !== "production") {
    const bypassCookie = cookieStore.get("sb-bypass-session");
    if (bypassCookie?.value) {
      try {
        const bypassData = JSON.parse(bypassCookie.value);
        if (bypassData && bypassData.user) {
          // Override auth.getUser
          const originalAuth = client.auth;
          client.auth = new Proxy(originalAuth, {
            get(target, prop, receiver) {
              if (prop === "getUser") {
                return async () => {
                  return { data: { user: bypassData.user }, error: null };
                };
              }
              return Reflect.get(target, prop, receiver);
            }
          });
        }
      } catch {
        // Ignore JSON parse error
      }
    }
  }

  return client;
}
