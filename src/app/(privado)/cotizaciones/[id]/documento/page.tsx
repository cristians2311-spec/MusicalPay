import Image from "next/image";
import { notFound } from "next/navigation";

import { DocumentActions } from "@/features/quotes/components/document-actions";
import { formatCop, getQuotePresentationLabels, optionalDisplayText } from "@/features/quotes/domain";
import { requireOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export default async function QuoteDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const quoteId = Number((await params).id);
  if (!Number.isSafeInteger(quoteId) || quoteId <= 0) notFound();
  const owner = await requireOwnerContext();
  const supabase = await createClient();
  const { data: quote } = await supabase.from("quotes").select("id,client_id,status,current_revision_number,quote_number").eq("id", quoteId).eq("band_id", owner.bandId).maybeSingle();
  if (!quote || quote.status === "draft") notFound();
  const [{ data: client }, { data: revision }] = await Promise.all([
    supabase.from("clients").select("name,phone").eq("id", quote.client_id).eq("band_id", owner.bandId).single(),
    supabase.from("quote_revisions").select("id,event_date,starts_at,venue,address,occasion,validity_days,expires_on,general_conditions").eq("quote_id", quote.id).eq("revision_number", quote.current_revision_number).eq("band_id", owner.bandId).single(),
  ]);
  if (!revision) notFound();
  const { data: options } = await supabase.from("quote_options").select("id,option_number,name,price_cop,half_tanda_units,break_minutes,required_advance_cop,customer_conditions").eq("revision_id", revision.id).eq("band_id", owner.bandId).order("option_number");
  const documentTitle = `Cotización COT-${String(quote.quote_number).padStart(6, "0")}`;
  const address = optionalDisplayText(revision.address);
  const quoteOptions = options ?? [];
  const presentation = getQuotePresentationLabels(quoteOptions.length);
  const dateFormat = new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "America/Bogota" });
  return (
    <div className="quote-document-page">
      <DocumentActions quoteId={quote.id} quoteNumber={quote.quote_number} title={documentTitle} />
      <article className="quote-document">
        <header className="quote-document__header"><div><Image alt="Cristian Santiago Music" height={86} src="/brand/cristian-santiago-music.png" width={86} /><div><span>Cristian Santiago Music</span><h1>Cotización</h1></div></div><strong>COT-{String(quote.quote_number).padStart(6, "0")}</strong></header>
        <section className="quote-document__intro"><span>Preparada para</span><h2>{client?.name ?? "Cliente"}</h2>{client?.phone ? <p>{client.phone}</p> : null}</section>
        <section className="quote-document__facts"><div className="quote-document__fact--primary"><span>Fecha</span><strong>{dateFormat.format(new Date(`${revision.event_date}T12:00:00`))}</strong></div><div><span>Evento</span><strong>{revision.occasion}</strong></div><div><span>Hora</span><strong>{revision.starts_at ? new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Bogota" }).format(new Date(revision.starts_at)) : "Por acordar"}</strong></div><div><span>Lugar</span><strong>{revision.venue}{address ? ` · ${address}` : ""}</strong></div></section>
        <section className={`quote-document__options${presentation.showOptionNumber ? "" : " quote-document__options--single"}`}><h2>{presentation.sectionTitle}</h2>{quoteOptions.map((option) => <article key={option.id}><div className="quote-document__option-copy">{presentation.showOptionNumber ? <span>Opción {option.option_number}</span> : null}<h3>{option.name}</h3><p>{option.half_tanda_units / 2} tanda(s) · {option.break_minutes} min de descanso</p></div><div className="quote-document__price"><span>Valor total</span><strong>{formatCop(option.price_cop)}</strong><small>{option.required_advance_cop ? `Anticipo: ${formatCop(option.required_advance_cop)}` : "Sin anticipo obligatorio"}</small></div>{option.customer_conditions ? <p className="quote-document__option-conditions">{option.customer_conditions}</p> : null}</article>)}</section>
        {revision.general_conditions ? <section className="quote-document__conditions"><h2>Condiciones</h2><p>{revision.general_conditions}</p></section> : null}
        <footer><p>Válida hasta el {revision.expires_on ? dateFormat.format(new Date(`${revision.expires_on}T12:00:00`)) : `${revision.validity_days} días`}.</p><strong>Cristian Santiago Music</strong></footer>
      </article>
    </div>
  );
}
