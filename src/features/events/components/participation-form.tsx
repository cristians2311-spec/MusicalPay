"use client";

import { useActionState, useMemo, useState } from "react";

import { addEventParticipationAction, type ParticipationFormState } from "@/features/events/participation-actions";

type MemberOption = { id: number; name: string; roles: { id: number; name: string }[] };
const initialState: ParticipationFormState = { status: "idle", message: "" };

export function ParticipationForm({ eventId, members }: { eventId: number; members: MemberOption[] }) {
  const [memberId, setMemberId] = useState("");
  const [state, formAction, pending] = useActionState(addEventParticipationAction, initialState);
  const roles = useMemo(() => members.find((member) => String(member.id) === memberId)?.roles ?? [], [memberId, members]);
  return (
    <form action={formAction} className="form-grid form-grid--two">
      <input name="eventId" type="hidden" value={eventId} />
      <label className="field-group"><span className="field-label">Músico *</span><select className="text-field" name="memberId" onChange={(event) => setMemberId(event.target.value)} required value={memberId}><option value="">Selecciona un músico</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
      <label className="field-group"><span className="field-label">Rol *</span><select className="text-field" defaultValue="" key={memberId} name="roleId" required><option value="">Selecciona el rol</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
      <label className="field-group"><span className="field-label">Pago acordado *</span><input className="text-field" inputMode="numeric" min="0" name="agreedFeeCop" required step="1" type="number" /></label>
      <label className="field-group"><span className="field-label">Notas</span><input className="text-field" maxLength={1000} name="notes" /></label>
      {state.message ? <p className={`action-message ${state.status === "success" ? "action-message--success" : "action-message--error"}`}>{state.message}</p> : null}
      <div><button className="primary-button" disabled={pending || members.length === 0} type="submit">{pending ? "Agregando…" : "Agregar músico"}</button></div>
    </form>
  );
}
