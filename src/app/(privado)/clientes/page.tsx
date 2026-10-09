import { toggleClientArchiveAction } from "./actions";
import { ClientForm } from "./client-form";

import { Icon } from "@/components/icon";
import { findOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

type ClientRow = {
  id: number;
  name: string;
  phone: string | null;
  notes: string | null;
  archived_at: string | null;
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>;
}) {
  const { q = "", estado = "activos" } = await searchParams;
  const ownerResult = await findOwnerContext();

  if (!ownerResult.context) {
    return (
      <div className="page-stack">
        <section className="page-heading">
          <div><span className="eyebrow">Directorio</span><h1>Clientes</h1></div>
        </section>
        <article className="content-card setup-notice">
          <span className="empty-state__icon"><Icon name="settings" size={24} /></span>
          <div><h2>Termina la conexión inicial</h2><p>{ownerResult.error} Sigue la guía de configuración para crear el perfil propietario.</p></div>
        </article>
      </div>
    );
  }

  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select("id,name,phone,notes,archived_at")
    .eq("band_id", ownerResult.context.bandId)
    .order("name");

  query = estado === "archivados"
    ? query.not("archived_at", "is", null)
    : query.is("archived_at", null);
  if (q.trim()) query = query.ilike("name", `%${q.trim().replaceAll("%", "")}%`);

  const { data, error } = await query;
  const clients = (data ?? []) as ClientRow[];

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Directorio</span>
          <h1>Clientes</h1>
          <p>Contactos listos para cotizar, reservar y consultar saldos.</p>
        </div>
      </section>

      <div className="directory-layout">
        <article className="content-card"><ClientForm /></article>
        <section className="content-card directory-results" aria-labelledby="client-list-title">
          <div className="section-heading">
            <div><span className="eyebrow">Directorio</span><h2 id="client-list-title">{estado === "archivados" ? "Archivados" : "Clientes activos"}</h2></div>
            <span className="record-count">{clients.length}</span>
          </div>

          <form className="filter-bar" method="get">
            <label className="search-field">
              <span className="sr-only">Buscar cliente</span>
              <input defaultValue={q} name="q" placeholder="Buscar por nombre" />
            </label>
            <select aria-label="Estado" defaultValue={estado} name="estado">
              <option value="activos">Activos</option>
              <option value="archivados">Archivados</option>
            </select>
            <button className="secondary-button" type="submit">Buscar</button>
          </form>

          {error ? <p className="action-message action-message--error">No fue posible cargar los clientes.</p> : null}
          {!error && clients.length === 0 ? (
            <div className="empty-state empty-state--compact">
              <span className="empty-state__icon"><Icon name="users" size={24} /></span>
              <h3>{q ? "No hay coincidencias" : "Aún no hay clientes"}</h3>
              <p>{q ? "Prueba otro nombre o cambia el estado." : "El primer cliente que guardes aparecerá aquí."}</p>
            </div>
          ) : (
            <div className="record-list">
              {clients.map((client) => (
                <article className="record-row" key={client.id}>
                  <div className="record-avatar" aria-hidden="true">{client.name.slice(0, 2).toLocaleUpperCase("es-CO")}</div>
                  <div className="record-row__body">
                    <strong>{client.name}</strong>
                    <span>{client.phone || "Sin teléfono"}</span>
                    {client.notes ? <small>{client.notes}</small> : null}
                  </div>
                  <form action={toggleClientArchiveAction}>
                    <input name="clientId" type="hidden" value={client.id} />
                    <button className="quiet-button" type="submit">{client.archived_at ? "Restaurar" : "Archivar"}</button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

