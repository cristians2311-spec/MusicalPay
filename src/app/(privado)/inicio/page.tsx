import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { calculateEventBalance } from "@/features/collections/domain";
import { remainingObligation } from "@/features/payments/domain";
import { formatCop } from "@/features/quotes/domain";
import { findOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const ownerResult = await findOwnerContext();
  if (!ownerResult.context) return <p>{ownerResult.error}</p>;
  const supabase = await createClient();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
  const monthStart = `${today.slice(0, 7)}-01`;
  const nextMonthDate = new Date(`${monthStart}T12:00:00Z`);
  nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);
  const nextMonth = nextMonthDate.toISOString().slice(0, 10);
  const [{ data: allEvents }, { data: collections }, { data: obligations }] = await Promise.all([
    supabase.from("events").select("id,event_number,client_id,occasion,agreed_price_cop,operational_status,event_date,starts_at,venue").eq("band_id", ownerResult.context.bandId).neq("operational_status", "cancelled").order("event_date").order("starts_at"),
    supabase.from("collections").select("event_id,amount_cop").eq("band_id", ownerResult.context.bandId),
    supabase.from("obligations").select("id,beneficiary_type,recognized_amount_cop").eq("band_id", ownerResult.context.bandId).in("status", ["pending", "partial"]),
  ]);
  const obligationIds = (obligations ?? []).map((obligation) => obligation.id);
  const { data: allocations } = obligationIds.length ? await supabase.from("payment_allocations").select("obligation_id,amount_cop").eq("band_id", ownerResult.context.bandId).in("obligation_id", obligationIds) : { data: [] };
  const clientIds = [...new Set((allEvents ?? []).map((event) => event.client_id))];
  const { data: clients } = clientIds.length ? await supabase.from("clients").select("id,name").in("id", clientIds) : { data: [] };
  const clientNames = new Map((clients ?? []).map((client) => [client.id, client.name]));
  const collectedByEvent = new Map<number, number>();
  for (const collection of collections ?? []) collectedByEvent.set(collection.event_id, (collectedByEvent.get(collection.event_id) ?? 0) + collection.amount_cop);
  const allocatedByObligation = new Map<number, number>();
  for (const allocation of allocations ?? []) allocatedByObligation.set(allocation.obligation_id, (allocatedByObligation.get(allocation.obligation_id) ?? 0) + allocation.amount_cop);
  const performedThisMonth = (allEvents ?? []).filter((event) => event.operational_status === "performed" && event.event_date >= monthStart && event.event_date < nextMonth);
  const contractedThisMonth = performedThisMonth.reduce((sum, event) => sum + event.agreed_price_cop, 0);
  const upcoming = (allEvents ?? []).filter((event) => event.event_date >= today && event.operational_status !== "performed").slice(0, 4);
  const customerPending = (allEvents ?? []).filter((event) => event.event_date < today).reduce((sum, event) => sum + calculateEventBalance(event.agreed_price_cop, collectedByEvent.get(event.id) ?? 0), 0);
  const memberPending = (obligations ?? []).filter((obligation) => obligation.beneficiary_type === "member").reduce((sum, obligation) => sum + remainingObligation(obligation.recognized_amount_cop, allocatedByObligation.get(obligation.id) ?? 0), 0);
  const expensePending = (obligations ?? []).filter((obligation) => obligation.beneficiary_type === "provider").reduce((sum, obligation) => sum + remainingObligation(obligation.recognized_amount_cop, allocatedByObligation.get(obligation.id) ?? 0), 0);
  const hasPending = customerPending + memberPending + expensePending > 0;
  return (
    <div className="page-stack">
      <section className="home-intro"><div className="home-intro__copy"><span className="eyebrow">Centro de operación</span><h1>Tu música en escena.<br />Tus cuentas en orden.</h1><p>Controla cotizaciones, agenda y pagos desde un solo lugar.</p></div><div className="home-intro__action"><span>Siguiente paso</span><strong>Prepara una propuesta profesional para tu próximo cliente.</strong><Link className="primary-button" href="/cotizaciones/nueva"><Icon name="file" size={18} /> Nueva cotización</Link></div></section>
      <section className="metric-grid" aria-label="Resumen del mes"><article className="metric-card"><span>Eventos este mes</span><div><strong>{performedThisMonth.length}</strong><small>realizados</small></div></article><article className="metric-card"><span>Valor contratado</span><div><strong>{formatCop(contractedThisMonth)}</strong><small>en eventos realizados</small></div></article></section>
      <section className="dashboard-grid">
        <article className="content-card content-card--wide"><div className="section-heading"><div><span className="eyebrow">Agenda</span><h2>Próximos eventos</h2></div><Link className="text-link" href="/eventos">Ver agenda <Icon name="arrow-right" size={16} /></Link></div>{upcoming.length ? <div className="record-list">{upcoming.map((event) => <Link className="record-row" href={`/eventos/${event.id}`} key={event.id}><div className="record-avatar">{new Date(`${event.event_date}T12:00:00`).getDate()}</div><div className="record-row__body"><strong>{event.occasion} · {clientNames.get(event.client_id) ?? "Cliente"}</strong><span>{event.event_date} · {event.venue}</span><small>{formatCop(event.agreed_price_cop)}</small></div></Link>)}</div> : <div className="empty-state"><span className="empty-state__icon"><Icon name="calendar" size={24} /></span><h3>Tu agenda está lista</h3><p>Agrega el primer evento o acepta una cotización para verlo aquí.</p><Link className="secondary-button" href="/eventos/nuevo">Crear evento</Link></div>}</article>
        <article className="content-card" id="pendientes"><div className="section-heading"><div><span className="eyebrow">Por revisar</span><h2>Pendientes</h2></div></div>{!hasPending ? <div className="attention-zero"><Icon name="sparkles" size={20} /><div><strong>Todo en orden</strong><span>No hay asuntos pendientes.</span></div></div> : null}<div className="pending-list" aria-label="Resumen de pendientes"><div><span>Cobros de clientes</span><strong>{formatCop(customerPending)}</strong></div><div><span>Pagos a músicos</span><strong>{formatCop(memberPending)}</strong></div><div><span>Gastos pendientes</span><strong>{formatCop(expensePending)}</strong></div></div><Link className="secondary-button secondary-button--full" href="/pagos"><Icon name="hand-coins" size={17} /> Preparar pagos</Link></article>
      </section>
    </div>
  );
}
