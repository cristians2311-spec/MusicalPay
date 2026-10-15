import Link from "next/link";
import { notFound } from "next/navigation";

import { Icon } from "@/components/ui/icon";
import { ParticipationForm } from "@/features/events/components/participation-form";
import { markEventPerformedAction } from "@/features/events/participation-actions";
import { formatCop } from "@/features/quotes/domain";
import { findOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const eventId = Number((await params).id);
  if (!Number.isSafeInteger(eventId) || eventId <= 0) notFound();
  const ownerResult = await findOwnerContext();
  if (!ownerResult.context) return <p>{ownerResult.error}</p>;
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("id,event_number,client_id,occasion,agreed_price_cop,operational_status,event_date,starts_at,half_tanda_units,venue,address").eq("id", eventId).eq("band_id", ownerResult.context.bandId).maybeSingle();
  if (!event) notFound();
  const [{ data: client }, { data: participations }, { data: members }, { data: memberRoles }, { data: roles }] = await Promise.all([
    supabase.from("clients").select("name,phone").eq("id", event.client_id).eq("band_id", ownerResult.context.bandId).single(),
    supabase.from("event_participations").select("id,member_id,agreed_fee_cop,participation_status").eq("event_id", eventId).eq("band_id", ownerResult.context.bandId).order("id"),
    supabase.from("members").select("id,name").eq("band_id", ownerResult.context.bandId).eq("is_active", true).is("archived_at", null).order("name"),
    supabase.from("member_roles").select("member_id,role_id").eq("band_id", ownerResult.context.bandId),
    supabase.from("roles").select("id,name").eq("band_id", ownerResult.context.bandId).eq("is_active", true).order("sort_order").order("name"),
  ]);
  const roleMap = new Map((roles ?? []).map((role) => [role.id, role.name]));
  const memberOptions = (members ?? []).map((member) => ({ id: member.id, name: member.name, roles: (memberRoles ?? []).filter((assignment) => assignment.member_id === member.id).flatMap((assignment) => { const name = roleMap.get(assignment.role_id); return name ? [{ id: assignment.role_id, name }] : []; }) })).filter((member) => member.roles.length > 0);
  const memberNames = new Map((members ?? []).map((member) => [member.id, member.name]));
  const editable = event.operational_status !== "performed" && event.operational_status !== "cancelled";
  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">EV-{String(event.event_number).padStart(4, "0")}</span><h1>{event.occasion}</h1><p>{client?.name ?? "Cliente"} · {event.event_date} · {event.venue}</p></div><Link className="text-link" href="/eventos">Volver</Link></section>
      <article className="content-card"><div className="section-heading"><div><span className="eyebrow">Acuerdo</span><h2>{formatCop(event.agreed_price_cop)}</h2></div></div><p>{event.half_tanda_units / 2} tanda(s){event.starts_at ? ` · ${new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Bogota" }).format(new Date(event.starts_at))}` : ""}{event.address ? ` · ${event.address}` : ""}</p></article>
      <article className="content-card">
        <div className="section-heading"><div><span className="eyebrow">Nómina del evento</span><h2>{participations?.length ?? 0} músico(s)</h2></div></div>
        {participations?.length ? <div className="record-list">{participations.map((participation) => <article className="record-row" key={participation.id}><div className="record-avatar"><Icon name="users" size={18} /></div><div className="record-row__body"><strong>{memberNames.get(participation.member_id) ?? "Músico"}</strong><span>{formatCop(participation.agreed_fee_cop)}</span><small>{participation.participation_status === "performed" ? "Participación realizada" : "Asignado"}</small></div></article>)}</div> : <p>Aún no has asignado músicos a este evento.</p>}
      </article>
      {editable ? <article className="form-panel"><div className="form-section-heading"><span className="eyebrow">Asignación</span><h2>Agregar músico</h2><p>El valor corresponde solamente a esta presentación.</p></div><ParticipationForm eventId={eventId} members={memberOptions} /></article> : null}
      {editable ? <form action={markEventPerformedAction}><input name="eventId" type="hidden" value={eventId} /><button className="primary-button" disabled={!participations?.length} type="submit">Marcar evento como realizado</button></form> : null}
    </div>
  );
}
