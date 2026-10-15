import Link from "next/link";
import { notFound } from "next/navigation";

import { formatCop } from "@/features/quotes/domain";
import { requireOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

const statusLabels: Record<string, string> = { draft: "Borrador", sent: "Enviada", accepted: "Aceptada", rejected: "Rechazada", expired: "Vencida", cancelled: "Cancelada" };

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const quoteId = Number((await params).id);
  if (!Number.isSafeInteger(quoteId) || quoteId <= 0) notFound();
  const owner = await requireOwnerContext();
  const supabase = await createClient();
  const { data: quote } = await supabase.from("quotes").select("id,client_id,status,current_revision_number,quote_number").eq("id", quoteId).eq("band_id", owner.bandId).single();
  if (!quote) notFound();
  const [{ data: client }, { data: revision }] = await Promise.all([
    supabase.from("clients").select("name,phone").eq("id", quote.client_id).eq("band_id", owner.bandId).single(),
    supabase.from("quote_revisions").select("id,event_date,starts_at,venue,address,occasion,validity_days,general_conditions,internal_notes").eq("quote_id", quote.id).eq("revision_number", quote.current_revision_number).eq("band_id", owner.bandId).single(),
  ]);
  if (!revision) notFound();
  const { data: options } = await supabase.from("quote_options").select("id,option_number,name,price_cop,half_tanda_units,break_minutes,required_advance_cop,customer_conditions").eq("revision_id", revision.id).eq("band_id", owner.bandId).order("option_number");
  return (
    <div className="page-stack">
      <section className="page-heading"><div><span className="eyebrow">Cotización {quote.quote_number ? `COT-${String(quote.quote_number).padStart(6, "0")}` : "sin emitir"}</span><h1>{client?.name ?? "Cliente"}</h1><p>{revision.occasion} · {revision.venue}</p></div><Link className="secondary-button" href="/cotizaciones">Volver</Link></section>
      <article className="content-card">
        <div className="section-heading"><div><span className={`status-chip status-chip--${quote.status}`}>{statusLabels[quote.status] ?? quote.status}</span><h2>Datos de la presentación</h2></div></div>
        <div className="pending-list"><div><span>Fecha</span><strong>{new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "America/Bogota" }).format(new Date(`${revision.event_date}T12:00:00`))}</strong></div><div><span>Cliente</span><strong>{client?.phone || "Sin teléfono"}</strong></div><div><span>Vigencia</span><strong>{revision.validity_days} días</strong></div></div>
      </article>
      <section className="option-stack">{(options ?? []).map((option) => <article className="form-panel" key={option.id}><div className="section-heading"><div><span className="eyebrow">Opción {option.option_number}</span><h2>{option.name}</h2></div><strong>{formatCop(option.price_cop)}</strong></div><p>{Number(option.half_tanda_units) / 2} tanda(s) · {option.break_minutes} min de descanso</p>{option.required_advance_cop ? <p>Anticipo solicitado: {formatCop(option.required_advance_cop)}</p> : <p>Sin anticipo obligatorio</p>}{option.customer_conditions ? <p>{option.customer_conditions}</p> : null}</article>)}</section>
    </div>
  );
}
