import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { calculateEventBalance } from "@/features/collections/domain";
import { formatCop } from "@/features/quotes/domain";
import { findOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ creado?: string }> }) {
  const { creado } = await searchParams;
  const ownerResult = await findOwnerContext();
  if (!ownerResult.context) return <p>{ownerResult.error}</p>;
  const supabase = await createClient();
  const [{ data: collections, error }, { data: events }] = await Promise.all([
    supabase.from("collections").select("id,event_id,collection_number,amount_cop,received_on,payment_method_id,reference").eq("band_id", ownerResult.context.bandId).order("received_on", { ascending: false }).order("id", { ascending: false }),
    supabase.from("events").select("id,event_number,client_id,occasion,agreed_price_cop").eq("band_id", ownerResult.context.bandId).neq("operational_status", "cancelled"),
  ]);
  const clientIds = [...new Set((events ?? []).map((event) => event.client_id))];
  const methodIds = [...new Set((collections ?? []).map((collection) => collection.payment_method_id))];
  const [{ data: clients }, { data: methods }] = await Promise.all([
    clientIds.length ? supabase.from("clients").select("id,name").in("id", clientIds) : Promise.resolve({ data: [] }),
    methodIds.length ? supabase.from("payment_methods").select("id,name").in("id", methodIds) : Promise.resolve({ data: [] }),
  ]);
  const clientNames = new Map((clients ?? []).map((client) => [client.id, client.name]));
  const methodNames = new Map((methods ?? []).map((method) => [method.id, method.name]));
  const eventMap = new Map((events ?? []).map((event) => [event.id, event]));
  const collectedByEvent = new Map<number, number>();
  for (const collection of collections ?? []) collectedByEvent.set(collection.event_id, (collectedByEvent.get(collection.event_id) ?? 0) + collection.amount_cop);
  const pendingTotal = (events ?? []).reduce((total, event) => total + calculateEventBalance(event.agreed_price_cop, collectedByEvent.get(event.id) ?? 0), 0);
  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">Ingresos</span><h1>Cobros</h1><p>Controla anticipos, pagos finales y saldos por evento.</p></div><Link className="primary-button" href="/cobros/nuevo"><Icon name="coins" size={18} />Registrar cobro</Link></section>
      {creado ? <p className="action-message action-message--success">El cobro quedó registrado.</p> : null}
      <article className="content-card">
        <div className="section-heading"><div><span className="eyebrow">Resumen</span><h2>Saldo pendiente: {formatCop(pendingTotal)}</h2></div></div>
        {error ? <p className="action-message action-message--error">No fue posible cargar los cobros.</p> : null}
        {!error && !collections?.length ? <div className="empty-state"><span className="empty-state__icon"><Icon name="coins" size={24} /></span><h3>Aún no hay cobros</h3><p>Registra un anticipo o el pago de un evento.</p></div> : <div className="record-list">{(collections ?? []).map((collection) => { const event = eventMap.get(collection.event_id); return <article className="record-row" key={collection.id}><div className="record-avatar" aria-hidden="true">#{collection.collection_number}</div><div className="record-row__body"><strong>{formatCop(collection.amount_cop)} · {event ? clientNames.get(event.client_id) ?? "Cliente" : "Evento"}</strong><span>{event ? `EV-${String(event.event_number).padStart(4, "0")} · ${event.occasion}` : "Evento asociado"}</span><small>{collection.received_on} · {methodNames.get(collection.payment_method_id) ?? "Medio de pago"}{collection.reference ? ` · ${collection.reference}` : ""}</small></div></article>; })}</div>}
      </article>
    </div>
  );
}

