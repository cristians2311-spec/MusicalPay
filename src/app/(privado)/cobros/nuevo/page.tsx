import Link from "next/link";

import { CollectionForm } from "@/features/collections/components/collection-form";
import { findOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export default async function NewCollectionPage() {
  const ownerResult = await findOwnerContext();
  if (!ownerResult.context) return <p>{ownerResult.error}</p>;
  const supabase = await createClient();
  const [{ data: events }, { data: methods }] = await Promise.all([
    supabase.from("events").select("id,event_number,client_id,occasion,agreed_price_cop").eq("band_id", ownerResult.context.bandId).neq("operational_status", "cancelled").order("event_date", { ascending: false }),
    supabase.from("payment_methods").select("id,name").eq("band_id", ownerResult.context.bandId).eq("is_active", true).order("sort_order").order("name"),
  ]);
  const clientIds = [...new Set((events ?? []).map((event) => event.client_id))];
  const { data: clients } = clientIds.length ? await supabase.from("clients").select("id,name").in("id", clientIds) : { data: [] };
  const clientNames = new Map((clients ?? []).map((client) => [client.id, client.name]));
  const eventOptions = (events ?? []).map((event) => ({ ...event, clientName: clientNames.get(event.client_id) ?? "Cliente" }));
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">Cobros / Nuevo</span><h1>Nuevo cobro</h1><p>Registra dinero recibido y conserva el saldo correcto de cada evento.</p></div><Link className="text-link" href="/cobros">Volver</Link></section>
      <CollectionForm events={eventOptions} paymentMethods={methods ?? []} today={today} />
    </div>
  );
}
