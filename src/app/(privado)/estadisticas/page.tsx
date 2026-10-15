import { formatCop } from "@/features/quotes/domain";
import { findOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export default async function StatisticsPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const ownerResult = await findOwnerContext();
  if (!ownerResult.context) return <p>{ownerResult.error}</p>;
  const currentMonth = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: "America/Bogota" }).format(new Date()).slice(0, 7);
  const requestedMonth = (await searchParams).mes;
  const month = requestedMonth && /^\d{4}-\d{2}$/.test(requestedMonth) ? requestedMonth : currentMonth;
  const monthStart = `${month}-01`;
  const nextMonthDate = new Date(`${monthStart}T12:00:00Z`);
  nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);
  const nextMonth = nextMonthDate.toISOString().slice(0, 10);
  const supabase = await createClient();
  const { data: events } = await supabase.from("events").select("id,agreed_price_cop").eq("band_id", ownerResult.context.bandId).eq("operational_status", "performed").gte("event_date", monthStart).lt("event_date", nextMonth);
  const eventIds = (events ?? []).map((event) => event.id);
  const { data: participations } = eventIds.length ? await supabase.from("event_participations").select("event_id,member_id,agreed_fee_cop").eq("band_id", ownerResult.context.bandId).eq("participation_status", "performed").in("event_id", eventIds) : { data: [] };
  const memberIds = [...new Set((participations ?? []).map((participation) => participation.member_id))];
  const { data: members } = memberIds.length ? await supabase.from("members").select("id,name").in("id", memberIds) : { data: [] };
  const memberNames = new Map((members ?? []).map((member) => [member.id, member.name]));
  const stats = new Map<number, { events: Set<number>; value: number }>();
  for (const participation of participations ?? []) { const current = stats.get(participation.member_id) ?? { events: new Set<number>(), value: 0 }; current.events.add(participation.event_id); current.value += participation.agreed_fee_cop; stats.set(participation.member_id, current); }
  const contracted = (events ?? []).reduce((sum, event) => sum + event.agreed_price_cop, 0);
  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">Resultados</span><h1>Estadísticas</h1><p>Consulta eventos realizados y valores contratados por mes.</p></div></section>
      <form className="content-card" method="get"><label className="field-group"><span className="field-label">Mes del reporte</span><input className="text-field" defaultValue={month} name="mes" type="month" /></label><button className="primary-button" type="submit">Ver reporte</button></form>
      <section className="metric-grid"><article className="metric-card"><span>Eventos realizados</span><div><strong>{events?.length ?? 0}</strong><small>en el período</small></div></article><article className="metric-card"><span>Valor contratado</span><div><strong>{formatCop(contracted)}</strong><small>en el período</small></div></article></section>
      <article className="content-card"><div className="section-heading"><div><span className="eyebrow">Reporte por músico</span><h2>Participaciones</h2></div></div>{stats.size ? <div className="record-list">{[...stats.entries()].sort((a, b) => (memberNames.get(a[0]) ?? "").localeCompare(memberNames.get(b[0]) ?? "")).map(([memberId, result]) => <article className="record-row" key={memberId}><div className="record-avatar">{result.events.size}</div><div className="record-row__body"><strong>{memberNames.get(memberId) ?? "Músico"}</strong><span>{result.events.size} evento(s)</span><small>{formatCop(result.value)} contratado</small></div></article>)}</div> : <div className="empty-state"><h3>Sin actividad en este mes</h3><p>Los eventos realizados aparecerán en este reporte.</p></div>}</article>
    </div>
  );
}
