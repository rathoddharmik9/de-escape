import { getEventBySlug } from "@/lib/data/events";
import { notFound } from "next/navigation";
import RegistrationForm from "@/components/events/RegistrationForm";

interface Props {
  params: { slug: string };
}

export default async function RegisterPage({ params }: Props) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();

  return <RegistrationForm event={event} />;
}
