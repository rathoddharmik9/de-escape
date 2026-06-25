import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import RegistrationDetailsContainer from "@/components/admin/RegistrationDetailsContainer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface Props {
  params: { id: string };
}

export default async function AdminRegistrationDetailPage({ params }: Props) {
  const supabase = createAdminClient();

  // 1. Fetch Registration joined with Event title & start datetime
  const { data: registration, error: regError } = await supabase
    .from("registrations")
    .select("*, events(title, start_at)")
    .eq("id", params.id)
    .maybeSingle();

  if (regError || !registration) {
    notFound();
  }

  // 2. Generate signed URL for manual payment screenshots from the private bucket
  let signedUrl: string | undefined = undefined;
  if (registration.screenshot_url && registration.payment_mode === "manual_upi") {
    try {
      const { data } = await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(registration.screenshot_url, 300); // Expires in 5 minutes (300 seconds)
      
      if (data?.signedUrl) {
        signedUrl = data.signedUrl;
      }
    } catch (err) {
      console.error("Failed to generate payment proof signed URL:", err);
    }
  }

  return (
    <RegistrationDetailsContainer
      registration={registration}
      signedUrl={signedUrl}
    />
  );
}
