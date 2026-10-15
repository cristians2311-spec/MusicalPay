import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { ModulePlaceholder } from "@/components/ui/module-placeholder";
import { formatCop } from "@/features/quotes/domain";
import { findOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

const statusLabels: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired: "Vencida",
  cancelled: "Cancelada",
};

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ creada?: string }> }) {
  const { creada } = await searchParams;
  const ownerResult = await findOwnerContext();
  if (!ownerResult.context) return <ModulePlaceholder eyebrow="Ventas" title="Cotizaciones" description={ownerResult.error} action="Configurar" href="/configuracion" />;

  const supabase = await createClient();
  const { data: quotes, error } = await supabase
    .from("quotes")
    .select("id,client_id,status,current_revision_number,created_at")
    .eq("band_id", ownerResult.context.bandId)
    .order("created_at", { ascending: false });

  const quoteRows = quotes ?? [];
  const clientIds = [...new Set(quoteRows.map((quote) => quote.client_id))];
  const quoteIds = quoteRows.map((quote) => quote.id);
  const [{ data: clients }, { data: revisions }] = await Promise.all([
    clientIds.length ? supabase.from("clients").select("id,name").in("id", clientIds) : Promise.resolve({ data: [] }),
    quoteIds.length ? supabase.from("quote_revisions").select("id,quote_id,event_date,venue,occasion").in("quote_id", quoteIds) : Promise.resolve({ data: [] }),
  ]);
  const revisionIds = (revisions ?? []).map((revision) => revision.id);
  const { data: options } = revisionIds.length
    ? await supabase.from("quote_options").select("revision_id,price_cop,name").in("revision_id", revisionIds).order("option_number")
    : { data: [] };
  const clientNames = new Map((clients ?? []).map((client) => [client.id, client.name]));
  const currentRevisions = new Map((revisions ?? []).map((revision) => [revision.quote_id, revision]));
  const optionsByRevision = new Map<number, { price_cop: number; name: string }[]>();
  for (const option of options ?? []) {
    const list = optionsByRevision.get(Number(option.revision_id)) ?? [];
    list.push({ price_cop: Number(option.price_cop), name: option.name });
    optionsByRevision.set(Number(option.revision_id), list);
  }

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div><span className="eyebrow">Ventas</span><h1>Cotizaciones</h1><p>Alternativas claras, historial de revisiones y documentos listos para compartir.</p></div>
        <Link className="primary-button" href="/cotizaciones/nueva"><Icon name="file" size={18} />Nueva cotización</Link>
      </section>
      {creada ? <p className="action-message action-message--success">El borrador quedó guardado. Puedes revisarlo antes de emitirlo.</p> : null}
      <article className="content-card">
        <div className="section-heading"><div><span className="eyebrow">Historial</span><h2>{quoteRows.length} {quoteRows.length === 1 ? "cotización" : "cotizaciones"}</h2></div></div>
        {error ? <p className="action-message action-message--error">No fue posible cargar las cotizaciones.</p> : null}
        {!error && quoteRows.length === 0 ? (
          <div className="empty-state"><span className="empty-state__icon"><Icon name="file" size={24} /></span><h2>Aún no hay cotizaciones</h2><p>Crea la primera propuesta con una o varias opciones para tu cliente.</p><Link className="secondary-button" href="/cotizaciones/nueva">Crear borrador</Link></div>
        ) : (
          <div className="quote-list">
            {quoteRows.map((quote) => {
              const revision = currentRevisions.get(quote.id);
              const revisionOptions = revision ? optionsByRevision.get(Number(revision.id)) ?? [] : [];
              const lowestPrice = revisionOptions.length ? Math.min(...revisionOptions.map((option) => option.price_cop)) : null;
              return (
                <article className="quote-row" key={quote.id}>
                  <div className="quote-row__date"><strong>{revision ? new Intl.DateTimeFormat("es-CO", { day: "2-digit" }).format(new Date(`${revision.event_date}T12:00:00`)) : "—"}</strong><span>{revision ? new Intl.DateTimeFormat("es-CO", { month: "short" }).format(new Date(`${revision.event_date}T12:00:00`)).replace(".", "") : ""}</span></div>
                  <div className="quote-row__body"><div><strong>{clientNames.get(quote.client_id) ?? "Cliente"}</strong><span className={`status-chip status-chip--${quote.status}`}>{statusLabels[quote.status] ?? quote.status}</span></div><span>{revision?.occasion ?? "Sin ocasión"} · {revision?.venue ?? "Sin lugar"}</span><small>{revisionOptions.length} {revisionOptions.length === 1 ? "opción" : "opciones"}{lowestPrice !== null ? ` · Desde ${formatCop(lowestPrice)}` : ""}</small></div>
                  <Link className="text-link" href={`/cotizaciones/${quote.id}`}>Ver <Icon name="arrow-right" size={16} /></Link>
                </article>
              );
            })}
          </div>
        )}
      </article>
    </div>
  );
}

