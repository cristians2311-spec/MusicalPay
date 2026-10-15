import Link from "next/link";

import { EventForm } from "@/features/events/components/event-form";
import { findOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export default async function NewEventPage() {
  const ownerResult = await findOwnerContext();
  if (!ownerResult.context) return <p>{ownerResult.error}</p>;
  const supabase = await createClient();
  const { data: clients } = await supabase.from("clients").select("id,name,phone").eq("band_id", ownerResult.context.bandId).is("archived_at", null).order("name");
  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">Eventos / Nuevo</span><h1>Nuevo evento</h1><p>Úsalo cuando el acuerdo no comenzó como cotización.</p></div><Link className="text-link" href="/eventos">Volver</Link></section>
      <EventForm clients={clients ?? []} />
    </div>
  );
}
