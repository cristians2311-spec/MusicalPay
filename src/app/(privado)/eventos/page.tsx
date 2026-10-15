import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { formatCop } from "@/features/quotes/domain";
import { findOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

const statusLabels: Record<string, string> = { pending: "Pendiente", confirmed: "Confirmado", performed: "Realizado", cancelled: "Cancelado" };
const financialLabels: Record<string, string> = { open: "Finanzas abiertas", review: "En revisión", closed: "Finanzas cerradas" };

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ creado?: string }> }) {
  const { creado } = await searchParams;
  const ownerResult = await findOwnerContext();
  if (!ownerResult.context) return <p>{ownerResult.error}</p>;
  const supabase = await createClient();
  const { data: events, error } = await supabase.from("events").select("id,event_number,client_id,occasion,agreed_price_cop,operational_status,financial_status,event_date,starts_at,venue").eq("band_id", ownerResult.context.bandId).order("event_date").order("starts_at");
  const clientIds = [...new Set((events ?? []).map((event) => event.client_id))];
  const { data: clients } = clientIds.length ? await supabase.from("clients").select("id,name").in("id", clientIds) : { data: [] };
  const clientNames = new Map((clients ?? []).map((client) => [client.id, client.name]));
  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">Agenda</span><h1>Eventos</h1><p>Consulta cada presentación y su valor contratado.</p></div><Link className="primary-button" href="/eventos/nuevo"><Icon name="calendar" size={18} />Nuevo evento</Link></section>
      {creado ? <p className="action-message action-message--success">El evento quedó registrado.</p> : null}
      <article className="content-card">
        <div className="section-heading"><div><span className="eyebrow">Agenda</span><h2>{events?.length ?? 0} {(events?.length ?? 0) === 1 ? "evento" : "eventos"}</h2></div></div>
        {error ? <p className="action-message action-message--error">No fue posible cargar los eventos.</p> : null}
        {!error && !events?.length ? <div className="empty-state"><span className="empty-state__icon"><Icon name="calendar" size={24} /></span><h3>Aún no hay eventos</h3><p>Crea el primero o acepta una cotización.</p></div> : <div className="record-list">{(events ?? []).map((event) => <Link className="record-row" href={`/eventos/${event.id}`} key={event.id}><div className="record-avatar" aria-hidden="true">{String(event.event_number).padStart(2, "0")}</div><div className="record-row__body"><strong>{event.occasion} · {clientNames.get(event.client_id) ?? "Cliente"}</strong><span>{new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "America/Bogota" }).format(new Date(`${event.event_date}T12:00:00`))} · {event.venue}</span><small>{statusLabels[event.operational_status] ?? event.operational_status} · {financialLabels[event.financial_status] ?? event.financial_status} · {formatCop(event.agreed_price_cop)}</small></div></Link>)}</div>}
      </article>
    </div>
  );
}
