"use server";

import { createClient } from "@/lib/supabase/server";

export async function signInWithMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      console.error("Magic link sign in error:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Magic link action error:", err);
    const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: errorMsg };
  }
}

export async function signOutAdmin(): Promise<{ success: boolean }> {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
    return { success: true };
  } catch (err) {
    console.error("Sign out action error:", err);
    return { success: false };
  }
}
