import { Icon } from "@/components/ui/icon";
import { toggleRoleAction } from "@/features/roles/actions";
import { RoleForm } from "@/features/roles/components/role-form";
import { findOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

type RoleRow = {
  id: number;
  is_active: boolean;
  name: string;
  sort_order: number;
};

export default async function SettingsPage() {
  const ownerResult = await findOwnerContext();
  if (!ownerResult.context) {
    return (
      <div className="page-stack">
        <section className="page-heading"><div><span className="eyebrow">Sistema</span><h1>Configuración</h1></div></section>
        <article className="content-card setup-notice"><Icon name="settings" size={24} /><p>{ownerResult.error}</p></article>
      </div>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("id,name,is_active,sort_order")
    .eq("band_id", ownerResult.context.bandId)
    .order("sort_order")
    .order("name");
  const roles = (data ?? []) as RoleRow[];

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Sistema</span>
          <h1>Configuración</h1>
          <p>Personaliza la agrupación sin alterar el historial de eventos.</p>
        </div>
      </section>

      <div className="directory-layout">
        <article className="content-card"><RoleForm /></article>
        <section className="content-card directory-results" aria-labelledby="role-list-title">
          <div className="section-heading">
            <div><span className="eyebrow">Agrupación</span><h2 id="role-list-title">Roles</h2></div>
            <span className="record-count">{roles.length}</span>
          </div>
          {error ? <p className="action-message action-message--error">No fue posible cargar los roles.</p> : null}
          <div className="record-list">
            {roles.map((role) => (
              <article className="record-row" key={role.id}>
                <div className="record-avatar" aria-hidden="true"><Icon name="users" size={18} /></div>
                <div className="record-row__body">
                  <strong>{role.name}</strong>
                  <span>{role.is_active ? "Disponible para nuevas asignaciones" : "Inactivo"}</span>
                </div>
                <form action={toggleRoleAction}>
                  <input name="roleId" type="hidden" value={role.id} />
                  <input name="nextActive" type="hidden" value={String(!role.is_active)} />
                  <button className="quiet-button" type="submit">{role.is_active ? "Desactivar" : "Activar"}</button>
                </form>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
