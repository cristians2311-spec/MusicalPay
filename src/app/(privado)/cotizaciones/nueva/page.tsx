import Link from "next/link";

import { QuoteForm } from "@/features/quotes/components/quote-form";
import { findOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

export default async function NewQuotePage() {
  const ownerResult = await findOwnerContext();
  if (!ownerResult.context) {
    return <div className="content-card"><p>{ownerResult.error}</p></div>;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id,name,phone")
    .eq("band_id", ownerResult.context.bandId)
    .is("archived_at", null)
    .order("name");
  const clients = (data ?? []).map((client) => ({ ...client, id: Number(client.id) }));

  return (
    <div className="page-stack quote-create-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Cotizaciones / Nuevo borrador</span>
          <h1>Nueva cotización</h1>
          <p>Primero guarda el borrador. La numeración y la vigencia comienzan cuando la emitas.</p>
        </div>
      </section>
      {clients.length === 0 ? (
        <article className="content-card setup-notice">
          <div><h2>Agrega primero un cliente</h2><p>Necesitas un cliente activo para preparar la cotización.</p></div>
          <Link className="primary-button" href="/clientes">Ir a clientes</Link>
        </article>
      ) : <QuoteForm clients={clients} />}
    </div>
  );
}
