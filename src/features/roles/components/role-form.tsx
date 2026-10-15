"use client";

import { useActionState, useEffect, useRef } from "react";

import { createRoleAction, type RoleFormState } from "@/features/roles/actions";

const initialState: RoleFormState = { status: "idle", message: "" };

export function RoleForm() {
  const [state, formAction, pending] = useActionState(createRoleAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="record-form">
      <div className="form-section-heading">
        <span className="eyebrow">Configuración</span>
        <h2>Crear rol</h2>
        <p>Agrega cualquier función que necesites dentro de la agrupación.</p>
      </div>
      <label className="field-label" htmlFor="role-name">Nombre del rol</label>
      <input
        aria-invalid={Boolean(state.errors?.name)}
        className="text-field"
        id="role-name"
        maxLength={80}
        name="name"
        placeholder="Ej. Segunda voz"
        required
      />
      {state.errors?.name?.[0] ? <span className="field-error">{state.errors.name[0]}</span> : null}
      {state.message ? <p className={`action-message action-message--${state.status}`}>{state.message}</p> : null}
      <button className="primary-button primary-button--full" disabled={pending} type="submit">
        {pending ? "Guardando…" : "Agregar rol"}
      </button>
    </form>
  );
}
