import { createClient } from "@/lib/supabase/server";
import RegistrationsBrowser from "@/components/admin/RegistrationsBrowser";

export default async function RegistrationsPage() {
  const supabase = createClient();

  const { data: registrations, error } = await supabase
    .from("registrations")
    .select("*, events(title, start_at)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch registrations:", error.message);
  }

  interface DBRegistration {
    id: string;
    full_name: string;
    phone: string;
    email: string;
    event_id: string;
    status: string;
    payment_mode: string;
    amount_paise: number;
    created_at: string;
    events?: {
      title: string;
      start_at: string;
    } | null;
  }

  // Map the join database response to fit front-end formats
  const mapped = (registrations ?? []).map((r) => {
    const reg = r as unknown as DBRegistration;
    return {
      id: reg.id,
      name: reg.full_name,
      phone: reg.phone,
      email: reg.email,
      event: reg.events?.title || "Unknown Event",
      event_id: reg.event_id,
      status: reg.status,
      payment: reg.payment_mode,
      amount: reg.amount_paise,
      created: reg.created_at,
    };
  });

  return <RegistrationsBrowser initialRegistrations={mapped} />;
}
