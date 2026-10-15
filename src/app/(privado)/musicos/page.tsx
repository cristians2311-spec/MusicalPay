import { Icon } from "@/components/ui/icon";
import { toggleMemberArchiveAction } from "@/features/members/actions";
import { MemberForm } from "@/features/members/components/member-form";
import { findOwnerContext } from "@/lib/auth/owner-context";
import { createClient } from "@/lib/supabase/server";

type MemberRow = {
  archived_at: string | null;
  id: number;
  is_owner_profile: boolean;
  name: string;
  nickname: string | null;
  notes: string | null;
  phone: string | null;
};

type RoleRow = {
  id: number;
  name: string;
};

export default async function MusiciansPage({
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
          <div><span className="eyebrow">Equipo</span><h1>Músicos</h1></div>
        </section>
        <article className="content-card setup-notice">
          <span className="empty-state__icon"><Icon name="settings" size={24} /></span>
          <div><h2>Termina la conexión inicial</h2><p>{ownerResult.error} Sigue la guía de configuración para crear el perfil propietario.</p></div>
        </article>
      </div>
    );
  }

  const supabase = await createClient();
  let memberQuery = supabase
    .from("members")
    .select("id,name,nickname,phone,notes,is_owner_profile,archived_at")
    .eq("band_id", ownerResult.context.bandId)
    .order("is_owner_profile", { ascending: false })
    .order("name");

  memberQuery = estado === "archivados"
    ? memberQuery.not("archived_at", "is", null)
    : memberQuery.is("archived_at", null);
  if (q.trim()) {
    memberQuery = memberQuery.ilike("name", `%${q.trim().replaceAll("%", "")}%`);
  }

  const [memberResult, roleResult, assignmentResult] = await Promise.all([
    memberQuery,
    supabase
      .from("roles")
      .select("id,name")
      .eq("band_id", ownerResult.context.bandId)
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("member_roles")
      .select("member_id,role_id")
      .eq("band_id", ownerResult.context.bandId),
  ]);

  const members = (memberResult.data ?? []) as MemberRow[];
  const roles = (roleResult.data ?? []) as RoleRow[];
  const roleNamesById = new Map(roles.map((role) => [role.id, role.name]));
  const roleNamesByMember = new Map<number, string[]>();

  for (const assignment of assignmentResult.data ?? []) {
    const roleName = roleNamesById.get(Number(assignment.role_id));
    if (!roleName) continue;
    const memberRoles = roleNamesByMember.get(Number(assignment.member_id)) ?? [];
    memberRoles.push(roleName);
    roleNamesByMember.set(Number(assignment.member_id), memberRoles);
  }

  const loadError = memberResult.error || roleResult.error || assignmentResult.error;

  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Equipo</span>
          <h1>Músicos</h1>
          <p>Organiza las personas disponibles y los roles que pueden cubrir.</p>
        </div>
      </section>

      <div className="directory-layout">
        <article className="content-card">
          <MemberForm roles={roles} />
        </article>
        <section className="content-card directory-results" aria-labelledby="member-list-title">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Agrupación</span>
              <h2 id="member-list-title">
                {estado === "archivados" ? "Músicos archivados" : "Músicos activos"}
              </h2>
            </div>
            <span className="record-count">{members.length}</span>
          </div>

          <form className="filter-bar" method="get">
            <label className="search-field">
              <span className="sr-only">Buscar músico</span>
              <input defaultValue={q} name="q" placeholder="Buscar por nombre" />
            </label>
            <select aria-label="Estado" defaultValue={estado} name="estado">
              <option value="activos">Activos</option>
              <option value="archivados">Archivados</option>
            </select>
            <button className="secondary-button" type="submit">Buscar</button>
          </form>

          {loadError ? (
            <p className="action-message action-message--error">
              No fue posible cargar los músicos y sus roles.
            </p>
          ) : null}
          {!loadError && roles.length === 0 ? (
            <p className="action-message action-message--error">
              No hay roles activos. Configura al menos uno antes de agregar músicos.
            </p>
          ) : null}
          {!loadError && members.length === 0 ? (
            <div className="empty-state empty-state--compact">
              <span className="empty-state__icon"><Icon name="users" size={24} /></span>
              <h3>{q ? "No hay coincidencias" : "Aún no hay músicos"}</h3>
              <p>{q ? "Prueba otro nombre o cambia el estado." : "El primer músico que guardes aparecerá aquí."}</p>
            </div>
          ) : (
            <div className="record-list">
              {members.map((member) => {
                const memberRoles = roleNamesByMember.get(member.id) ?? [];
                return (
                  <article className="record-row" key={member.id}>
                    <div className="record-avatar" aria-hidden="true">
                      {member.name.slice(0, 2).toLocaleUpperCase("es-CO")}
                    </div>
                    <div className="record-row__body">
                      <strong>{member.name}{member.nickname ? ` · ${member.nickname}` : ""}</strong>
                      <span>{member.phone || "Sin teléfono"}</span>
                      <small>{memberRoles.length ? memberRoles.join(" · ") : "Sin roles"}</small>
                    </div>
                    {member.is_owner_profile ? (
                      <span className="record-badge">Propietario</span>
                    ) : (
                      <form action={toggleMemberArchiveAction}>
                        <input name="memberId" type="hidden" value={member.id} />
                        <button className="quiet-button" type="submit">
                          {member.archived_at ? "Restaurar" : "Archivar"}
                        </button>
                      </form>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
