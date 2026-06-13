"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { User } from "@supabase/supabase-js";

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

    // Clear bypass cookie
    const { cookies } = await import("next/headers");
    cookies().delete("sb-bypass-session");

    return { success: true };
  } catch (err) {
    console.error("Sign out action error:", err);
    return { success: false };
  }
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const approvedEmails = [
      "dharmik@de-escape.in",
      "dharmikrathod@example.com",
      "dharmikrathod98@gmail.com",
      "rathoddharmik9@gmail.com",
    ];

    if (process.env.NODE_ENV !== 'production' && approvedEmails.includes(normalizedEmail) && password === "AdminPassword123!") {
      const adminClient = createAdminClient();

      // Find user in auth.users by paginating through the users list
      let existingUser: User | null = null;
      let page = 1;
      const perPage = 100;

      while (true) {
        const { data, error: listError } = await adminClient.auth.admin.listUsers({
          page,
          perPage,
        });
        if (listError) {
          console.error("Failed to list users:", listError);
          return { success: false, error: listError.message };
        }

        const users = data?.users || [];
        if (users.length === 0) {
          break;
        }

        const found = users.find(
          (u) => u.email?.toLowerCase().trim() === normalizedEmail
        );
        if (found) {
          existingUser = found;
          break;
        }

        if (users.length < perPage) {
          break;
        }

        page++;
      }

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
          userId,
          {
            password: password,
            email_confirm: true,
          }
        );
        if (updateError) {
          console.error("Failed to update user password/confirm status:", updateError);
          return { success: false, error: updateError.message };
        }
      } else {
        const { data: created, error: createError } = await adminClient.auth.admin.createUser({
          email: normalizedEmail,
          password: password,
          email_confirm: true,
        });
        if (createError) {
          console.error("Failed to create bypass admin user:", createError);
          return { success: false, error: createError.message };
        }
        if (!created.user) {
          return { success: false, error: "Failed to create user object." };
        }
        userId = created.user.id;
      }

      // Ensure user exists in public.admins
      const { data: existingAdmin, error: adminQueryError } = await adminClient
        .from("admins")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (adminQueryError) {
        console.error("Failed to query public.admins table:", adminQueryError);
        return { success: false, error: adminQueryError.message };
      }

      if (!existingAdmin) {
        const { error: insertError } = await adminClient
          .from("admins")
          .insert({
            user_id: userId,
            email: normalizedEmail,
            role: "super_admin",
          });
        if (insertError) {
          console.error("Failed to insert into public.admins table:", insertError);
          return { success: false, error: insertError.message };
        }
      }

      // Set bypass cookie and return success immediately
      const mockUser = {
        id: userId,
        email: normalizedEmail,
        role: "authenticated",
      };
      const { cookies } = await import("next/headers");
      cookies().set("sb-bypass-session", JSON.stringify({ user: mockUser }), {
        path: "/",
        httpOnly: true,
        secure: false,
        maxAge: 60 * 60 * 24, // 1 day
      });

      return { success: true };
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password,
    });

    if (signInError) {
      console.error("Bypass password sign in error:", signInError.message);
      return { success: false, error: signInError.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Password sign in action error:", err);
    const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: errorMsg };
  }
}

